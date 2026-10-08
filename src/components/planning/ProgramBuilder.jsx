import { useMemo, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon } from '../icons'
import { useConfirm } from '../../context/ConfirmContext'
import { usePlanning } from '../../context/PlanningContext'
import { useToast } from '../../context/ToastContext'
import {
  LEAF_LEVEL,
  canHaveChildren,
  collectSubtree,
  computeSchedules,
  formatDisplayDate,
  getChildren,
  getLevelMeta,
} from '../../data/planning'

// Per-level visual styling so the hierarchy reads at a glance in a large
// program: a colored left accent + row tint + level-tag color per depth.
// Indexed by task.level (0 = Main … 3 = Sub-task).
const LEVEL_STYLES = [
  { row: 'bg-slate-50', accent: 'bg-slate-400', name: 'text-base font-semibold text-slate-900', tag: 'bg-slate-200 text-slate-600' },
  { row: 'bg-blue-50/40', accent: 'bg-brand', name: 'text-sm font-semibold text-slate-800', tag: 'bg-brand/10 text-brand' },
  { row: '', accent: 'bg-emerald-400', name: 'text-sm font-medium text-slate-800', tag: 'bg-emerald-50 text-emerald-700' },
  { row: '', accent: 'bg-transparent', name: 'text-sm text-slate-700', tag: 'bg-gray-100 text-gray-500' },
]

function getLevelStyle(level) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES[LEAF_LEVEL]
}

