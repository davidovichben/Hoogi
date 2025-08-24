import React from 'react'
import { useI18n } from '../../i18n'

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="opacity-70">{t('language')}:</span>
      <button
        onClick={() => setLang('he')}
        className={`px-2 py-1 rounded transition border ${lang === 'he' ? 'border-gray-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
      >HE</button>
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded transition border ${lang === 'en' ? 'border-gray-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
      >EN</button>
    </div>
  )
}
