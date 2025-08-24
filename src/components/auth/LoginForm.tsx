import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n'

export const LoginForm: React.FC<{ onForgot: () => void; onSuccess?: () => void }> = ({ onForgot, onSuccess }) => {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already signed in, redirect
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) onSuccess?.()
    })
  }, [onSuccess])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (remember) {
        // default supabase persistSession=true; nothing additional required
      }
      onSuccess?.()
    } catch (err: any) {
      setError(err?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) throw error
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">{t('email')}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">{t('password')}</label>
        <div className="flex items-center gap-2">
          <input
            type={show ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="text-sm px-3 py-2 rounded border">
            {show ? t('hide') : t('show')}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {t('remember_me')}
        </label>
        <button type="button" onClick={onForgot} className="text-sm underline">
          {t('forgot_password')}
        </button>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-black text-white py-2 disabled:opacity-60">
        {loading ? '…' : t('sign_in')}
      </button>
      <div className="flex items-center gap-2 opacity-70">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-xs">{t('or')}</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>
      <button type="button" onClick={handleGoogle} disabled={loading} className="w-full rounded-lg border py-2">
        {t('continue_google')}
      </button>
    </form>
  )
}
