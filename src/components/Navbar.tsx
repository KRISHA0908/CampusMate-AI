import React, { useState } from 'react';
import { Bot, Bell, Award, Sparkles, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Reminder } from '../types.js';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  studentName: string;
  semester: number;
  reminders: Reminder[];
  onResetDemo: () => void;
  isDemoMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentName,
  semester,
  reminders,
  onResetDemo,
  isDemoMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const activeReminders = reminders.filter((r) => !r.completed);

  const navItems = [
    { id: 'voice', label: 'Talk to AI', icon: Bot, highlight: true },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'planner', label: 'Study Planner' },
    { id: 'tasks', label: 'Tasks & Reminders' },
    { id: 'updates', label: 'Campus Updates' },
    { id: 'mcp', label: 'MCP & Hackathon', badge: 'Alexa+' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  CampusMate AI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Alexa+ 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Your Intelligent Campus & Study Companion
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${item.highlight ? 'ring-1 ring-cyan-500/40 text-cyan-200' : ''}`}
                >
                  {item.icon && <item.icon className="w-4 h-4 text-cyan-400" />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Side: Notifications & Profile */}
          <div className="flex items-center space-x-3">
            {/* Demo Mode / Reset Button */}
            <button
              onClick={onResetDemo}
              title="Reset Demo Data"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Demo Mode' : 'Reset'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {activeReminders.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-sm font-semibold text-slate-200">Active Reminders & Alerts</span>
                    <span className="text-xs text-cyan-400 font-medium">{activeReminders.length} active</span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {activeReminders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No pending reminders right now.</p>
                    ) : (
                      activeReminders.map((rem) => (
                        <div
                          key={rem.id}
                          className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start space-x-2.5"
                        >
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-cyan-400 shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{rem.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{rem.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('tasks');
                      }}
                      className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1"
                    >
                      Manage All Reminders &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Student Avatar Tag */}
            <div
              onClick={() => setActiveTab('settings')}
              className="flex items-center space-x-2.5 pl-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                {studentName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition leading-tight">
                  {studentName}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">Sem {semester} CS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Navigation */}
        <div className="md:hidden flex overflow-x-auto py-2.5 space-x-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                activeTab === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
