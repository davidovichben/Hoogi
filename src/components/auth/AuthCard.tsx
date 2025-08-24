import React from 'react'

export const AuthCard: React.FC<{ children: React.ReactNode; title: string; subtitle?: string; hoogiSrc?: string } > = ({ children, title, subtitle, hoogiSrc }) => {
  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur shadow-xl rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        {hoogiSrc ? (
          <img src={hoogiSrc} alt="Hoogi" className="w-10 h-10" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
