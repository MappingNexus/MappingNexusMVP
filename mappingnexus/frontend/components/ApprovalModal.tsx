import React, { useState } from 'react';
import { X, DollarSign, CheckCircle } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  email: string;
  onApprove: (amount: number) => void;
  onCancel: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
  isOpen, 
  email, 
  onApprove, 
  onCancel 
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    onApprove(amountNum);
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#121212] border border-zinc-800 w-full max-w-md p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-900/30 border border-green-700 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Approve Subscription</h2>
            <p className="text-xs text-zinc-500 font-mono">{email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
              Amount Received ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full bg-black border border-zinc-800 text-white px-3 pl-7 py-3 focus:outline-none focus:border-white transition-colors text-sm"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-800 p-2 rounded">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded text-xs text-zinc-300">
            <p className="font-mono">
              ✓ Setting access to 30 days from today<br/>
              ✓ Recording transaction in database<br/>
              ✓ Subscription status will be Active
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-zinc-700 text-zinc-300 py-2 px-4 text-sm font-mono uppercase tracking-wider hover:border-white hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 text-sm font-mono uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
