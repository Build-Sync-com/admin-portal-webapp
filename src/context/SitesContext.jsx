import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { generateProjectId, sites as initialSites } from '../data/sites'

const SitesContext = createContext(null)

// Mock async boundary: every method below already behaves like a real API
// call (returns a Promise, can reject). Only the body needs to change to a
// real fetch/axios call once the backend exists - callers already await it.
const MOCK_LATENCY_MS = 300

function mockRequest(result) {
  return new Promise((resolve) => setTimeout(() => resolve(result), MOCK_LATENCY_MS))
}

export function SitesProvider({ children }) {
  const [sites, setSites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    mockRequest(initialSites)
      .then((data) => {
        if (!cancelled) setSites(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      sites,
      isLoading,
      error,
      getSite: (id) => sites.find((site) => site.id === id),
      addSite: async (site) => {
        const newSite = {
          status: 'Planning',
          assignedUsers: [],
          ...site,
          id: crypto.randomUUID(),
          projectId: site.projectId || generateProjectId(sites.length),
        }
        await mockRequest(null)
        setSites((prev) => [...prev, newSite])
        return newSite
      },
      updateSite: async (id, updates) => {
        await mockRequest(null)
        setSites((prev) => prev.map((site) => (site.id === id ? { ...site, ...updates } : site)))
      },
      deleteSite: async (id) => {
        await mockRequest(null)
        setSites((prev) => prev.filter((site) => site.id !== id))
      },
      addAssignedUser: async (siteId, assignment) => {
        const newAssignment = {
          assignedDate: new Date().toISOString().slice(0, 10),
          ...assignment,
          id: crypto.randomUUID(),
        }
        await mockRequest(null)
        setSites((prev) =>
          prev.map((site) =>
            site.id === siteId ? { ...site, assignedUsers: [...site.assignedUsers, newAssignment] } : site,
          ),
        )
        return newAssignment
      },
      removeAssignedUser: async (siteId, assignmentId) => {
        await mockRequest(null)
        setSites((prev) =>
          prev.map((site) =>
            site.id === siteId
              ? { ...site, assignedUsers: site.assignedUsers.filter((a) => a.id !== assignmentId) }
              : site,
          ),
        )
      },
    }),
    [sites, isLoading, error],
  )

  return <SitesContext.Provider value={value}>{children}</SitesContext.Provider>
}

export function useSites() {
  const ctx = useContext(SitesContext)
  if (!ctx) throw new Error('useSites must be used within a SitesProvider')
  return ctx
}
