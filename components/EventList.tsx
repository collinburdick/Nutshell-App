import React, { useState } from 'react';
import { Event } from '../types';
import { Calendar, Plus, Users, Layout, ArrowRight, MapPin, Clock, Edit2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { DEFAULT_AGENDA } from '../constants';

interface EventListProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: (event: Event) => void;
  onUpdateEvent: (event: Event) => void;
}

export const EventList: React.FC<EventListProps> = ({ events, onSelectEvent, onCreateEvent, onUpdateEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: ''
  });

  const resetForm = () => {
    setFormData({ name: '', location: '', startDate: '', endDate: '' });
    setEditingEventId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    // Default start date to "tomorrow 09:00"
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    setFormData({
      name: '',
      location: '',
      startDate: tomorrow.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    setFormData({
      name: event.name,
      location: event.location,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEventId) {
        // Update existing
        const existingEvent = events.find(ev => ev.id === editingEventId);
        if (existingEvent) {
            onUpdateEvent({
                ...existingEvent,
                name: formData.name,
                location: formData.location,
                startDate: formData.startDate,
                endDate: formData.endDate
            });
        }
    } else {
        // Create new
        const newEvent: Event = {
            id: `evt${Date.now()}`,
            name: formData.name,
            location: formData.location,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: 'UPCOMING',
            sessionsCount: 0,
            tablesCount: 0,
            privacyMode: 'STRICT',
            mainSession: { status: 'IDLE', duration: 0 },
            defaultAgenda: DEFAULT_AGENDA,
            branding: {
                primaryColor: '#6366f1' // Default Indigo
            },
            tracks: [],
            facilitators: [],
            sponsors: []
        };
        onCreateEvent(newEvent);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const formatDateRange = (start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      
      const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

      const isSameDay = s.toDateString() === e.toDateString();

      if (isSameDay) {
          return `${s.toLocaleDateString('en-US', dateOptions)} • ${s.toLocaleTimeString('en-US', timeOptions)} - ${e.toLocaleTimeString('en-US', timeOptions)}`;
      }
      return `${s.toLocaleDateString('en-US', dateOptions)} - ${e.toLocaleDateString('en-US', dateOptions)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Events</h1>
            <p className="text-slate-500">Manage sessions, facilitators, and monitor live intelligence.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all group relative"
            >
              {/* Edit Button (Visible on Hover) */}
              <button 
                onClick={(e) => handleOpenEdit(e, event)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Edit Details"
              >
                  <Edit2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                  event.status === 'LIVE' ? "bg-red-100 text-red-700 animate-pulse" :
                  event.status === 'UPCOMING' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                )}>
                  {event.status}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 pr-8 leading-snug">{event.name}</h3>
              
              <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">{formatDateRange(event.startDate, event.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{event.location || 'No location set'}</span>
                  </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Layout className="w-4 h-4 text-slate-400" />
                  <span>{event.sessionsCount} Sessions</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{event.tablesCount} Tables</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-900">{editingEventId ? 'Edit Event Details' : 'Create New Event'}</h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
                        <input 
                            type="text" 
                            required
                            autoFocus
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Q4 Global Summit"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <input 
                            type="text" 
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            placeholder="e.g. Convention Center, Hall B"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input 
                                type="datetime-local" 
                                required
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input 
                                type="datetime-local" 
                                required
                                value={formData.endDate}
                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                            {editingEventId ? 'Save Changes' : 'Create Event'}
                        </button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};