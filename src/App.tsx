import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { VoiceAssistant } from './components/VoiceAssistant.js';
import { Dashboard } from './components/Dashboard.js';
import { AttendanceManager } from './components/AttendanceManager.js';
import { StudyPlanner } from './components/StudyPlanner.js';
import { TasksAndReminders } from './components/TasksAndReminders.js';
import { CampusUpdates } from './components/CampusUpdates.js';
import { McpInspector } from './components/McpInspector.js';
import { Settings } from './components/Settings.js';
import { AppState } from './types.js';
import { Bot, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setState(data);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load application state:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-seed', { method: 'POST' });
      fetchState();
    } catch (e) {
      console.error('Failed to reset demo data', e);
    }
  };

  const handleClearData = async () => {
    try {
      await fetch('/api/clear-data', { method: 'POST' });
      fetchState();
    } catch (e) {
      console.error('Failed to clear data', e);
    }
  };

  const handleLanguageChange = async (lang: 'en-US' | 'hi-IN' | 'gu-IN') => {
    if (!state) return;
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
      fetchState();
    } catch (e) {
      console.error('Failed to update language', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/20 animate-pulse">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">CampusMate AI</h2>
          <p className="text-xs text-slate-400 mt-1">Initializing intelligent student companion & MCP server...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Failed to connect to CampusMate API</h2>
          <p className="text-xs text-slate-400">{error || 'Server did not respond.'}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchState();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center space-x-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentName={state.settings.studentName}
        semester={state.settings.semester}
        reminders={state.reminders}
        onResetDemo={handleResetDemo}
        isDemoMode={state.settings.isDemoMode}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'voice' && (
          <VoiceAssistant
            onStateUpdate={fetchState}
            language={state.settings.language}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            setActiveTab={setActiveTab}
            onRefresh={fetchState}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManager
            state={state}
            onRefresh={fetchState}
          />
        )}

        {activeTab === 'planner' && (
          <StudyPlanner
            state={state}
            onRefresh={fetchState}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksAndReminders
            state={state}
            onRefresh={fetchState}
          />
        )}

        {activeTab === 'updates' && (
          <CampusUpdates
            state={state}
            onRefresh={fetchState}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'mcp' && (
          <McpInspector />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={state.settings}
            onRefresh={fetchState}
            onResetDemo={handleResetDemo}
            onClearData={handleClearData}
          />
        )}
      </main>

      {/* Floating Alexa Companion Quick Button (visible on all tabs except 'voice') */}
      {activeTab !== 'voice' && (
        <button
          onClick={() => setActiveTab('voice')}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition flex items-center space-x-2 border border-cyan-400/30 group cursor-pointer"
          title="Talk to Alexa Companion"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
            Talk to AI
          </span>
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            CampusMate AI — Built for the Amazon Alexa+ Developer Hackathon 2026.
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            MCP Protocol: 2025-11-25 • Streamable HTTP
          </p>
        </div>
      </footer>
    </div>
  );
}
