
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Explore } from './components/Explore';
import { EventList } from './components/EventList';
import { FacilitatorScreen } from './components/FacilitatorScreen';
import { LiveRecap } from './components/LiveRecap';
import { SettingsView } from './components/SettingsView';
import { AttendeeView } from './components/AttendeeView';
import { SponsorDashboard } from './components/SponsorDashboard'; // Import new component
import { LayoutDashboard, Compass, Settings, Users, Bell, LogIn, ChevronLeft, Tv, BarChart } from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_EVENTS, MOCK_TABLES, DEFAULT_AGENDA } from './constants';
import { Event, Table } from './types';

enum UserRole {
  ADMIN = 'ADMIN',
  FACILITATOR = 'FACILITATOR',
  ATTENDEE = 'ATTENDEE',
  SPONSOR = 'SPONSOR' // New Role
}

enum AdminView {
  EVENT_LIST = 'EVENT_LIST',
  DASHBOARD = 'DASHBOARD',
  EXPLORE = 'EXPLORE',
  LIVE_RECAP = 'LIVE_RECAP',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  // Global State
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);
  const [notices, setNotices] = useState<Record<string, string[]>>({});
  
  // Admin State
  const [adminView, setAdminView] = useState<AdminView>(AdminView.EVENT_LIST);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);

  // Facilitator State
  const [facilitatorTableId, setFacilitatorTableId] = useState<string | null>(null);

  // Attendee State
  const [attendeeEventId, setAttendeeEventId] = useState<string | null>(null);

  // Sponsor State
  const [sponsorEventId, setSponsorEventId] = useState<string | null>(null);
  const [currentSponsorId, setCurrentSponsorId] = useState<string | null>(null);

  // Handlers
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setAdminView(AdminView.DASHBOARD);
  };

  const handleCreateEvent = (event: Event) => {
    setEvents([event, ...events]);
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleAddTable = (newTable: Table) => {
    setTables(prev => [...prev, newTable]);
    // Update event table count
    setEvents(prev => prev.map(e => 
      e.id === newTable.eventId 
        ? { ...e, tablesCount: e.tablesCount + 1 } 
        : e
    ));
  };

  const handleUpdateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find(t => t.id === tableId);
    setTables(prev => prev.filter(t => t.id !== tableId));
    
    // Decrement table count for the relevant event
    if (tableToDelete) {
      setEvents(prev => prev.map(e => 
        e.id === tableToDelete.eventId 
          ? { ...e, tablesCount: Math.max(0, e.tablesCount - 1) } 
          : e
      ));
    }
  };

  const handleSendNudge = (tableIds: string[], message: string) => {
    setNotices(prev => {
      const next = { ...prev };
      tableIds.forEach(id => {
        next[id] = [...(next[id] || []), message];
      });
      return next;
    });
  };

  // --- RENDER LOGIC ---

  // Sponsor View
  if (role === UserRole.SPONSOR) {
      if (sponsorEventId && currentSponsorId) {
          const event = events.find(e => e.id === sponsorEventId) || events[0];
          const sponsor = event.sponsors.find(s => s.id === currentSponsorId) || event.sponsors[0];
          
          if (!sponsor) return <div>Error: Sponsor not found.</div>;

          return (
              <SponsorDashboard 
                  event={event} 
                  sponsor={sponsor}
                  onExit={() => { setSponsorEventId(null); setCurrentSponsorId(null); }}
              />
          );
      }
      return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 text-white">
                        <BarChart className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Sponsor Portal</h1>
                    <p className="text-slate-500 mt-2">Log in to view real-time brand impact.</p>
                </div>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => { setSponsorEventId('evt1'); setCurrentSponsorId('s1'); }}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg transition-colors text-white"
                    >
                        Login as Acme Cloud (Demo)
                    </button>
                    <button 
                        onClick={() => setRole(UserRole.ADMIN)}
                        className="w-full py-4 text-sm text-slate-500 hover:text-slate-800"
                    >
                        Back to Admin (Demo)
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // Facilitator View
  if (role === UserRole.FACILITATOR) {
    if (facilitatorTableId) {
        const table = tables.find(t => t.id === facilitatorTableId) || tables[0];
        const event = events.find(e => e.id === table.eventId) || events[0];
        const tableNotices = notices[facilitatorTableId] || [];
        return (
            <FacilitatorScreen 
                table={table} 
                onExit={() => setFacilitatorTableId(null)} 
                notices={tableNotices}
                defaultAgenda={event.defaultAgenda}
            />
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <span className="text-3xl font-bold">N</span>
                    </div>
                    <h1 className="text-2xl font-bold">Facilitator Login</h1>
                    <p className="text-slate-400 mt-2">Enter your table code to join the session.</p>
                </div>
                
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Table Code (e.g. 7X92B1)"
                        className="w-full h-14 bg-slate-900 border border-slate-700 rounded-xl px-4 text-center text-xl tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                        onClick={() => setFacilitatorTableId('3M88K2')} // Mock join - strictly forcing the hot table for demo
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg transition-colors"
                    >
                        Join Session (Demo)
                    </button>
                    <p className="text-xs text-center text-slate-500">
                        In this demo, clicking Join connects as Table A2 (Code: 3M88K2)
                    </p>
                    <button 
                        onClick={() => setRole(UserRole.ADMIN)}
                        className="w-full py-4 text-sm text-slate-500 hover:text-slate-300"
                    >
                        Back to Admin (Demo)
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Attendee View
  if (role === UserRole.ATTENDEE) {
      if (attendeeEventId) {
          const event = events.find(e => e.id === attendeeEventId) || events[0];
          return <AttendeeView event={event} onExit={() => setAttendeeEventId(null)} />;
      }
      return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 text-white">
                        <Users className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendee Access</h1>
                    <p className="text-slate-500 mt-2">Enter event code to view live insights.</p>
                </div>
                
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Event Code"
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center text-xl tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button 
                        onClick={() => setAttendeeEventId('evt1')}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-lg transition-colors text-white"
                    >
                        Enter Event (Demo)
                    </button>
                    <button 
                        onClick={() => setRole(UserRole.ADMIN)}
                        className="w-full py-4 text-sm text-slate-500 hover:text-slate-800"
                    >
                        Back to Admin (Demo)
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // Admin View
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className={clsx(
          "h-14 flex items-center justify-between px-4 shrink-0 shadow-md z-50 transition-colors",
          adminView === AdminView.LIVE_RECAP ? "bg-slate-950 text-white border-b border-white/10" : "bg-slate-900 text-white"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setAdminView(AdminView.EVENT_LIST); setSelectedEventId(null); }}>
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                N
             </div>
             <span className="font-bold text-lg tracking-tight">Nutshell</span>
          </div>
          
          {selectedEventId && (
            <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setAdminView(AdminView.DASHBOARD)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        adminView === AdminView.DASHBOARD ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                </button>
                <button 
                    onClick={() => setAdminView(AdminView.EXPLORE)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        adminView === AdminView.EXPLORE ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Compass className="w-4 h-4" />
                    Explore
                </button>
                <button 
                    onClick={() => setAdminView(AdminView.LIVE_RECAP)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        adminView === AdminView.LIVE_RECAP ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Tv className="w-4 h-4" />
                    Live Recap
                </button>
                <button 
                    onClick={() => setAdminView(AdminView.SETTINGS)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        adminView === AdminView.SETTINGS ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
             {selectedEventId ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 text-xs font-medium animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Event Live
                </div>
             ) : (
                <span className="text-xs text-slate-500 font-medium px-2">Global Admin</span>
             )}
             
             <div className="h-6 w-[1px] bg-slate-700"></div>
             
             {/* Role Switcher for Demo */}
             <div className="flex gap-2">
                 <button 
                    onClick={() => setRole(UserRole.FACILITATOR)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-600 transition-colors"
                 >
                    Facilitator
                 </button>
                 <button 
                    onClick={() => setRole(UserRole.ATTENDEE)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-600 transition-colors"
                 >
                    Attendee
                 </button>
                 <button 
                    onClick={() => setRole(UserRole.SPONSOR)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-600 transition-colors"
                 >
                    Sponsor
                 </button>
             </div>

             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold border-2 border-slate-800">
                 AD
             </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {adminView === AdminView.EVENT_LIST && (
            <EventList 
                events={events} 
                onSelectEvent={handleSelectEvent} 
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
            />
        )}
        
        {adminView === AdminView.DASHBOARD && selectedEventId && (
            <Dashboard 
                event={events.find(e => e.id === selectedEventId)!}
                tables={tables}
                onAddTable={handleAddTable}
                onUpdateTable={handleUpdateTable}
                onDeleteTable={handleDeleteTable}
                onSendNudge={handleSendNudge}
                onUpdateEvent={handleUpdateEvent}
                onBack={() => { setAdminView(AdminView.EVENT_LIST); setSelectedEventId(null); }}
            />
        )}
        
        {adminView === AdminView.EXPLORE && (
            <Explore />
        )}

        {adminView === AdminView.LIVE_RECAP && selectedEventId && (
            <LiveRecap 
                event={events.find(e => e.id === selectedEventId)!}
                tables={tables}
            />
        )}

        {adminView === AdminView.SETTINGS && selectedEventId && (
            <SettingsView 
                event={events.find(e => e.id === selectedEventId)!}
                onUpdateEvent={handleUpdateEvent}
            />
        )}
      </main>
    </div>
  );
};

export default App;
