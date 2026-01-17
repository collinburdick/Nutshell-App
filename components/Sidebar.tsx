
import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Mic, Clock, Plus, QrCode, Flame, Radio, Pencil, Trash2 } from 'lucide-react';
import { Table, TableStatus, Event } from '../types';
import { clsx } from 'clsx';

interface SidebarProps {
  event: Event;
  tables: Table[];
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
  onAddTable: () => void;
  onEditTable: (table: Table) => void;
  onDeleteTable: (id: string) => void;
  onViewCodes: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ event, tables, selectedTableId, onSelectTable, onAddTable, onEditTable, onDeleteTable, onViewCodes }) => {
  
  const getStatusIcon = (table: Table) => {
    if (table.isHot) return <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />;
    
    switch (table.status) {
      case TableStatus.ACTIVE: return <Wifi className="w-4 h-4 text-emerald-500" />;
      case TableStatus.DEGRADED: return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case TableStatus.OFFLINE: return <WifiOff className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.ACTIVE: return 'border-emerald-500';
      case TableStatus.DEGRADED: return 'border-amber-500';
      case TableStatus.OFFLINE: return 'border-slate-300';
    }
  };

  const isMainStageSelected = selectedTableId === 'MAIN_STAGE';

  // Helper to find track color
  const getTrackColor = (trackId?: string) => {
      const track = event.tracks?.find(t => t.id === trackId);
      return track ? track.color : 'transparent';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20 shadow-[1px_0_10px_rgba(0,0,0,0.05)]">
      
      {/* Main Session Section */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Plenary</h2>
           <div 
             onClick={() => onSelectTable('MAIN_STAGE')}
             className={clsx(
                "p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group",
                isMainStageSelected ? "bg-white border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300"
             )}
           >
               <div className="flex items-center gap-2">
                   <div className={clsx(
                       "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                       event.mainSession.status === 'RECORDING' ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-500"
                   )}>
                       <Radio className="w-4 h-4" />
                   </div>
                   <div>
                       <div className="text-sm font-bold text-slate-800">Main Stage</div>
                       <div className="text-[10px] text-slate-500 font-medium">
                           {event.mainSession.status === 'RECORDING' ? 'Recording Live' : 'Idle / Offline'}
                       </div>
                   </div>
               </div>
               {isMainStageSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
           </div>
      </div>

      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Tables</h2>
            <div className="flex gap-1">
                <button 
                    onClick={onAddTable}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Add Table"
                >
                    <Plus className="w-4 h-4" />
                </button>
                <button 
                    onClick={onViewCodes}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="View Join Codes"
                >
                    <QrCode className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {tables.filter(t => t.status === TableStatus.ACTIVE).length} Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {tables.filter(t => t.status === TableStatus.DEGRADED).length} Issue</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div 
            onClick={() => onSelectTable(null)}
            className={clsx(
                "p-3 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors",
                selectedTableId === null ? "border-indigo-600 bg-indigo-50" : "border-transparent"
            )}
        >
             <div className="font-medium text-sm text-slate-900">All Tables</div>
             <div className="text-xs text-slate-500">View aggregate stream</div>
        </div>

        {tables.map(table => (
          <div
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            className={clsx(
              "p-3 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 group relative",
              selectedTableId === table.id ? "bg-slate-50" : "",
              selectedTableId === table.id ? getStatusColor(table.status) : "border-transparent"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm text-slate-900 truncate max-w-[140px]">{table.name}</span>
              <div className="flex items-center gap-1">
                  {/* Track Indicator Dot */}
                  {table.trackId && (
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getTrackColor(table.trackId) }}
                        title="Track Indicator"
                      ></div>
                  )}
                  {getStatusIcon(table)}
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-1 truncate">{table.topic}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    <span>{Math.floor((Date.now() - table.lastAudio) / 1000)}s ago</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="font-mono text-slate-400 bg-slate-100 px-1 rounded">Code: {table.id}</span>
            </div>

            {/* Action Buttons - Visible on Hover */}
            <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 z-10 bg-white/90 rounded px-1">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEditTable(table); }}
                    className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    title="Edit Table"
                >
                    <Pencil className="w-3 h-3" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTable(table.id); }}
                    className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                    title="Delete Table"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
          </div>
        ))}

        {/* Inline Add Table Button at end of list */}
        <button 
          onClick={onAddTable}
          className="w-full p-4 border-l-4 border-transparent border-b border-slate-100 flex items-center gap-3 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 group-hover:border-indigo-300 flex items-center justify-center">
             <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Add Table</span>
        </button>

      </div>
    </div>
  );
};
