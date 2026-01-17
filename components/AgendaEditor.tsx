
import React from 'react';
import { AgendaItem } from '../types';
import { Plus, Trash2, GripVertical, Clock } from 'lucide-react';

interface AgendaEditorProps {
  agenda: AgendaItem[];
  onChange: (newAgenda: AgendaItem[]) => void;
  label?: string;
}

export const AgendaEditor: React.FC<AgendaEditorProps> = ({ agenda, onChange, label }) => {
  
  const handleAdd = () => {
    const newItem: AgendaItem = {
      id: `p${Date.now()}`,
      phase: 'New Phase',
      text: '',
      durationMinutes: 10
    };
    onChange([...agenda, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(agenda.filter(item => item.id !== id));
  };

  const handleChange = (id: string, field: keyof AgendaItem, value: any) => {
    onChange(agenda.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-4">
      {label && <h4 className="text-sm font-bold text-slate-700">{label}</h4>}
      
      <div className="space-y-3">
        {agenda.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-start group bg-white p-3 border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
            <div className="mt-3 text-slate-400 cursor-move">
              <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={item.phase}
                  onChange={(e) => handleChange(item.id, 'phase', e.target.value)}
                  placeholder="Phase Name (e.g. Intro)"
                  className="flex-1 px-2 py-1 text-sm font-bold border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="relative w-24">
                   <Clock className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                   <input 
                    type="number"
                    value={item.durationMinutes}
                    onChange={(e) => handleChange(item.id, 'durationMinutes', parseInt(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-right"
                   />
                   <span className="absolute right-6 top-1 text-xs text-slate-400 pointer-events-none">min</span>
                </div>
              </div>
              <textarea 
                value={item.text}
                onChange={(e) => handleChange(item.id, 'text', e.target.value)}
                placeholder="Facilitator prompt or question..."
                rows={2}
                className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <button 
              onClick={() => handleRemove(item.id)}
              className="mt-1 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button 
        type="button"
        onClick={handleAdd}
        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Agenda Phase
      </button>
    </div>
  );
};
