import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n'
import { AuthCard } from '../../components/auth/AuthCard'

export const UpdatePassword: React.FC = () => {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <AuthCard title={t('set_new_password')}>
        {done ? (
          <div className="space-y-4">
            <p className="text-green-700">{t('password_updated')}</p>
            <a href="/auth" className="underline">{t('back_to_sign_in')}</a>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">{t('new_password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-black text-white py-2 disabled:opacity-60">
              {loading ? '…' : t('update_password')}
            </button>
          </form>
        )}
      </AuthCard>
    </div>
  )
}
