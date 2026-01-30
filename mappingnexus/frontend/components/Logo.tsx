import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <circle cx="50" cy="50" r="50" fill="#2F353B" />
      {/* M Shape / Nodes Construction */}
      <path 
        d="M30 65 L40 40 L50 55 L60 40 L70 65" 
        stroke="white" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Nodes */}
      <circle cx="30" cy="65" r="8" fill="transparent" stroke="white" strokeWidth="4" />
      <circle cx="70" cy="65" r="8" fill="transparent" stroke="white" strokeWidth="4" />
      <circle cx="40" cy="40" r="5" fill="white" />
      <circle cx="60" cy="40" r="5" fill="white" />
    </svg>
  );
};
