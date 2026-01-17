import React from 'react';
import { Insight, InsightType } from '../types';
import { Lightbulb, CheckSquare, HelpCircle, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface InsightCardProps {
  insight: Insight;
  onClick: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onClick }) => {
  
  const getIcon = () => {
    switch (insight.type) {
      case InsightType.THEME: return <Lightbulb className="w-5 h-5 text-violet-600" />;
      case InsightType.ACTION_ITEM: return <CheckSquare className="w-5 h-5 text-emerald-600" />;
      case InsightType.QUESTION: return <HelpCircle className="w-5 h-5 text-blue-600" />;
      case InsightType.SENTIMENT_SPIKE: return <TrendingUp className="w-5 h-5 text-rose-600" />;
      case InsightType.GOLDEN_NUGGET: return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
    }
  };

  const getBorderColor = () => {
     switch (insight.type) {
      case InsightType.THEME: return 'border-violet-100 bg-violet-50/50';
      case InsightType.ACTION_ITEM: return 'border-emerald-100 bg-emerald-50/50';
      case InsightType.QUESTION: return 'border-blue-100 bg-blue-50/50';
      case InsightType.SENTIMENT_SPIKE: return 'border-rose-100 bg-rose-50/50';
      case InsightType.GOLDEN_NUGGET: return 'border-amber-300 bg-amber-50 shadow-sm ring-1 ring-amber-100';
    }
  };

  return (
    <div 
        onClick={onClick}
        className={clsx(
            "p-4 rounded-lg border mb-3 cursor-pointer transition-all hover:shadow-md bg-white group",
            getBorderColor()
        )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-white shadow-sm ring-1 ring-slate-900/5">
            {getIcon()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {insight.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1">
             {insight.type === InsightType.GOLDEN_NUGGET ? (
                 <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                     Facilitator Pick
                 </span>
             ) : (
                 <span className={clsx(
                     "text-xs font-semibold px-1.5 py-0.5 rounded",
                     insight.confidence > 0.9 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                 )}>
                     {Math.round(insight.confidence * 100)}% Conf
                 </span>
             )}
        </div>
      </div>
      
      <h3 className="font-semibold text-slate-900 mb-1 leading-snug group-hover:text-indigo-700 transition-colors">
          {insight.title}
      </h3>
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {insight.description}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100/50">
          <span>{insight.relatedTableIds.length} tables involved</span>
          <div className="flex items-center gap-1 text-indigo-600 font-medium group-hover:underline">
              {insight.evidenceCount} evidence clips <ArrowRight className="w-3 h-3" />
          </div>
      </div>
    </div>
  );
};