import PublicForm from "../PublicForm";

export default function PublicFormDecor(){
  return (
    <div className="public-form" dir="rtl" style={{maxWidth:860, margin:"24px auto"}}>
      <div className="hero">
        <div className="brand">
          <img src="/assets/demo/logo.svg" alt="brand" />
          <div>
            <div className="title">שאלון</div>
            <p className="subtitle">עיצוב דמו — הנתונים נשמרים אמיתי</p>
          </div>
        </div>
      </div>
      <PublicForm />
    </div>
  );
}
