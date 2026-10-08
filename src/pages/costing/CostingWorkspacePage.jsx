import { Link, useParams } from 'react-router-dom'
import CostTree from '../../components/costing/CostTree'
import { ChevronLeftIcon } from '../../components/icons'
import { useSites } from '../../context/SitesContext'
import { STATUS_STYLES, getShortLocation } from '../../data/sites'

// Phase 2 — the per-project costing workspace.
// Displays the planned construction program (sourced from Planning) and lets
// the responsible staff member allocate costs to its lowest-level activities.
// The hierarchy, task names and structure all come from Planning; Costing only
// adds the money. There is no "Costing editor" for the structure itself — the
// header links back to Planning for any structural change.
export default function CostingWorkspacePage() {
  const { siteId } = useParams()
  const { getSite, isLoading, error } = useSites()
  const site = getSite(siteId)

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading project...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load this project. Please try again.</p>
  }

  if (!site) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Project not found</h1>
        <Link
          to="/dashboard/costing"
          className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-dark"
        >
          Back to Costing
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/dashboard/costing"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-brand"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Costing
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{site.name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[site.status]}`}>
              {site.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Program Costing
            <span className="mx-2 text-gray-300">•</span>
            {site.projectId || '—'}
            {getShortLocation(site) && (
              <>
                <span className="mx-2 text-gray-300">•</span>
                {getShortLocation(site)}
              </>
            )}
          </p>
        </div>

        <Link
          to={`/dashboard/planning/${site.id}`}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Edit program in Planning
        </Link>
      </div>

      <CostTree siteId={site.id} />
    </div>
  )
}
