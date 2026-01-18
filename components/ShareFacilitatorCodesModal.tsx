import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, MessageSquare } from 'lucide-react';
import { Table } from '../types';

interface ShareFacilitatorCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  eventName: string;
}

export const ShareFacilitatorCodesModal: React.FC<ShareFacilitatorCodesModalProps> = ({ 
  isOpen, 
  onClose, 
  tables,
  eventName
}) => {
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    if (selectedTableIds.length === tables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(tables.map(t => t.id));
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copySelectedCodes = async () => {
    const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
    const codesText = selectedTables
      .map(t => `${t.name}: ${t.id}`)
      .join('\n');
    
    const fullText = `Facilitator Codes for ${eventName}\n\n${codesText}\n\nUse these codes to join and facilitate your assigned table.`;
    
    await navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const shareViaEmail = () => {
    const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
    const codesText = selectedTables
      .map(t => `${t.name}: ${t.id}`)
      .join('%0D%0A');
    
    const subject = encodeURIComponent(`Facilitator Codes for ${eventName}`);
    const body = `Facilitator%20Codes%20for%20${encodeURIComponent(eventName)}%0D%0A%0D%0A${codesText}%0D%0A%0D%0AUse%20these%20codes%20to%20join%20and%20facilitate%20your%20assigned%20table.`;
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaSMS = () => {
    const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
    const codesText = selectedTables
      .map(t => `${t.name}: ${t.id}`)
      .join('\n');
    
    const body = encodeURIComponent(`Facilitator Codes for ${eventName}\n\n${codesText}`);
    window.open(`sms:?body=${body}`, '_blank');
  };

  const selectedCount = selectedTableIds.length;
  const allSelected = selectedTableIds.length === tables.length && tables.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Share Facilitator Codes</h3>
              <p className="text-sm text-slate-500">Select tables to share their access codes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={selectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-slate-500">
              {selectedCount} of {tables.length} selected
            </span>
          </div>

          <div className="space-y-2 mb-6">
            {tables.map(table => (
              <div 
                key={table.id}
                onClick={() => toggleTableSelection(table.id)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTableIds.includes(table.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedTableIds.includes(table.id)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedTableIds.includes(table.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{table.name}</div>
                    <div className="text-xs text-slate-500">{table.topic || 'No topic set'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-mono font-bold text-slate-700">
                    {table.id}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(table.id);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === table.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No tables available. Create tables first to share their codes.
            </div>
          )}
        </div>

        {tables.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <div className="text-sm font-medium text-slate-700 mb-3">Share selected codes via:</div>
            <div className="flex gap-2">
              <button
                onClick={copySelectedCodes}
                disabled={selectedCount === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAll ? 'Copied!' : 'Copy All'}
              </button>
              <button
                onClick={shareViaEmail}
                disabled={selectedCount === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share via Email"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                onClick={shareViaSMS}
                disabled={selectedCount === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share via SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
