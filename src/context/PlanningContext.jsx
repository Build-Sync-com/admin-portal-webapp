import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LEAF_LEVEL, collectSubtree, getChildren } from '../data/planning'

// Per-site planning data for the Construction Program feature.
//
// Keyed by siteId (a site = a project at this stage). Holds the holiday /
// non-working-day calendar (Phase 2) and the flat task hierarchy (Phase 3).
// The schedule roll-ups (Phases 4-5) will derive from these same tasks.
//
// Mirrors SitesContext's mock async boundary: methods return Promises and can
// be swapped for real API calls later without changing callers.

const PlanningContext = createContext(null)

const MOCK_LATENCY_MS = 200

function mockRequest(result) {
  return new Promise((resolve) => setTimeout(() => resolve(result), MOCK_LATENCY_MS))
}

// Shape of a single site's planning record.
// tasks: flat list of nodes { id, siteId, parentId, name, level, order }.
function emptyPlan() {
  return { holidays: [], tasks: [] }
}

export function PlanningProvider({ children }) {
  // { [siteId]: { holidays: string[] } }
  const [plansBySite, setPlansBySite] = useState({})

  const getPlan = useCallback(
    (siteId) => plansBySite[siteId] ?? emptyPlan(),
    [plansBySite],
  )

  // Replaces the full holiday list for a site (sorted, de-duplicated). Used by
  // all holiday mutations so the stored list stays normalized.
  const setHolidays = useCallback(async (siteId, holidays) => {
    const normalized = Array.from(new Set(holidays)).sort()
    await mockRequest(null)
    setPlansBySite((prev) => ({
      ...prev,
      [siteId]: { ...(prev[siteId] ?? emptyPlan()), holidays: normalized },
    }))
    return normalized
  }, [])

  const addHoliday = useCallback(
    (siteId, iso) => setHolidays(siteId, [...(plansBySite[siteId]?.holidays ?? []), iso]),
    [plansBySite, setHolidays],
  )

  const addHolidays = useCallback(
    (siteId, isoList) => setHolidays(siteId, [...(plansBySite[siteId]?.holidays ?? []), ...isoList]),
    [plansBySite, setHolidays],
  )

  const removeHoliday = useCallback(
    (siteId, iso) =>
      setHolidays(siteId, (plansBySite[siteId]?.holidays ?? []).filter((h) => h !== iso)),
    [plansBySite, setHolidays],
  )

  const clearHolidays = useCallback((siteId) => setHolidays(siteId, []), [setHolidays])

  // --- Task hierarchy --------------------------------------------------------

  // Adds a task under parentId (null for the Main/root task). Level is derived
  // from the parent so callers can't create an inconsistent depth. The new node
  // is appended after its existing siblings.
  const addTask = useCallback(async (siteId, { parentId = null, name }) => {
    await mockRequest(null)
    let created = null
    setPlansBySite((prev) => {
      const plan = prev[siteId] ?? emptyPlan()
      const tasks = plan.tasks
      const parent = parentId ? tasks.find((t) => t.id === parentId) : null
      const level = parent ? parent.level + 1 : 0
      const siblings = getChildren(tasks, parentId)
      const order = siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0

      created = {
        id: crypto.randomUUID(),
        siteId,
        parentId,
        name: name.trim(),
        level,
        order,
      }
      return { ...prev, [siteId]: { ...plan, tasks: [...tasks, created] } }
    })
    return created
  }, [])

  const updateTask = useCallback(async (siteId, taskId, updates) => {
    await mockRequest(null)
    setPlansBySite((prev) => {
      const plan = prev[siteId] ?? emptyPlan()
      const next = { ...updates }
      if (typeof next.name === 'string') next.name = next.name.trim()
      return {
        ...prev,
        [siteId]: {
          ...plan,
          tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, ...next } : t)),
        },
      }
    })
  }, [])

  // --- Costing ---------------------------------------------------------------
  //
  // Allocates a planned cost to a LEAF task (Sub-task). Parent totals are never
  // stored — they are derived from children by computeCosts — so this guards
  // against costing a non-leaf, keeping a single source of truth. `cost` is a
  // number (>= 0) or null to clear an allocation. Lives here, next to the task
  // hierarchy, because a cost is an attribute of a planned task, not a separate
  // Costing-owned record: the task keeps one identity across Planning/Costing.
  const setTaskCost = useCallback(async (siteId, taskId, cost) => {
    await mockRequest(null)
    setPlansBySite((prev) => {
      const plan = prev[siteId] ?? emptyPlan()
      return {
        ...prev,
        [siteId]: {
          ...plan,
          tasks: plan.tasks.map((t) =>
            t.id === taskId && t.level === LEAF_LEVEL ? { ...t, cost } : t,
          ),
        },
      }
    })
  }, [])

  // Deletes a task and its entire subtree (descendants go with the parent).
  const deleteTask = useCallback(async (siteId, taskId) => {
    await mockRequest(null)
    setPlansBySite((prev) => {
      const plan = prev[siteId] ?? emptyPlan()
      const removeIds = new Set(collectSubtree(plan.tasks, taskId).map((t) => t.id))
      return {
        ...prev,
        [siteId]: { ...plan, tasks: plan.tasks.filter((t) => !removeIds.has(t.id)) },
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      getPlan,
      addHoliday,
      addHolidays,
      removeHoliday,
      clearHolidays,
      addTask,
      updateTask,
      setTaskCost,
      deleteTask,
    }),
    [getPlan, addHoliday, addHolidays, removeHoliday, clearHolidays, addTask, updateTask, setTaskCost, deleteTask],
  )

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>
}

export function usePlanning() {
  const ctx = useContext(PlanningContext)
  if (!ctx) throw new Error('usePlanning must be used within a PlanningProvider')
  return ctx
}
