import { Link } from 'react-router-dom'
import { STATUS_STYLES, getShortLocation } from '../data/sites'
import { useSites } from '../context/SitesContext'

export default function DashboardOverview() {
  const { sites, isLoading, error } = useSites()
  const totalSites = sites.length
  const activeSites = sites.filter((s) => s.status === 'Active').length
  const onHoldSites = sites.filter((s) => s.status === 'On Hold').length
  const totalAssignedUsers = sites.reduce((sum, s) => sum + s.assignedUsers.length, 0)

  const stats = [
    { label: 'Total Sites', value: totalSites },
    { label: 'Active Sites', value: activeSites },
    { label: 'On Hold', value: onHoldSites },
    { label: 'Assigned Users', value: totalAssignedUsers },
  ]

  const recentSites = [...sites]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of construction sites and assignments.</p>
        </div>
        <Link
          to="/dashboard/sites/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          + New Site
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Sites</h2>
          <Link to="/dashboard/sites" className="text-sm font-medium text-brand hover:text-brand-dark">
            View all
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="px-6 py-3 font-medium">Site Name</th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Start Date</th>
              <th className="px-6 py-3 font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  Loading sites...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-red-600">
                  Failed to load sites. Please try again.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              recentSites.map((site) => (
                <tr key={site.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <Link to={`/dashboard/sites/${site.id}`} className="font-medium text-slate-900 hover:text-brand">
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{getShortLocation(site)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[site.status]}`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{site.startDate}</td>
                  <td className="px-6 py-3 text-gray-600">{site.assignedUsers.length}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
