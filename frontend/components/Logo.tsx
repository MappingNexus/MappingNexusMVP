import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 12L3 6V18L9 24L15 18V6L21 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="24" r="2" fill="currentColor" />
      <circle cx="15" cy="18" r="2" fill="currentColor" />
      <circle cx="21" cy="12" r="2" fill="currentColor" />
      <path d="M9 24V12" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="12" r="2" fill="currentColor" />
      <path d="M3 6L15 6" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
  );
};