// Phase 3 — Hierarchical Task Builder + Phases 4-5 — scheduling & roll-ups.
// Renders the per-project construction program as an indented, collapsible
// tree with inline add / rename / delete. Sub-tasks (the leaf level) take a
// Start Date and a working-day Duration; parent tasks derive Start/Finish/
// Duration automatically from their descendants via the working-day calendar.
export default function ProgramBuilder({ siteId }) {
  const { getPlan, addTask, updateTask, deleteTask } = usePlanning()
  const confirm = useConfirm()
  const toast = useToast()

  const plan = getPlan(siteId)
  const tasks = plan.tasks
  const holidays = useMemo(() => new Set(plan.holidays), [plan.holidays])
  const root = useMemo(() => tasks.find((t) => t.parentId === null) ?? null, [tasks])

  // Resolved schedule for every task (leaf = manual input, parent = rolled up).
  // Recomputed whenever tasks or the calendar change.
  const schedules = useMemo(() => computeSchedules(tasks, holidays), [tasks, holidays])

  const [expanded, setExpanded] = useState(() => new Set())
  // Single active inline input at a time: either adding a child or renaming.
  // { mode: 'add', parentId } | { mode: 'edit', taskId } | null
  const [draft, setDraft] = useState(null)
  const [draftValue, setDraftValue] = useState('')
  const [busy, setBusy] = useState(false)

  const isExpanded = (id) => expanded.has(id)

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Tasks that have children — the only ones expand/collapse applies to.
  const parentIds = useMemo(
    () => tasks.filter((t) => tasks.some((c) => c.parentId === t.id)).map((t) => t.id),
    [tasks],
  )
  const expandAll = () => setExpanded(new Set(parentIds))
  const collapseAll = () => setExpanded(new Set())

  const openAdd = (parentId) => {
    setDraft({ mode: 'add', parentId })
    setDraftValue('')
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId))
  }

  const openEdit = (task) => {
    setDraft({ mode: 'edit', taskId: task.id })
    setDraftValue(task.name)
  }

  const cancelDraft = () => {
    setDraft(null)
    setDraftValue('')
  }

  const submitDraft = async () => {
    const name = draftValue.trim()
    if (!name) {
      toast.error('Please enter a name.')
      return
    }
    setBusy(true)
    try {
      if (draft.mode === 'add') {
        await addTask(siteId, { parentId: draft.parentId, name })
      } else {
        await updateTask(siteId, draft.taskId, { name })
      }
      cancelDraft()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Persists a Sub-task's scheduling input (startDate / duration). Finish is
  // never stored: it is always derived from start + duration + the current
  // calendar, so changing holidays later keeps every finish date correct.
  const saveSchedule = async (taskId, updates) => {
    try {
      await updateTask(siteId, taskId, updates)
    } catch {
      toast.error('Could not save the schedule. Please try again.')
    }
  }

  const handleDelete = async (task) => {
    const subtree = collectSubtree(tasks, task.id)
    const descendantCount = subtree.length - 1
    const meta = getLevelMeta(task.level)

    const confirmed = await confirm({
      title: `Delete ${meta.label.toLowerCase()}`,
      message:
        descendantCount > 0
          ? `Delete "${task.name}" and all ${descendantCount} item(s) nested under it? This cannot be undone.`
          : `Delete "${task.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteTask(siteId, task.id)
      toast.success(`"${task.name}" deleted.`)
      if (draft?.taskId === task.id || draft?.parentId === task.id) cancelDraft()
    } catch {
      toast.error('Failed to delete. Please try again.')
    }
  }

  // --- Empty state: no Main Task yet -----------------------------------------
  if (!root) {
    const creatingRoot = draft?.mode === 'add' && draft.parentId === null
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-slate-900">Start the construction program</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Create the main task for this project (for example, the overall work package). You can
          then break it down into sections and detailed activities.
        </p>

        {creatingRoot ? (
          <div className="mx-auto mt-6 flex max-w-sm items-center gap-2">
            <input
              autoFocus
              type="text"
              value={draftValue}
              maxLength={120}
              onChange={(e) => setDraftValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitDraft()
                if (e.key === 'Escape') cancelDraft()
              }}
              placeholder="Main task name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={submitDraft}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              Create
            </button>
            <button
              type="button"
              onClick={cancelDraft}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAdd(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <PlusIcon className="h-4 w-4" />
            Create Main Task
          </button>
        )}
      </div>
    )
  }

  // --- Program view ----------------------------------------------------------
  const overall = schedules[root.id]
  const summaryStats = [
    { label: 'Program start', value: overall?.scheduled ? formatDisplayDate(overall.start) : '—' },
    { label: 'Program finish', value: overall?.scheduled ? formatDisplayDate(overall.finish) : '—' },
    {
      label: 'Total working days',
      value: overall?.scheduled ? `${overall.duration} day${overall.duration === 1 ? '' : 's'}` : '—',
    },
    { label: 'Activities', value: tasks.length },
  ]

  return (
    <div className="mt-6 space-y-4">
      {/* Program summary — overall span rolled up from the Main task */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1.5 text-lg font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      {parentIds.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Collapse all
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Column header — aligns with the schedule cells on each row */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 pr-3 text-xs font-medium text-gray-400">
          <div className="flex-1 py-2.5 pl-4">Task</div>
          <div className="w-36 shrink-0 px-2 py-2.5">Start</div>
          <div className="w-28 shrink-0 px-2 py-2.5">Duration</div>
          <div className="w-32 shrink-0 px-2 py-2.5">Finish</div>
          <div className="w-[108px] shrink-0" aria-hidden="true" />
        </div>

        <TaskNode
          task={root}
          depth={0}
          tasks={tasks}
          schedules={schedules}
          isExpanded={isExpanded}
          onToggle={toggleExpanded}
          draft={draft}
          draftValue={draftValue}
          setDraftValue={setDraftValue}
          busy={busy}
          onOpenAdd={openAdd}
          onOpenEdit={openEdit}
          onSubmitDraft={submitDraft}
          onCancelDraft={cancelDraft}
          onDelete={handleDelete}
          onSaveSchedule={saveSchedule}
        />
      </div>
    </div>
  )
}

// Recursive row + its children. Indentation and styling communicate depth.
function TaskNode({
  task,
  depth,
  tasks,
  schedules,
  isExpanded,
  onToggle,
  draft,
  draftValue,
  setDraftValue,
  busy,
  onOpenAdd,
  onOpenEdit,
  onSubmitDraft,
  onCancelDraft,
  onDelete,
  onSaveSchedule,
}) {
  const meta = getLevelMeta(task.level)
  const children = getChildren(tasks, task.id)
  const hasChildren = children.length > 0
  const expanded = isExpanded(task.id)
  const editing = draft?.mode === 'edit' && draft.taskId === task.id
  const addingHere = draft?.mode === 'add' && draft.parentId === task.id

  // Indentation grows per depth; the Main row is visually weightiest.
  const indent = 16 + depth * 24
  const isLeaf = task.level === LEAF_LEVEL
  const schedule = schedules[task.id]
  const style = getLevelStyle(task.level)

  return (
    <div>
      <div
        className={`group relative flex items-center gap-2 border-b border-gray-100 pr-3 transition hover:bg-gray-50/70 ${style.row}`}
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Level accent bar */}
        <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden="true" />

        {/* Expand/collapse toggle (only if it has children) */}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(task.id)}
          aria-label={hasChildren ? (expanded ? 'Collapse' : 'Expand') : undefined}
          disabled={!hasChildren}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 ${
            hasChildren ? 'hover:bg-gray-200 hover:text-gray-600' : 'opacity-0'
          }`}
        >
          {expanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>

        {/* Name / level, or inline rename input */}
        {editing ? (
          <InlineInput
            value={draftValue}
            onChange={setDraftValue}
            onSubmit={onSubmitDraft}
            onCancel={onCancelDraft}
            busy={busy}
            placeholder="Task name"
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5">
            <span className={`truncate ${style.name}`}>
              {task.name}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.tag}`}>
              {meta.label}
            </span>
            {hasChildren && (
              <span className="shrink-0 text-xs text-gray-400">
                {children.length} item{children.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Schedule columns — Sub-tasks are editable; parents show values
            rolled up from their descendants. Hidden while renaming. */}
        {!editing &&
          (isLeaf ? (
            <ScheduleCells task={task} finish={schedule?.finish} onSave={onSaveSchedule} />
          ) : (
            <RollupCells schedule={schedule} />
          ))}

        {/* Row actions (hover-revealed) */}
        {!editing && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            {canHaveChildren(task.level) && (
              <button
                type="button"
                onClick={() => onOpenAdd(task.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand/10"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {meta.addChildLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenEdit(task)}
              aria-label={`Rename ${task.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={`Delete ${task.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Inline "add child" input, shown indented one level deeper */}
      {addingHere && (
        <div
          className="flex items-center gap-2 border-b border-gray-100 bg-brand/5 py-2 pr-3"
          style={{ paddingLeft: `${indent + 24 + 8}px` }}
        >
          <InlineInput
            value={draftValue}
            onChange={setDraftValue}
            onSubmit={onSubmitDraft}
            onCancel={onCancelDraft}
            busy={busy}
            placeholder={`New ${getLevelMeta(task.level).childNoun?.toLowerCase() ?? 'item'} name`}
          />
        </div>
      )}

      {/* Children */}
      {expanded &&
        children.map((child) => (
          <TaskNode
            key={child.id}
            task={child}
            depth={depth + 1}
            tasks={tasks}
            schedules={schedules}
            isExpanded={isExpanded}
            onToggle={onToggle}
            draft={draft}
            draftValue={draftValue}
            setDraftValue={setDraftValue}
            busy={busy}
            onOpenAdd={onOpenAdd}
            onOpenEdit={onOpenEdit}
            onSubmitDraft={onSubmitDraft}
            onCancelDraft={onCancelDraft}
            onDelete={onDelete}
            onSaveSchedule={onSaveSchedule}
          />
        ))}
    </div>
  )
}

// Read-only schedule cells for a parent task. Values are rolled up from its
// descendants (earliest start, latest finish, working-day span) and shown with
// a subtle styling so it's clear they are derived, not editable.
function RollupCells({ schedule }) {
  const scheduled = schedule?.scheduled
  const cell = (content) => (
    <span className={scheduled ? 'text-slate-500' : 'text-gray-300'}>{scheduled ? content : '—'}</span>
  )
  return (
    <div className="flex shrink-0 items-center text-sm">
      <div className="w-36 px-2">{cell(formatDisplayDate(schedule?.start))}</div>
      <div className="w-28 px-2">
        {cell(`${schedule?.duration} day${schedule?.duration === 1 ? '' : 's'}`)}
      </div>
      <div className="w-32 px-2">{cell(formatDisplayDate(schedule?.finish))}</div>
    </div>
  )
}

// Scheduling cells for a Sub-task (leaf): Start Date + working-day Duration are
// entered here; Finish is derived (passed in from the shared schedule roll-up)
// and read-only. Start saves immediately on change; Duration saves on blur/
// Enter so typing isn't interrupted.
function ScheduleCells({ task, finish, onSave }) {
  const [duration, setDuration] = useState(task.duration ?? '')

  // Keep the local duration input in sync if the stored value changes
  // elsewhere (e.g. after a reload or an external update).
  const storedDuration = task.duration ?? ''
  const [lastStored, setLastStored] = useState(storedDuration)
  if (storedDuration !== lastStored) {
    setLastStored(storedDuration)
    setDuration(storedDuration)
  }

  // A valid start with no computed finish means the start fell on / the task
  // never resolved to a working day; also flag a start on a non-working day.
  const startUnscheduled = task.startDate && task.duration > 0 && !finish

  const commitDuration = () => {
    const trimmed = String(duration).trim()
    const parsed = trimmed === '' ? null : Number(trimmed)
    const normalized = Number.isInteger(parsed) && parsed > 0 ? parsed : null
    if (normalized !== (task.duration ?? null)) {
      onSave(task.id, { duration: normalized })
    }
    // Reflect the normalized value back into the input (e.g. clears invalid).
    setDuration(normalized ?? '')
  }

  // Stop row-level clicks (expand/collapse etc.) from firing when interacting
  // with the inputs.
  const stop = (e) => e.stopPropagation()

  return (
    <div className="flex shrink-0 items-center text-sm" onClick={stop}>
      <div className="w-36 px-2">
        <input
          type="date"
          value={task.startDate ?? ''}
          onChange={(e) => onSave(task.id, { startDate: e.target.value || null })}
          aria-label={`Start date for ${task.name}`}
          title={startUnscheduled ? 'No working day available for this start date.' : undefined}
          className={`w-full rounded-md border px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
            startUnscheduled ? 'border-amber-400' : 'border-gray-300 focus:border-brand'
          }`}
        />
      </div>

      <div className="w-28 px-2">
        <input
          type="number"
          min={1}
          step={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onBlur={commitDuration}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setDuration(storedDuration)
          }}
          placeholder="days"
          aria-label={`Duration in working days for ${task.name}`}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="w-32 px-2 text-slate-600">
        {finish ? formatDisplayDate(finish) : <span className="text-gray-300">—</span>}
      </div>
    </div>
  )
}

// Shared inline text input used for both add and rename, with Enter/Escape
// shortcuts and explicit Save/Cancel controls.
function InlineInput({ value, onChange, onSubmit, onCancel, busy, placeholder }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
      <input
        autoFocus
        type="text"
        value={value}
        maxLength={120}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  )
}
