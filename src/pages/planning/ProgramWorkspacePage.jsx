import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProgramBuilder from '../../components/planning/ProgramBuilder'
import WorkingCalendar from '../../components/planning/WorkingCalendar'
import { ChevronLeftIcon } from '../../components/icons'
import { useSites } from '../../context/SitesContext'
import { STATUS_STYLES, getShortLocation } from '../../data/sites'

const TABS = ['Working Calendar', 'Program']

// Phase 1 — Program workspace foundation for a single project.
// This establishes the layout, project/site context header, and the tab
// structure that later phases fill in:
//   - Working Calendar (Phase 2): holiday / non-working-day configuration.
//   - Program (Phases 3-6): the hierarchical task builder and program view.
// The tab bodies are intentionally left as empty placeholders here.
export default function ProgramWorkspacePage() {
  const { siteId } = useParams()
  const { getSite, isLoading, error } = useSites()
  const site = getSite(siteId)
  const [activeTab, setActiveTab] = useState('Working Calendar')

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
          to="/dashboard/planning"
          className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-dark"
        >
          Back to Planning
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/dashboard/planning"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-brand"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Planning
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
            Construction Program
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
      </div>

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Working Calendar' && <WorkingCalendar siteId={site.id} />}

      {activeTab === 'Program' && <ProgramBuilder siteId={site.id} />}
    </div>
  )
}
