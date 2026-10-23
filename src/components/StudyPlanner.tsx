import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  ChevronRight, 
  Zap, 
  Flame, 
  Award, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { AppState, StudySession } from '../types.js';

interface StudyPlannerProps {
  state: AppState;
  onRefresh: () => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ state, onRefresh }) => {
  const { subjects, exams, syllabus, studyPlan, settings } = state;

  const [totalDays, setTotalDays] = useState<number>(studyPlan?.totalDays || 5);
  const [dailyHours, setDailyHours] = useState<number>(settings.studyHoursPerDay || 5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDateTab, setActiveDateTab] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [rescheduleMessage, setRescheduleMessage] = useState<string | null>(null);

  // Group sessions by date
  const uniqueDates = Array.from(new Set(studyPlan?.sessions.map((s) => s.date) || [])).sort();

  // Default active tab to today or first date
  const todayStr = new Date().toISOString().split('T')[0];
  const currentDateTab = activeDateTab || (uniqueDates.includes(todayStr) ? todayStr : uniqueDates[0] || todayStr);

  const filteredSessions = studyPlan?.sessions.filter((s) => s.date === currentDateTab) || [];

  // Syllabus completion metrics
  const totalSyllabusTopics = syllabus.length;
  const completedTopics = syllabus.filter((s) => s.completed).length;
  const overallSyllabusPct = totalSyllabusTopics === 0 ? 0 : Math.round((completedTopics / totalSyllabusTopics) * 100);

  // Toggle syllabus topic completion
  const handleToggleSyllabus = async (id: string) => {
    try {
      await fetch(`/api/syllabus/${id}/toggle`, { method: 'PUT' });
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle syllabus topic', e);
    }
  };

  // Toggle study plan session
  const handleToggleSession = async (sessionId: string, currentCompleted: boolean) => {
    try {
      await fetch(`/api/study-planner/session/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle session', e);
    }
  };

  // Generate Intelligent Plan
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setRescheduleMessage(null);
    try {
      const res = await fetch('/api/study-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalDays: Number(totalDays),
          availableHoursPerDay: Number(dailyHours),
        }),
      });
      await res.json();
      setIsGenerating(false);
      onRefresh();
    } catch (e) {
      console.error('Failed to generate study plan', e);
      setIsGenerating(false);
    }
  };

  // Reschedule Incomplete Tasks
  const handleReschedule = async () => {
    try {
      const res = await fetch('/api/study-planner/reschedule', { method: 'POST' });
      const data = await res.json();
      setRescheduleMessage(
        data.rescheduledCount > 0
          ? `Successfully redistributed ${data.rescheduledCount} overdue session(s) into future available slots without cramming.`
          : 'All past sessions are already completed! Your schedule is fully up to date.'
      );
      onRefresh();
    } catch (e) {
      console.error('Failed to reschedule', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Planner Header & Exam Countdown Grid */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Personalized AI Study Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Intelligent Exam Preparation Planner
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Conflict-free schedules tailored around your college timetable, sleep hours, and syllabus difficulty.
            </p>
          </div>

          {/* Quick Reschedule & Re-balance Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReschedule}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center space-x-2 transition shadow-md"
              title="Recalculate remaining plan when a task was missed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reschedule Incomplete</span>
            </button>
          </div>
        </div>

        {/* Reschedule Message Banner */}
        {rescheduleMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
            <span>{rescheduleMessage}</span>
            <button onClick={() => setRescheduleMessage(null)} className="text-xs text-amber-400 font-bold ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* 6 Subjects Upcoming Exams Countdown Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Upcoming Exam Schedule Countdown
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {exams.map((ex) => {
              const daysLeft = Math.ceil((new Date(ex.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return (
                <div
                  key={ex.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center"
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-400 block">{ex.subjectCode}</span>
                  <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{ex.subjectName}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{ex.examDate}</p>
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      daysLeft <= 5
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}
                  >
                    {daysLeft > 0 ? `${daysLeft} Days Left` : 'Exam Today!'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PLAN GENERATOR CONFIGURATION BAR */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Days Before Exam
              </label>
              <select
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value={3}>3-Day Crash Sprint</option>
                <option value={5}>5-Day Standard Plan (Recommended)</option>
                <option value={7}>7-Day Deep Master Plan</option>
                <option value={10}>10-Day Comprehensive Sprint</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Daily Study Hours Available
              </label>
              <select
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value={4}>4 Hours / Day</option>
                <option value={5}>5 Hours / Day (Default)</option>
                <option value={6}>6 Hours / Day</option>
                <option value={8}>8 Hours / Day (Intensive)</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 pt-3">
              Protected Sleep: <strong className="text-slate-200">{settings.sleepTime} - {settings.wakeTime}</strong>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'AI Generating Plan...' : 'Generate Adaptive Exam Plan'}</span>
          </button>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: DAY-BY-DAY SCHEDULE vs MULTI-SUBJECT SYLLABUS TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: DAY-BY-DAY SESSIONS (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Daily Timetable & Study Sessions</h2>
              </div>
              <span className="text-xs text-slate-400">
                {studyPlan?.sessions.filter((s) => s.completed).length || 0} / {studyPlan?.sessions.length || 0} Sessions Finished
              </span>
            </div>

            {/* Date Tabs */}
            <div className="flex overflow-x-auto space-x-2 py-3 border-b border-slate-800/60 no-scrollbar">
              {uniqueDates.map((d, index) => {
                const isSelected = d === currentDateTab;
                const isToday = d === todayStr;
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDateTab(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    <span>Day {index + 1} {isToday ? '(Today)' : ''}</span>
                    <span className="block text-[10px] text-slate-400">{d}</span>
                  </button>
                );
              })}
            </div>

            {/* Sessions on Current Date */}
            <div className="mt-4 space-y-3">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No sessions for this date. Click "Generate Adaptive Exam Plan" to populate.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isBreak = session.type === 'break';
                  return (
                    <div
                      key={session.id}
                      className={`p-3.5 rounded-xl border transition ${
                        session.completed
                          ? 'bg-slate-900/60 border-slate-800/80 opacity-60'
                          : isBreak
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : 'bg-slate-800/70 border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={session.completed}
                            onChange={() => handleToggleSession(session.id, session.completed)}
                            className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                          />
                          <div>
                            <span className="text-[11px] font-mono font-bold text-cyan-400 block">
                              {session.startTime} - {session.endTime}
                            </span>
                            <p className={`text-sm font-semibold mt-0.5 ${session.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                              {session.subjectName}: {session.topicName}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isBreak
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : session.type === 'practice'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : session.type === 'mock_test'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {session.type}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MULTI-SUBJECT SYLLABUS TRACKER (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Syllabus Completion Tracker</h2>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {overallSyllabusPct}% Completed
              </span>
            </div>

            {/* Overall Syllabus Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${overallSyllabusPct}%` }}
              ></div>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex overflow-x-auto space-x-1.5 py-3 border-b border-slate-800/60 no-scrollbar">
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                All Subjects ({syllabus.length})
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                    selectedSubjectFilter === sub.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.code}
                </button>
              ))}
            </div>

            {/* Syllabus Chapters List */}
            <div className="mt-3 space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {syllabus
                .filter((topic) => selectedSubjectFilter === 'all' || topic.subjectId === selectedSubjectFilter)
                .map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleToggleSyllabus(topic.id)}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      topic.completed
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                        : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={topic.completed}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">
                          {topic.subjectName} • Ch {topic.chapterNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            topic.difficulty === 'hard'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : topic.difficulty === 'medium'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {topic.difficulty} (~{topic.estimatedHours}h)
                        </span>
                      </div>
                      <p className={`text-xs font-semibold mt-1 leading-snug ${topic.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {topic.topicName}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
