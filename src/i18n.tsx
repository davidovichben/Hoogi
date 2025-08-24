import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Lang = 'he' | 'en'

type Dict = Record<string, string>

const DICTS: Record<Lang, Dict> = {
  en: {
    app_name: 'Hoogi — Answer Buddy',
    welcome: 'Welcome back',
    tagline: 'Your AI-powered assistant for marketing & automation',
    email: 'Email',
    password: 'Password',
    remember_me: 'Remember me',
    show: 'Show',
    hide: 'Hide',
    sign_in: 'Sign in',
    or: 'or',
    continue_google: 'Continue with Google',
    forgot_password: 'Forgot your password?',
    reset_password: 'Reset password',
    send_reset_link: 'Send reset link',
    back_to_sign_in: 'Back to sign in',
    password_updated: 'Password updated. You can sign in now.',
    set_new_password: 'Set a new password',
    new_password: 'New password',
    update_password: 'Update password',
    language: 'Language',
  },
  he: {
    app_name: 'Hoogi — עוזר התשובות',
    welcome: 'ברוכים השבים',
    tagline: 'העוזר החכם לשיווק ואוטומציה',
    email: 'אימייל',
    password: 'סיסמה',
    remember_me: 'זכור אותי',
    show: 'הצג',
    hide: 'הסתר',
    sign_in: 'כניסה',
    or: 'או',
    continue_google: 'המשך עם Google',
    forgot_password: 'שכחת סיסמה?',
    reset_password: 'איפוס סיסמה',
    send_reset_link: 'שליחת קישור לאיפוס',
    back_to_sign_in: 'חזרה למסך כניסה',
    password_updated: 'הסיסמה עודכנה. ניתן להתחבר כעת.',
    set_new_password: 'הגדרת סיסמה חדשה',
    new_password: 'סיסמה חדשה',
    update_password: 'עדכון סיסמה',
    language: 'שפה',
  },
}

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'he',
  setLang: () => {},
  t: (k: string) => k,
})

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'he')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    // Set document direction
    document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (k: string) => DICTS[lang][k] ?? k,
  }), [lang])

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export const useI18n = () => useContext(I18nCtx)
