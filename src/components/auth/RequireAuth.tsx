import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Navigate } from "react-router-dom";
export default function RequireAuth({children}:{children:JSX.Element}){
  const [ok,setOk]=useState<boolean|null>(null);
  useEffect(()=>{ supabase.auth.getSession().then(({data})=>setOk(!!data.session)); },[]);
  if(ok===null) return null;
  return ok? children : <Navigate to="/auth" replace />;
}
