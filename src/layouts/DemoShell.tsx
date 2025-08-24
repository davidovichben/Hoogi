import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
export default function DemoShell({children}:{children:ReactNode}){
  return (
    <div dir="rtl" className="demo-shell">
      <header className="demo-header">
        <div className="brand">
          <img src="/assets/demo/logo.svg" alt="logo" width={28} height={28}/>
          <strong>Answer Tool</strong>
        </div>
        <nav className="quick">
          <NavLink to="/questionnaires" className="chip">השאלונים שלי</NavLink>
          <NavLink to="/questionnaires/new" className="chip">שאלון חדש</NavLink>
          <NavLink to="/admin/db-checks" className="chip">בדיקות מערכת</NavLink>
          <NavLink to="/auth" className="chip">התחברות</NavLink>
          <NavLink to="/auth/signup" className="chip">הרשמה</NavLink>
        </nav>
      </header>
      <div className="demo-layout">
        <main className="content">{children}</main>
        <aside className="side">
          <NavLink to="/questionnaires" className="side-link">השאלונים שלי</NavLink>
          <NavLink to="/questionnaires/new" className="side-link">שאלון חדש</NavLink>
          <NavLink to="/admin/db-checks" className="side-link">בדיקות מערכת</NavLink>
          <NavLink to="/auth" className="side-link">התחברות</NavLink>
          <NavLink to="/auth/signup" className="side-link">הרשמה</NavLink>
        </aside>
      </div>
    </div>
  );
}
