import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BuildingIcon, HardHatIcon, HomeIcon, LogoutIcon, PlanIcon, WalletIcon } from '../components/icons'
import { PlanningProvider } from '../context/PlanningContext'
import { SitesProvider } from '../context/SitesContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/dashboard/sites', label: 'Construction Sites', icon: BuildingIcon },
  { to: '/dashboard/planning', label: 'Planning', icon: PlanIcon },
  { to: '/dashboard/costing', label: 'Costing', icon: WalletIcon },
]

export default function DashboardLayout() {
  const navigate = useNavigate()

  return (
    <SitesProvider>
      <PlanningProvider>
      <div className="flex h-screen bg-gray-50">
        <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="shrink-0 px-6 py-6">
            <span className="text-lg font-bold text-slate-900">
              BuildOpt <span className="text-brand">5.0</span>
            </span>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="shrink-0 border-t border-gray-200 p-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <LogoutIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white">
                <HardHatIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium text-slate-900">Admin</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
      </PlanningProvider>
    </SitesProvider>
  )
}
