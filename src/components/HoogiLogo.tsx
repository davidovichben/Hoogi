import React from 'react';

export const HoogiLogo: React.FC = () => (
  <div className="flex items-center gap-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#16939B"/>
        <path d="M9 10C9 8.89543 9.89543 8 11 8H13C14.1046 8 15 8.89543 15 10V14C15 15.1046 14.1046 16 13 16H11C9.89543 16 9 15.1046 9 14V10Z" fill="white"/>
    </svg>
    <span className="font-bold text-lg">iHoogi</span>
  </div>
);
