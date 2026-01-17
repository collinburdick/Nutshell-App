
import React, { useState, useEffect } from 'react';
import { Table, TableStatus, Insight, InsightType, AgendaItem } from '../types';
import { Mic, Pause, Play, Star, Clock, ChevronDown, ChevronUp, LogOut, Megaphone, X, CheckCircle, Trash2, ArrowRight, Save, ShieldCheck, Sparkles, Smartphone, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_INSIGHTS } from '../constants';

interface FacilitatorScreenProps {
  table: Table;
  onExit: () => void;
  notices: string[];
  // Pass the default agenda as fallback if table has no custom one
  defaultAgenda: AgendaItem[];
}

export const FacilitatorScreen: React.FC<FacilitatorScreenProps> = ({ table, onExit, notices, defaultAgenda }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>('p2');
  const [localSummary, setLocalSummary] = useState<string[]>([]);
  const [showNuggetToast, setShowNuggetToast] = useState(false);
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  
  // Use custom table agenda or fall back to event default
  const activeAgenda = table.customAgenda && table.customAgenda.length > 0 ? table.customAgenda : defaultAgenda;

  // Coach State
  const [showCoachTip, setShowCoachTip] = useState(false);
  const [coachTipText, setCoachTipText] = useState("Tip: We haven't heard much about *budget implications* yet. Consider asking about costs.");

  // Wrap-Up Review State
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [actionItems, setActionItems] = useState<Insight[]>([]);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  
  // Notice State
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  // Handoff State
  const [showHandoffCode, setShowHandoffCode] = useState(false);

  // Initialize mock action items for review
  useEffect(() => {
     // Filter mock insights for this table that are action items or questions
     const items = MOCK_INSIGHTS.filter(i => 
         (i.type === InsightType.ACTION_ITEM || i.type === InsightType.QUESTION) && 
         i.relatedTableIds.includes(table.id)
     );
     // Add a dummy one if none exist for demo
     if(items.length === 0) {
         items.push({
             id: 'temp_ai_1',
             type: InsightType.ACTION_ITEM,
             title: 'Schedule follow-up on API limits',
             description: 'Team needs to clarify rate limits before Q4.',
             confidence: 0.9,
             relatedTableIds: [table.id],
             evidenceCount: 1,
             timestamp: Date.now()
         });
     }
     setActionItems(items);
  }, [table.id]);

  // Effect to show new notices when they arrive
  useEffect(() => {
    if (notices.length > 0) {
        setActiveNotice(notices[notices.length - 1]);
    }
  }, [notices]);

  // Simulate Coach Tip Appearance
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowCoachTip(true);
    }, 8000); // Show tip after 8 seconds for demo
    return () => clearTimeout(timer);
  }, []);

  // Simulate Mic Level
  useEffect(() => {
    if (!isRecording) {
      setMicLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setMicLevel(Math.random() * 100);
    }, 150);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Session Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate Local Summary Stream
  useEffect(() => {
    const messages = [
      "Noted: Concern about wiki fragmentation.",
      "Captured: Idea for automated provisioning.",
      "Key point: Support SLA is vital for enterprise.",
      "Trend: Buddy system is working well."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLocalSummary(prev => [messages[i % messages.length], ...prev].slice(0, 3));
      i++;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGoldenNugget = () => {
    setShowNuggetToast(true);
    setTimeout(() => setShowNuggetToast(false), 3000);
  };

  const handleVoiceCommandTrigger = () => {
      setVoiceCommandActive(true);
      // Simulate listening and then action
      setTimeout(() => {
          setVoiceCommandActive(false);
          // Simulate the result of a voice command
          const newAi: Insight = {
               id: `vc_${Date.now()}`,
               type: InsightType.ACTION_ITEM,
               title: 'Voice Capture: Follow up on Licensing',
               description: 'Captured via voice command "Hey Nutshell, flag that action item"',
               confidence: 1,
               relatedTableIds: [table.id],
               evidenceCount: 1,
               timestamp: Date.now()
          };
          setActionItems(prev => [newAi, ...prev]);
          alert("✓ Voice Command Recognized: Action Item Added");
      }, 2000);
  };

  const toggleItemReview = (id: string) => {
      setReviewedItems(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };
  
  const handleRemoveItem = (id: string) => {
      setActionItems(prev => prev.filter(i => i.id !== id));
  };

  const handleFinishSession = () => {
      // Logic to submit approved items would go here
      onExit();
  };

  // --- RENDER HANDOFF MODE ---
  if (showHandoffCode) {
      return (
          <div className="h-full w-full bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-indigo-600 p-4 rounded-full mb-6 shadow-lg shadow-indigo-900/50">
                  <Smartphone className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Device Transfer</h2>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                  Scan this code or enter the key on your new device to resume this session instantly.
              </p>
              
              <div className="bg-white p-6 rounded-2xl mb-6">
                  <div className="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                      [QR CODE PLACEHOLDER]
                  </div>
              </div>

              <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 font-mono text-2xl tracking-widest font-bold mb-8">
                  {table.id}-TRF
              </div>

              <button 
                  onClick={() => setShowHandoffCode(false)}
                  className="w-full max-w-sm h-14 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-lg transition-colors border border-slate-600"
              >
                  Cancel Transfer
              </button>
          </div>
      );
  }

  // --- RENDER REVIEW MODE ---
  if (isReviewMode) {
      return (
        <div className="h-full w-full bg-slate-900 text-white flex flex-col font-sans relative">
            <div className="px-6 py-6 border-b border-slate-700 bg-slate-800">
                <h1 className="text-2xl font-bold mb-1">Session Wrap-Up</h1>
                <p className="text-slate-400">Review and approve captured items before closing.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {actionItems.map(item => (
                    <div key={item.id} className={clsx(
                        "bg-slate-800 rounded-xl p-4 border transition-all duration-300",
                        reviewedItems.has(item.id) ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700"
                    )}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                item.type === InsightType.ACTION_ITEM ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            )}>
                                {item.type.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-slate-400 text-sm mb-4">{item.description}</p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => toggleItemReview(item.id)}
                                className={clsx(
                                    "flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors",
                                    reviewedItems.has(item.id) ? "bg-emerald-500 text-white" : "bg-slate-700 hover:bg-slate-600"
                                )}
                            >
                                <CheckCircle className="w-5 h-5" />
                                {reviewedItems.has(item.id) ? "Approved" : "Approve"}
                            </button>
                            <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="px-4 py-3 bg-slate-700 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {actionItems.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No pending items to review.
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                <button 
                    onClick={handleFinishSession}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                >
                    <Save className="w-5 h-5" />
                    Finalize & Close Session
                </button>
                <button 
                    onClick={() => setIsReviewMode(false)}
                    className="w-full py-4 text-slate-500 hover:text-white mt-2"
                >
                    Back to Discussion
                </button>
            </div>
        </div>
      );
  }

  // --- RENDER STANDARD MODE ---
  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col font-sans relative">
      
      {/* Nudge Banner (Admin Notice) */}
      {activeNotice && (
          <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white p-4 z-50 animate-in slide-in-from-top duration-300 shadow-xl border-b border-indigo-400">
              <div className="flex items-start gap-3">
                  <Megaphone className="w-6 h-6 shrink-0 animate-pulse" />
                  <div className="flex-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider opacity-90">Admin Message</h4>
                      <p className="text-lg font-medium leading-snug mt-1">{activeNotice}</p>
                  </div>
                  <button onClick={() => setActiveNotice(null)} className="p-1 hover:bg-indigo-500 rounded"><X className="w-5 h-5"/></button>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{table.session}</h2>
          <h1 className="text-lg font-bold text-white truncate max-w-[200px]">{table.topic}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
             <div className={clsx("w-2 h-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-500")}></div>
             <span className="font-mono text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
          
          <button 
            onClick={() => setShowHandoffCode(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Transfer Session"
          >
              <Smartphone className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setIsReviewMode(true)} 
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-600 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      {/* Mic Status Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden flex">
          {Array.from({ length: 20 }).map((_, i) => (
             <div 
                key={i} 
                className="flex-1 h-full border-r border-slate-900 transition-colors duration-75"
                style={{ backgroundColor: isRecording && (i * 5) < micLevel ? (micLevel > 80 ? '#ef4444' : '#10b981') : 'transparent' }}
             ></div>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        
        {/* Discussion Guide */}
        <div className="p-4 space-y-4">
           <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discussion Guide</h3>
                {table.customAgenda && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Custom Agenda</span>
                )}
           </div>
           
           {activeAgenda.map(prompt => (
             <div 
                key={prompt.id} 
                onClick={() => setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id)}
                className={clsx(
                    "border rounded-xl transition-all duration-300 overflow-hidden cursor-pointer",
                    expandedPromptId === prompt.id ? "bg-indigo-600 border-indigo-500 shadow-lg scale-[1.02]" : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                )}
             >
                <div className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{prompt.phase}</span>
                        {prompt.durationMinutes > 0 && <span className="text-xs text-indigo-300 bg-indigo-900/50 px-1.5 py-0.5 rounded-full">{prompt.durationMinutes}m</span>}
                    </div>
                    {expandedPromptId === prompt.id ? <ChevronUp className="w-5 h-5 opacity-70" /> : <ChevronDown className="w-5 h-5 opacity-50" />}
                </div>
                {expandedPromptId === prompt.id && (
                    <div className="px-4 pb-4 pt-1 text-indigo-100 text-lg leading-snug font-medium border-t border-white/10">
                        {prompt.text}
                    </div>
                )}
             </div>
           ))}
        </div>

        {/* Coach Tip */}
        {showCoachTip && (
            <div className="mx-4 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
                <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shrink-0">
                            <Sparkles className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-indigo-200 uppercase tracking-wide mb-1">Coach Tip</h4>
                            <p className="text-white font-medium leading-snug">
                                {coachTipText}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowCoachTip(false)} 
                            className="p-1 hover:bg-white/10 rounded-full text-indigo-300"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
                </div>
            </div>
        )}

        {/* Privacy Reassurance Card */}
        <div className="px-4 pb-4">
             <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-3 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
                 <div>
                     <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Privacy Active</p>
                     <p className="text-[10px] text-slate-500">Audio is processed in real-time and not stored. PII redacted.</p>
                 </div>
             </div>
        </div>

        <div className="flex-1"></div>

        {/* Local Summary Stream */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Local Summary Stream</span>
             </div>
             <div className="space-y-2">
                 {localSummary.map((msg, i) => (
                     <div key={i} className={clsx("text-sm transition-opacity duration-500", i === 0 ? "text-white font-medium" : "text-slate-500")}>
                         {msg}
                     </div>
                 ))}
             </div>
        </div>

      </div>

      {/* Voice Command Overlay - Simulated */}
      {voiceCommandActive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse mb-4">
                      <Mic className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">Listening...</h3>
                  <p className="text-slate-400">"Hey Nutshell, flag that action item"</p>
              </div>
          </div>
      )}

      {/* Controls Footer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-4 shrink-0 pb-8 relative">
          
          {/* Voice Button Floating above controls */}
          <button 
             onClick={handleVoiceCommandTrigger}
             className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-800 hover:scale-110 transition-transform z-10"
             title="Voice Command"
          >
              <Mic className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={clsx(
                "flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-lg transition-colors",
                isRecording ? "bg-slate-800 text-slate-200 border border-slate-600" : "bg-red-600 text-white"
            )}
          >
             {isRecording ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Resume</>}
          </button>
          
          <button 
            onClick={handleGoldenNugget}
            className="flex items-center justify-center gap-2 h-14 bg-amber-500 text-slate-900 rounded-xl font-bold text-lg shadow-lg shadow-amber-900/20 active:scale-95 transition-transform"
          >
             <Star className="w-5 h-5 fill-slate-900" />
             Golden Nugget
          </button>
      </div>

      {/* Toast Notification */}
      {showNuggetToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-top-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Nugget Captured!
          </div>
      )}

    </div>
  );
};
