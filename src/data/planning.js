// Planning domain helpers for the Construction Program feature.
//
// Dates are represented as plain 'YYYY-MM-DD' strings throughout the planning
// feature. This avoids timezone drift that comes from passing Date objects
// around, and matches how dates are already stored on sites (e.g. startDate).
//
// A "non-working day" is any date that should NOT count towards a task's
// working-day duration. Currently that means configured holidays. Weekend
// policy is intentionally NOT hardcoded here: the engineer explicitly marks
// non-working days (e.g. via "Add all Sundays"), so the calendar stays flexible
// for projects that work different weekly patterns. The scheduling engine
// (Phase 4) will consume isWorkingDay / these helpers.

const DAY_MS = 24 * 60 * 60 * 1000

// --- Task hierarchy ----------------------------------------------------------
//
// The construction program is stored as a FLAT list of task nodes per site:
//   { id, siteId, parentId, name, level, order }
// Flat storage (vs. nested children) keeps CRUD, reordering and the Phase 5
// roll-up calculations simple, since those walk parent/child relationships.
//
// Levels, by depth:
//   0 = Main Task   (one root per project, e.g. "Civil Works")
//   1 = Section     (e.g. "Construction Section 01")
//   2 = Task        (e.g. "Construction of Culverts")
//   3 = Sub-task    (the lowest / executable scheduling level in Phase 4)
//
// Level 3 is the lowest level: it has no "add child" action. The names below
// are UI-facing; the engineer never sees the word "Level N".

export const MAIN_LEVEL = 0
export const LEAF_LEVEL = 3

export const TASK_LEVELS = [
  { level: 0, label: 'Main Task', addChildLabel: 'Add Section', childNoun: 'Section' },
  { level: 1, label: 'Section', addChildLabel: 'Add Task', childNoun: 'Task' },
  { level: 2, label: 'Task', addChildLabel: 'Add Sub-task', childNoun: 'Sub-task' },
  { level: 3, label: 'Sub-task', addChildLabel: null, childNoun: null },
]

export function getLevelMeta(level) {
  return TASK_LEVELS[level] ?? TASK_LEVELS[LEAF_LEVEL]
}

export function canHaveChildren(level) {
  return level < LEAF_LEVEL
}

// Returns the direct children of parentId (null for the root), ordered.
export function getChildren(tasks, parentId) {
  return tasks
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}

