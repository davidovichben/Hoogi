import React from "react";
export default function BrandStyles({primary,accent,background,children}:{primary:string;accent:string;background:string;children:React.ReactNode;}){
  return (
    <div style={{["--brand-primary" as any]:primary||"#2563eb",["--brand-accent" as any]:accent||"#f59e0b",["--brand-bg" as any]:background||"#ffffff",minHeight:"100vh"}}>
      {children}
    </div>
  );
}
