
import React, { useState } from 'react';
import { Event, Insight, InsightType } from '../types';
import { MOCK_INSIGHTS } from '../constants';
import { MessageSquare, ArrowRight, Shield, Clock, Star, Users, Sparkles, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { queryTranscripts } from '../services/openaiService';

interface AttendeeViewProps {
  event: Event;
  onExit: () => void;
}

export const AttendeeView: React.FC<AttendeeViewProps> = ({ event, onExit }) => {
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'ASK'>('INSIGHTS');
  const [question, setQuestion] = useState('');
  const [userName, setUserName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [target, setTarget] = useState<'ORGANIZERS' | 'AI'>('ORGANIZERS');
  
  // State for AI response
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // State for Organizer submission
  const [submitted, setSubmitted] = useState(false);

  // Filter relevant insights for attendees (Themes & Action Items mostly)
  const insights = MOCK_INSIGHTS.filter(i => 
      i.type === InsightType.THEME || 
      i.type === InsightType.ACTION_ITEM || 
      i.type === InsightType.GOLDEN_NUGGET
  );

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (target === 'AI') {
          setAiLoading(true);
          const answer = await queryTranscripts(question);
          setAiResponse(answer);
          setAiLoading(false);
      } else {
          setSubmitted(true);
          setTimeout(() => {
              setQuestion('');
              setSubmitted(false);
              alert("Question submitted to the event moderators!");
          }, 2000);
      }
  };

  const resetAsk = () => {
      setQuestion('');
      setAiResponse(null);
      setSubmitted(false);
  };

  const primaryColor = event.branding?.primaryColor || '#6366f1';

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-4 text-white shrink-0 shadow-md z-10" style={{ backgroundColor: primaryColor }}>
            <div className="font-bold text-lg truncate pr-4">{event.name}</div>
            <button onClick={onExit} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">Exit</button>
        </div>

        {/* Tab Nav */}
        <div className="flex bg-white border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('INSIGHTS')}
                className={clsx(
                    "flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors",
                    activeTab === 'INSIGHTS' ? "border-current text-slate-900" : "border-transparent text-slate-400"
                )}
                style={{ borderColor: activeTab === 'INSIGHTS' ? primaryColor : 'transparent', color: activeTab === 'INSIGHTS' ? primaryColor : undefined }}
            >
                Live Insights
            </button>
            <button 
                onClick={() => setActiveTab('ASK')}
                className={clsx(
                    "flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors",
                    activeTab === 'ASK' ? "border-current text-slate-900" : "border-transparent text-slate-400"
                )}
                style={{ borderColor: activeTab === 'ASK' ? primaryColor : 'transparent', color: activeTab === 'ASK' ? primaryColor : undefined }}
            >
                Ask a Question
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {activeTab === 'INSIGHTS' && (
                <>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-2">Event Pulse</h2>
                        <div className="flex justify-between items-center text-sm text-slate-500">
                            <div className="flex items-center gap-1"><Users className="w-4 h-4"/> {event.tablesCount * 8} Attendees</div>
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4"/> Live Now</div>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Key Takeaways So Far</h3>
                    
                    {insights.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                {item.type === InsightType.GOLDEN_NUGGET && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                <span className={clsx(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                    item.type === InsightType.THEME ? "bg-indigo-100 text-indigo-700" :
                                    item.type === InsightType.ACTION_ITEM ? "bg-emerald-100 text-emerald-700" :
                                    "bg-amber-100 text-amber-700"
                                )}>
                                    {item.type.replace('_', ' ')}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                            <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                    ))}
                </>
            )}

            {activeTab === 'ASK' && (
                <div className="h-full flex flex-col">
                    
                    {/* Toggle Target */}
                    <div className="flex bg-slate-200 p-1 rounded-lg mb-4">
                        <button 
                            onClick={() => { setTarget('ORGANIZERS'); resetAsk(); }}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-md transition-all", target === 'ORGANIZERS' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500")}
                        >
                            Ask Organizers
                        </button>
                        <button 
                            onClick={() => { setTarget('AI'); resetAsk(); }}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1", target === 'AI' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500")}
                        >
                            <Sparkles className="w-3 h-3" /> Ask Nutshell AI
                        </button>
                    </div>

                    {submitted ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <ArrowRight className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Sent!</h3>
                            <p className="text-slate-500 mt-2">Your question has been queued for the moderators.</p>
                            <button onClick={resetAsk} className="mt-6 text-indigo-600 font-medium text-sm">Ask another question</button>
                        </div>
                    ) : aiResponse ? (
                        <div className="flex-1 flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">You Asked</h4>
                                <p className="text-slate-800 font-medium">"{question}"</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm flex-1 overflow-y-auto">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Answer</h4>
                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                            </div>
                            <button onClick={resetAsk} className="mt-4 w-full py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-700">Ask another question</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {target === 'AI' ? (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-2">
                                    <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4"/> Instant Answers</h3>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        Ask about themes, sentiment, or specific topics. Answers are grounded in real-time transcripts from all tables.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-2">
                                    <h3 className="font-bold text-slate-800 text-sm">Event Q&A</h3>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Submit questions for the main stage Q&A or for facilitators to address.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Your Question</label>
                                <textarea 
                                    required
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    rows={4}
                                    placeholder={target === 'AI' ? "e.g., What are people saying about pricing?" : "e.g., Will the slides be shared?"}
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                />
                            </div>

                            {/* Name Input Logic */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                                    <input 
                                        type="text" 
                                        value={userName}
                                        onChange={e => {
                                            setUserName(e.target.value);
                                            if(e.target.value) setIsAnonymous(false);
                                        }}
                                        placeholder="Optional"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isAnonymous} 
                                            onChange={e => {
                                                setIsAnonymous(e.target.checked);
                                                if(e.target.checked) setUserName('');
                                            }}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs text-slate-500">Post Anonymously</span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!question.trim() || aiLoading}
                                className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : target === 'AI' ? 'Ask AI' : 'Submit Question'}
                            </button>
                        </form>
                    )}
                </div>
            )}

        </div>
    </div>
  );
};
