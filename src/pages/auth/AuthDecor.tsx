import React from "react";
import AuthPage from "@/pages/AuthPage";
export default function AuthDecor(){
  return (
    <div dir="rtl" className="auth-wrap">
      <div className="auth-hero">
        <div className="brand">
          <img src="/assets/demo/logo.svg" alt="logo" width={32} height={32}/>
          <div><div style={{fontSize:20,fontWeight:800}}>ברוכה הבאה</div><div>כניסה/הרשמה בסגנון הדמו</div></div>
        </div>
      </div>
      <div className="auth-card"><AuthPage/></div>
    </div>
  );
}
