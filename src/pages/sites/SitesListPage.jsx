import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PencilIcon, SearchIcon, TrashIcon } from '../../components/icons'
import { useConfirm } from '../../context/ConfirmContext'
import { useSites } from '../../context/SitesContext'
import { useToast } from '../../context/ToastContext'
import { SITE_STATUSES, STATUS_STYLES, getShortLocation } from '../../data/sites'

export default function SitesListPage() {
  const { sites, deleteSite, isLoading, error } = useSites()
  const confirm = useConfirm()
  const toast = useToast()
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

  const handleDelete = async (site) => {
    const confirmed = await confirm({
      title: 'Delete site',
      message: `Delete "${site.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteSite(site.id)
      toast.success(`"${site.name}" deleted.`)
    } catch {
      toast.error('Failed to delete the site. Please try again.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Construction Sites</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage construction sites.</p>
        </div>
        <Link
          to="/dashboard/sites/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          + New Site
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location, or client"
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

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="px-6 py-3 font-medium">Site Name</th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Start Date</th>
              <th className="px-6 py-3 font-medium">Assigned</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                  Loading sites...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-red-600">
                  Failed to load sites. Please try again.
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredSites.map((site) => (
              <tr key={site.id} className="border-t border-gray-100">
                <td className="px-6 py-3">
                  <Link to={`/dashboard/sites/${site.id}`} className="font-medium text-slate-900 hover:text-brand">
                    {site.name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-gray-600">{getShortLocation(site)}</td>
                <td className="px-6 py-3 text-gray-600">{site.clientName}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[site.status]}`}>
                    {site.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">{site.startDate}</td>
                <td className="px-6 py-3 text-gray-600">{site.assignedUsers.length}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      to={`/dashboard/sites/${site.id}/edit`}
                      aria-label={`Edit ${site.name}`}
                      className="text-gray-400 hover:text-brand"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(site)}
                      aria-label={`Delete ${site.name}`}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !error && filteredSites.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                  No sites found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
