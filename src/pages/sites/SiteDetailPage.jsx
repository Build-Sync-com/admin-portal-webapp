import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PencilIcon, TrashIcon } from '../../components/icons'
import { useConfirm } from '../../context/ConfirmContext'
import { useSites } from '../../context/SitesContext'
import { useToast } from '../../context/ToastContext'
import {
  COUNTRIES,
  COUNTRY_DIAL_CODES,
  ID_TYPES,
  SITE_ROLES,
  STATUS_STYLES,
  calculateDuration,
  getFullAddress,
  getLocalPhonePlaceholder,
} from '../../data/sites'

const TABS = ['Overview', 'Assigned Users']
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/
const NAME_PATTERN = /^[A-Za-z\s.'-]{2,80}$/
const PHONE_NUMBER_PATTERN = /^[0-9\s-]{6,12}$/
const NIC_PATTERN = /^([0-9]{9}[VvXx]|[0-9]{12})$/
const PASSPORT_PATTERN = /^[A-Za-z0-9]{5,15}$/

const EMPTY_USER_FORM = {
  name: '',
  username: '',
  role: SITE_ROLES[0],
  phoneCountry: 'Sri Lanka',
  phoneNumber: '',
  idType: ID_TYPES[0],
  idNumber: '',
  country: 'Sri Lanka',
  homeTown: '',
}

export default function SiteDetailPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { getSite, deleteSite, addAssignedUser, removeAssignedUser, isLoading, error } = useSites()
  const site = getSite(siteId)
  const confirm = useConfirm()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('Overview')
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [userErrors, setUserErrors] = useState({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading site...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load this site. Please try again.</p>
  }

  if (!site) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Site not found</h1>
        <Link to="/dashboard/sites" className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-dark">
          Back to Construction Sites
        </Link>
      </div>
    )
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete site',
      message: `Delete "${site.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteSite(site.id)
      toast.success(`"${site.name}" deleted.`)
      navigate('/dashboard/sites')
    } catch {
      toast.error('Failed to delete the site. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleUserFieldChange = (field) => (e) => {
    setUserForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (userErrors[field]) setUserErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Defaults the phone country-code dropdown to match the selected country;
  // the user can still override it separately afterwards.
  const handleUserCountryChange = (e) => {
    const country = e.target.value
    setUserForm((prev) => ({ ...prev, country, phoneCountry: country || prev.phoneCountry }))
    setUserErrors((prev) => ({ ...prev, country: undefined }))
  }

  // The ID number format depends on the ID type, so clear it (and its error)
  // whenever the type changes to avoid a stale value in the wrong format.
  const handleIdTypeChange = (e) => {
    const idType = e.target.value
    setUserForm((prev) => ({ ...prev, idType, idNumber: '' }))
    setUserErrors((prev) => ({ ...prev, idType: undefined, idNumber: undefined }))
  }

  const validateUserForm = (values) => {
    const next = {}

    const name = values.name.trim()
    if (!name) {
      next.name = 'Name is required.'
    } else if (name.length < 2 || !NAME_PATTERN.test(name)) {
      next.name = 'Enter a valid name.'
    }

    const username = values.username.trim()
    if (!username) {
      next.username = 'Username is required.'
    } else if (username.length < 2 || !USERNAME_PATTERN.test(username)) {
      next.username = 'Enter a valid username (letters, numbers, dots, hyphens, underscores only).'
    } else if (site.assignedUsers.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      next.username = 'This user is already assigned to the site.'
    }

    const phoneNumber = values.phoneNumber.trim()
    if (!phoneNumber) {
      next.phoneNumber = 'Telephone number is required.'
    } else if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
      next.phoneNumber = 'Enter a valid telephone number.'
    }

    if (!values.country) next.country = 'Country is required.'

    const homeTown = values.homeTown.trim()
    if (!homeTown) {
      next.homeTown = 'Home town is required.'
    } else if (homeTown.length > 80) {
      next.homeTown = 'Home town must be 80 characters or fewer.'
    }

    const idNumber = values.idNumber.trim()
    if (!idNumber) {
      next.idNumber = `${values.idType} number is required.`
    } else if (values.idType === 'NIC' && !NIC_PATTERN.test(idNumber)) {
      next.idNumber = 'Enter a valid NIC number (9 digits + V/X, or 12 digits).'
    } else if (values.idType === 'Passport' && !PASSPORT_PATTERN.test(idNumber)) {
      next.idNumber = 'Enter a valid passport number.'
    }

    return next
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    const errs = validateUserForm(userForm)
    if (Object.keys(errs).length > 0) {
      setUserErrors(errs)
      return
    }

    const dialCode = COUNTRY_DIAL_CODES[userForm.phoneCountry]
    const name = userForm.name.trim()

    setIsAssigning(true)
    try {
      await addAssignedUser(site.id, {
        name,
        username: userForm.username.trim(),
        role: userForm.role,
        telephone: `+${dialCode} ${userForm.phoneNumber.trim()}`,
        idType: userForm.idType,
        idNumber: userForm.idNumber.trim(),
        country: userForm.country,
        homeTown: userForm.homeTown.trim(),
      })
      setUserForm(EMPTY_USER_FORM)
      setUserErrors({})
      toast.success(`${name} assigned as ${userForm.role}.`)
    } catch {
      toast.error('Failed to assign the user. Please try again.')
    } finally {
      setIsAssigning(false)
    }
  }

  const userInputClass = (field) =>
    `w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
      userErrors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-300 focus:border-brand focus:ring-brand/20'
    }`

  const userFieldError = (field) =>
    userErrors[field] ? <p className="mt-1.5 text-sm text-red-600">{userErrors[field]}</p> : null

  const handleRemoveUser = async (assignment) => {
    const confirmed = await confirm({
      title: 'Remove assigned user',
      message: `Remove ${assignment.username} from "${site.name}"?`,
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await removeAssignedUser(site.id, assignment.id)
      toast.success(`${assignment.username} removed.`)
    } catch {
      toast.error('Failed to remove the user. Please try again.')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{site.name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[site.status]}`}>
              {site.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{getFullAddress(site)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/dashboard/sites/${site.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
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

      {activeTab === 'Overview' && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <h2 className="text-sm font-semibold text-slate-900">Project Information</h2>
            <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Project ID</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.projectId || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Project Type</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.projectType || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Client Name</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.clientName || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Contract Reference No</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.contractRefNo || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Consultant Name</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.consultantName || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <h2 className="text-sm font-semibold text-slate-900">Location</h2>
            <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Site Address</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{getFullAddress(site) || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">District</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.district || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Province</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.province || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Country</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.country || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <h2 className="text-sm font-semibold text-slate-900">Project Dates</h2>
            <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.startDate || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Completion Date</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.completionDate || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {calculateDuration(site.startDate, site.completionDate) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Initial Contract Value</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {site.initialContractValue ? `LKR ${Number(site.initialContractValue).toLocaleString()}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Telephone No</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.telephone || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Site Email</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{site.siteEmail || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Project Description</dt>
                <dd className="mt-1 text-sm text-slate-700">{site.description || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'Assigned Users' && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Telephone No</th>
                  <th className="px-6 py-3 font-medium">NIC / Passport</th>
                  <th className="px-6 py-3 font-medium">Country</th>
                  <th className="px-6 py-3 font-medium">Home Town</th>
                  <th className="px-6 py-3 font-medium">Assigned Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {site.assignedUsers.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-slate-900">{assignment.name || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{assignment.username}</td>
                    <td className="px-6 py-3 text-gray-600">{assignment.role}</td>
                    <td className="px-6 py-3 text-gray-600">{assignment.telephone || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {assignment.idNumber ? `${assignment.idType}: ${assignment.idNumber}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{assignment.country || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{assignment.homeTown || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{assignment.assignedDate}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(assignment)}
                        aria-label={`Remove ${assignment.username}`}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {site.assignedUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                      No users assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddUser} noValidate className="border-t border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900">Assign New User</h3>
            <p className="mt-1 text-sm text-gray-500">Enter the details below to assign a user to this site.</p>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="userName" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Name
                </label>
                <input
                  id="userName"
                  type="text"
                  maxLength={80}
                  value={userForm.name}
                  onChange={handleUserFieldChange('name')}
                  placeholder="Enter name"
                  className={userInputClass('name')}
                />
                {userFieldError('name')}
              </div>

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={userForm.username}
                  onChange={handleUserFieldChange('username')}
                  placeholder="Enter username"
                  className={userInputClass('username')}
                />
                {userFieldError('username')}
              </div>

              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Role
                </label>
                <select
                  id="role"
                  value={userForm.role}
                  onChange={handleUserFieldChange('role')}
                  className={userInputClass('role')}
                >
                  {SITE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="userCountry" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Country
                </label>
                <select
                  id="userCountry"
                  value={userForm.country}
                  onChange={handleUserCountryChange}
                  className={userInputClass('country')}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {userFieldError('country')}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Telephone No
                </label>
                <div className="flex gap-2">
                  <select
                    id="phoneCountry"
                    value={userForm.phoneCountry}
                    onChange={handleUserFieldChange('phoneCountry')}
                    aria-label="Country code"
                    className="w-28 shrink-0 rounded-lg border border-gray-300 py-2.5 px-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        +{COUNTRY_DIAL_CODES[c] || '--'}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={handleUserFieldChange('phoneNumber')}
                    placeholder={getLocalPhonePlaceholder()}
                    className={`min-w-0 flex-1 ${userInputClass('phoneNumber')}`}
                  />
                </div>
                {userFieldError('phoneNumber')}
              </div>

              <div>
                <label htmlFor="homeTown" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Home Town
                </label>
                <input
                  id="homeTown"
                  type="text"
                  maxLength={80}
                  value={userForm.homeTown}
                  onChange={handleUserFieldChange('homeTown')}
                  placeholder="Enter home town"
                  className={userInputClass('homeTown')}
                />
                {userFieldError('homeTown')}
              </div>

              <div>
                <label htmlFor="idType" className="mb-1.5 block text-sm font-medium text-gray-600">
                  ID Type
                </label>
                <select
                  id="idType"
                  value={userForm.idType}
                  onChange={handleIdTypeChange}
                  className={userInputClass('idType')}
                >
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="idNumber" className="mb-1.5 block text-sm font-medium text-gray-600">
                  {userForm.idType} Number
                </label>
                <input
                  id="idNumber"
                  type="text"
                  value={userForm.idNumber}
                  onChange={handleUserFieldChange('idNumber')}
                  placeholder={userForm.idType === 'NIC' ? 'Enter NIC number' : 'Enter passport number'}
                  className={userInputClass('idNumber')}
                />
                {userFieldError('idNumber')}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isAssigning}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning ? 'Assigning...' : 'Assign User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
