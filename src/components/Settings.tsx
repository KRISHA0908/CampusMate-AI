import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Target, 
  Moon, 
  Clock, 
  Globe, 
  RefreshCw, 
  Trash2, 
  CheckCircle2 
} from 'lucide-react';
import { UserSettings } from '../types.js';

interface SettingsProps {
  settings: UserSettings;
  onRefresh: () => void;
  onResetDemo: () => void;
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onRefresh,
  onResetDemo,
  onClearData,
}) => {
  const [studentName, setStudentName] = useState(settings.studentName);
  const [collegeName, setCollegeName] = useState(settings.collegeName);
  const [semester, setSemester] = useState(settings.semester);
  const [targetPercentage, setTargetPercentage] = useState(settings.targetPercentage);
  const [language, setLanguage] = useState(settings.language);
  const [wakeTime, setWakeTime] = useState(settings.wakeTime);
  const [sleepTime, setSleepTime] = useState(settings.sleepTime);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(settings.studyHoursPerDay);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          collegeName,
          semester: Number(semester),
          targetPercentage: Number(targetPercentage),
          language,
          wakeTime,
          sleepTime,
          studyHoursPerDay: Number(studyHoursPerDay),
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefresh();
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4 text-cyan-400" />
          <span>Student Preferences & Targets</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Application Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure your attendance threshold, college details, sleep schedule, and voice assistant settings.
        </p>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Section 1: Academic Profile */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Academic Profile</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Current Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  College / Institute Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Attendance Threshold */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Attendance Target</span>
            </h2>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Minimum Attendance Requirement
                </label>
                <span className="text-base font-extrabold text-cyan-400 font-mono">
                  {targetPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="90"
                step="5"
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standard university criteria is 75%. Safe Bunk margins and At-Risk alerts calculate against this value.
              </p>
            </div>
          </div>

          {/* Section 3: Daily Study & Sleep Protection */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Sleep & Study Hours</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Bedtime (Sleep)
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Target Daily Study
                </label>
                <select
                  value={studyHoursPerDay}
                  onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={5}>5 Hours (Recommended)</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Voice Language */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Voice Assistant Language</span>
            </h2>

            <div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="en-US">English (US / Global / Indian Accents)</option>
                <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Demo Mode / Reset Controls */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Reset & Demo Mode Controls</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset to default college student demo data or clear all records for a clean slate.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onResetDemo}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={onClearData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 flex items-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Student Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
