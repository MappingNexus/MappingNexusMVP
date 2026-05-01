import React from 'react';

interface Props { message?: string; }

const LoadingSpinner: React.FC<Props> = ({ message = 'Loading...' }) => (
 <div className="flex flex-col items-center justify-center gap-6 py-16">
 <div className="relative w-10 h-10">
 <div className="absolute inset-0 border border-border"></div>
 <div className="absolute inset-0 border border-transparent border-t-primary animate-spin"></div>
 </div>
 <p className="cb-body text-sm">{message}</p>
 </div>
);

export default LoadingSpinner;
