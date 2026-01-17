
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { InsightCard } from './InsightCard';
import { EvidencePanel } from './EvidencePanel';
import { ThemeMap } from './ThemeMap';
import { GovernanceModal } from './GovernanceModal';
import { AgendaEditor } from './AgendaEditor';
import { MOCK_INSIGHTS, MOCK_TRANSCRIPTS } from '../constants';
import { Table, Insight, TranscriptSegment, InsightType, TableStatus, Event, AgendaItem } from '../types';
import { BarChart2, Activity, Zap, Star, ArrowLeft, Megaphone, Plus, X, Copy, Check, QrCode, Sliders, Download, Shield, FileText, Filter, Search, Upload, Radio, StopCircle, HardDrive, Users, ThumbsUp, ThumbsDown, GitCommit, LayoutGrid, List, ShieldAlert, CalendarClock, Video, Loader2, PlayCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';

const data = [
  { name: '10:00', sentiment: 0.2 },
  { name: '10:05', sentiment: 0.4 },
  { name: '10:10', sentiment: 0.1 },
  { name: '10:15', sentiment: -0.3 },
  { name: '10:20', sentiment: -0.1 },
  { name: '10:25', sentiment: 0.5 },
  { name: '10:30', sentiment: 0.7 },
];

const CONSENSUS_DATA = [
    { topic: "Cloud Strategy", score: 85, label: "Strong Consensus", type: 'consensus' },
    { topic: "RTO Policy", score: 25, label: "Highly Controversial", type: 'controversy' },
    { topic: "AI Adoption", score: 60, label: "Leaning Positive", type: 'consensus' },
];

interface DashboardProps {
    event: Event;
    tables: Table[];
    onBack: () => void;
    onAddTable: (table: Table) => void;
    onUpdateTable: (table: Table) => void;
    onDeleteTable: (tableId: string) => void;
    onSendNudge: (tableIds: string[], message: string) => void;
    // New prop to update event details (like agenda)
    onUpdateEvent?: (updatedEvent: Event) => void;
}

const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const Dashboard: React.FC<DashboardProps> = ({ event: initialEvent, tables, onBack, onAddTable, onUpdateTable, onDeleteTable, onSendNudge, onUpdateEvent }) => {
  const [event, setEvent] = useState<Event>(initialEvent);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Modals State
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);

  // Ops Modal Highlight Reel State
  const [highlightReelStatus, setHighlightReelStatus] = useState<'IDLE' | 'GENERATING' | 'READY'>('IDLE');

  // Edit State
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  // View State
  const [insightsViewMode, setInsightsViewMode] = useState<'LIST' | 'MAP'>('LIST');

  // Filters State
  const [sessionFilter, setSessionFilter] = useState<string>('All Sessions');
  const [trackFilter, setTrackFilter] = useState<string>('All Tracks');
  const [searchQuery, setSearchQuery] = useState('');

  // Ops State
  const [privacyMode, setPrivacyMode] = useState<'STRICT' | 'BALANCED' | 'OFF'>('STRICT');
  const [opsTab, setOpsTab] = useState<'GENERAL' | 'DATA' | 'AGENDA'>('GENERAL');

  // Form State
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableFacilitator, setNewTableFacilitator] = useState('');
  const [newTableTopic, setNewTableTopic] = useState('');
  
  // Table Agenda State
  const [useCustomAgenda, setUseCustomAgenda] = useState(false);
  const [customAgendaItems, setCustomAgendaItems] = useState<AgendaItem[]>([]);

  // Update local event state when prop changes
  useEffect(() => {
      setEvent(initialEvent);
  }, [initialEvent]);

  const isMainStage = selectedTableId === 'MAIN_STAGE';

  // Get unique sessions for filter
  const sessions = ['All Sessions', ...Array.from(new Set(tables.filter(t => t.eventId === event.id).map(t => t.session)))];
  // Get tracks for filter
  const tracks = ['All Tracks', ...(event.tracks || []).map(t => t.name)];

  // Filter Logic
  const eventTables = tables.filter(t => {
      const matchEvent = t.eventId === event.id;
      const matchSession = sessionFilter === 'All Sessions' || t.session === sessionFilter;
      
      const trackName = event.tracks?.find(tr => tr.id === t.trackId)?.name || 'Unknown';
      const matchTrack = trackFilter === 'All Tracks' || trackName === trackFilter;

      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.facilitatorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchEvent && matchSession && matchTrack && matchSearch;
  });
  
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [filteredTranscripts, setFilteredTranscripts] = useState<TranscriptSegment[]>([]);

  useEffect(() => {
    // 1. Determine relevant table IDs based on selection OR current list filters
    let relevantTableIds: string[] = [];
    
    if (isMainStage) {
        relevantTableIds = []; 
    } else if (selectedTableId) {
        relevantTableIds = [selectedTableId];
    } else {
        relevantTableIds = eventTables.map(t => t.id);
    }

    // 2. Filter Insights
    const relevantInsights = MOCK_INSIGHTS.filter(i => 
        i.relatedTableIds.some(id => relevantTableIds.includes(id))
    );

    // 3. Filter Transcripts
    const relevantTranscripts = MOCK_TRANSCRIPTS.filter(t => 
        relevantTableIds.includes(t.tableId)
    );

    setFilteredInsights(relevantInsights);
    setFilteredTranscripts(relevantTranscripts);
  }, [selectedTableId, event.id, tables, sessionFilter, trackFilter, searchQuery, isMainStage]);

  const nuggets = filteredInsights.filter(i => i.type === InsightType.GOLDEN_NUGGET);
  const standardInsights = filteredInsights.filter(i => i.type !== InsightType.GOLDEN_NUGGET);

  // Handlers
  const handleTableFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agendaToSave = useCustomAgenda ? customAgendaItems : undefined;

    if (editingTable) {
        const updatedTable: Table = {
            ...editingTable,
            name: newTableName,
            topic: newTableTopic,
            facilitatorName: newTableFacilitator,
            customAgenda: agendaToSave
        };
        onUpdateTable(updatedTable);
    } else {
        const newTable: Table = {
            id: generateJoinCode(), 
            eventId: event.id,
            name: newTableName,
            session: 'New Session',
            status: TableStatus.OFFLINE,
            lastAudio: 0,
            lastTranscript: 0,
            topic: newTableTopic || 'General Discussion',
            facilitatorName: newTableFacilitator || 'TBD',
            isHot: false,
            customAgenda: agendaToSave
        };
        onAddTable(newTable);
    }
    setIsAddTableModalOpen(false);
    resetTableForm();
  };

  const resetTableForm = () => {
    setEditingTable(null);
    setNewTableName('');
    setNewTableTopic('');
    setNewTableFacilitator('');
    setUseCustomAgenda(false);
    setCustomAgendaItems([]);
  };

  const openAddModal = () => {
      resetTableForm();
      setIsAddTableModalOpen(true);
  };

  const handleEditTable = (table: Table) => {
      setEditingTable(table);
      setNewTableName(table.name);
      setNewTableTopic(table.topic);
      setNewTableFacilitator(table.facilitatorName);
      if (table.customAgenda && table.customAgenda.length > 0) {
          setUseCustomAgenda(true);
          setCustomAgendaItems(table.customAgenda);
      } else {
          setUseCustomAgenda(false);
          setCustomAgendaItems(event.defaultAgenda);
      }
      setIsAddTableModalOpen(true);
  };

  const handleDeleteTable = (tableId: string) => {
      if (window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
          onDeleteTable(tableId);
          if (selectedTableId === tableId) setSelectedTableId(null);
      }
  };

  const handleNudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMainStage) {
        alert("Cannot nudge Main Stage (it has no facilitator app).");
        return;
    }
    const targetIds = selectedTableId ? [selectedTableId] : eventTables.map(t => t.id);
    onSendNudge(targetIds, nudgeMessage);
    setIsNudgeModalOpen(false);
    setNudgeMessage('');
    alert(`Nudge sent to ${targetIds.length} tables.`);
  };

  const handleGlobalAgendaUpdate = (newAgenda: AgendaItem[]) => {
      const updatedEvent = { ...event, defaultAgenda: newAgenda };
      setEvent(updatedEvent);
      if (onUpdateEvent) {
          onUpdateEvent(updatedEvent);
      }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleExport = (format: string) => {
      alert(`Exporting data to ${format}... (Mock)`);
  };

  const handleDownload = (type: string, scope: string) => {
      alert(`Downloading ${scope} ${type}... (Mock)`);
  };

  const handleGenerateHighlightReel = () => {
      setHighlightReelStatus('GENERATING');
      setTimeout(() => {
          setHighlightReelStatus('READY');
      }, 3000);
  };

  const toggleMainSessionRecording = () => {
      setEvent(prev => ({
          ...prev,
          mainSession: {
              ...prev.mainSession,
              status: prev.mainSession.status === 'RECORDING' ? 'COMPLETED' : 'RECORDING'
          }
      }));
  };

  return (
    <div className="flex h-full w-full bg-slate-50 relative">
      {/* Left Column: Tables */}
      <Sidebar 
        event={event}
        tables={eventTables} 
        selectedTableId={selectedTableId} 
        onSelectTable={setSelectedTableId} 
        onAddTable={openAddModal}
        onEditTable={handleEditTable}
        onDeleteTable={handleDeleteTable}
        onViewCodes={() => setIsCodesModalOpen(true)}
      />

      {/* Center Column: Insights & Viz */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
           <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                   <ArrowLeft className="w-5 h-5" />
               </button>
               <div>
                   <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       {isMainStage ? (
                           <>
                            <Radio className={clsx("w-5 h-5", event.mainSession.status === 'RECORDING' ? "text-red-500 animate-pulse" : "text-slate-400")} />
                            Main Stage
                           </>
                       ) : selectedTableId ? (
                           tables.find(t => t.id === selectedTableId)?.name
                       ) : (
                           'Event Overview'
                       )}
                   </h1>
                    <span className="text-sm font-normal text-slate-500">
                       {isMainStage ? (event.mainSession.status === 'RECORDING' ? 'Recording in progress...' : 'Ready to record') : selectedTableId ? tables.find(t => t.id === selectedTableId)?.session : 'All Sessions'}
                   </span>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
               {isMainStage && (
                   <button 
                       onClick={toggleMainSessionRecording}
                       className={clsx(
                           "flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm transition-all shadow-sm",
                           event.mainSession.status === 'RECORDING' 
                            ? "bg-white text-red-600 border border-red-200 hover:bg-red-50" 
                            : "bg-red-600 text-white hover:bg-red-700"
                       )}
                   >
                       {event.mainSession.status === 'RECORDING' ? <StopCircle className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                       {event.mainSession.status === 'RECORDING' ? 'Stop Recording' : 'Start Recording'}
                   </button>
               )}

               {!isMainStage && (
                   <>
                       <button 
                        onClick={() => setIsGovernanceModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors font-medium text-sm"
                        title="3 Pending Redaction Reviews"
                       >
                           <ShieldAlert className="w-4 h-4" />
                           <span className="bg-amber-600 text-white text-[10px] px-1 rounded-full">3</span>
                       </button>

                       <button 
                        onClick={() => setIsNudgeModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium text-sm"
                       >
                           <Megaphone className="w-4 h-4" />
                           Broadcast
                       </button>
                   </>
               )}

               <button 
                onClick={() => setIsOpsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 rounded-md border border-slate-300 hover:bg-slate-50 transition-colors font-medium text-sm"
               >
                   <Sliders className="w-4 h-4" />
                   Ops
               </button>

               {!isMainStage && (
                   <>
                       <div className="h-8 w-[1px] bg-slate-200"></div>
                       <div className="flex flex-col items-end">
                           <span className="text-xs font-bold text-slate-500 uppercase">Avg Sentiment</span>
                           <span className="text-sm font-semibold text-emerald-600">+0.42</span>
                       </div>
                   </>
               )}
           </div>
        </div>

        {/* Global Filter Bar */}
        {!isMainStage && (
            <div className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shrink-0">
                 <div className="flex items-center gap-2 text-slate-500">
                     <Filter className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-wider">Filters:</span>
                 </div>
                 
                 <select 
                    value={sessionFilter} 
                    onChange={e => setSessionFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                 >
                     {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>

                 <select 
                    value={trackFilter} 
                    onChange={e => setTrackFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                 >
                     {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>

                 <div className="h-4 w-[1px] bg-slate-200"></div>

                 <div className="relative flex-1 max-w-md">
                     <Search className="w-4 h-4 absolute left-2.5 top-1.5 text-slate-400" />
                     <input 
                        type="text" 
                        placeholder="Search tables, topics, or facilitators..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-4 py-1 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                     />
                 </div>
            </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {isMainStage ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Radio className="w-12 h-12 mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-600">Main Stage Audio Feed</h3>
                    <p>Live analysis for plenary sessions is coming soon.</p>
                    <button 
                        onClick={() => setIsOpsModalOpen(true)}
                        className="mt-4 text-indigo-600 font-medium hover:underline text-sm"
                    >
                        Access Recordings in Ops Vault
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Pulse Chart */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-500" />
                                    Sentiment Pulse
                                </h3>
                                <select className="text-xs border-slate-200 border rounded px-2 py-1 bg-slate-50">
                                    <option>Last 30 mins</option>
                                    <option>Last Hour</option>
                                </select>
                            </div>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                        <YAxis hide domain={[-1, 1]} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="sentiment" stroke="#8884d8" fillOpacity={1} fill="url(#colorSentiment)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Consensus vs Controversy Widget */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                             <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                                <GitCommit className="w-4 h-4 text-slate-500" />
                                Consensus vs Controversy
                            </h3>
                            <div className="flex-1 space-y-3">
                                {CONSENSUS_DATA.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">{item.topic}</div>
                                            <div className={clsx("text-[10px] font-bold uppercase", item.type === 'consensus' ? "text-emerald-600" : "text-amber-600")}>
                                                {item.label}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={clsx("h-full rounded-full", item.type === 'consensus' ? "bg-emerald-500" : "bg-amber-500")}
                                                    style={{ width: `${item.score}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-400 w-8 text-right">{item.score}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Golden Nuggets Section */}
                    {nuggets.length > 0 && (
                        <div className="mb-2">
                            <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-3">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                Golden Nuggets (Facilitator Highlights)
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                 {nuggets.map(insight => (
                                    <InsightCard key={insight.id} insight={insight} onClick={() => {}} />
                                 ))}
                            </div>
                        </div>
                    )}

                    {/* Insight Cards / Theme Map */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-slate-500" />
                                Emerging Themes & Insights
                            </h3>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button 
                                    onClick={() => setInsightsViewMode('LIST')}
                                    className={clsx("p-1.5 rounded-md transition-all", insightsViewMode === 'LIST' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setInsightsViewMode('MAP')}
                                    className={clsx("p-1.5 rounded-md transition-all", insightsViewMode === 'MAP' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {insightsViewMode === 'LIST' ? (
                            <div className="grid grid-cols-1 gap-4">
                                {standardInsights.map(insight => (
                                    <InsightCard 
                                        key={insight.id} 
                                        insight={insight} 
                                        onClick={() => {}} 
                                    />
                                ))}
                                {filteredInsights.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        No insights found matching filters.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ThemeMap insights={filteredInsights} onSelectInsight={() => {}} />
                        )}
                    </div>
                </>
            )}

        </div>
      </div>

      {/* Right Column: Evidence */}
      <EvidencePanel transcripts={filteredTranscripts} />

      {/* --- MODALS --- */}

      {/* Governance Modal */}
      <GovernanceModal isOpen={isGovernanceModalOpen} onClose={() => setIsGovernanceModalOpen(false)} />

      {/* Add / Edit Table Modal */}
      {isAddTableModalOpen && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-900">{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
                     <button onClick={() => setIsAddTableModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleTableFormSubmit} className="space-y-4">
                        {/* Bulk Import Mock - Only show on create */}
                        {!editingTable && (
                            <>
                                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center mb-4 cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-colors">
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                    <span className="text-sm font-medium text-slate-600 block">Bulk Import via CSV</span>
                                    <span className="text-xs text-slate-400">Drag & drop or click to upload</span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-2 bg-white text-xs text-slate-500 uppercase">Or Add Manually</span>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Table Name</label>
                            <input required value={newTableName} onChange={e => setNewTableName(e.target.value)} type="text" placeholder="e.g. Table C4" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                            <input required value={newTableTopic} onChange={e => setNewTableTopic(e.target.value)} type="text" placeholder="e.g. AI Ethics" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Facilitator</label>
                            <input value={newTableFacilitator} onChange={e => setNewTableFacilitator(e.target.value)} type="text" placeholder="e.g. John Doe" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>

                        {/* Agenda Override Section */}
                        <div className="pt-4 border-t border-slate-100">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4" /> Table Specific Agenda
                                </h4>
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={useCustomAgenda} onChange={(e) => {
                                            setUseCustomAgenda(e.target.checked);
                                            if (e.target.checked && customAgendaItems.length === 0) {
                                                setCustomAgendaItems([...event.defaultAgenda]); // Init with default
                                            }
                                        }} />
                                        <div className={clsx("block w-10 h-6 rounded-full transition-colors", useCustomAgenda ? "bg-indigo-600" : "bg-slate-300")}></div>
                                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform" style={{ transform: useCustomAgenda ? "translateX(16px)" : "translateX(0)" }}></div>
                                    </div>
                                    <div className="ml-3 text-xs text-slate-600">
                                        {useCustomAgenda ? 'Custom Agenda' : 'Use Event Default'}
                                    </div>
                                </label>
                             </div>

                             {useCustomAgenda && (
                                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                     <AgendaEditor 
                                        agenda={customAgendaItems} 
                                        onChange={setCustomAgendaItems} 
                                        label="Custom Phases & Prompts"
                                     />
                                 </div>
                             )}
                        </div>
                    </form>
                 </div>
                 <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                     <button onClick={handleTableFormSubmit} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">{editingTable ? 'Save Changes' : 'Create Table'}</button>
                     <button onClick={() => setIsAddTableModalOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                 </div>
             </div>
        </div>
      )}

      {/* Broadcast Nudge Modal */}
      {isNudgeModalOpen && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-600"/> Broadcast Nudge</h3>
                     <button onClick={() => setIsNudgeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleNudgeSubmit} className="p-6 space-y-4">
                     <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-800 border border-indigo-100">
                         Sending to: <strong>{selectedTableId ? 'Selected Table Only' : `All ${eventTables.length} Tables`}</strong>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                         <textarea 
                            required 
                            autoFocus
                            value={nudgeMessage} 
                            onChange={e => setNudgeMessage(e.target.value)} 
                            rows={3}
                            placeholder="e.g. 5 minutes remaining! Please wrap up." 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" 
                        />
                     </div>
                     <div className="pt-2 flex gap-3">
                         <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Send Nudge</button>
                         <button type="button" onClick={() => setIsNudgeModalOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                     </div>
                 </form>
             </div>
        </div>
      )}

      {/* Ops & Export Modal */}
      {isOpsModalOpen && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                     <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Sliders className="w-5 h-5 text-indigo-600"/> Ops & Data Vault</h3>
                     <button onClick={() => setIsOpsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>
                 
                 {/* Ops Tabs */}
                 <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setOpsTab('GENERAL')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold border-b-2 transition-colors",
                            opsTab === 'GENERAL' ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        General & Privacy
                    </button>
                    <button 
                        onClick={() => setOpsTab('AGENDA')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold border-b-2 transition-colors",
                            opsTab === 'AGENDA' ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Default Agenda
                    </button>
                    <button 
                        onClick={() => setOpsTab('DATA')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold border-b-2 transition-colors",
                            opsTab === 'DATA' ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Raw Data & Recordings
                    </button>
                 </div>

                 <div className="p-6 space-y-6 overflow-y-auto">
                     
                     {opsTab === 'GENERAL' && (
                        <>
                             {/* Privacy Mode */}
                             <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-slate-500" /> Privacy & Redaction
                                </h4>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {(['STRICT', 'BALANCED', 'OFF'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setPrivacyMode(mode)}
                                            className={clsx(
                                                "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                                privacyMode === mode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {privacyMode === 'STRICT' && "Redacts all PII (names, emails, orgs) and disables raw audio storage."}
                                    {privacyMode === 'BALANCED' && "Redacts contact info but keeps names for context. Audio retained for 24h."}
                                    {privacyMode === 'OFF' && "No redaction. Full fidelity. Requires user consent."}
                                </p>
                             </div>

                             <div className="h-px bg-slate-100"></div>

                             {/* Exports */}
                             <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Download className="w-4 h-4 text-slate-500" /> Report Exports
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleExport('Slack')} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-left">
                                        <div className="w-8 h-8 bg-[#4A154B] rounded flex items-center justify-center text-white font-bold text-xs">S</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">Slack</div>
                                            <div className="text-[10px] text-slate-500">Post summary to channel</div>
                                        </div>
                                    </button>
                                     <button onClick={() => handleExport('Notion')} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-left">
                                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">N</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">Notion</div>
                                            <div className="text-[10px] text-slate-500">Create page with items</div>
                                        </div>
                                    </button>
                                     <button onClick={() => handleExport('PDF')} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-left">
                                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">P</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">PDF Report</div>
                                            <div className="text-[10px] text-slate-500">Executive summary</div>
                                        </div>
                                    </button>
                                     <button onClick={() => handleExport('CSV')} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-left">
                                        <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-xs">X</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">CSV Dump</div>
                                            <div className="text-[10px] text-slate-500">Raw action items</div>
                                        </div>
                                    </button>
                                </div>
                             </div>
                        </>
                     )}

                     {opsTab === 'AGENDA' && (
                         <div className="space-y-4">
                             <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                 <h4 className="font-bold text-amber-800 text-sm mb-1">Global Event Agenda</h4>
                                 <p className="text-xs text-amber-700">Changes here update the default agenda for all tables. Tables with custom overrides will not be affected.</p>
                             </div>
                             
                             <AgendaEditor 
                                agenda={event.defaultAgenda}
                                onChange={handleGlobalAgendaUpdate}
                             />
                         </div>
                     )}

                     {opsTab === 'DATA' && (
                        <div className="space-y-6">
                            
                            {/* NEW: Highlight Reel Generator */}
                            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-indigo-600" /> Automated Highlight Reel
                                </h4>
                                <p className="text-xs text-indigo-700 mb-4">
                                    Stitches "Golden Nuggets" audio with transcript captions into a shareable recap video.
                                </p>
                                
                                {highlightReelStatus === 'IDLE' && (
                                    <button 
                                        onClick={handleGenerateHighlightReel}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm flex items-center justify-center gap-2"
                                    >
                                        <Zap className="w-4 h-4" /> Generate 3-Min Recap
                                    </button>
                                )}

                                {highlightReelStatus === 'GENERATING' && (
                                    <div className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 cursor-wait">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Stitching Clips...
                                    </div>
                                )}

                                {highlightReelStatus === 'READY' && (
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm flex items-center justify-center gap-2">
                                            <PlayCircle className="w-4 h-4" /> Preview
                                        </button>
                                        <button className="flex-1 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 text-sm flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4" /> Download MP4
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Main Stage Downloads */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-slate-500" /> Main Stage
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <HardDrive className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Raw Audio Recording</div>
                                                <div className="text-[10px] text-slate-500">MP3 • High Quality • {event.mainSession.status === 'RECORDING' ? 'In Progress' : 'Available'}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload('Audio', 'Main Stage')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100">
                                            Download
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Full Transcript</div>
                                                <div className="text-[10px] text-slate-500">JSON / TXT</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload('Transcript', 'Main Stage')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100">
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Event Wide Downloads */}
                             <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-slate-500" /> Bulk Event Data
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">ALL</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">All Tables Audio Archive</div>
                                                <div className="text-[10px] text-slate-500">ZIP Archive • ~1.2GB</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload('Audio Archive', 'All Tables')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100">
                                            Download
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">TXT</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Complete Event Transcripts</div>
                                                <div className="text-[10px] text-slate-500">Merged CSV + JSON</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload('Transcripts', 'All Tables')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100">
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Specific Table Downloads */}
                            {selectedTableId && !isMainStage && (
                                <>
                                    <div className="h-px bg-slate-100"></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-slate-500" /> Current Selection ({tables.find(t => t.id === selectedTableId)?.name})
                                        </h4>
                                        <div className="flex gap-2">
                                             <button onClick={() => handleDownload('Audio', 'Current Table')} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700">
                                                Download Table Audio
                                            </button>
                                            <button onClick={() => handleDownload('Transcript', 'Current Table')} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700">
                                                Download Table Transcript
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                     )}

                 </div>
                 <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                     <button onClick={() => setIsOpsModalOpen(false)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm">Done</button>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};
