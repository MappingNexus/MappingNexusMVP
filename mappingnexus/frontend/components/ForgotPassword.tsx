import React from 'react';
import { Button } from './Button';
import { ArrowLeft, Mail } from 'lucide-react';

interface ForgotPasswordProps {
  onClose: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose }) => {
  const contactEmail = 'tiwari.dhairya@zohomail.in';

  const handleContactClick = () => {
    window.location.href = `mailto:${contactEmail}?subject=Password Reset Request&body=Hi, I need to reset my password for the Mapping Nexus account.`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-6">
      <div className="max-w-md w-full bg-white border-2 border-zinc-200 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-zinc-900 text-white p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Password Reset</h1>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-black mb-3">Sorry, Password Reset Unavailable</h2>
              <p className="text-sm text-zinc-600 mb-2">
                We apologize for the inconvenience. To reset your password, please contact our admin team.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-zinc-700 mb-3">
                <strong>Contact Email:</strong>
              </p>
              <p className="text-sm font-mono bg-white border border-blue-100 rounded px-3 py-2 text-center">
                {contactEmail}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button fullWidth onClick={handleContactClick}>
                📧 Send Email Request
              </Button>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors font-medium py-3 border border-zinc-200 rounded hover:bg-zinc-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
