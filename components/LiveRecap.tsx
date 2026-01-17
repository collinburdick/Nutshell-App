
import React, { useState, useEffect } from 'react';
import { Event, Table, Insight, InsightType } from '../types';
import { MOCK_INSIGHTS } from '../constants';
import { Flame, Star, MessageSquare, TrendingUp, Users, Mic, Quote, ArrowUpRight, Zap, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface LiveRecapProps {
  event: Event;
  tables: Table[];
}

export const LiveRecap: React.FC<LiveRecapProps> = ({ event, tables }) => {
  const [activeTab, setActiveTab] = useState<'HIGHLIGHTS' | 'THEMES' | 'QUESTIONS'>('HIGHLIGHTS');

  // Derived Metrics
  const activeTablesCount = tables.filter(t => t.status === 'ACTIVE').length;
  const hotTables = tables.filter(t => t.isHot);
  const totalInsights = MOCK_INSIGHTS.length * 12; // Mock multiplier for "total captured" feel
  
  // Data Filtering
  const themes = MOCK_INSIGHTS.filter(i => i.type === InsightType.THEME).slice(0, 3);
  const nuggets = MOCK_INSIGHTS.filter(i => i.type === InsightType.GOLDEN_NUGGET);
  const questions = MOCK_INSIGHTS.filter(i => i.type === InsightType.QUESTION);
  const controversy = MOCK_INSIGHTS.filter(i => i.type === InsightType.SENTIMENT_SPIKE);

  // Auto-rotate spotlight nugget every 10s
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  useEffect(() => {
    if (nuggets.length === 0) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % nuggets.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [nuggets.length]);

  return (
    <div className="h-full w-full bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
      
      {/* Presentation Header */}
      <header className="h-20 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/30">N</div>
            <div>
                <h1 className="text-xl font-bold tracking-wide text-white">{event.name}</h1>
                <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">Live Intelligence Recap</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-white/5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-slate-300">Live Feed Active</span>
            </div>
            <div className="text-right">
                <div className="text-2xl font-mono font-bold leading-none">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* Top Level Stats */}
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-indigo-300 mb-2">
                        <Users className="w-6 h-6" />
                        <span className="font-bold uppercase tracking-wider text-sm">Active Tables</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{activeTablesCount} <span className="text-2xl text-slate-500 font-medium">/ {tables.length}</span></div>
                    <div className="text-sm text-slate-400">Collaborating right now</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-emerald-300 mb-2">
                        <Zap className="w-6 h-6" />
                        <span className="font-bold uppercase tracking-wider text-sm">Ideas Captured</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{totalInsights}</div>
                    <div className="text-sm text-slate-400">Across all sessions</div>
                </div>
                <div className="bg-gradient-to-br from-amber-900/50 to-slate-900 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-amber-300 mb-2">
                        <Flame className="w-6 h-6" />
                        <span className="font-bold uppercase tracking-wider text-sm">Hot Topics</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{themes.length + 2}</div>
                    <div className="text-sm text-slate-400">Trending heavily</div>
                </div>
                <div className="bg-gradient-to-br from-violet-900/50 to-slate-900 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-violet-300 mb-2">
                        <MessageSquare className="w-6 h-6" />
                        <span className="font-bold uppercase tracking-wider text-sm">Open Questions</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{questions.length}</div>
                    <div className="text-sm text-slate-400">Needs answering</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                
                {/* LEFT COL: Themes & Trending */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
                    {/* Golden Nugget Spotlight */}
                    {nuggets.length > 0 && (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-1 shadow-2xl">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                             <div className="bg-slate-900/90 h-full w-full rounded-[20px] p-8 relative flex flex-col justify-center items-center text-center">
                                 <div className="absolute top-6 left-6 flex items-center gap-2 text-amber-400">
                                     <Star className="w-6 h-6 fill-amber-400 animate-pulse" />
                                     <span className="font-bold uppercase tracking-widest text-sm">Golden Nugget Spotlight</span>
                                 </div>
                                 
                                 <Quote className="w-16 h-16 text-amber-500/20 mb-6 mx-auto" />
                                 <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6 max-w-3xl">
                                     "{nuggets[spotlightIndex].description.replace('Facilitator marked this: "', '').replace('" Great soundbite.', '')}"
                                 </h2>
                                 
                                 <div className="flex items-center gap-4 text-slate-400">
                                     <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium border border-white/10">
                                         Detected at {tables.find(t => nuggets[spotlightIndex].relatedTableIds.includes(t.id))?.name || 'Table A1'}
                                     </span>
                                     <span className="text-sm">•</span>
                                     <span className="text-sm">{new Date(nuggets[spotlightIndex].timestamp).toLocaleTimeString()}</span>
                                 </div>

                                 {/* Progress bar for auto-rotate */}
                                 <div className="absolute bottom-0 left-0 h-1 bg-amber-500/50 w-full">
                                     <div className="h-full bg-amber-500 animate-[progress_10s_linear_infinite] origin-left"></div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Trending Themes */}
                    <div className="flex-1 bg-slate-900 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-indigo-400" /> Top Emerging Themes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {themes.map((theme, i) => (
                                <div key={theme.id} className="group bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/50 p-6 rounded-2xl transition-all cursor-pointer">
                                    <div className="text-4xl font-bold text-white/10 mb-2 group-hover:text-indigo-500/20 transition-colors">0{i+1}</div>
                                    <h4 className="text-lg font-bold text-white mb-2 leading-snug">{theme.title}</h4>
                                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">{theme.description}</p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                                        {theme.evidenceCount} Tables discussing <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COL: Leaderboards & Questions */}
                <div className="space-y-6 flex flex-col">
                    
                    {/* Active Tables Leaderboard */}
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" /> Most Active Tables
                        </h3>
                        <div className="space-y-3">
                            {hotTables.length > 0 ? hotTables.map((table, i) => (
                                <div key={table.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{table.name}</div>
                                            <div className="text-xs text-slate-400">{table.topic}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-emerald-400">High Engagement</div>
                                        <div className="text-[10px] text-slate-500">{table.facilitatorName}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-500 text-center py-4">Waiting for activity data...</div>
                            )}
                            {/* Fillers if not enough hot tables */}
                            {hotTables.length < 3 && tables.slice(0, 3 - hotTables.length).map((table, i) => (
                                <div key={`fill-${table.id}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 opacity-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-sm">
                                            {hotTables.length + i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{table.name}</div>
                                            <div className="text-xs text-slate-400">{table.topic}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Questions */}
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-violet-500" /> Top Open Questions
                        </h3>
                        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {questions.map((q) => (
                                <div key={q.id} className="p-4 bg-violet-500/10 border-l-4 border-violet-500 rounded-r-xl">
                                    <p className="text-sm font-medium text-violet-100 italic">"{q.title}"</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wider text-violet-400 font-bold">Votes: {q.evidenceCount * 5}</span>
                                    </div>
                                </div>
                            ))}
                            {questions.length === 0 && (
                                <div className="text-slate-500 text-center">No open questions yet.</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
