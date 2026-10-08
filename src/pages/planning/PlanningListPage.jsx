import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, PlanIcon, SearchIcon } from '../../components/icons'
import { useSites } from '../../context/SitesContext'
import { SITE_STATUSES, STATUS_STYLES, getShortLocation } from '../../data/sites'

// Phase 1 — Planning tab foundation.
// The Planning Engineer first chooses which project's construction program to
// work on. Since a site and its project are the same entity at this stage, the
// program is scoped to a site; this list is that project picker. The actual
// program workspace (calendar + hierarchy builder) lives behind each project.
export default function PlanningListPage() {
  const { sites, isLoading, error } = useSites()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredSites = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sites.filter((site) => {
      const matchesStatus = statusFilter === 'All' || site.status === statusFilter
      const matchesSearch =
        !term ||
        site.name.toLowerCase().includes(term) ||
        getShortLocation(site).toLowerCase().includes(term) ||
        site.clientName.toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [sites, search, statusFilter])

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Planning</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a project to define and manage its construction program.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, location, or client"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="All">All statuses</option>
          {SITE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="mt-6 text-sm text-gray-500">Loading projects...</p>}
      {!isLoading && error && (
        <p className="mt-6 text-sm text-red-600">Failed to load projects. Please try again.</p>
      )}

      {!isLoading && !error && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => (
            <Link
              key={site.id}
              to={`/dashboard/planning/${site.id}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <PlanIcon className="h-5 w-5" />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[site.status]}`}>
                  {site.status}
                </span>
              </div>
              <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-brand">{site.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{getShortLocation(site) || '—'}</p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="text-gray-500">{site.projectId || '—'}</span>
                <span className="flex items-center gap-1 font-medium text-brand">
                  Open program
                  <ChevronRightIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}

          {filteredSites.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              No projects found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
