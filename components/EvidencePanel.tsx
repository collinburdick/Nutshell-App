import React, { useState, useMemo } from 'react';
import { TranscriptSegment } from '../types';
import { Quote, Search, Clock, Bookmark, BookmarkPlus, Trash2, BatteryCharging } from 'lucide-react';
import { clsx } from 'clsx';

interface EvidencePanelProps {
  transcripts: TranscriptSegment[];
  isLoading?: boolean;
  sessionStartTime?: number;
  expectedDurationMinutes?: number;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ 
  transcripts, 
  isLoading,
  sessionStartTime,
  expectedDurationMinutes = 60
}) => {
  const [view, setView] = useState<'STREAM' | 'QUOTES'>('STREAM');
  const [savedQuotes, setSavedQuotes] = useState<TranscriptSegment[]>([]);
  const [filterText, setFilterText] = useState('');

  const filteredTranscripts = useMemo(() => {
    if (!filterText.trim()) return transcripts;
    return transcripts.filter(t => 
      t.text.toLowerCase().includes(filterText.toLowerCase()) ||
      t.speaker.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [transcripts, filterText]);

  const dataCaptureStats = useMemo(() => {
    if (!sessionStartTime) {
      return { elapsedMinutes: 0, expectedMinutes: expectedDurationMinutes, percentage: 0 };
    }
    const elapsedMs = Date.now() - sessionStartTime;
    const elapsedMinutes = Math.min(Math.floor(elapsedMs / 60000), expectedDurationMinutes);
    const percentage = Math.min(100, Math.round((elapsedMinutes / expectedDurationMinutes) * 100));
    return { elapsedMinutes, expectedMinutes: expectedDurationMinutes, percentage };
  }, [sessionStartTime, expectedDurationMinutes]);

  const handleSaveQuote = (segment: TranscriptSegment) => {
      if (!savedQuotes.find(q => q.id === segment.id)) {
          setSavedQuotes([...savedQuotes, segment]);
      }
  };

  const handleRemoveQuote = (id: string) => {
      setSavedQuotes(savedQuotes.filter(q => q.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-[400px] shrink-0 transition-all">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Data Capture</span>
          </div>
          <div className="text-right">
              <div className="text-xs font-bold text-slate-800">
                {dataCaptureStats.elapsedMinutes}m / {dataCaptureStats.expectedMinutes}m
              </div>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${dataCaptureStats.percentage}%` }}
                  ></div>
              </div>
          </div>
      </div>

      {/* Header Tabs */}
      <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setView('STREAM')}
            className={clsx(
                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors",
                view === 'STREAM' ? "border-indigo-600 text-indigo-700 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
              <Quote className="w-4 h-4" /> Live Stream
          </button>
          <button 
            onClick={() => setView('QUOTES')}
            className={clsx(
                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors",
                view === 'QUOTES' ? "border-indigo-600 text-indigo-700 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
              <Bookmark className="w-4 h-4" /> Quote Bank <span className="text-xs bg-indigo-100 px-1.5 rounded-full text-indigo-700">{savedQuotes.length}</span>
          </button>
      </div>

      {view === 'STREAM' && (
        <>
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Filter transcripts..." 
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredTranscripts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p>No transcripts available for this selection.</p>
                </div>
                ) : (
                    filteredTranscripts.map((segment) => (
                    <div key={segment.id} className="group relative pl-4 border-l-2 border-slate-200 hover:border-indigo-400 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-700">{segment.speaker}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(segment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed selection:bg-indigo-100">
                            {segment.text}
                        </p>
                        {/* Sentiment Indicator */}
                        <div className={clsx(
                            "absolute -left-[3px] top-0 bottom-0 w-[4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                            segment.sentiment > 0.3 ? "bg-emerald-400" : segment.sentiment < -0.3 ? "bg-rose-400" : "bg-slate-300"
                        )}></div>
                        
                        {/* Admin Actions */}
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-slate-200 rounded flex overflow-hidden">
                            <button 
                                onClick={() => handleSaveQuote(segment)}
                                className="p-1.5 hover:bg-slate-50 text-xs font-medium text-indigo-600 flex items-center gap-1"
                            >
                                <BookmarkPlus className="w-3 h-3" /> Clip
                            </button>
                        </div>
                    </div>
                    ))
                )}
                {isLoading && (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    </div>
                )}
            </div>
        </>
      )}

      {view === 'QUOTES' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {savedQuotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                      <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Quote Bank is empty.</p>
                      <p className="text-xs">Clip transcripts from the Live Stream to save them here.</p>
                  </div>
              ) : (
                  savedQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                         <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-50">
                             <span className="text-xs font-bold text-slate-700">{quote.speaker}</span>
                             <span className="text-[10px] text-slate-400">{new Date(quote.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <p className="text-sm text-slate-800 italic leading-relaxed">"{quote.text}"</p>
                         
                         <button 
                            onClick={() => handleRemoveQuote(quote.id)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                    </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};