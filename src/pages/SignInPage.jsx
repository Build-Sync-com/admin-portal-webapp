import { useState } from 'react'

function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function HardHatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 18a7 7 0 0 1 14 0"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.5h6a1.5 1.5 0 0 1 1.5 1.5v.5h-9V7a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
      />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.7C4.3 8.2 2.5 12 2.5 12s3.5 7 9.5 7c1.9 0 3.5-.5 4.8-1.3M17.4 17.3C19.6 15.8 21.5 12 21.5 12s-3.5-7-9.5-7c-.6 0-1.2.05-1.8.16"
      />
    </svg>
  )
}

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
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

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                    placeholder="Enter your username"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
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
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Sign in
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
