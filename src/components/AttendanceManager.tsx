import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Calendar, 
  TrendingUp,
  Percent,
  Calculator,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppState, Subject } from '../types.js';

interface AttendanceManagerProps {
  state: AppState;
  onRefresh: () => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ state, onRefresh }) => {
  const { subjects, attendanceSummary, timetable, settings } = state;

  // Simulator State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [missTheoryCount, setMissTheoryCount] = useState<number>(1);
  const [missLabCount, setMissLabCount] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // New Subject Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubTarget, setNewSubTarget] = useState(75);
  const [newTheoryAttended, setNewTheoryAttended] = useState(20);
  const [newTheoryTotal, setNewTheoryTotal] = useState(25);
  const [newLabAttended, setNewLabAttended] = useState(8);
  const [newLabTotal, setNewLabTotal] = useState(10);
  const [newCredits, setNewCredits] = useState(4);

  // Target Threshold in settings
  const [targetPct, setTargetPct] = useState(settings.targetPercentage || 75);

  // Run simulation
  const handleRunSimulation = async () => {
    if (!selectedSubjectId) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/attendance/bunk-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          missTheoryCount,
          missLabCount,
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
      setIsSimulating(false);
    } catch (e) {
      console.error('Simulation error', e);
      setIsSimulating(false);
    }
  };

  // Quick mark attendance
  const handleQuickMark = async (subjectId: string, type: 'theory' | 'lab', status: 'attended' | 'missed') => {
    try {
      await fetch('/api/attendance/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          date: new Date().toISOString().split('T')[0],
          type,
          status,
          remarks: `Quick marked from Attendance Manager`,
        }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to mark attendance', e);
    }
  };

  // Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;

    try {
      await fetch('/api/attendance/subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubName.trim(),
          code: newSubCode.trim(),
          targetPercentage: Number(newSubTarget),
          theoryAttended: Number(newTheoryAttended),
          theoryTotal: Number(newTheoryTotal),
          labAttended: Number(newLabAttended),
          labTotal: Number(newLabTotal),
          credits: Number(newCredits),
        }),
      });
      setShowAddModal(false);
      setNewSubName('');
      setNewSubCode('');
      onRefresh();
    } catch (e) {
      console.error('Failed to add subject', e);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (id: string) => {
    try {
      await fetch(`/api/attendance/subject/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error('Failed to delete subject', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Banner & Attendance Health */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>College Attendance & Bunk Margin Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Student Attendance Manager
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Exact mathematical calculations separating Theory lectures & Practical labs with What-If-I-Bunk simulation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Global Attendance Health Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase">Overall Attendance</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white mt-1">
              {attendanceSummary.overallPercentage}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {attendanceSummary.totalAttended} / {attendanceSummary.totalConducted} classes
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase">Theory Lectures</p>
            <p className="text-2xl md:text-3xl font-extrabold text-cyan-400 mt-1">
              {attendanceSummary.theoryPercentage}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Classroom lectures</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase">Practical Labs</p>
            <p className="text-2xl md:text-3xl font-extrabold text-purple-400 mt-1">
              {attendanceSummary.labPercentage}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hands-on laboratory</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase">Attendance Risk</p>
            <p className={`text-2xl md:text-3xl font-extrabold mt-1 ${attendanceSummary.atRiskSubjects.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {attendanceSummary.atRiskSubjects.length} At Risk
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {attendanceSummary.warningSubjects.length} near threshold (75-80%)
            </p>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: "WHAT IF I BUNK?" SIMULATOR */}
      <div className="rounded-3xl bg-slate-900 border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center space-x-2">
                <span>"What If I Bunk?" Simulator</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                  Precise Math Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate attendance impact before skipping tomorrow's lecture or lab.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Simulator Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Select Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Miss Theory Lectures
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMissTheoryCount(Math.max(0, missTheoryCount - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-white">
                    {missTheoryCount}
                  </span>
                  <button
                    onClick={() => setMissTheoryCount(missTheoryCount + 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Miss Practical Labs
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMissLabCount(Math.max(0, missLabCount - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-white">
                    {missLabCount}
                  </span>
                  <button
                    onClick={() => setMissLabCount(missLabCount + 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              {isSimulating ? 'Calculating Impact...' : 'Simulate Attendance Impact'}
            </button>
          </div>

          {/* Simulator Output (7 cols) */}
          <div className="lg:col-span-7">
            {simulationResult ? (
              <div className="h-full rounded-2xl bg-slate-800/70 border border-slate-700/80 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <div>
                      <p className="text-xs text-cyan-400 font-semibold uppercase">Prediction Result</p>
                      <h3 className="text-base font-bold text-white">
                        {simulationResult.subjectName} ({simulationResult.subjectCode})
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        simulationResult.isBelowTarget
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {simulationResult.newStatus.toUpperCase()} ({simulationResult.targetPercentage}% Required)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-4">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <p className="text-[11px] text-slate-400">Current</p>
                      <p className="text-xl font-extrabold text-slate-200">
                        {simulationResult.currentPercentage}%
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <p className="text-[11px] text-slate-400">Predicted</p>
                      <p className={`text-xl font-extrabold ${simulationResult.isBelowTarget ? 'text-rose-400' : 'text-cyan-300'}`}>
                        {simulationResult.predictedPercentage}%
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <p className="text-[11px] text-slate-400">Drop</p>
                      <p className="text-xl font-extrabold text-amber-400">
                        -{simulationResult.percentageDrop}%
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-200 leading-relaxed">
                    <p className="font-semibold text-cyan-300 mb-1">Mathematical Breakdown:</p>
                    <p>{simulationResult.explanation}</p>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                      <span>Theory: {simulationResult.theoryDetails.current}% &rarr; {simulationResult.theoryDetails.predicted}%</span>
                      <span>Lab: {simulationResult.labDetails.current}% &rarr; {simulationResult.labDetails.predicted}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-3 text-right">
                  * Predictions depend on current college records and scheduled attendance weights.
                </p>
              </div>
            ) : (
              <div className="h-full rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 p-6 flex flex-col items-center justify-center text-center">
                <HelpCircle className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Ready to simulate?</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Select a subject and the number of lectures/labs you plan to miss. The engine will calculate your post-bunk percentage instantly!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUBJECTS ATTENDANCE CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Subject-wise Attendance Breakdown</h2>
          <span className="text-xs text-slate-400">{subjects.length} Enrolled Courses</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {attendanceSummary.subjectStats.map((subStat) => {
            const rawSub = subjects.find((s) => s.id === subStat.subjectId);
            const isCritical = subStat.status === 'critical';
            const isWarning = subStat.status === 'warning';

            return (
              <div
                key={subStat.subjectId}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between shadow-lg transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 font-mono">
                        {subStat.subjectCode}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                        {subStat.subjectName}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {subStat.status}
                    </span>
                  </div>

                  {/* Attendance Percentage & Conducted */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-white">
                        {subStat.combined.percentage}%
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">
                        ({subStat.combined.attended}/{subStat.combined.total})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Target: {subStat.targetPercentage}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCritical
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, subStat.combined.percentage)}%` }}
                    ></div>
                  </div>

                  {/* Separate Theory & Lab metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Theory Lecture</p>
                      <p className="font-bold text-slate-200 mt-0.5">
                        {subStat.theory.percentage}% <span className="text-[10px] font-normal text-slate-400">({subStat.theory.attended}/{subStat.theory.total})</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Practical Lab</p>
                      <p className="font-bold text-slate-200 mt-0.5">
                        {subStat.lab.total === 0 ? 'N/A' : `${subStat.lab.percentage}% `}
                        {subStat.lab.total > 0 && <span className="text-[10px] font-normal text-slate-400">({subStat.lab.attended}/{subStat.lab.total})</span>}
                      </p>
                    </div>
                  </div>

                  {/* Safe Bunk Margin OR Needed Classes Callout */}
                  <div className="mt-3">
                    {subStat.classesNeededToTarget > 0 ? (
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Must attend next <strong className="font-bold text-rose-200">{subStat.classesNeededToTarget}</strong> classes to hit {subStat.targetPercentage}%!
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Can safely bunk <strong className="font-bold text-emerald-200">{subStat.safeBunkCount}</strong> lecture(s) without dropping below {subStat.targetPercentage}%.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleQuickMark(subStat.subjectId, 'theory', 'attended')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700"
                      title="Mark Today's Lecture Attended (+1)"
                    >
                      + Attended
                    </button>
                    <button
                      onClick={() => handleQuickMark(subStat.subjectId, 'theory', 'missed')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold border border-slate-700"
                      title="Mark Today's Lecture Missed"
                    >
                      + Missed
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteSubject(subStat.subjectId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEEKLY COLLEGE TIMETABLE VIEW */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Weekly Class & Lab Timetable</h2>
          </div>
          <span className="text-xs text-slate-400">Total {timetable.length} Slots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
            const daySlots = timetable.filter((t) => t.dayOfWeek === day);
            return (
              <div key={day} className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3">
                <p className="text-xs font-bold text-cyan-300 uppercase pb-2 border-b border-slate-700/60">
                  {day}
                </p>
                <div className="space-y-2 mt-2">
                  {daySlots.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2">No classes</p>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs"
                      >
                        <span className="text-[10px] font-mono text-cyan-400 block">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <p className="font-semibold text-slate-200 mt-0.5 line-clamp-1">
                          {slot.subjectName}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{slot.room}</span>
                          <span className="uppercase font-bold text-[9px] text-slate-300 px-1 py-0.2 rounded bg-slate-700">
                            {slot.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD SUBJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add College Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Distributed Computing"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="e.g. CS607"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target %</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newSubTarget}
                    onChange={(e) => setNewSubTarget(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Theory Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={newTheoryAttended}
                    onChange={(e) => setNewTheoryAttended(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Theory Conducted</label>
                  <input
                    type="number"
                    min="0"
                    value={newTheoryTotal}
                    onChange={(e) => setNewTheoryTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Lab Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={newLabAttended}
                    onChange={(e) => setNewLabAttended(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Lab Conducted</label>
                  <input
                    type="number"
                    min="0"
                    value={newLabTotal}
                    onChange={(e) => setNewLabTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
