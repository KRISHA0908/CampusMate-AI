import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  GraduationCap, 
  BookOpen, 
  Volume2, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { AppState } from '../types.js';

interface DashboardProps {
  state: AppState;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, setActiveTab, onRefresh }) => {
  const { subjects, attendanceSummary, exams, timetable, studyPlan, tasks, campusUpdates, settings } = state;
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Filter today's college classes
  const todayClasses = timetable.filter((t) => t.dayOfWeek === todayDayName);

  // Filter today's study plan sessions
  const todaySessions = studyPlan?.sessions.filter((s) => s.date === todayDateStr) || [];

  // Sort upcoming exams
  const sortedExams = [...exams].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  const nextExam = sortedExams.find((e) => new Date(e.examDate) >= new Date()) || sortedExams[0];
  const daysUntilNextExam = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
    : null;

  // Urgent updates
  const urgentNotices = campusUpdates.filter((u) => u.actionRequired && !u.read).slice(0, 3);

  // Read aloud morning briefing
  const playMorningBriefing = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const text = `Good day, ${settings.studentName}! Here is your CampusMate AI Morning Briefing. Your overall attendance is ${attendanceSummary.overallPercentage} percent. ${
      attendanceSummary.atRiskSubjects.length > 0
        ? `Warning: ${attendanceSummary.atRiskSubjects.map((s) => s.subjectName).join(', ')} is currently below the target attendance requirement.`
        : 'All your subjects are within safe attendance thresholds.'
    } You have ${todayClasses.length} college classes today. Your next major exam is ${nextExam?.subjectName} in ${daysUntilNextExam} days. You have ${todaySessions.length} study sessions planned for today. Have a productive day!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.language || 'en-US';
    utterance.onstart = () => setIsPlayingBriefing(true);
    utterance.onend = () => setIsPlayingBriefing(false);
    utterance.onerror = () => setIsPlayingBriefing(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle task', e);
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Morning Briefing Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>CampusMate AI Daily Briefing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">{settings.studentName}</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Semester {settings.semester} • {settings.collegeName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={playMorningBriefing}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm flex items-center space-x-2 transition shadow-lg ${
                isPlayingBriefing
                  ? 'bg-indigo-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingBriefing ? 'Speaking Briefing...' : 'Listen to Morning Briefing'}</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition"
            >
              <span>Talk to Alexa Companion</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* At-Risk Warning Callout if any */}
        {attendanceSummary.atRiskSubjects.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-300">Attendance Risk Alert: </span>
                <span>
                  {attendanceSummary.atRiskSubjects.map((s) => `${s.subjectName} (${s.combined.percentage}%)`).join(', ')} is below your {settings.targetPercentage}% threshold!
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-semibold text-rose-400 hover:underline shrink-0"
            >
              Simulate Recovery &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat 1: Overall Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Status</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                attendanceSummary.isBelowTarget
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              Target: {settings.targetPercentage}%
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-extrabold text-white">
                {attendanceSummary.overallPercentage}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {attendanceSummary.totalAttended} attended of {attendanceSummary.totalConducted} classes
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Theory: {attendanceSummary.theoryPercentage}%</p>
              <p className="text-xs text-slate-400">Labs: {attendanceSummary.labPercentage}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendanceSummary.overallPercentage >= settings.targetPercentage + 5
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : attendanceSummary.overallPercentage >= settings.targetPercentage
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}
              style={{ width: `${Math.min(100, attendanceSummary.overallPercentage)}%` }}
            ></div>
          </div>
        </div>

        {/* Stat 2: Next Upcoming Exam */}
        <div
          onClick={() => setActiveTab('planner')}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Exam</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              {daysUntilNextExam !== null ? `In ${daysUntilNextExam} Days` : 'Scheduled'}
            </span>
          </div>

          {nextExam ? (
            <div className="mt-3">
              <p className="text-lg font-bold text-white truncate group-hover:text-cyan-400 transition">
                {nextExam.subjectName}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{nextExam.examDate} • {nextExam.startTime} ({nextExam.room || 'Exam Hall'})</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Total Exams: {exams.length}</span>
                <span className="text-indigo-400 font-medium">View Countdown &rarr;</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-4">No upcoming exams entered.</p>
          )}
        </div>

        {/* Stat 3: Study Plan & Goals */}
        <div
          onClick={() => setActiveTab('planner')}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Study Sprint</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
              {todaySessions.filter((s) => s.completed).length} / {todaySessions.length} Done
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              {studyPlan?.title || 'Exam Master Plan'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {settings.studyHoursPerDay} hrs available today • Sleep protected ({settings.sleepTime})
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>{studyPlan?.sessions.length || 0} Total Sessions</span>
              <span className="text-blue-400 font-medium">Open Planner &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Today's Schedule + Tasks & Urgent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's College Timetable & Study Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's College Schedule */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Today's College Classes ({todayDayName})</h2>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Full Week &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayClasses.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/40 text-center text-xs text-slate-400">
                  No lectures or labs scheduled for today ({todayDayName}). Great time for revision!
                </div>
              ) : (
                todayClasses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 text-center">
                        <span className="text-xs font-bold text-cyan-400 block">{c.startTime}</span>
                        <span className="text-[10px] text-slate-400">{c.endTime}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-700"></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{c.subjectName}</p>
                        <p className="text-xs text-slate-400">{c.room} • {c.durationMinutes} mins</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.type === 'lab'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Study Planner Sessions */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white">Today's Scheduled Study Sessions</h2>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs text-blue-400 hover:underline font-medium"
              >
                View 5-Day Plan &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {todaySessions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/40 text-center text-xs text-slate-400">
                  No study sessions scheduled for today. You can generate a 5-day exam plan in the Study Planner tab.
                </div>
              ) : (
                todaySessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      sess.completed
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-60'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={sess.completed}
                        onChange={() => handleToggleSession(sess.id, sess.completed)}
                        className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`text-xs font-semibold ${sess.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {sess.subjectName}: {sess.topicName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sess.startTime} - {sess.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        sess.type === 'break'
                          ? 'bg-emerald-950 text-emerald-300'
                          : sess.type === 'practice'
                          ? 'bg-amber-950 text-amber-300'
                          : sess.type === 'mock_test'
                          ? 'bg-purple-950 text-purple-300'
                          : 'bg-blue-950 text-blue-300'
                      }`}
                    >
                      {sess.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Priority Tasks & Campus Notices */}
        <div className="space-y-6">
          {/* Action Tasks */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Pending Tasks</h2>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                All Tasks &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {tasks.filter((t) => !t.completed).slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                      <span>Due: {task.dueDate}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span className={`capitalize ${task.priority === 'high' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Campus Notices */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">Campus Updates</h2>
              </div>
              <button
                onClick={() => setActiveTab('updates')}
                className="text-xs text-amber-400 hover:underline font-medium"
              >
                Inbox &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {urgentNotices.map((upd) => (
                <div
                  key={upd.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide">
                      {upd.source}
                    </span>
                    {upd.deadline && (
                      <span className="text-[10px] text-amber-300 font-mono">
                        Due {upd.deadline}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-200 mt-1 line-clamp-2">
                    {upd.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
