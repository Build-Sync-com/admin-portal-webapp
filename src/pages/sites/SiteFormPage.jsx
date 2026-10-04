import { Fragment, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSites } from '../../context/SitesContext'
import { useToast } from '../../context/ToastContext'
import { COUNTRIES, PROJECT_TYPES, SL_DISTRICTS, SL_PROVINCES, calculateDuration, generateProjectId, getPhonePlaceholder } from '../../data/sites'

const EMPTY_FORM = {
  name: '',
  projectType: PROJECT_TYPES[0],
  clientName: '',
  contractRefNo: '',
  consultantName: '',
  siteAddress: '',
  city: '',
  district: '',
  province: '',
  country: 'Sri Lanka',
  startDate: '',
  completionDate: '',
  initialContractValue: '',
  telephone: '',
  siteEmail: '',
  description: '',
}

const STEPS = [
  { id: 1, title: 'Project Information' },
  { id: 2, title: 'Location' },
  { id: 3, title: 'Project Dates' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/
const CONTRACT_REF_PATTERN = /^[A-Za-z0-9/-]{3,30}$/
const MAX_CONTRACT_VALUE = 1_000_000_000_000

// Which step each field lives on - used to jump to the first error on submit.
const FIELD_STEP = {
  name: 1,
  clientName: 1,
  contractRefNo: 1,
  consultantName: 1,
  siteAddress: 2,
  city: 2,
  district: 2,
  province: 2,
  country: 2,
  startDate: 3,
  completionDate: 3,
  initialContractValue: 3,
  telephone: 3,
  siteEmail: 3,
  description: 3,
}

export default function SiteFormPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { sites, getSite, addSite, updateSite, isLoading, error } = useSites()
  const toast = useToast()
  const isEditMode = Boolean(siteId)
  const existingSite = isEditMode ? getSite(siteId) : null

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydratedSiteId, setHydratedSiteId] = useState(null)

  // existingSite only resolves once the sites list has finished loading, so it
  // isn't known at useState's initializer time. Adjusted during render (rather
  // than in an effect) to avoid an extra render pass - see React docs on
  // "adjusting state when a prop changes".
  if (isEditMode && existingSite && existingSite.id !== hydratedSiteId) {
    setForm({ ...EMPTY_FORM, ...existingSite })
    setHydratedSiteId(existingSite.id)
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load. Please try again.</p>
  }

  if (isEditMode && !existingSite) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Site not found</h1>
        <Link to="/dashboard/sites" className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-dark">
          Back to Construction Sites
        </Link>
      </div>
    )
  }

  const projectId = existingSite?.projectId || generateProjectId(sites.length)
  const duration = calculateDuration(form.startDate, form.completionDate)

  const isSriLanka = form.country === 'Sri Lanka'

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Province/District meaning changes with the country (SL dropdowns vs. free text),
  // so clear them whenever the country changes to avoid stale values.
  const handleCountryChange = (e) => {
    const country = e.target.value
    setForm((prev) => ({ ...prev, country, province: '', district: '' }))
    setErrors((prev) => ({ ...prev, country: undefined, province: undefined, district: undefined }))
  }

  const validateStep1 = (values) => {
    const next = {}
    const name = values.name.trim()
    if (!name) {
      next.name = 'Project name is required.'
    } else if (name.length < 2) {
      next.name = 'Project name must be at least 2 characters.'
    } else if (name.length > 120) {
      next.name = 'Project name must be 120 characters or fewer.'
    } else {
      const duplicate = sites.some(
        (s) => s.id !== siteId && (s.name || '').trim().toLowerCase() === name.toLowerCase(),
      )
      if (duplicate) next.name = 'A project with this name already exists.'
    }

    if (!values.projectType) next.projectType = 'Project type is required.'

    const client = values.clientName.trim()
    if (!client) {
      next.clientName = 'Client name is required.'
    } else if (client.length > 120) {
      next.clientName = 'Client name must be 120 characters or fewer.'
    }

    if (values.contractRefNo.trim() && !CONTRACT_REF_PATTERN.test(values.contractRefNo.trim())) {
      next.contractRefNo = 'Use letters, numbers, dashes or slashes (e.g. CR-2026-014).'
    }

    if (values.consultantName.trim().length > 120) {
      next.consultantName = 'Consultant name must be 120 characters or fewer.'
    }

    return next
  }

  const validateStep2 = (values) => {
    const next = {}
    if (!values.siteAddress.trim()) next.siteAddress = 'Site address is required.'
    else if (values.siteAddress.trim().length > 200) next.siteAddress = 'Site address must be 200 characters or fewer.'
    if (!values.city.trim()) next.city = 'City is required.'
    else if (values.city.trim().length > 80) next.city = 'City must be 80 characters or fewer.'
    if (!values.district) next.district = 'District is required.'
    if (!values.province) next.province = 'Province is required.'
    if (!values.country) next.country = 'Country is required.'
    return next
  }

  const validateStep3 = (values) => {
    const next = {}
    if (!values.startDate) next.startDate = 'Start date is required.'

    if (!values.completionDate) {
      next.completionDate = 'Completion date is required.'
    } else if (values.startDate && values.completionDate < values.startDate) {
      next.completionDate = 'Completion date cannot be before the start date.'
    }

    if (values.initialContractValue === '') {
      next.initialContractValue = 'Initial contract value is required.'
    } else {
      const amount = Number(values.initialContractValue)
      if (Number.isNaN(amount)) {
        next.initialContractValue = 'Enter a valid amount.'
      } else if (amount < 0) {
        next.initialContractValue = 'Contract value cannot be negative.'
      } else if (amount > MAX_CONTRACT_VALUE) {
        next.initialContractValue = 'Contract value is unrealistically large.'
      }
    }

    if (values.telephone.trim() && !PHONE_PATTERN.test(values.telephone.trim())) {
      next.telephone = 'Enter a valid telephone number.'
    }
    if (values.siteEmail.trim() && !EMAIL_PATTERN.test(values.siteEmail.trim())) {
      next.siteEmail = 'Enter a valid email address.'
    }
    if (values.description.length > 1000) {
      next.description = 'Description must be 1000 characters or fewer.'
    }
    return next
  }

  const validateAll = (values) => ({
    ...validateStep1(values),
    ...validateStep2(values),
    ...validateStep3(values),
  })

  const firstErrorStep = (errs) =>
    Math.min(...Object.keys(errs).map((field) => FIELD_STEP[field] || STEPS.length))

  const goToStep = (targetStep) => {
    // Only validate when moving forward; going back is always allowed.
    if (targetStep > step) {
      const validators = { 1: validateStep1, 2: validateStep2, 3: validateStep3 }
      for (let s = step; s < targetStep; s += 1) {
        const stepErrors = validators[s](form)
        if (Object.keys(stepErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...stepErrors }))
          setStep(s)
          return
        }
      }
    }
    setStep(targetStep)
  }

  const handleNext = () => goToStep(step + 1)
  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  // The form never submits implicitly: Enter in any field is swallowed here so it
  // can't trigger the Create button (which used to auto-skip step 3). Creation
  // happens only via an explicit click on the final-step button -> handleCreate.
  const handleFormSubmit = (e) => {
    e.preventDefault()
  }

  const handleCreate = async () => {
    const allErrors = validateAll(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setStep(firstErrorStep(allErrors))
      return
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      contractRefNo: form.contractRefNo.trim(),
      consultantName: form.consultantName.trim(),
      siteAddress: form.siteAddress.trim(),
      city: form.city.trim(),
      telephone: form.telephone.trim(),
      siteEmail: form.siteEmail.trim(),
      description: form.description.trim(),
      initialContractValue: form.initialContractValue === '' ? '' : Number(form.initialContractValue),
    }

    setIsSubmitting(true)
    try {
      if (isEditMode) {
        await updateSite(siteId, payload)
        toast.success(`"${payload.name}" updated successfully.`)
      } else {
        await addSite({ ...payload, projectId })
        toast.success(`"${payload.name}" created successfully.`)
      }
      navigate('/dashboard/sites')
    } catch {
      toast.error(isEditMode ? 'Failed to update the project. Please try again.' : 'Failed to create the project. Please try again.')
      setIsSubmitting(false)
    }
  }

  const inputClass = (field) =>
    `w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-300 focus:border-brand focus:ring-brand/20'
    }`

  const fieldError = (field) =>
    errors[field] ? <p className="mt-1.5 text-sm text-red-600">{errors[field]}</p> : null

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{isEditMode ? 'Edit Project' : 'Add New Project'}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {isEditMode ? 'Update the details for this construction project.' : 'Enter the details for the new construction project.'}
      </p>

      <div className="mx-auto mt-6 max-w-2xl">
        <ol className="flex items-start">
          {STEPS.map((s, idx) => (
            <Fragment key={s.id}>
              <li>
                <button type="button" onClick={() => goToStep(s.id)} className="flex flex-col items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step === s.id
                        ? 'bg-brand text-white'
                        : step > s.id
                          ? 'bg-brand/10 text-brand'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s.id}
                  </span>
                  <span
                    className={`whitespace-nowrap text-sm font-medium ${step === s.id ? 'text-slate-900' : 'text-gray-500'}`}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
              {idx < STEPS.length - 1 && <li aria-hidden="true" className="mx-3 mt-4 h-px flex-1 bg-gray-200" />}
            </Fragment>
          ))}
        </ol>
      </div>

      <form onSubmit={handleFormSubmit} noValidate className="mx-auto mt-6 max-w-2xl rounded-2xl border border-gray-200 bg-white p-8">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Project ID</label>
              <input
                type="text"
                value={projectId}
                disabled
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Project Type</label>
              <select value={form.projectType} onChange={handleChange('projectType')} className={inputClass('projectType')}>
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {fieldError('projectType')}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-600">
                Project Name
              </label>
              <input
                id="name"
                type="text"
                maxLength={120}
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Enter project name"
                className={inputClass('name')}
              />
              {fieldError('name')}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-gray-600">
                Client Name
              </label>
              <input
                id="clientName"
                type="text"
                maxLength={120}
                value={form.clientName}
                onChange={handleChange('clientName')}
                placeholder="Enter client name"
                className={inputClass('clientName')}
              />
              {fieldError('clientName')}
            </div>

            <div>
              <label htmlFor="contractRefNo" className="mb-1.5 block text-sm font-medium text-gray-600">
                Contract Reference No
              </label>
              <input
                id="contractRefNo"
                type="text"
                maxLength={30}
                value={form.contractRefNo}
                onChange={handleChange('contractRefNo')}
                placeholder="CR-YYYY-000"
                className={inputClass('contractRefNo')}
              />
              {fieldError('contractRefNo')}
            </div>

            <div>
              <label htmlFor="consultantName" className="mb-1.5 block text-sm font-medium text-gray-600">
                Consultant Name
              </label>
              <input
                id="consultantName"
                type="text"
                maxLength={120}
                value={form.consultantName}
                onChange={handleChange('consultantName')}
                placeholder="Enter consultant name"
                className={inputClass('consultantName')}
              />
              {fieldError('consultantName')}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="siteAddress" className="mb-1.5 block text-sm font-medium text-gray-600">
                Site Address
              </label>
              <input
                id="siteAddress"
                type="text"
                maxLength={200}
                value={form.siteAddress}
                onChange={handleChange('siteAddress')}
                placeholder="Enter site address"
                className={inputClass('siteAddress')}
              />
            </div>

            <div>
              <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-gray-600">
                Country
              </label>
              <select id="country" value={form.country} onChange={handleCountryChange} className={inputClass('country')}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldError('country')}
            </div>

            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-600">
                City
              </label>
              <input
                id="city"
                type="text"
                maxLength={80}
                value={form.city}
                onChange={handleChange('city')}
                placeholder="Enter city"
                className={inputClass('city')}
              />
              {fieldError('city')}
            </div>

            <div>
              <label htmlFor="province" className="mb-1.5 block text-sm font-medium text-gray-600">
                Province
              </label>
              {isSriLanka ? (
                <select id="province" value={form.province} onChange={handleChange('province')} className={inputClass('province')}>
                  <option value="">Select province</option>
                  {SL_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="province"
                  type="text"
                  maxLength={80}
                  value={form.province}
                  onChange={handleChange('province')}
                  placeholder="Enter province / state / region"
                  className={inputClass('province')}
                />
              )}
              {fieldError('province')}
            </div>

            <div>
              <label htmlFor="district" className="mb-1.5 block text-sm font-medium text-gray-600">
                District
              </label>
              {isSriLanka ? (
                <select id="district" value={form.district} onChange={handleChange('district')} className={inputClass('district')}>
                  <option value="">Select district</option>
                  {SL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="district"
                  type="text"
                  maxLength={80}
                  value={form.district}
                  onChange={handleChange('district')}
                  placeholder="Enter district / area"
                  className={inputClass('district')}
                />
              )}
              {fieldError('district')}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-gray-600">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange('startDate')}
                className={inputClass('startDate')}
              />
              {fieldError('startDate')}
            </div>

            <div>
              <label htmlFor="completionDate" className="mb-1.5 block text-sm font-medium text-gray-600">
                Completion Date
              </label>
              <input
                id="completionDate"
                type="date"
                value={form.completionDate}
                onChange={handleChange('completionDate')}
                className={inputClass('completionDate')}
              />
              {fieldError('completionDate')}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Duration</label>
              <input
                type="text"
                value={duration || '-'}
                disabled
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="initialContractValue" className="mb-1.5 block text-sm font-medium text-gray-600">
                Initial Contract Value (LKR)
              </label>
              <input
                id="initialContractValue"
                type="number"
                min="0"
                step="0.01"
                value={form.initialContractValue}
                onChange={handleChange('initialContractValue')}
                placeholder="Enter initial contract value"
                className={inputClass('initialContractValue')}
              />
              {fieldError('initialContractValue')}
            </div>

            <div>
              <label htmlFor="telephone" className="mb-1.5 block text-sm font-medium text-gray-600">
                Telephone No
              </label>
              <input
                id="telephone"
                type="tel"
                value={form.telephone}
                onChange={handleChange('telephone')}
                placeholder={getPhonePlaceholder(form.country)}
                className={inputClass('telephone')}
              />
              {fieldError('telephone')}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="siteEmail" className="mb-1.5 block text-sm font-medium text-gray-600">
                Site Email
              </label>
              <input
                id="siteEmail"
                type="email"
                value={form.siteEmail}
                onChange={handleChange('siteEmail')}
                placeholder="Enter site email"
                className={inputClass('siteEmail')}
              />
              {fieldError('siteEmail')}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-600">
                Project Description
              </label>
              <textarea
                id="description"
                rows={4}
                maxLength={1000}
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Enter project description"
                className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {fieldError('description')}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/sites"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            {step < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
