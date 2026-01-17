import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Explore } from './components/Explore';
import { EventList } from './components/EventList';
import { FacilitatorScreen } from './components/FacilitatorScreen';
import { LiveRecap } from './components/LiveRecap';
import { SettingsView } from './components/SettingsView';
import { AttendeeView } from './components/AttendeeView';
import { SponsorDashboard } from './components/SponsorDashboard';
import { LayoutDashboard, Compass, Settings, Users, Tv, BarChart, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Event, Table } from './types';
import { api, wsClient } from './services/api';
import { 
  convertApiEventToFrontend, 
  convertApiTableToFrontend 
} from './services/typeConverters';

enum UserRole {
  ADMIN = 'ADMIN',
  FACILITATOR = 'FACILITATOR',
  ATTENDEE = 'ATTENDEE',
  SPONSOR = 'SPONSOR'
}

enum AdminView {
  EVENT_LIST = 'EVENT_LIST',
  DASHBOARD = 'DASHBOARD',
  EXPLORE = 'EXPLORE',
  LIVE_RECAP = 'LIVE_RECAP',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [tables, setTables] = useState<Table[]>([]);
  const [notices, setNotices] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [adminView, setAdminView] = useState<AdminView>(AdminView.EVENT_LIST);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const [facilitatorTableId, setFacilitatorTableId] = useState<string | null>(null);
  const [attendeeEventId, setAttendeeEventId] = useState<string | null>(null);
  const [sponsorEventId, setSponsorEventId] = useState<string | null>(null);
  const [currentSponsorId, setCurrentSponsorId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    wsClient.connect();
    
    const unsubTable = wsClient.subscribe('table_updated', (data) => {
      setTables(prev => prev.map(t => t._dbId === data.id ? convertApiTableToFrontend(data) : t));
    });
    
    const unsubNotice = wsClient.subscribe('notice', (data) => {
      if (data.tableIds) {
        setNotices(prev => {
          const next = { ...prev };
          data.tableIds.forEach((id: string) => {
            const table = tables.find(t => t._dbId === parseInt(id) || t.id === id);
            if (table) {
              next[table.id] = [...(next[table.id] || []), data.message];
            }
          });
          return next;
        });
      }
    });
    
    return () => {
      unsubTable();
      unsubNotice();
      wsClient.disconnect();
    };
  }, []);

  const loadEvents = async () => {
    try {
      const apiEvents = await api.events.list();
      setEvents(apiEvents.map(convertApiEventToFrontend));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTablesForEvent = async (eventId: number) => {
    try {
      const apiTables = await api.tables.list(eventId);
      setTables(apiTables.map(convertApiTableToFrontend));
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    setAdminView(AdminView.DASHBOARD);
    await loadTablesForEvent(parseInt(eventId));
  };

  const handleCreateEvent = async (event: Event) => {
    try {
      const created = await api.events.create({
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        status: event.status,
        primaryColor: event.branding?.primaryColor,
      });
      setEvents(prev => [convertApiEventToFrontend(created), ...prev]);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    try {
      const updated = await api.events.update(parseInt(updatedEvent.id), {
        name: updatedEvent.name,
        startDate: updatedEvent.startDate,
        endDate: updatedEvent.endDate,
        location: updatedEvent.location,
        status: updatedEvent.status,
        primaryColor: updatedEvent.branding?.primaryColor,
        logoUrl: updatedEvent.branding?.logoUrl,
        privacyMode: updatedEvent.privacyMode,
        mainSessionStatus: updatedEvent.mainSession?.status,
        streamUrl: updatedEvent.mainSession?.streamUrl,
      });
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? convertApiEventToFrontend(updated) : e));
    } catch (error) {
      console.error('Failed to update event:', error);
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    }
  };

  const handleAddTable = async (newTable: Table) => {
    try {
      const eventId = parseInt(newTable.eventId);
      const created = await api.tables.create(eventId, {
        name: newTable.name,
        session: newTable.session,
        topic: newTable.topic,
      });
      const convertedTable = convertApiTableToFrontend(created);
      setTables(prev => [...prev, convertedTable]);
      setEvents(prev => prev.map(e => 
        e.id === newTable.eventId 
          ? { ...e, tablesCount: e.tablesCount + 1 } 
          : e
      ));
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  };

  const handleUpdateTable = async (updatedTable: Table) => {
    try {
      if (updatedTable._dbId) {
        await api.tables.update(updatedTable._dbId, {
          name: updatedTable.name,
          session: updatedTable.session,
          topic: updatedTable.topic,
          status: updatedTable.status,
          isHot: updatedTable.isHot,
        });
      }
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    } catch (error) {
      console.error('Failed to update table:', error);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    const tableToDelete = tables.find(t => t.id === tableId);
    if (!tableToDelete?._dbId) return;
    
    try {
      await api.tables.delete(tableToDelete._dbId);
      setTables(prev => prev.filter(t => t.id !== tableId));
      if (tableToDelete) {
        setEvents(prev => prev.map(e => 
          e.id === tableToDelete.eventId 
            ? { ...e, tablesCount: Math.max(0, e.tablesCount - 1) } 
            : e
        ));
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  const handleSendNudge = async (tableIds: string[], message: string) => {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) return;
    
    try {
      const dbTableIds = tableIds.map(id => {
        const table = tables.find(t => t.id === id);
        return table?._dbId;
      }).filter(Boolean) as number[];
      
      await api.broadcast(parseInt(selectedEvent.id), message, dbTableIds);
      
      setNotices(prev => {
        const next = { ...prev };
        tableIds.forEach(id => {
          next[id] = [...(next[id] || []), message];
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to send nudge:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (role === UserRole.SPONSOR) {
    if (sponsorEventId && currentSponsorId) {
      const event = events.find(e => e.id === sponsorEventId) || events[0];
      const sponsor = event?.sponsors?.find(s => s.id === currentSponsorId) || event?.sponsors?.[0];
      
      if (!sponsor || !event) return <div>Error: Sponsor not found.</div>;

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
            {events.length > 0 && events[0].sponsors?.length > 0 ? (
              <button 
                onClick={() => { setSponsorEventId(events[0].id); setCurrentSponsorId(events[0].sponsors[0].id); }}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg transition-colors text-white"
              >
                Login as {events[0].sponsors[0].name}
              </button>
            ) : (
              <p className="text-center text-slate-500">No sponsors configured yet.</p>
            )}
            <button 
              onClick={() => setRole(UserRole.ADMIN)}
              className="w-full py-4 text-sm text-slate-500 hover:text-slate-800"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === UserRole.FACILITATOR) {
    if (facilitatorTableId) {
      const table = tables.find(t => t.id === facilitatorTableId) || tables[0];
      const event = events.find(e => e.id === table?.eventId) || events[0];
      const tableNotices = notices[facilitatorTableId] || [];
      
      if (!table || !event) {
        return <div>Error: Table not found.</div>;
      }
      
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
              id="facilitator-code"
              placeholder="Table Code (e.g. 7X92B1)"
              className="w-full h-14 bg-slate-900 border border-slate-700 rounded-xl px-4 text-center text-xl tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button 
              onClick={async () => {
                const input = document.getElementById('facilitator-code') as HTMLInputElement;
                const code = input?.value?.trim().toUpperCase();
                if (code) {
                  try {
                    const table = await api.tables.join(code);
                    const converted = convertApiTableToFrontend(table);
                    setTables(prev => {
                      const exists = prev.find(t => t.id === converted.id);
                      if (exists) return prev.map(t => t.id === converted.id ? converted : t);
                      return [...prev, converted];
                    });
                    setFacilitatorTableId(converted.id);
                  } catch (error) {
                    alert('Table not found. Please check the code.');
                  }
                } else if (tables.length > 0) {
                  setFacilitatorTableId(tables[0].id);
                }
              }}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg transition-colors"
            >
              Join Session
            </button>
            <button 
              onClick={() => setRole(UserRole.ADMIN)}
              className="w-full py-4 text-sm text-slate-500 hover:text-slate-300"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === UserRole.ATTENDEE) {
    if (attendeeEventId) {
      const event = events.find(e => e.id === attendeeEventId) || events[0];
      if (!event) return <div>Error: Event not found.</div>;
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
            <p className="text-slate-500 mt-2">Select an event to view live insights.</p>
          </div>
          
          <div className="space-y-4">
            {events.map(event => (
              <button 
                key={event.id}
                onClick={() => setAttendeeEventId(event.id)}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-lg transition-colors text-white"
              >
                {event.name}
              </button>
            ))}
            {events.length === 0 && (
              <p className="text-center text-slate-500">No events available.</p>
            )}
            <button 
              onClick={() => setRole(UserRole.ADMIN)}
              className="w-full py-4 text-sm text-slate-500 hover:text-slate-800"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
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
        
        {adminView === AdminView.EXPLORE && selectedEventId && (
          <Explore eventId={parseInt(selectedEventId)} />
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
