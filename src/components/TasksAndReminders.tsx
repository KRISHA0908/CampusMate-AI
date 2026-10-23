import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle, 
  RotateCcw, 
  Calendar, 
  Filter,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { AppState, Reminder, Task } from '../types.js';

interface TasksAndRemindersProps {
  state: AppState;
  onRefresh: () => void;
}

export const TasksAndReminders: React.FC<TasksAndRemindersProps> = ({ state, onRefresh }) => {
  const { tasks, reminders, subjects } = state;

  // Browser notification state
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // New Reminder Form State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('');
  const [remType, setRemType] = useState<'study' | 'assignment' | 'exam' | 'lab' | 'attendance' | 'general'>('study');

  // New Task Form State
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('high');

  // Filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('CampusMate AI Notifications Enabled', {
          body: 'You will receive reminders for exams, study sessions, and college deadlines.',
        });
      }
    }
  };

  // Add Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remTime.trim()) return;

    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: remTitle.trim(),
          time: remTime,
          type: remType,
        }),
      });
      setShowAddReminder(false);
      setRemTitle('');
      setRemTime('');
      onRefresh();
    } catch (e) {
      console.error('Failed to add reminder', e);
    }
  };

  // Snooze Reminder
  const handleSnooze = async (id: string, minutes: number) => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutes);
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSnoozed: true,
          snoozedUntil: target.toISOString(),
        }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to snooze reminder', e);
    }
  };

  // Toggle Reminder Complete
  const handleToggleReminder = async (id: string, currentCompleted: boolean) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle reminder', e);
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error('Failed to delete reminder', e);
    }
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          subjectId: taskSubjectId || undefined,
          dueDate: taskDueDate,
          priority: taskPriority,
          source: 'manual',
        }),
      });
      setShowAddTask(false);
      setTaskTitle('');
      setTaskDesc('');
      onRefresh();
    } catch (e) {
      console.error('Failed to add task', e);
    }
  };

  // Toggle Task Complete
  const handleToggleTask = async (id: string, currentCompleted: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle task', e);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Persistent Reminders & Action Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Tasks & Reminders
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Track assignments, study sessions, and deadlines with in-app & browser notification alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 flex items-center space-x-2 transition"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Browser Notifications</span>
              </button>
            )}

            <button
              onClick={() => setShowAddReminder(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Reminder</span>
            </button>

            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Browser Notification Status Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${notificationPermission === 'granted' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>
              Browser Notifications: <strong className="text-slate-200 capitalize">{notificationPermission}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            * Persistent in database; browser alerts fire while tab is active or in background.
          </span>
        </div>
      </div>

      {/* TWO COLUMNS: ACTIVE REMINDERS (5 cols) vs TASKS MANAGER (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: PERSISTENT REMINDERS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Scheduled Reminders</h2>
              </div>
              <span className="text-xs text-cyan-400 font-bold">
                {reminders.filter((r) => !r.completed).length} Pending
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {reminders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No reminders created yet. Add one above or tell Alexa ("Remind me to revise Python at 7 PM").
                </div>
              ) : (
                reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border transition ${
                      rem.completed
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-60'
                        : 'bg-slate-800/70 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={rem.completed}
                          onChange={() => handleToggleReminder(rem.id, rem.completed)}
                          className="w-4 h-4 mt-1 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <div>
                          <p className={`text-sm font-semibold ${rem.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {rem.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{rem.time}</span>
                            {rem.isSnoozed && (
                              <span className="text-amber-400 font-medium">(Snoozed)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSnooze(rem.id, 15)}
                          className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-700 text-[10px] font-semibold transition"
                          title="Snooze 15 minutes"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700 transition"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: TASKS MANAGER */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Student Tasks & Deadlines</h2>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                {(['active', 'completed', 'all'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      taskFilter === filter
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tasks matching the selected filter.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition ${
                      task.completed
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-60'
                        : 'bg-slate-800/70 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id, task.completed)}
                          className="w-4 h-4 mt-1 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <div>
                          <p className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-cyan-400" />
                              <span>Due: {task.dueDate}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                task.priority === 'high'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="font-mono text-slate-400">
                              Via: {task.source.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700 transition"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE REMINDER MODAL */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Reminder</h3>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Revise Python algorithms tomorrow at 7 PM"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Time / Date</label>
                <input
                  type="datetime-local"
                  required
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={remType}
                  onChange={(e) => setRemType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="study">Study Session</option>
                  <option value="assignment">Assignment Due Date</option>
                  <option value="exam">Exam Day</option>
                  <option value="lab">Lab Submission</option>
                  <option value="attendance">Attendance Check</option>
                  <option value="general">General Reminder</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddReminder(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showAddTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Student Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Finish Operating Systems Assignment 3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Problem statements 1 to 5 with kernel tracing..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
