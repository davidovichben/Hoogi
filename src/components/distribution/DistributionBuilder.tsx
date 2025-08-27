import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/Toaster";

type Channel = "whatsapp" | "facebook" | "instagram" | "email" | "qr" | "direct";
type Lang = "he" | "en" | "ar" | "ru" | "fr" | "es";

type Questionnaire = { id: string; title: string | null; created_at: string | null };
type Partner = { id: string; name: string | null; code: string | null };

const CHANNELS: Channel[] = ["whatsapp","facebook","instagram","email","qr","direct"];
const LANGS: Lang[] = ["he","en","ar","ru","fr","es"];

const PAGE_SIZE = 10;

const DistributionBuilder = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // selections
  const [questionnaireId, setQuestionnaireId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [lang, setLang] = useState<Lang>("he");

  // data + pagination
  const [qPage, setQPage] = useState(0);
  const [pPage, setPPage] = useState(0);
  const [qHasMore, setQHasMore] = useState(false);
  const [pHasMore, setPHasMore] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [pSearch, setPSearch] = useState("");

  // ui
  const [resultUrl, setResultUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // boot: get user id
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) { setErr(error.message); return; }
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  // load questionnaires page (owner scoped)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const from = qPage * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      let query = supabase
        .from("questionnaires")
        .select("id,title,created_at", { count: "exact" })
        .eq("owner_id", userId);
      const term = qSearch.trim();
      if (term) query = query.ilike("title", `%${term}%`);
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to - 1);
      if (error) { setErr(error.message); return; }
      setQuestionnaires(data || []);
      setQHasMore(((count ?? 0) > to));
    })();
  }, [userId, qPage, qSearch]);

  // load partners page (owner scoped)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const from = pPage * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      let query = supabase
        .from("partners")
        .select("id,name,code", { count: "exact" })
        .eq("owner_id", userId);
      const term = pSearch.trim();
      if (term) query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to - 1);
      if (error) { setErr(error.message); return; }
      setPartners(data || []);
      setPHasMore(((count ?? 0) > to));
    })();
  }, [userId, pPage, pSearch]);

  // reset page when search changes
  useEffect(() => { setQPage(0); }, [qSearch]);
  useEffect(() => { setPPage(0); }, [pSearch]);

  const createLink = async () => {
    setErr(null);
    setResultUrl("");
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) { toast.error("לא מחובר/ת"); return; }
    if (!questionnaireId) { toast.info("בחרי שאלון"); return; }

    try {
      setLoading(true);
      // short code with retry on unique violation if exists
      let short = Math.random().toString(36).slice(2, 9);
      for (let i=0;i<3;i++) {
        const { error } = await supabase
          .from("campaigns")
          .insert({
            owner_id: uid,
            questionnaire_id: questionnaireId,
            partner_id: partnerId,
            channel,
            lang,
            utm_source: partnerId ? "partner" : channel,
            utm_campaign: `q_${questionnaireId}`,
            short_code: short,
          });
        if (!error) break;
        if (String(error.message || "").toLowerCase().includes("unique")) {
          short = Math.random().toString(36).slice(2, 9);
          continue;
        }
        throw error;
      }

      const u = new URL(`/q/${short}`, window.location.origin);
      u.searchParams.set("lang", lang);
      u.searchParams.set("channel", channel);
      if (partnerId) u.searchParams.set("ref", partnerId);
      setResultUrl(u.toString());
      toast.success("קישור נוצר");
    } catch (e:any) {
      setErr(e?.message || String(e));
      toast.error("יצירת קישור נכשלה", { description: e?.message });
    } finally { setLoading(false); }
  };

  const waHref = useMemo(() => resultUrl ? `https://wa.me/?text=${encodeURIComponent(resultUrl)}` : "", [resultUrl]);
  const mailHref = useMemo(() => resultUrl ? `mailto:?subject=${encodeURIComponent("שאלון חדש")}&body=${encodeURIComponent(resultUrl)}` : "", [resultUrl]);

  return (
    <div className="grid gap-4 p-4 max-w-2xl mx-auto" dir="rtl">
      <h2 className="text-xl font-semibold">הפצה</h2>
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">שאלון</label>
          <div className="flex items-center gap-2">
            <input
              value={qSearch}
              onChange={(e)=>setQSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת"
              className="px-3 py-2 rounded-md border bg-background w-40"
            />
            <select
              value={questionnaireId}
              onChange={(e) => setQuestionnaireId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border bg-background"
            >
              <option value="">—</option>
              {questionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.title || q.id}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button disabled={qPage===0} onClick={() => setQPage(p=>Math.max(0,p-1))} className="px-2 py-2 rounded-md border disabled:opacity-50">קודם</button>
              <button disabled={!qHasMore} onClick={() => setQPage(p=>p+1)} className="px-2 py-2 rounded-md border disabled:opacity-50">הבא</button>
            </div>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">שותפה (לא חובה)</label>
          <div className="flex items-center gap-2">
            <input
              value={pSearch}
              onChange={(e)=>setPSearch(e.target.value)}
              placeholder="חיפוש שותפה (שם/קוד)"
              className="px-3 py-2 rounded-md border bg-background w-40"
            />
            <select
              value={partnerId ?? ""}
              onChange={(e) => setPartnerId(e.target.value || null)}
              className="flex-1 px-3 py-2 rounded-md border bg-background"
            >
              <option value="">—</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button disabled={pPage===0} onClick={() => setPPage(p=>Math.max(0,p-1))} className="px-2 py-2 rounded-md border disabled:opacity-50">קודם</button>
              <button disabled={!pHasMore} onClick={() => setPPage(p=>p+1)} className="px-2 py-2 rounded-md border disabled:opacity-50">הבא</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">ערוץ</label>
            <select value={channel} onChange={(e)=>setChannel(e.target.value as Channel)} className="px-3 py-2 rounded-md border bg-background">
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">שפה</label>
            <select value={lang} onChange={(e)=>setLang(e.target.value as Lang)} className="px-3 py-2 rounded-md border bg-background">
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button disabled={loading} onClick={createLink} className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60">{loading?"יוצר…":"יצירת קישור"}</button>
          {resultUrl && <button onClick={async()=>{ try{ await navigator.clipboard.writeText(resultUrl); toast.success("קישור הועתק"); }catch{ toast.error("לא ניתן להעתיק"); } }} className="px-3 py-2 rounded-md border">העתק</button>}
        </div>

        {resultUrl && (
          <div className="grid gap-2">
            <input value={resultUrl} readOnly className="w-full px-3 py-2 rounded-md border bg-background" />
            <div className="flex gap-2 flex-wrap text-sm">
              <a href={waHref} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border hover:bg-muted">WhatsApp</a>
              <a href={mailHref} className="px-3 py-2 rounded-md border hover:bg-muted">Email</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionBuilder;
