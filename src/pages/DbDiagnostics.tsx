import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Row = { check_key: string; ok: boolean; details: any };

export default function DbDiagnostics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await supabase.rpc("diagnostics_report");
    if (error) setErr(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl mb-2">בדיקות מסד נתונים</h1>
        <p className="text-sm text-gray-500">דוח מהיר לבריאות SQL ו-RLS ב-Supabase</p>
      </div>

      <div className="flex gap-3">
        <button className="btn-brand" onClick={run} disabled={loading}>
          {loading ? "מריץ בדיקות…" : "הרץ בדיקות שוב"}
        </button>
        {err && <span className="chip" style={{background:'#fde2e1', color:'#8a1c1c'}}>שגיאה: {err}</span>}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="text-right p-3">בדיקה</th>
              <th className="text-right p-3">סטטוס</th>
              <th className="text-right p-3">פרטים</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.check_key} className="border-t">
                <td className="p-3 font-medium">{r.check_key}</td>
                <td className="p-3">
                  <span className="chip" style={{
                    background: r.ok ? "hsl(142 71% 90%)" : "hsl(0 84% 94%)",
                    color:      r.ok ? "hsl(142 71% 20%)" : "hsl(0 84% 30%)"
                  }}>{r.ok ? "PASS" : "FAIL"}</span>
                </td>
                <td className="p-3">
                  <code className="break-all">{JSON.stringify(r.details, null, 2)}</code>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && !err && (
              <tr><td className="p-3" colSpan={3}>אין נתונים להצגה.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
