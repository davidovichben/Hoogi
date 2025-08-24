// =============================
// Dashboard – Single CTA ("שאלון חדש") + Live data
// Vite + React + TS + Tailwind (assumed) + Supabase
// =============================
// Drop-in replacement for your dashboard page. Adjust table/column names in the CONFIG section below.
// 1) Save as src/pages/Dashboard.tsx (or adapt the import in App routes)
// 2) Ensure supabase client at src/lib/supabaseClient.ts
// 3) Make sure routes exist for /questionnaires/new, /questionnaires/:id, /questionnaires, /leads, /comments etc.

import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// =============================
// CONFIG — map to your real schema
// =============================
const CONFIG = {
  tables: {
    questionnaires: 'questionnaires',
    responses: 'responses',
    leads: 'leads',
  },
  columns: {
    questionnaires: { id: 'id', title: 'title', category: 'category', is_active: 'is_active', created_at: 'created_at' },
    responses: { id: 'id', questionnaire_id: 'questionnaire_id' },
    leads: { id: 'id', source: 'source', status: 'status' },
  },
  limits: { recent: 3 },
}

type QItem = { id: string; title: string | null; category: string | null; created_at: string | null }

export function Dashboard() {
  const n = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [counts, setCounts] = useState({
    questionnaires: 0,
    responses: 0,
    leads: 0,
  })
  const [recentQ, setRecentQ] = useState<QItem[]>([])

  // ============ fetch live data ============
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // counts
        const [{ count: qCount, error: qErr }, { count: rCount, error: rErr }, { count: lCount, error: lErr }] = await Promise.all([
          supabase.from(CONFIG.tables.questionnaires).select('*', { count: 'exact', head: true }),
          supabase.from(CONFIG.tables.responses).select('*', { count: 'exact', head: true }),
          supabase.from(CONFIG.tables.leads).select('*', { count: 'exact', head: true }),
        ])
        if (qErr || rErr || lErr) throw qErr || rErr || lErr

        // recent questionnaires
        const { data: qList, error: qListErr } = await supabase
          .from(CONFIG.tables.questionnaires)
          .select(
            [
              CONFIG.columns.questionnaires.id,
              CONFIG.columns.questionnaires.title,
              CONFIG.columns.questionnaires.category,
              CONFIG.columns.questionnaires.created_at,
            ].join(',')
          )
          .order(CONFIG.columns.questionnaires.created_at, { ascending: false })
          .limit(CONFIG.limits.recent)

        if (qListErr) throw qListErr

        if (!mounted) return
        setCounts({
          questionnaires: qCount ?? 0,
          responses: rCount ?? 0,
          leads: lCount ?? 0,
        })
        setRecentQ((qList as any[] | null)?.map((r) => ({
          id: r[CONFIG.columns.questionnaires.id],
          title: r[CONFIG.columns.questionnaires.title] ?? 'ללא כותרת',
          category: r[CONFIG.columns.questionnaires.category] ?? null,
          created_at: r[CONFIG.columns.questionnaires.created_at] ?? null,
        })) ?? [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // ============ UI helpers ============
  const Stat = ({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) => (
    <div className="rounded-2xl bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {icon}
      </div>
      <div className="mt-1 text-sm opacity-70">{label}</div>
    </div>
  )

  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm opacity-70 bg-white">{children}</div>
  )

  const goNew = () => n('/onboarding')

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header with single CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">לוח בקרה</h1>
          <p className="opacity-70 text-sm">ברוכים הבאים, הנה תמונת מצב של הפעילות שלכם.</p>
        </div>
        <button onClick={goNew} className="px-4 py-2 rounded-xl bg-teal-600 text-white shadow hover:opacity-90">
          + שאלון חדש
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="שאלונים פעילים" value={counts.questionnaires} />
        <Stat label="ס׳ תגובות" value={counts.responses} />
        <Stat label="ס׳ לידים" value={counts.leads} />
      </div>

      {/* Recent questionnaires */}
      <div className="bg-white shadow-sm rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">שאלונים אחרונים</h2>
          <Link to="/questionnaires" className="text-sm underline">לכל השאלונים</Link>
        </div>
        {loading ? (
          <div className="text-sm opacity-70">טוען…</div>
        ) : recentQ.length === 0 ? (
          <Empty>אין עדיין שאלונים. התחילו ביצירת שאלון חדש.</Empty>
        ) : (
          <ul className="divide-y">
            {recentQ.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <Link to={`/questionnaires/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
                  <div className="text-xs opacity-70">
                    {q.category ?? 'ללא קטגוריה'} · {q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/questionnaires/${q.id}`} className="px-3 py-1.5 rounded-lg border">פתח</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-2">לידים</h3>
          <p className="text-sm opacity-70 mb-3">ניהול לידים והמרות.</p>
          <Link to="/leads" className="inline-block px-3 py-2 rounded-lg border">פתח לידים</Link>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-2">תגובות</h3>
          <p className="text-sm opacity-70 mb-3">מענה אוטומטי וניטור.</p>
          <Link to="/responses" className="inline-block px-3 py-2 rounded-lg border">פתח תגובות</Link>
        </div>
      </div>
    </div>
  )
}

// =============================
// OPTIONAL: Sidebar – hide extra CTAs, keep only "+ שאלון חדש"
// If you have a sidebar component, keep one primary action.
// Example snippet:
/*
<button onClick={() => navigate('/questionnaires/new')} className="w-full px-4 py-2 rounded-xl bg-teal-600 text-white">+ שאלון חדש</button>
*/

// =============================
// NOTES
// - Empty states show אפס/אין נתונים במקום דמו.
// - All links are real <Link> to routes (adapt to your paths).
// - Counts use { count: 'exact', head: true } so אין משיכת נתונים מיותרת.
// - Match CONFIG to your actual Supabase tables/columns.
// =============================