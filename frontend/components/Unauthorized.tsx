import React from 'react';
import { Button } from './Button';
import { ShieldAlert, LockKeyhole } from 'lucide-react';

interface UnauthorizedProps {
  onSubscribeClick: () => void;
}

export const Unauthorized: React.FC<UnauthorizedProps> = ({ onSubscribeClick }) => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
        
        <div className="relative inline-block">
          <ShieldAlert className="w-24 h-24 text-white mx-auto stroke-[1.5]" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <LockKeyhole className="w-8 h-8 text-black fill-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight uppercase">
            Mission Unauthorized
          </h1>
          <div className="h-1 w-24 bg-white mx-auto"></div>
          <p className="font-mono text-sm text-zinc-400 uppercase tracking-widest leading-relaxed">
            Access to the Nexus requires active clearance.<br/>
            Your protocol level is insufficient.
          </p>
        </div>

        <div className="pt-8">
          <Button 
            onClick={onSubscribeClick}
            className="bg-white text-black hover:bg-zinc-200 border-transparent w-full md:w-auto"
          >
            Obtain Clearance (Subscribe)
          </Button>
        </div>

        <div className="text-[10px] font-mono text-zinc-600 mt-12">
          ERROR_CODE: 403_FORBIDDEN // PAYMENT_REQUIRED
        </div>
      </div>
    </div>
  );
};
