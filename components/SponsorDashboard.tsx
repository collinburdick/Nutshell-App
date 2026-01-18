
import React, { useState, useEffect, useCallback } from 'react';
import { Event, Sponsor } from '../types';
import { api, notifyError } from '../services/api';
import { Radar, BarChart2, TrendingUp, TrendingDown, Users, Activity, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { clsx } from 'clsx';

interface SponsorDashboardProps {
  event: Event;
  sponsor: Sponsor;
  onExit: () => void;
}

export const SponsorDashboard: React.FC<SponsorDashboardProps> = ({ event, sponsor, onExit }) => {
  const [stats, setStats] = useState<{ keyword: string; count: number; sentiment: number }[]>([]);
  const [totalMentions, setTotalMentions] = useState(0);
  const [avgOverallSentiment, setAvgOverallSentiment] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSponsorStats = useCallback(async () => {
    const eventDbId = parseInt(event.id);
    const sponsorDbId = parseInt(sponsor.id);
    if (isNaN(eventDbId) || isNaN(sponsorDbId)) {
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await api.sponsors.getStats(eventDbId, sponsorDbId);
      setStats(result.keywords);
      setTotalMentions(result.totalMentions);
      setAvgOverallSentiment(result.avgSentiment);
    } catch (error) {
      notifyError('Failed to fetch sponsor stats', error);
    }
    setIsLoading(false);
  }, [event.id, sponsor.id]);

  useEffect(() => {
    fetchSponsorStats();
    const interval = setInterval(fetchSponsorStats, 30000);
    return () => clearInterval(interval);
  }, [fetchSponsorStats]);

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col font-sans">
        {/* Sponsor Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {sponsor.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{sponsor.name} Brand Radar</h1>
                    <p className="text-xs text-slate-500">Live intelligence from {event.name}</p>
                </div>
            </div>
            <button onClick={onExit} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Exit Dashboard
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Privacy Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-emerald-800">Privacy Active</h3>
                        <p className="text-sm text-emerald-700 mt-1">
                            This dashboard aggregates keyword frequency and sentiment trends. 
                            Individual quotes and attendee identities are strictly redacted to comply with event privacy policies.
                        </p>
                    </div>
                </div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Share of Voice</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-900">{totalMentions}</div>
                        <div className="text-sm text-slate-400">Mentions across all tables</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                            {avgOverallSentiment >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                            <span className="text-xs font-bold uppercase tracking-wider">Net Sentiment</span>
                        </div>
                        <div className={clsx("text-4xl font-bold", avgOverallSentiment >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {avgOverallSentiment > 0 ? '+' : ''}{Math.round(avgOverallSentiment * 100)}%
                        </div>
                        <div className="text-sm text-slate-400">Positive/Negative skew</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Reach</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-900">~{Math.round(totalMentions * 1.5)}</div>
                        <div className="text-sm text-slate-400">Est. attendees engaged</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Keyword Volume */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-indigo-600" /> Keyword Volume
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="keyword" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Radar className="w-5 h-5 text-emerald-600" /> Sentiment by Topic
                        </h3>
                        <div className="space-y-4">
                            {stats.map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-700">{stat.keyword}</span>
                                        <span className={clsx("font-bold", stat.sentiment >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {stat.sentiment > 0 ? '+' : ''}{Math.round(stat.sentiment * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        {/* Simple visualization of sentiment range -1 to 1 mapped to 0-100% width where 50% is neutral */}
                                        <div 
                                            className={clsx("h-full transition-all duration-500", stat.sentiment >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                            style={{ 
                                                width: `${Math.abs(stat.sentiment) * 100}%`,
                                                marginLeft: stat.sentiment >= 0 ? '50%' : `${50 - (Math.abs(stat.sentiment) * 100)}%`
                                            }}
                                        ></div>
                                        {/* Center marker */}
                                        <div className="absolute left-1/2 w-0.5 h-2 bg-slate-300 transform -translate-x-1/2"></div>
                                    </div>
                                </div>
                            ))}
                            {stats.length === 0 && <div className="text-center text-slate-400 py-10">No data available yet.</div>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};
