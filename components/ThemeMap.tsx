import React from 'react';
import { Insight, InsightType } from '../types';
import { clsx } from 'clsx';

interface ThemeMapProps {
  insights: Insight[];
  onSelectInsight: (insight: Insight) => void;
}

export const ThemeMap: React.FC<ThemeMapProps> = ({ insights, onSelectInsight }) => {
  // Filter only themes and sort by evidence count (size)
  const themes = insights
    .filter(i => i.type === InsightType.THEME)
    .sort((a, b) => b.evidenceCount - a.evidenceCount);

  if (themes.length === 0) {
      return (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              No themes detected yet.
          </div>
      );
  }

  // Simple visual packing simulation using flex wrap and varying sizes
  return (
    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 min-h-[300px]">
        <div className="flex flex-wrap gap-4 items-center justify-center h-full">
            {themes.map((theme, i) => {
                // Determine size based on evidence count relative to max
                const maxEvidence = Math.max(...themes.map(t => t.evidenceCount));
                const scale = Math.max(0.6, theme.evidenceCount / maxEvidence);
                const sizeClass = scale > 0.8 ? "w-48 h-48" : scale > 0.5 ? "w-36 h-36" : "w-28 h-28";
                const textSize = scale > 0.8 ? "text-lg" : "text-sm";

                return (
                    <div 
                        key={theme.id}
                        onClick={() => onSelectInsight(theme)}
                        className={clsx(
                            sizeClass,
                            "rounded-full flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all hover:scale-105 shadow-sm hover:shadow-md border",
                            "bg-white border-slate-200 hover:border-indigo-300 group relative overflow-hidden"
                        )}
                        style={{
                            animation: `float ${3 + i}s ease-in-out infinite`
                        }}
                    >
                        {/* Background heatmap effect */}
                        <div className={clsx(
                            "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity",
                            i % 2 === 0 ? "bg-indigo-500" : "bg-violet-500"
                        )}></div>

                        <span className={clsx("font-bold text-slate-800 relative z-10 leading-tight", textSize)}>
                            {theme.title}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 relative z-10 font-medium">
                            {theme.evidenceCount} sources
                        </span>
                    </div>
                );
            })}
        </div>
        <style>{`
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
            }
        `}</style>
    </div>
  );
};