import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { supabase } from "@/integrations/supabase/client";
import { Share2, BarChart3, Edit, Settings, ExternalLink } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { previewAny } from "@/lib/preview";
import { getPublishState } from '@/lib/preview';
import { getBaseUrl } from '@/lib/baseUrl';
import { safeToast } from '@/lib/rpc';

type Q={
  id:string;
  title:string|null;
  public_token:string|null;
  form_token?:string|null;
  created_at:string|null;
  is_active?:boolean|null;
};
export default function QuestionnairesList(){
  const [rows,setRows]=useState<Q[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  const [respCount, setRespCount] = useState<Record<string, number>>({});
  const [leadCount, setLeadCount] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(()=>{(async()=>{
    try{
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if(!user){
        // Fallback: show locally saved questionnaires
        const local = JSON.parse(localStorage.getItem('hoogiQuestionnaires')||'[]');
        setRows(local);
        return;
      }

      // Attempt 1: סינון ישיר לפי owner_id (עדיף כאשר RLS קיים)
      let res = await supabase
        .from("questionnaires")
        .select("id,title,category,design_colors,logo_url,created_at,user_id,public_token")
        .eq('owner_id', user.id)
        .order("created_at",{ascending:false});

      // אם אין תוצאות – ננסה וריאנט חלופי
      if(!res.error && (res.data?.length ?? 0) === 0){
        res = await supabase
          .from("questionnaires")
          .select("id,title,category,design_colors,logo_url,created_at,user_id,public_token")
          .eq('user_id', user.id)
          .order("created_at",{ascending:false})
          .limit(20);
      }

      if(res.error){
        // Attempt 2: user_id fallback
        res = await supabase
          .from("questionnaires")
          .select("id,title,category,design_colors,logo_url,created_at,user_id,public_token")
          .eq("user_id", user.id)
          .order("created_at",{ascending:false});
      }

      if(res.error){
        // Attempt 3: no filter (show latest to avoid column-mismatch 400)
        res = await supabase
          .from("questionnaires")
          .select("id,title,category,design_colors,logo_url,created_at,user_id,public_token")
          .order("created_at",{ascending:false})
          .limit(20);
      }

      if(res.error){
        // final fallback to local
        const local = JSON.parse(localStorage.getItem('hoogiQuestionnaires')||'[]');
        setRows(local);
      } else {
        setRows((res.data||[]) as Q[]);
      }
    }catch(e:any){
      // on any exception show local cache so the UI isn't empty
      const local = JSON.parse(localStorage.getItem('hoogiQuestionnaires')||'[]');
      setRows(local);
      setError(e.message||String(e));
    }finally{ setLoading(false); }
  })();},[]);

  // fetch counts for responses and leads per questionnaire (best-effort)
  useEffect(()=>{(async()=>{ if(!rows.length) return; const nextResp:Record<string,number>={}; const nextLead:Record<string,number>={}; for(const q of rows){ try{ const r=await supabase.from('responses').select('id',{count:'exact', head:true}).eq('questionnaire_id', q.id); nextResp[q.id]=r.count??0; }catch{ nextResp[q.id]=0;} try{ const l=await supabase.from('leads').select('id',{count:'exact', head:true}).eq('questionnaire_id', q.id); nextLead[q.id]=l.count??0; }catch{ nextLead[q.id]=0;} } setRespCount(nextResp); setLeadCount(nextLead); })();},[rows]);

  // Handlers for questionnaire actions
  function handleOpen(qid: string) {
    // Opens a full preview (public if published, otherwise draft)
    previewAny(qid, "he", "open");
  }

  function handleEdit(qid: string) {
    // Navigate to the correct editor path, avoiding 404s
    navigate(`/onboarding?id=${qid}`);
  }

  if(loading) return <div className="p-6">טוען…</div>; if(error) return <div className="p-6 text-red-600">{error}</div>;
  
  return(
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">השאלונים שלי</h1>
        <Button variant="default" size="lg" asChild>
          <a href="/onboarding" className="font-semibold">
            צור את השאלון הראשון שלך
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rows.map((q)=>{
          const status = q.is_active? 'active' : 'draft';
          const responses = respCount[q.id] ?? 0;
          const leads = leadCount[q.id] ?? 0;
          const conversion = responses>0 ? Math.round((leads/responses)*100) : 0;
          return (
            <Card key={q.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{q.title || 'ללא שם'}</CardTitle>
                    <CardDescription>{new Date(q.created_at||'').toLocaleString()}</CardDescription>
                  </div>
                  <Badge variant={status==='active' ? 'default' : 'secondary'}>
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{responses}</p>
                    <p className="text-sm text-muted-foreground">תגובות</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/5 rounded-lg">
                    <p className="text-2xl font-bold text-secondary-foreground">{leads}</p>
                    <p className="text-sm text-muted-foreground">לידים</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TooltipWrapper content="שיתוף">
                    <Button variant="outline" size="sm" onClick={async()=>{ 
                      const state = await getPublishState(q.id);
                      if (!state.is_published || !state.token) {
                        safeToast({ title: "לא פורסם", description: "פרסם את השאלון כדי לקבל קישור שיתוף." });
                        return;
                      }
                      const url = new URL(`/q/${state.token}`, getBaseUrl()).toString();
                      try { 
                        await navigator.clipboard.writeText(url); 
                        safeToast({ title: 'הועתק', description: 'קישור השיתוף הועתק.' }); 
                      } catch { 
                        safeToast({ title: 'שגיאה', description: 'לא ניתן היה להעתיק את הקישור.' }); 
                      } 
                    }}>
                      <Share2 className="h-4 w-4 mr-1" /> שיתוף
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="אנליטיקות">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" /> אנליטיקס
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="עריכה">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(q.id)}>
                      <Edit className="h-4 w-4 mr-1" /> עריכה
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="הגדרות">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" /> הגדרות
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="תצוגה מקדימה">
                    <Button variant="ghost" size="sm" onClick={() => handleOpen(q.id)}>
                      <ExternalLink className="h-4 w-4 mr-1" /> תצוגה
                    </Button>
                  </TooltipWrapper>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">שיעור המרה</span>
                    <span className="font-medium text-primary">{conversion}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${conversion}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!rows.length && (
        <div className="text-gray-600">אין שאלונים עדיין. התחילי בלחיצה על "שאלון חדש".</div>
      )}
    </div>
  );
}
