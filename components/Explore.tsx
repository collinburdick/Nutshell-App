import React, { useState } from 'react';
import { Search, Sparkles, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ExploreProps {
  eventId: number;
}

export const Explore: React.FC<ExploreProps> = ({ eventId }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{q: string, a: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await api.ai.query(eventId, query);
      setHistory(prev => [{q: query, a: result.answer}, ...prev]);
    } catch (error) {
      setHistory(prev => [{q: query, a: 'Error: Unable to process query. Please ensure the OpenAI API key is configured.'}, ...prev]);
    }
    setQuery('');
    setIsLoading(false);
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center">
      
      <div className="w-full max-w-4xl px-6 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Explore Insights
          </h1>
          <p className="text-slate-500">Ask questions across all active sessions. Answers are grounded in real-time transcripts.</p>
      </div>

      <div className="w-full max-w-2xl mb-8 relative z-10">
          <form onSubmit={handleSearch} className="relative shadow-lg rounded-xl">
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: What are the main complaints about onboarding?"
                className="w-full h-14 pl-6 pr-14 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:outline-none text-lg"
            />
            <button 
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-2 top-2 h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
          <div className="mt-3 flex gap-2 justify-center">
              <button onClick={() => setQuery("What is the sentiment around pricing?")} className="text-xs bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-colors text-slate-600">
                  Pricing Sentiment
              </button>
              <button onClick={() => setQuery("List all action items mentioned.")} className="text-xs bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-colors text-slate-600">
                  Action Items
              </button>
              <button onClick={() => setQuery("What questions did facilitators ask?")} className="text-xs bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-colors text-slate-600">
                  Facilitator Prompts
              </button>
          </div>
      </div>

      <div className="w-full max-w-4xl flex-1 overflow-y-auto px-6 pb-20 space-y-6">
          {history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>No queries yet. Start by asking a question above.</p>
              </div>
          )}

          {history.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          You
                      </div>
                      <p className="font-medium text-slate-800">{item.q}</p>
                  </div>
                  <div className="p-6">
                       <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                                AI
                           </div>
                           <div className="prose prose-slate text-sm max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
                               {item.a}
                           </div>
                       </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
