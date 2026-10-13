import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Plus, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { UserDataStore } from '../../services/UserDataStore';
import { ScheduleItem } from '../../types/zara';

interface ScheduleAppProps {
  onScheduleUpdated: () => void;
}

export const ScheduleApp: React.FC<ScheduleAppProps> = ({ onScheduleUpdated }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => UserDataStore.getUserData().schedule);
  const [taskText, setTaskText] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    UserDataStore.addScheduleItem(taskText.trim(), taskTime.trim() || 'Today', priority);
    setSchedule(UserDataStore.getUserData().schedule);
    setTaskText('');
    setTaskTime('');
    onScheduleUpdated();
  };

  const handleToggle = (id: string) => {
    UserDataStore.toggleScheduleItem(id);
    setSchedule(UserDataStore.getUserData().schedule);
    onScheduleUpdated();
  };

  const handleDelete = (id: string) => {
    UserDataStore.deleteScheduleItem(id);
    setSchedule(UserDataStore.getUserData().schedule);
    onScheduleUpdated();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Daily Agenda & Tasks</h4>
            <p className="text-[11px] text-slate-400">Integrated with Zara's live schedule tools</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="New task description..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            value={taskTime}
            onChange={(e) => setTaskTime(e.target.value)}
            placeholder="Time (e.g. 3:00 PM)"
            className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400">Priority:</span>
            {(['high', 'normal', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-mono transition-all cursor-pointer ${
                  priority === p
                    ? p === 'high'
                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                      : p === 'normal'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!taskText.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      <div className="mt-4 flex-1 flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Agenda Items ({schedule.length})
        </span>

        {schedule.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
            <Calendar className="w-6 h-6 mb-2 opacity-50" />
            <span>No tasks scheduled. Say "Zara, add a meeting at 2 PM"</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {schedule.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                  item.completed
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => handleToggle(item.id)}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer"
                >
                  <button className="text-slate-400 hover:text-emerald-400 transition-colors">
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      {item.task}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.time && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {item.time}
                        </span>
                      )}
                      {item.priority === 'high' && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          HIGH
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer"
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
