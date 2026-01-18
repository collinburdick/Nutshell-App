
import React, { useState } from 'react';
import { Event, Track, Facilitator, Sponsor } from '../types';
import { Users, Palette, Radio, Tag, Plus, Trash2, Mail, Briefcase, X } from 'lucide-react';
import { clsx } from 'clsx';
import { api, notifyError } from '../services/api';
import { convertApiFacilitatorToFrontend, convertApiSponsorToFrontend, convertApiTrackToFrontend } from '../services/typeConverters';

interface SettingsViewProps {
  event: Event;
  onUpdateEvent: (event: Event) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ event, onUpdateEvent }) => {
  const [activeTab, setActiveTab] = useState<'BRANDING' | 'TRACKS' | 'FACILITATORS' | 'MAINSTAGE' | 'SPONSORS'>('BRANDING');
  
  // Local state for forms
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackColor, setNewTrackColor] = useState('#6366f1');
  const [newFacilitatorEmail, setNewFacilitatorEmail] = useState('');
  const [newFacilitatorName, setNewFacilitatorName] = useState('');

  // Sponsor Form State
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLogo, setNewSponsorLogo] = useState('');
  const [newSponsorKeywords, setNewSponsorKeywords] = useState('');

  const handleUpdateBranding = (field: string, value: string) => {
      onUpdateEvent({
          ...event,
          branding: { ...event.branding, [field]: value }
      });
  };

  const handleUpdateMainStage = (field: string, value: string) => {
      onUpdateEvent({
          ...event,
          mainSession: { ...event.mainSession, [field]: value }
      });
  };

  const handleTestStream = () => {
      if (!event.mainSession?.streamUrl) {
          notifyError('Stream URL missing', 'Add a stream URL before testing the main stage feed.');
          return;
      }
      window.open(event.mainSession.streamUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResetStream = () => {
      onUpdateEvent({
          ...event,
          mainSession: { ...event.mainSession, streamUrl: '' }
      });
  };

  const handleAddTrack = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTrackName.trim()) return;
      api.tracks.create(parseInt(event.id), {
          name: newTrackName,
          color: newTrackColor
      }).then(created => {
          const newTrack = convertApiTrackToFrontend(created);
          onUpdateEvent({
              ...event,
              tracks: [...(event.tracks || []), newTrack]
          });
          setNewTrackName('');
      }).catch(error => {
          notifyError('Failed to create track', error);
      });
  };

  const handleDeleteTrack = (id: string) => {
      api.tracks.delete(parseInt(id)).then(() => {
          onUpdateEvent({
              ...event,
              tracks: event.tracks.filter(t => t.id !== id)
          });
      }).catch(error => {
          notifyError('Failed to delete track', error);
      });
  };

  const handleInviteFacilitator = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFacilitatorEmail.trim() || !newFacilitatorName.trim()) return;
      api.facilitators.create(parseInt(event.id), {
          name: newFacilitatorName,
          email: newFacilitatorEmail,
          status: 'INVITED'
      }).then(created => {
          const newFacilitator = convertApiFacilitatorToFrontend(created);
          onUpdateEvent({
              ...event,
              facilitators: [...(event.facilitators || []), newFacilitator]
          });
          setNewFacilitatorName('');
          setNewFacilitatorEmail('');
      }).catch(error => {
          notifyError('Failed to invite facilitator', error);
      });
  };

  const handleAddSponsor = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSponsorName.trim()) return;
      api.sponsors.create(parseInt(event.id), {
          name: newSponsorName,
          logoUrl: newSponsorLogo,
          keywords: newSponsorKeywords.split(',').map(k => k.trim()).filter(k => k)
      }).then(created => {
          const newSponsor = convertApiSponsorToFrontend(created);
          onUpdateEvent({
              ...event,
              sponsors: [...(event.sponsors || []), newSponsor]
          });
          setNewSponsorName('');
          setNewSponsorLogo('');
          setNewSponsorKeywords('');
      }).catch(error => {
          notifyError('Failed to add sponsor', error);
      });
  };

  const handleDeleteSponsor = (id: string) => {
      if (window.confirm("Remove this sponsor?")) {
          api.sponsors.delete(parseInt(id)).then(() => {
              onUpdateEvent({
                  ...event,
                  sponsors: (event.sponsors || []).filter(s => s.id !== id)
              });
          }).catch(error => {
              notifyError('Failed to delete sponsor', error);
          });
      }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col items-center p-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Event Settings</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 space-y-2">
                    <button 
                        onClick={() => setActiveTab('BRANDING')}
                        className={clsx("w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", activeTab === 'BRANDING' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100")}
                    >
                        <Palette className="w-4 h-4" /> Branding
                    </button>
                    <button 
                        onClick={() => setActiveTab('TRACKS')}
                        className={clsx("w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", activeTab === 'TRACKS' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100")}
                    >
                        <Tag className="w-4 h-4" /> Tracks & Groups
                    </button>
                    <button 
                        onClick={() => setActiveTab('FACILITATORS')}
                        className={clsx("w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", activeTab === 'FACILITATORS' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100")}
                    >
                        <Users className="w-4 h-4" /> Facilitators
                    </button>
                    <button 
                        onClick={() => setActiveTab('SPONSORS')}
                        className={clsx("w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", activeTab === 'SPONSORS' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100")}
                    >
                        <Briefcase className="w-4 h-4" /> Sponsors
                    </button>
                    <button 
                        onClick={() => setActiveTab('MAINSTAGE')}
                        className={clsx("w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", activeTab === 'MAINSTAGE' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100")}
                    >
                        <Radio className="w-4 h-4" /> Main Stage
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8">
                    
                    {/* BRANDING */}
                    {activeTab === 'BRANDING' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Custom Branding</h2>
                            <p className="text-slate-500 text-sm">Customize the look and feel of the facilitator and attendee apps.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Brand Color</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="color" 
                                        value={event.branding?.primaryColor || '#6366f1'}
                                        onChange={(e) => handleUpdateBranding('primaryColor', e.target.value)}
                                        className="h-10 w-20 p-1 rounded border border-slate-200 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-500 uppercase">{event.branding?.primaryColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
                                <input 
                                    type="text" 
                                    value={event.branding?.logoUrl || ''}
                                    onChange={(e) => handleUpdateBranding('logoUrl', e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {event.branding?.logoUrl && (
                                    <div className="mt-2 p-2 border border-slate-200 rounded bg-slate-50 inline-block">
                                        <img src={event.branding.logoUrl} alt="Logo Preview" className="h-8 object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TRACKS */}
                    {activeTab === 'TRACKS' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Tracks & Groups</h2>
                            <p className="text-slate-500 text-sm">Organize tables into tracks (e.g. Sales, Product) for easier filtering and analysis.</p>
                            
                            <form onSubmit={handleAddTrack} className="flex gap-2 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Track Name</label>
                                    <input 
                                        type="text" 
                                        value={newTrackName}
                                        onChange={e => setNewTrackName(e.target.value)}
                                        placeholder="e.g. Engineering"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Color</label>
                                    <input 
                                        type="color" 
                                        value={newTrackColor}
                                        onChange={e => setNewTrackColor(e.target.value)}
                                        className="h-9 w-12 p-0.5 rounded border border-slate-300"
                                    />
                                </div>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add</button>
                            </form>

                            <div className="space-y-2">
                                {event.tracks?.map(track => (
                                    <div key={track.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: track.color }}></div>
                                            <span className="font-medium text-slate-800">{track.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteTrack(track.id)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!event.tracks || event.tracks.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        No tracks configured yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FACILITATORS */}
                    {activeTab === 'FACILITATORS' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Facilitator Management</h2>
                            <p className="text-slate-500 text-sm">Invite facilitators via email and track their status.</p>
                            
                            <form onSubmit={handleInviteFacilitator} className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={newFacilitatorName}
                                        onChange={e => setNewFacilitatorName(e.target.value)}
                                        placeholder="Jane Doe"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={newFacilitatorEmail}
                                        onChange={e => setNewFacilitatorEmail(e.target.value)}
                                        placeholder="jane@company.com"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <button type="submit" className="col-span-2 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4" /> Send Invite
                                </button>
                            </form>

                            <div className="space-y-2">
                                {event.facilitators?.map(fac => (
                                    <div key={fac.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div>
                                            <div className="font-bold text-slate-800">{fac.name}</div>
                                            <div className="text-xs text-slate-500">{fac.email}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                fac.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {fac.status}
                                            </span>
                                            {fac.assignedTableId && (
                                                 <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Table {fac.assignedTableId}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!event.facilitators || event.facilitators.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        No facilitators invited.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SPONSORS */}
                    {activeTab === 'SPONSORS' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Sponsor Management</h2>
                            <p className="text-slate-500 text-sm">Add sponsors and configure their brand tracking keywords for the Radar dashboard.</p>
                            
                            <form onSubmit={handleAddSponsor} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                                        <input 
                                            type="text" 
                                            value={newSponsorName}
                                            onChange={e => setNewSponsorName(e.target.value)}
                                            placeholder="Acme Corp"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={newSponsorLogo}
                                            onChange={e => setNewSponsorLogo(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tracking Keywords (Comma separated)</label>
                                    <input 
                                        type="text" 
                                        value={newSponsorKeywords}
                                        onChange={e => setNewSponsorKeywords(e.target.value)}
                                        placeholder="e.g. Cloud, Security, AI, Acme"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">These terms will be tracked in real-time across all sessions.</p>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Sponsor
                                </button>
                            </form>

                            <div className="space-y-3">
                                {event.sponsors?.map(sponsor => (
                                    <div key={sponsor.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                                {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-contain" /> : <Briefcase className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{sponsor.name}</h3>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {sponsor.keywords.map((k, i) => (
                                                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                                            {k}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSponsor(sponsor.id)}
                                            className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!event.sponsors || event.sponsors.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        No sponsors added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MAIN STAGE */}
                    {activeTab === 'MAINSTAGE' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Main Stage Config</h2>
                            <p className="text-slate-500 text-sm">Configure the live feed URL for the plenary session.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">HLS / RTMP Stream URL</label>
                                <input 
                                    type="text" 
                                    value={event.mainSession?.streamUrl || ''}
                                    onChange={(e) => handleUpdateMainStage('streamUrl', e.target.value)}
                                    placeholder="https://stream.mux.com/..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    Supported formats: .m3u8 (HLS) or RTMP ingestion points.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                                <Radio className="w-5 h-5 text-slate-500 mt-1" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Current Status</h4>
                                    <p className="text-sm text-slate-600 mb-2">
                                        The main stage is currently <strong>{event.mainSession?.status}</strong>.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={handleTestStream} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 font-medium">Test Stream</button>
                                        <button onClick={handleResetStream} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 font-medium">Reset Config</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
  );
};
