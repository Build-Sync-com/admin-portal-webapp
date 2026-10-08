import { useMemo, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '../icons'
import { useConfirm } from '../../context/ConfirmContext'
import { usePlanning } from '../../context/PlanningContext'
import { useToast } from '../../context/ToastContext'
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  buildMonthGrid,
  computeSchedules,
  dayOfWeek,
  formatDisplayDate,
  getWeekdaysBetween,
  todayISO,
  toISODate,
} from '../../data/planning'

const FULL_WEEKDAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']

// Builds a short label for a selected weekday set, e.g. "Sundays",
// "Fridays & Saturdays", or "3 days" for larger selections.
function describeWeekdays(weekdaySet) {
  const days = [...weekdaySet].sort((a, b) => a - b)
  if (days.length === 0) return 'days'
  if (days.length > 2) return `${days.length} days`
  return days.map((d) => FULL_WEEKDAYS[d]).join(' & ')
}

// Phase 2 — Working Calendar / Holidays.
// A month-grid calendar where the Planning Engineer toggles holidays
// (non-working days) by clicking dates, plus a side panel listing the
// configured holidays with remove / bulk actions. The stored holiday list is
// what the scheduling engine uses to skip non-working days. Bulk actions mark
// the company's recurring rest day(s) — any selected weekday(s), not just
// Sundays — for the viewed month or across the whole program span (the latter
// derived from the task schedule roll-up).
export default function WorkingCalendar({ siteId }) {
  const { getPlan, addHoliday, addHolidays, removeHoliday, clearHolidays } = usePlanning()
  const confirm = useConfirm()
  const toast = useToast()

  const today = todayISO()
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  // Which weekday(s) the company treats as recurring rest days, driving the
  // bulk "add" actions. Defaults to Sunday (the previous fixed behavior).
  const [restDays, setRestDays] = useState(() => new Set([0]))

  const toggleRestDay = (weekday) => {
    setRestDays((prev) => {
      const next = new Set(prev)
      if (next.has(weekday)) next.delete(weekday)
      else next.add(weekday)
      return next
    })
  }

  const plan = getPlan(siteId)
  const holidaySet = useMemo(() => new Set(plan.holidays), [plan.holidays])
  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  // Overall program span (earliest start → latest finish), rolled up from the
  // task hierarchy. Null until at least one Sub-task has a resolvable schedule.
  const programRange = useMemo(() => {
    const root = plan.tasks.find((t) => t.parentId === null)
    if (!root) return null
    const schedule = computeSchedules(plan.tasks, holidaySet)[root.id]
    return schedule?.scheduled ? { start: schedule.start, finish: schedule.finish } : null
  }, [plan.tasks, holidaySet])

  const goToMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const goToToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
  }

  const toggleDay = async (iso) => {
    try {
      if (holidaySet.has(iso)) {
        await removeHoliday(siteId, iso)
      } else {
        await addHoliday(siteId, iso)
      }
    } catch {
      toast.error('Could not update the calendar. Please try again.')
    }
  }

  const restDayLabel = describeWeekdays(restDays)

  // Adds the selected rest day(s) within a date range as non-working days.
  // Shared by the month-scoped and program-wide actions; `scopeLabel` is used
  // in the toasts (e.g. "in October" / "across the program").
  const addRestDaysInRange = async (startISO, endISO, scopeLabel) => {
    if (restDays.size === 0) {
      toast.info('Select at least one weekday first.')
      return
    }
    const dates = getWeekdaysBetween(startISO, endISO, restDays)
    const toAdd = dates.filter((d) => !holidaySet.has(d))

    if (toAdd.length === 0) {
      toast.info(`All ${restDayLabel} ${scopeLabel} are already marked.`)
      return
    }

    try {
      await addHolidays(siteId, toAdd)
      toast.success(`Added ${toAdd.length} day${toAdd.length > 1 ? 's' : ''} (${restDayLabel}) ${scopeLabel}.`)
    } catch {
      toast.error('Could not add the days. Please try again.')
    }
  }

  // Scoped to the visible month so the action is predictable (vs. silently
  // marking days across years the engineer can't see).
  const handleAddRestDaysThisMonth = () => {
    const monthStart = toISODate(new Date(viewYear, viewMonth, 1))
    const monthEnd = toISODate(new Date(viewYear, viewMonth + 1, 0))
    return addRestDaysInRange(monthStart, monthEnd, `in ${MONTH_LABELS[viewMonth]} ${viewYear}`)
  }

  // Across the whole program span (earliest start → latest finish). The span is
  // derived from the current schedule; since marking a rest day can only push
  // finish dates later (never the start earlier), it is safe to mark up to the
  // current finish — if the span later grows, the engineer can run this again.
  const handleAddRestDaysAcrossProgram = () => {
    if (!programRange) return
    return addRestDaysInRange(programRange.start, programRange.finish, 'across the program')
  }

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: 'Clear all non-working days',
      message: `Remove all ${plan.holidays.length} configured non-working day(s) for this project? This cannot be undone.`,
      confirmLabel: 'Clear all',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await clearHolidays(siteId)
      toast.success('All non-working days cleared.')
    } catch {
      toast.error('Could not clear the calendar. Please try again.')
    }
  }

  const handleRemove = async (iso) => {
    try {
      await removeHoliday(siteId, iso)
    } catch {
      toast.error('Could not remove this day. Please try again.')
    }
  }

  const sortedHolidays = plan.holidays // already stored sorted by the context

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Calendar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <h2 className="min-w-[160px] text-center text-base font-semibold text-slate-900">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </h2>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Today
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-2 text-center text-xs font-medium text-gray-400">
              {label}
            </div>
          ))}

          {weeks.flat().map((cell) => {
            const isHoliday = holidaySet.has(cell.iso)
            const isToday = cell.iso === today
            // A cell is a "rest day" if its weekday is in the current selection.
            const isRestDay = restDays.has(dayOfWeek(cell.iso))

            const base =
              'relative flex h-11 items-center justify-center rounded-lg text-sm font-medium transition'
            let tone
            if (!cell.inMonth) {
              tone = 'text-gray-300 hover:bg-gray-50'
            } else if (isHoliday) {
              tone = 'bg-red-500 text-white hover:bg-red-600'
            } else if (isRestDay) {
              tone = 'bg-red-50 text-red-600 hover:bg-red-100'
            } else {
              tone = 'text-slate-700 hover:bg-brand/10'
            }

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => toggleDay(cell.iso)}
                aria-pressed={isHoliday}
                aria-label={`${formatDisplayDate(cell.iso)}${isHoliday ? ' (non-working day)' : ''}`}
                className={`${base} ${tone} ${isToday ? 'ring-2 ring-brand ring-offset-1' : ''}`}
              >
                {cell.day}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-500" /> Non-working day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-inset ring-red-200" /> Rest day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-1 ring-inset ring-gray-300" /> Working day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-brand" /> Today
          </span>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Click any date to mark it as a non-working day, or click again to make it a working day.
        </p>
      </div>

      {/* Holiday list / actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Non-working days</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {plan.holidays.length}
          </span>
        </div>

        {/* Recurring rest-day selector — choose which weekday(s) the bulk
            actions mark (varies by company, e.g. Sun, or Fri & Sat). */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Recurring rest day(s)</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {WEEKDAY_LABELS.map((label, weekday) => {
              const selected = restDays.has(weekday)
              return (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleRestDay(weekday)}
                  aria-pressed={selected}
                  className={`h-8 w-9 rounded-md text-xs font-semibold transition ${
                    selected
                      ? 'bg-brand text-white'
                      : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAddRestDaysThisMonth}
            disabled={restDays.size === 0}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Add all {restDayLabel} in {MONTH_LABELS[viewMonth]}
          </button>
          <button
            type="button"
            onClick={handleAddRestDaysAcrossProgram}
            disabled={!programRange || restDays.size === 0}
            title={
              restDays.size === 0
                ? 'Select at least one weekday above.'
                : programRange
                  ? `Marks every ${restDayLabel} from ${formatDisplayDate(programRange.start)} to ${formatDisplayDate(programRange.finish)}.`
                  : 'Available once the program has scheduled tasks.'
            }
            className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            Add all {restDayLabel} across the program
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={plan.holidays.length === 0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
        </div>

        {programRange && (
          <p className="mt-2 text-xs text-gray-400">
            Program span: {formatDisplayDate(programRange.start)} – {formatDisplayDate(programRange.finish)}
          </p>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4">
          {sortedHolidays.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No non-working days configured yet.
            </p>
          ) : (
            <ul className="flex max-h-[360px] flex-col gap-1 overflow-y-auto pr-1">
              {sortedHolidays.map((iso) => (
                <li
                  key={iso}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <span className="text-sm text-slate-700">{formatDisplayDate(iso)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(iso)}
                    aria-label={`Remove ${formatDisplayDate(iso)}`}
                    className="text-gray-400 transition hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
