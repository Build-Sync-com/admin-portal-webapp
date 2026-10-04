import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, EyeIcon, EyeOffIcon, HardHatIcon, LockIcon, UserIcon } from '../components/icons'
import { useToast } from '../context/ToastContext'

// Frontend-only stub. Swap this for a real API call when the backend is ready.
// Resolves on valid demo credentials, rejects with a tagged reason otherwise.
// Credentials come from .env.local (gitignored), so nothing sensitive is committed -
// see .env.example for the variable names.
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD

function signIn({ username, password }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
        resolve({ username })
      } else {
        reject(new Error('invalid_credentials'))
      }
    }, 700)
  })
}

export default function SignInPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (setter, field) => (e) => {
    setter(e.target.value)
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (trimmedUsername) => {
    const nextErrors = {}
    if (!trimmedUsername) nextErrors.username = 'Username is required.'
    if (!password) nextErrors.password = 'Password is required.'
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmedUsername = username.trim()
    const nextErrors = validate(trimmedUsername)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await signIn({ username: trimmedUsername, password })
      setUsername(trimmedUsername)
      toast.success('Login successful. Redirecting...')
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof Error && err.message === 'invalid_credentials') {
        toast.error('Invalid username or password.')
      } else {
        toast.error('Unable to sign in. Please try again.')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_right,#0f172a09_1px,transparent_1px),linear-gradient(to_bottom,#0f172a09_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(29,91,255,0.16),transparent_70%)]" />

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <span className="text-xl font-bold text-slate-900">
            BuildOpt <span className="text-brand">5.0</span>
          </span>
          <a
            href="/"
            className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to website
          </a>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-[480px] rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
            <div className="mb-8 flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
                  <HardHatIcon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-slate-900">Admin</span>
              </div>
              <span className="text-sm font-medium text-brand">Change</span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">Sign in to your account</h1>
            <p className="mt-1 text-sm text-gray-500">Enter the username and password.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-600">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={handleChange(setUsername, 'username')}
                    placeholder="Enter your username"
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                      errors.username
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-300 focus:border-brand focus:ring-brand/20'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p id="username-error" className="mt-1.5 text-sm text-red-600">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-dark">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={handleChange(setPassword, 'password')}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-300 focus:border-brand focus:ring-brand/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="keep-signed-in"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-brand"
                />
                <label htmlFor="keep-signed-in" className="text-sm text-gray-600">
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-brand"
              >
                {isSubmitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
