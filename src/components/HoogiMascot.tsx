import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HoogiMascotProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HoogiMascot: React.FC<HoogiMascotProps> = ({ size = 'md', className = '' }) => {
  const { language } = useLanguage();
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const altText = language === 'he' ? 'הוגי - העוזר החכם שלכם' : 'Hoogi - Your friendly AI assistant';

  return (
    <div className={`${sizeClasses[size]} ${className} animate-glow`}>
      <img 
        src="/lovable-uploads/ce243fe3-a985-4578-a2fd-fbbafaddfb89.png" 
        alt={altText}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

interface HoogiMessageProps {
  message: string;
  className?: string;
}

export const HoogiMessage: React.FC<HoogiMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-start gap-4 p-6 bg-gradient-soft rounded-xl border border-primary/20 shadow-lg ${className}`}>
      <HoogiMascot size="sm" />
      <div className="flex-1">
        <p className="text-sm text-foreground font-medium leading-relaxed">{message}</p>
      </div>
    </div>
  );
};