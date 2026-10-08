import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfirmProvider } from './context/ConfirmContext'
import { ToastProvider } from './context/ToastContext'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import PlanningListPage from './pages/planning/PlanningListPage'
import ProgramWorkspacePage from './pages/planning/ProgramWorkspacePage'
import CostingListPage from './pages/costing/CostingListPage'
import CostingWorkspacePage from './pages/costing/CostingWorkspacePage'
import SignInPage from './pages/SignInPage'
import SiteDetailPage from './pages/sites/SiteDetailPage'
import SiteFormPage from './pages/sites/SiteFormPage'
import SitesListPage from './pages/sites/SitesListPage'

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="sites" element={<SitesListPage />} />
              <Route path="sites/new" element={<SiteFormPage />} />
              <Route path="sites/:siteId" element={<SiteDetailPage />} />
              <Route path="sites/:siteId/edit" element={<SiteFormPage />} />
              <Route path="planning" element={<PlanningListPage />} />
              <Route path="planning/:siteId" element={<ProgramWorkspacePage />} />
              <Route path="costing" element={<CostingListPage />} />
              <Route path="costing/:siteId" element={<CostingWorkspacePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
