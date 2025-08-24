import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n'

export const ForgotPassword: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const redirectTo = `${window.location.origin}/auth/update-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sent && <p className="text-sm text-green-700">{t('send_reset_link')} ✓</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-black text-white py-2 disabled:opacity-60">
          {loading ? '…' : t('send_reset_link')}
        </button>
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border py-2">
          {t('back_to_sign_in')}
        </button>
      </div>
    </form>
  )
}