// Collects a task plus all of its descendants (depth-first). Used when deleting
// a parent so the whole subtree goes with it, and to warn about the count.
export function collectSubtree(tasks, taskId) {
  const result = []
  const walk = (id) => {
    const node = tasks.find((t) => t.id === id)
    if (!node) return
    result.push(node)
    getChildren(tasks, id).forEach((child) => walk(child.id))
  }
  walk(taskId)
  return result
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// --- Conversions between 'YYYY-MM-DD' strings and local Date objects ---------

// Parses 'YYYY-MM-DD' into a Date at local midnight. Building from numeric
// parts (rather than new Date(string)) keeps it in local time and avoids the
// UTC-parsing pitfall that can shift the day.
export function parseDate(iso) {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

// --- Date arithmetic / inspection -------------------------------------------

export function addDays(iso, days) {
  const date = parseDate(iso)
  if (!date) return null
  return toISODate(new Date(date.getTime() + days * DAY_MS))
}

// 0 = Sunday ... 6 = Saturday
export function dayOfWeek(iso) {
  const date = parseDate(iso)
  return date ? date.getDay() : null
}

export function isSunday(iso) {
  return dayOfWeek(iso) === 0
}

// --- Holiday / working-day logic --------------------------------------------

// Treats the holiday collection as the set of configured non-working days.
// Accepts an array or a Set for convenience.
export function isHoliday(iso, holidays) {
  if (!iso) return false
  return holidays instanceof Set ? holidays.has(iso) : holidays.includes(iso)
}

// A working day is any day that is not a configured non-working day.
export function isWorkingDay(iso, holidays) {
  return !isHoliday(iso, holidays)
}

// --- Working-day scheduling (Phase 4) ---------------------------------------
//
// A task's duration is counted in WORKING days. Non-working days (configured
// holidays / Sundays etc.) do not consume duration. Convention: the start day,
// if it is a working day, counts as working day 1; the finish date is the last
// (Nth) working day the task occupies.
//
// Safety cap: never scan more than this many calendar days looking for working
// days. Protects against a pathological calendar where everything is marked
// non-working (which would otherwise loop forever).
const MAX_SCHEDULE_SCAN_DAYS = 365 * 50

// Rolls an ISO date forward to the first working day on or after it. Returns
// null if no working day is found within the safety cap.
export function nextWorkingDay(iso, holidays) {
  let cursor = iso
  for (let i = 0; i < MAX_SCHEDULE_SCAN_DAYS; i += 1) {
    if (isWorkingDay(cursor, holidays)) return cursor
    cursor = addDays(cursor, 1)
  }
  return null
}

// Given a start date and a duration in working days, returns the finish date
// (the last working day occupied). If the start lands on a non-working day it
// is first rolled forward to the next working day. Returns null for invalid
// input (missing date, non-positive/invalid duration, or cap exceeded).
export function calculateFinishDate(startISO, durationWorkingDays, holidays) {
  if (!startISO) return null
  const duration = Number(durationWorkingDays)
  if (!Number.isInteger(duration) || duration < 1) return null

  let cursor = nextWorkingDay(startISO, holidays)
  if (!cursor) return null

  // cursor is working day #1. Advance until we've counted `duration` of them.
  let counted = 1
  let guard = 0
  while (counted < duration) {
    cursor = addDays(cursor, 1)
    if (isWorkingDay(cursor, holidays)) counted += 1
    guard += 1
    if (guard > MAX_SCHEDULE_SCAN_DAYS) return null
  }
  return cursor
}

// Counts the working days in the inclusive range [startISO, endISO]. Used by
// the Phase 5 roll-ups to express a parent's span as a working-day duration.
// Returns 0 for an empty/invalid range.
export function countWorkingDays(startISO, endISO, holidays) {
  const start = parseDate(startISO)
  const end = parseDate(endISO)
  if (!start || !end || end < start) return 0

  let count = 0
  let cursor = startISO
  for (let i = 0; i <= MAX_SCHEDULE_SCAN_DAYS; i += 1) {
    if (isWorkingDay(cursor, holidays)) count += 1
    if (cursor === endISO) break
    cursor = addDays(cursor, 1)
  }
  return count
}

// --- Schedule roll-up (Phase 5) ---------------------------------------------
//
// Computes the resolved schedule for every task in one bottom-up pass and
// returns a map: { [taskId]: { start, finish, duration, scheduled } }.
//   - Leaf (Sub-task): start/duration are the engineer's manual input; finish
//     is derived via the working-day calendar (same as Phase 4).
//   - Parent: start = earliest child start, finish = latest child finish,
//     duration = working days in [start, finish] on the calendar. Parents never
//     store schedule values — they are always derived from descendants.
//   - scheduled=false means the task has no resolvable schedule yet (a leaf
//     with missing/invalid input, or a parent with no scheduled descendants).
//
// Dates are comparable as 'YYYY-MM-DD' strings, so min/max use string compare.
export function computeSchedules(tasks, holidays) {
  const schedules = {}

  const resolve = (task) => {
    if (schedules[task.id]) return schedules[task.id]

    let result
    if (task.level === LEAF_LEVEL) {
      const finish = calculateFinishDate(task.startDate, task.duration, holidays)
      result = finish
        ? { start: task.startDate, finish, duration: task.duration, scheduled: true }
        : { start: null, finish: null, duration: null, scheduled: false }
    } else {
      const children = getChildren(tasks, task.id)
      const scheduledChildren = children
        .map((child) => resolve(child))
        .filter((s) => s.scheduled)

      if (scheduledChildren.length === 0) {
        result = { start: null, finish: null, duration: null, scheduled: false }
      } else {
        const start = scheduledChildren.reduce((min, s) => (s.start < min ? s.start : min), scheduledChildren[0].start)
        const finish = scheduledChildren.reduce((max, s) => (s.finish > max ? s.finish : max), scheduledChildren[0].finish)
        result = { start, finish, duration: countWorkingDays(start, finish, holidays), scheduled: true }
      }
    }

    schedules[task.id] = result
    return result
  }

  tasks.forEach(resolve)
  return schedules
}

// Returns every date (ISO strings) in [startISO, endISO] inclusive whose day
// of week is in `weekdays` (a Set or array of 0=Sun … 6=Sat). Used to bulk-mark
// a company's recurring rest day(s) as non-working. Empty selection -> [].
export function getWeekdaysBetween(startISO, endISO, weekdays) {
  const start = parseDate(startISO)
  const end = parseDate(endISO)
  if (!start || !end || end < start) return []

  const wanted = weekdays instanceof Set ? weekdays : new Set(weekdays)
  if (wanted.size === 0) return []

  const result = []
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (wanted.has(d.getDay())) result.push(toISODate(d))
  }
  return result
}

// Returns every Sunday (as ISO strings) within [startISO, endISO], inclusive.
export function getSundaysBetween(startISO, endISO) {
  return getWeekdaysBetween(startISO, endISO, [0])
}

// --- Cost roll-up (Costing feature) -----------------------------------------
//
// Costing allocates a planned cost to each leaf (Sub-task) and derives every
// parent total as the sum of its children. This mirrors computeSchedules: the
// same flat task list is the single source of truth, so Costing never defines
// its own hierarchy — it reuses the planned one.
//
//   - A leaf cost is the staff member's entered value (task.cost, a number;
//     null/undefined means "not yet costed").
//   - A parent cost is always SUM(direct children costs), computed recursively.
//     Parents never store a cost of their own, so a leaf change rolls straight
//     up through Level 2 → Level 1 → Main Task with no chance of drift.
//
// Returns a map: { [taskId]: { cost, costed, leafCount, costedLeafCount } }.
//   - cost: the resolved total (0 when nothing is costed yet).
//   - costed: true if this task has at least one costed leaf beneath it (or, for
//     a leaf, that it has a stored cost). Lets the UI distinguish a genuine
//     "LKR 0" from "not costed yet".
//   - leafCount / costedLeafCount: leaves in this subtree and how many are
//     costed — drives the "X / Y activities costed" summary.
export function computeCosts(tasks) {
  const costs = {}

  const resolve = (task) => {
    if (costs[task.id]) return costs[task.id]

    let result
    if (task.level === LEAF_LEVEL) {
      const hasCost = Number.isFinite(task.cost)
      result = {
        cost: hasCost ? task.cost : 0,
        costed: hasCost,
        leafCount: 1,
        costedLeafCount: hasCost ? 1 : 0,
      }
    } else {
      const children = getChildren(tasks, task.id)
      result = children.reduce(
        (acc, child) => {
          const c = resolve(child)
          acc.cost += c.cost
          acc.costed = acc.costed || c.costed
          acc.leafCount += c.leafCount
          acc.costedLeafCount += c.costedLeafCount
          return acc
        },
        { cost: 0, costed: false, leafCount: 0, costedLeafCount: 0 },
      )
    }

    costs[task.id] = result
    return result
  }

  tasks.forEach(resolve)
  return costs
}

// --- Currency helpers --------------------------------------------------------
//
// The application's existing currency convention (see sites) is "LKR" with
// grouped thousands. Costing keeps that convention rather than introducing a
// new one. Values are STORED as plain numbers and only formatted for display,
// so they stay usable for the roll-up arithmetic above.

export const CURRENCY_CODE = 'LKR'

// Formats a number as currency, e.g. 1600000 -> 'LKR 1,600,000.00'. Two decimal
// places match how construction costs are quoted (e.g. 526,205.77). A nullish
// or non-finite value renders as a dash so empty/uncosted cells read clearly.
export function formatCurrency(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${CURRENCY_CODE} ${formatted}`
}

// Largest cost we accept, guarding against overflow / fat-finger entries while
// still comfortably covering large construction programs (hundreds of billions).
export const MAX_COST = 1e15

// Parses a user-entered cost string into a validated number. Strips currency
// prefix, grouping commas and surrounding whitespace so pasted/formatted values
// still work. Returns { value, error }:
//   - '' (empty) -> { value: null } : clears the cost (uncosted).
//   - valid      -> { value: <number> }
//   - invalid    -> { error: <message> } : non-numeric, negative, or too large.
export function parseCurrencyInput(raw) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') return { value: null }

  // Drop the currency code, thousands separators and any spaces.
  const cleaned = trimmed
    .replace(new RegExp(CURRENCY_CODE, 'i'), '')
    .replace(/,/g, '')
    .replace(/\s/g, '')

  if (!/^\d*\.?\d+$/.test(cleaned)) {
    return { error: 'Enter a valid amount (numbers only).' }
  }

  const value = Number(cleaned)
  if (!Number.isFinite(value)) return { error: 'Enter a valid amount.' }
  if (value < 0) return { error: 'Cost cannot be negative.' }
  if (value > MAX_COST) return { error: 'That cost is too large.' }

  // Normalize to at most 2 decimal places (sub-cent precision is meaningless).
  return { value: Math.round(value * 100) / 100 }
}

// --- Display helpers ---------------------------------------------------------

// Human-friendly date, e.g. '7 Oct 2026'.
export function formatDisplayDate(iso) {
  const date = parseDate(iso)
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Builds the weeks grid for a month view. Returns an array of weeks, each a
// 7-element array of day cells. Cells outside the target month are included
// (so weeks stay aligned) but flagged with inMonth: false.
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  // Back up to the Sunday that starts the first visible week.
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(1 - firstOfMonth.getDay())

  const weeks = []
  const cursor = new Date(gridStart)
  // 6 weeks always covers any month and keeps the grid height stable.
  for (let week = 0; week < 6; week += 1) {
    const days = []
    for (let d = 0; d < 7; d += 1) {
      days.push({
        iso: toISODate(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month,
        isSunday: cursor.getDay() === 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}
