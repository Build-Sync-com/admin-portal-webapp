import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDownIcon, ChevronRightIcon, PencilIcon } from '../icons'
import { usePlanning } from '../../context/PlanningContext'
import { useToast } from '../../context/ToastContext'
import {
  LEAF_LEVEL,
  computeCosts,
  formatCurrency,
  getChildren,
  getLevelMeta,
  parseCurrencyInput,
} from '../../data/planning'

// Per-level visual styling, matched to the Planning ProgramBuilder so the
// costing view reads as the SAME construction program, not a different tree.
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

// Phases 2-5 — displays the planned program and allocates costs to it.
// The hierarchy comes entirely from Planning (same flat task list). Costs are
// entered only on Sub-tasks (leaves); every parent total is derived bottom-up
// by computeCosts, so parents are read-only and can never drift from their
// children. Editing a leaf cost re-runs the roll-up, updating every ancestor.
export default function CostTree({ siteId }) {
  const { getPlan, setTaskCost } = usePlanning()
  const toast = useToast()

  const plan = getPlan(siteId)
  const tasks = plan.tasks
  const root = useMemo(() => tasks.find((t) => t.parentId === null) ?? null, [tasks])

  // Resolved cost for every task: leaves = entered value, parents = rolled up.
  // Recomputed whenever any task (including a cost) changes.
  const costs = useMemo(() => computeCosts(tasks), [tasks])

  const [expanded, setExpanded] = useState(() => new Set())
  // The one leaf currently being edited, or null. Keeping a single active editor
  // avoids ambiguity about which value is "in flight".
  const [editingId, setEditingId] = useState(null)

  // Pre-bind the site so the editor only deals with (taskId, cost). cost is a
  // number or null (to clear the allocation).
  const saveCost = (taskId, cost) => setTaskCost(siteId, taskId, cost)

  const isExpanded = (id) => expanded.has(id)
  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const parentIds = useMemo(
    () => tasks.filter((t) => tasks.some((c) => c.parentId === t.id)).map((t) => t.id),
    [tasks],
  )
  const expandAll = () => setExpanded(new Set(parentIds))
  const collapseAll = () => setExpanded(new Set())

  // --- No program planned yet ------------------------------------------------
  if (!root) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-slate-900">No construction program yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Costing follows the construction program defined in Planning. Once the Planning Engineer
          creates the program for this project, its activities will appear here ready to be costed.
        </p>
        <Link
          to={`/dashboard/planning/${siteId}`}
          className="mt-6 inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Go to Planning
        </Link>
      </div>
    )
  }

  // --- Costing view ----------------------------------------------------------
  const overall = costs[root.id]
  const uncosted = overall.leafCount - overall.costedLeafCount

  return (
    <div className="mt-6 space-y-4">
      {/* Summary — overall cost and costing progress rolled up from the program */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total planned cost</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-900">
            {overall.costed ? formatCurrency(overall.cost) : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Costed activities</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-900">
            {overall.costedLeafCount} / {overall.leafCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Uncosted activities</p>
          <p className={`mt-1.5 text-lg font-semibold ${uncosted > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {uncosted}
          </p>
        </div>
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
        {/* Column header — aligns with the cost cell on each row */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 pr-3 text-xs font-medium text-gray-400">
          <div className="flex-1 py-2.5 pl-4">Task</div>
          <div className="w-64 shrink-0 px-2 py-2.5 text-right">Cost</div>
        </div>

        <CostNode
          task={root}
          depth={0}
          tasks={tasks}
          costs={costs}
          isExpanded={isExpanded}
          onToggle={toggleExpanded}
          editingId={editingId}
          onStartEdit={setEditingId}
          onStopEdit={() => setEditingId(null)}
          onSaveCost={saveCost}
          toast={toast}
        />
      </div>
    </div>
  )
}

// Recursive row + its children. Indentation and styling communicate depth,
// identical to the Planning tree. Parents show a derived, read-only total;
// leaves (Sub-tasks) carry the editable cost.
function CostNode({
  task,
  depth,
  tasks,
  costs,
  isExpanded,
  onToggle,
  editingId,
  onStartEdit,
  onStopEdit,
  onSaveCost,
  toast,
}) {
  const meta = getLevelMeta(task.level)
  const children = getChildren(tasks, task.id)
  const hasChildren = children.length > 0
  const expanded = isExpanded(task.id)
  const isLeaf = task.level === LEAF_LEVEL
  const entry = costs[task.id]
  const style = getLevelStyle(task.level)

  const indent = 16 + depth * 24

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

        {/* Name / level */}
        <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5">
          <span className={`truncate ${style.name}`}>{task.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.tag}`}>
            {meta.label}
          </span>
          {hasChildren && (
            <span className="shrink-0 text-xs text-gray-400">
              {children.length} item{children.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Cost cell — leaf = editable, parent = derived read-only total */}
        {isLeaf ? (
          <LeafCostCell
            task={task}
            editing={editingId === task.id}
            onStartEdit={() => onStartEdit(task.id)}
            onStopEdit={onStopEdit}
            onSaveCost={onSaveCost}
            toast={toast}
          />
        ) : (
          <RollupCostCell entry={entry} />
        )}
      </div>

      {/* Children */}
      {expanded &&
        children.map((child) => (
          <CostNode
            key={child.id}
            task={child}
            depth={depth + 1}
            tasks={tasks}
            costs={costs}
            isExpanded={isExpanded}
            onToggle={onToggle}
            editingId={editingId}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
            onSaveCost={onSaveCost}
            toast={toast}
          />
        ))}
    </div>
  )
}

// Read-only cost for a parent task: the cumulative sum of its children. Styled
// subtly (and labelled "calculated") so it's unmistakably derived, not editable.
function RollupCostCell({ entry }) {
  const costed = entry?.costed
  return (
    <div className="flex w-64 shrink-0 flex-col items-end px-2 py-2.5 text-right">
      <span className={`text-sm font-semibold ${costed ? 'text-slate-700' : 'text-gray-300'}`}>
        {costed ? formatCurrency(entry.cost) : '—'}
      </span>
      <span className="text-[11px] text-gray-400">calculated</span>
    </div>
  )
}

// Editable cost for a Sub-task (leaf). Shows the stored value with an edit
// affordance; clicking reveals an inline input with Save/Cancel, validation
// feedback, and a saved confirmation. The stored value is a plain number;
// it's displayed formatted but edited as a raw amount.
function LeafCostCell({ task, editing, onStartEdit, onStopEdit, onSaveCost, toast }) {
  const hasCost = Number.isFinite(task.cost)

  if (editing) {
    return (
      <CostEditor task={task} onStopEdit={onStopEdit} onSaveCost={onSaveCost} toast={toast} />
    )
  }

  return (
    <div className="flex w-64 shrink-0 items-center justify-end gap-2 px-2 py-2">
      <button
        type="button"
        onClick={onStartEdit}
        className={`group/edit flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition hover:bg-brand/5 ${
          hasCost ? 'font-semibold text-slate-800' : 'font-medium text-gray-400'
        }`}
        aria-label={`${hasCost ? 'Edit' : 'Add'} cost for ${task.name}`}
      >
        <span>{hasCost ? formatCurrency(task.cost) : 'Add cost'}</span>
        <PencilIcon className="h-3.5 w-3.5 text-gray-300 transition group-hover/edit:text-brand" />
      </button>
    </div>
  )
}

// The inline cost input. Validates on save, surfaces inline errors, persists via
// setTaskCost, and confirms with a toast. Enter saves, Escape cancels.
function CostEditor({ task, onStopEdit, onSaveCost, toast }) {
  const [value, setValue] = useState(
    Number.isFinite(task.cost) ? String(task.cost) : '',
  )
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const stop = (e) => e.stopPropagation()

  const save = async () => {
    const { value: parsed, error: parseError } = parseCurrencyInput(value)
    if (parseError) {
      setError(parseError)
      return
    }
    setBusy(true)
    try {
      await onSaveCost(task.id, parsed)
      toast.success(
        parsed === null ? `Cost cleared for "${task.name}".` : `Cost saved for "${task.name}".`,
      )
      onStopEdit()
    } catch {
      setBusy(false)
      toast.error('Could not save the cost. Please try again.')
    }
  }

  return (
    <div className="flex w-64 shrink-0 flex-col items-end gap-1 px-2 py-2" onClick={stop}>
      <div className="flex w-full items-center justify-end gap-1.5">
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') onStopEdit()
          }}
          placeholder="0.00"
          aria-label={`Cost for ${task.name}`}
          aria-invalid={Boolean(error)}
          className={`w-32 rounded-md border px-2 py-1 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
            error ? 'border-red-400' : 'border-gray-300 focus:border-brand'
          }`}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onStopEdit}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )
}
