import { useState, useEffect } from "react";
export default function LocaleSwitch() {
  const [l,setL]=useState(localStorage.getItem("app:locale")||import.meta.env.VITE_DEFAULT_LOCALE||"he");
  useEffect(()=>{ localStorage.setItem("app:locale",l); document.documentElement.setAttribute("lang",l); document.documentElement.setAttribute("dir", l==="he"||l==="ar"?"rtl":"ltr"); },[l]);
  return (
    <div className="row" style={{gap:8}}>
      <button className="btn-ghost" onClick={()=>setL("he")} aria-pressed={l==="he"}>עב</button>
      <button className="btn-ghost" onClick={()=>setL("en")} aria-pressed={l==="en"}>EN</button>
    </div>
  );
}
