'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthMode } from '@/types'

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [processing, setProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Use selectors to avoid subscribing to entire store (prevents re-render storms)
  const signUp = useAuthStore(s => s.signUp)
  const signIn = useAuthStore(s => s.signIn)
  const sendMagicLink = useAuthStore(s => s.sendMagicLink)
  const resetPassword = useAuthStore(s => s.resetPassword)
  const error = useAuthStore(s => s.error)
  const setError = useAuthStore(s => s.setError)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Safety: if processing is stuck for 12s, force it off with an error
  useEffect(() => {
    if (!processing) return
    const timer = setTimeout(() => {
      console.warn('[auth-screen] Processing timeout: forcing off after 12s')
      setProcessing(false)
      setError('Sign in took too long. Please try again.')
    }, 12000)
    return () => clearTimeout(timer)
  }, [processing])

  const handleSignUp = async () => {
    const name = nameRef.current?.value?.trim()
    const email = emailRef.current?.value?.trim()
    const password = passwordRef.current?.value
    if (!name) { setError('Please enter your name.'); return }
    if (!email) { setError('Please enter your email.'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setProcessing(true); setError(null)
    try {
      const { hasSession } = await signUp(email, password, name)
      if (!hasSession) {
        setMessage('Check your email to confirm your account!')
        setMode('signin')
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Sign up failed. Try again.')
    }
    setProcessing(false)
  }

  const handleSignIn = async () => {
    const email = emailRef.current?.value?.trim()
    const password = passwordRef.current?.value
    if (!email) { setError('Please enter your email.'); return }
    if (!password) { setError('Please enter your password.'); return }

    setProcessing(true); setError(null)
    try {
      await signIn(email, password)
      // signIn sets user in store, page.tsx re-renders to AppShell
    } catch (e: unknown) {
      setError((e as Error).message || 'Sign in failed. Check your credentials.')
    } finally {
      setProcessing(false)
    }
  }

  const handleMagicLink = async () => {
    const email = emailRef.current?.value?.trim()
    if (!email) { setError('Enter your email first.'); return }
    setProcessing(true); setError(null)
    try {
      await sendMagicLink(email)
      setMessage('Magic link sent! Check your email.')
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to send magic link.')
    }
    setProcessing(false)
  }

  const handleResetPassword = async () => {
    const email = emailRef.current?.value?.trim()
    if (!email) { setError('Enter your email.'); return }
    setProcessing(true); setError(null)
    try {
      await resetPassword(email)
      setMessage('Password reset link sent! Check your email.')
      setMode('signin')
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to send reset link.')
    }
    setProcessing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'signup') handleSignUp()
      else if (mode === 'signin') handleSignIn()
      else handleResetPassword()
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setMessage(null)
    setShowPassword(false)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl gradient-amber mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-black">
          P
        </div>
        <h1 className="text-2xl font-bold text-white">PrÄperty</h1>
        <p className="text-dim text-sm mt-1">Track what you own</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm space-y-4">
        {/* Name field (signup only) */}
        {mode === 'signup' && (
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-2">
              Name <span className="text-amber-brand">*</span>
            </label>
            <input
              ref={nameRef}
              className="form-input"
              type="text"
              placeholder="What should we call you?"
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {/* Email field */}
        <div>
          <label className="block text-xs text-dim uppercase tracking-wider mb-2">
            Email <span className="text-amber-brand">*</span>
          </label>
          <input
            ref={emailRef}
            className="form-input"
            type="email"
            placeholder="you@email.com"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Password field (not on forgot) */}
        {mode !== 'forgot' && (
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-2">
              Password <span className="text-amber-brand">*</span>
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                className="form-input pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <g>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </g>
                  ) : (
                    <g>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </g>
                  )}
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
            {message}
          </div>
        )}

        {/* Action buttons */}
        {mode === 'signin' && (
          <>
            <button
              onClick={handleSignIn}
              disabled={processing}
              className="w-full gradient-amber rounded-xl py-4 text-base font-bold text-black disabled:opacity-60 transition-opacity"
            >
              {processing ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={handleMagicLink}
              disabled={processing}
              className="w-full glass glass-hover rounded-xl py-3 text-sm font-semibold text-white transition-all"
            >
              Send Magic Link Instead
            </button>
          </>
        )}

        {mode === 'signup' && (
          <button
            onClick={handleSignUp}
            disabled={processing}
            className="w-full gradient-amber rounded-xl py-4 text-base font-bold text-black disabled:opacity-60 transition-opacity"
          >
            {processing ? 'Creating account...' : 'Create Account'}
          </button>
        )}

        {mode === 'forgot' && (
          <button
            onClick={handleResetPassword}
            disabled={processing}
            className="w-full gradient-amber rounded-xl py-4 text-base font-bold text-black disabled:opacity-60 transition-opacity"
          >
            {processing ? 'Sending...' : 'Send Reset Link'}
          </button>
        )}

        {/* Mode switching */}
        <div className="text-center space-y-2 pt-2">
          {mode === 'signin' && (
            <>
              <button onClick={() => switchMode('forgot')} className="text-dim text-sm hover:text-white transition-colors">
                Forgot password?
              </button>
              <p className="text-dim text-sm">
                No account?{' '}
                <button onClick={() => switchMode('signup')} className="text-amber-brand font-semibold hover:text-amber-light transition-colors">
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-dim text-sm">
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="text-amber-brand font-semibold hover:text-amber-light transition-colors">
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} className="text-amber-brand text-sm font-semibold hover:text-amber-light transition-colors">
              Back to sign in
            </button>
          )}
        </div>
      </div>

      {/* Version stamp - confirms latest code is running */}
      <p className="text-[10px] text-zinc-600 mt-8">v2.1.0-Feb21</p>
    </div>
  )
}
