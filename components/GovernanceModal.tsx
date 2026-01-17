import React, { useState } from 'react';
import { X, ShieldAlert, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

interface GovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock PII Data
const FLAGGED_ITEMS = [
    { id: 'pii1', table: 'Table A1', original: 'Email james@example.com regarding the invoice.', redacted: 'Email [EMAIL_REDACTED] regarding the invoice.', type: 'EMAIL' },
    { id: 'pii2', table: 'Table B2', original: 'My phone number is 555-0199.', redacted: 'My phone number is [PHONE_REDACTED].', type: 'PHONE' },
    { id: 'pii3', table: 'Table C1', original: 'Contact Sarah directly.', redacted: 'Contact [PERSON_NAME] directly.', type: 'PERSON' },
];

export const GovernanceModal: React.FC<GovernanceModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState(FLAGGED_ITEMS);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleAction = (id: string) => {
      // Simulate approving/handling
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleReveal = (id: string) => {
      setRevealedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500"/> 
                    Redaction Review Queue
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{items.length} Pending</span>
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">All caught up!</p>
                        <p>No PII flags pending review.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{item.table}</span>
                                <span className="text-[10px] font-bold text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">{item.type} DETECTED</span>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-md mb-3 font-mono text-sm text-slate-700 relative group">
                                {revealedIds.has(item.id) ? (
                                    <span className="text-rose-600 font-bold">{item.original}</span>
                                ) : (
                                    <span>{item.redacted}</span>
                                )}
                                <button 
                                    onClick={() => toggleReveal(item.id)}
                                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-indigo-600"
                                    title="Toggle Original"
                                >
                                    {revealedIds.has(item.id) ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleAction(item.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                >
                                    <Check className="w-4 h-4" /> Confirm Redaction
                                </button>
                                <button 
                                    onClick={() => handleAction(item.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" /> Restore Original
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">Close</button>
            </div>
        </div>
    </div>
  );
};