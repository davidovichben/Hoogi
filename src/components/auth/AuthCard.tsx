import { ReactNode } from "react";
import LocaleSwitch from "./LocaleSwitch";
export default function AuthCard({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div className="card" style={{padding:"24px", maxWidth:560, margin:"0 auto"}}>
      <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
        <h1 style={{fontSize:24, fontWeight:800}}>{title}</h1>
        <LocaleSwitch />
      </div>
      {children}
    </div>
  );
}
