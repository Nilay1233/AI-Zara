import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  BrainCircuit,
  Save,
} from 'lucide-react';
import { UserDataStore } from '../../services/UserDataStore';

interface NotesAppProps {
  onAddNote: (note: string) => void;
}

export const NotesApp: React.FC<NotesAppProps> = ({ onAddNote }) => {
  const [userData, setUserData] = useState(() => UserDataStore.getUserData());
  const [newNote, setNewNote] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    UserDataStore.addMemoryNote(newNote.trim());
    onAddNote(newNote.trim());
    setUserData(UserDataStore.getUserData());
    setNewNote('');
  };

  const handleDelete = (index: number) => {
    UserDataStore.deleteMemoryNote(index);
    setUserData(UserDataStore.getUserData());
  };

  const handleCopyAll = () => {
    const text = userData.memoryNotes.join('\n• ');
    navigator.clipboard.writeText(`• ${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Zara Memory & Notes Bank</h4>
            <p className="text-[11px] text-slate-400">Personal facts and thoughts remembered by Zara</p>
          </div>
        </div>

        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy All'}</span>
        </button>
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note or fact for Zara to remember..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      <div className="mt-4 flex-1 flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Saved Memory Notes ({userData.memoryNotes.length})
        </span>

        {userData.memoryNotes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
            <BookOpen className="w-6 h-6 mb-2 opacity-50" />
            <span>No memory notes saved yet. Tell Zara "Remember that I like..."</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {userData.memoryNotes.map((note, idx) => (
              <div
                key={idx}
                className="group flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-200"
              >
                <span className="leading-relaxed flex-1">• {note}</span>
                <button
                  onClick={() => handleDelete(idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition-opacity cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
