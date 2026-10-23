import { GoogleGenAI } from '@google/genai';
import { db, StudyPlan, StudySession } from './db.js';

interface GeneratePlanOptions {
  totalDays?: number;
  availableHoursPerDay?: number;
  startDate?: string; // YYYY-MM-DD
  userGoal?: string;
  focusSubjectId?: string;
}

export async function generateIntelligentStudyPlan(options: GeneratePlanOptions = {}): Promise<StudyPlan> {
  const subjects = db.getSubjects();
  const exams = db.getExams();
  const syllabus = db.getSyllabus();
  const timetable = db.getTimetable();
  const settings = db.getSettings();

  const totalDays = options.totalDays || 5;
  const availableHours = options.availableHoursPerDay || settings.studyHoursPerDay || 5;
  const startDateStr = options.startDate || new Date().toISOString().split('T')[0];
  const startDate = new Date(startDateStr);

  // Group syllabus by subject and determine pending topics
  const uncompletedTopics = syllabus.filter((s) => !s.completed);

  // Sort subjects by nearest exam date
  const sortedExams = [...exams].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  // Determine study sessions per day based on available hours
  // Break into 1.5-hour study blocks with 20-min breaks
  const sessions: StudySession[] = [];
  const startDay = new Date(startDate);

  // Try using Gemini if API key is present for smart customized topic prioritization
  let aiTopicAdvice = '';
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `You are CampusMate AI Exam Strategist.
A student has ${totalDays} days before college exams across ${subjects.length} subjects:
Subjects: ${subjects.map((s) => `${s.name} (${s.code})`).join(', ')}.
Exams schedule: ${sortedExams.map((e) => `${e.subjectName} on ${e.examDate}`).join(', ')}.
Remaining pending syllabus topics: ${uncompletedTopics.slice(0, 15).map((t) => `${t.subjectName}: ${t.topicName} (difficulty: ${t.difficulty})`).join('; ')}.
Available daily study hours: ${availableHours} hours. Sleep schedule: ${settings.sleepTime} to ${settings.wakeTime}.

Provide a concise 3-bullet master exam strategy for the student that focuses on high-yield topics and interleaved revision before each exam date.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      aiTopicAdvice = response.text || '';
    } catch (e) {
      console.warn('Gemini study planner enhancement skipped, using algorithmic planner:', e);
    }
  }

  // Algorithmic timetable generation
  // Distribute pending topics across the totalDays, prioritizing earliest exams
  let topicIndex = 0;
  const sortedTopics = [...uncompletedTopics].sort((a, b) => {
    // Priority: earlier exam date, then harder difficulty
    const examA = exams.find((e) => e.subjectId === a.subjectId);
    const examB = exams.find((e) => e.subjectId === b.subjectId);
    const dateA = examA ? new Date(examA.examDate).getTime() : Infinity;
    const dateB = examB ? new Date(examB.examDate).getTime() : Infinity;
    if (dateA !== dateB) return dateA - dateB;

    const diffWeight: Record<string, number> = { hard: 3, medium: 2, easy: 1 };
    return (diffWeight[b.difficulty] || 2) - (diffWeight[a.difficulty] || 2);
  });

  for (let day = 0; day < totalDays; day++) {
    const curDate = new Date(startDay);
    curDate.setDate(curDate.getDate() + day);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayName = curDate.toLocaleDateString('en-US', { weekday: 'long' });

    // College hours on this day from timetable
    const collegeClasses = timetable.filter((t) => t.dayOfWeek === dayName);
    const hasCollegeAfternoon = collegeClasses.some((c) => parseInt(c.endTime.split(':')[0]) >= 16);

    // Starting study after college / late afternoon
    const studyStartHour = hasCollegeAfternoon ? 17 : 16; // 5 PM or 4 PM

    // Session 1: Intensive Deep Work (90 mins)
    const t1 = sortedTopics[topicIndex % sortedTopics.length];
    topicIndex++;

    const s1Start = `${studyStartHour.toString().padStart(2, '0')}:00`;
    const s1End = `${(studyStartHour + 1).toString().padStart(2, '0')}:30`;

    sessions.push({
      id: `sess_${day}_1_${Date.now()}`,
      date: dateStr,
      startTime: s1Start,
      endTime: s1End,
      subjectId: t1?.subjectId || subjects[0]?.id || 'sub_general',
      subjectName: t1?.subjectName || subjects[0]?.name || 'General Revision',
      topicId: t1?.id,
      topicName: t1 ? `${t1.topicName}` : 'High Yield Review',
      type: 'study',
      completed: false,
    });

    // Session 2: Structured Rest & Hydration (20 mins)
    const breakStart = s1End;
    const breakEnd = `${(studyStartHour + 1).toString().padStart(2, '0')}:50`;
    sessions.push({
      id: `sess_${day}_break_${Date.now()}`,
      date: dateStr,
      startTime: breakStart,
      endTime: breakEnd,
      subjectId: 'break',
      subjectName: 'Break & Refresh',
      topicName: 'Hydration & Mindful Reset',
      type: 'break',
      completed: false,
    });

    // Session 3: Second Core Subject / Practice (90 mins)
    const t2 = sortedTopics[topicIndex % sortedTopics.length];
    topicIndex++;
    const s2Start = `${(studyStartHour + 2).toString().padStart(2, '0')}:00`;
    const s2End = `${(studyStartHour + 3).toString().padStart(2, '0')}:30`;

    sessions.push({
      id: `sess_${day}_2_${Date.now()}`,
      date: dateStr,
      startTime: s2Start,
      endTime: s2End,
      subjectId: t2?.subjectId || subjects[1]?.id || 'sub_general',
      subjectName: t2?.subjectName || subjects[1]?.name || 'Core Problem Solving',
      topicId: t2?.id,
      topicName: t2 ? `${t2.topicName} (Numerical / Code Practice)` : 'Problem Solving',
      type: 'practice',
      completed: false,
    });

    // Session 4: Night Active Recall or Mock Questions (60 mins before sleep)
    const nearestExam = sortedExams[day % sortedExams.length];
    sessions.push({
      id: `sess_${day}_3_${Date.now()}`,
      date: dateStr,
      startTime: '21:00',
      endTime: '22:15',
      subjectId: nearestExam?.subjectId || subjects[0]?.id || 'sub_general',
      subjectName: nearestExam?.subjectName || 'Exam Prep',
      topicName: day === totalDays - 1 ? 'Comprehensive Mock Exam & Formula Sheet' : `Active Recall & Flashcards for ${nearestExam?.subjectName}`,
      type: day === totalDays - 1 ? 'mock_test' : 'revision',
      completed: false,
    });
  }

  const newPlan: StudyPlan = {
    id: `plan_${Date.now()}`,
    title: `${totalDays}-Day Adaptive Exam Master Plan`,
    totalDays,
    generatedAt: new Date().toISOString(),
    dailyAvailableHours: availableHours,
    sleepSchedule: `${settings.sleepTime} - ${settings.wakeTime} (Rest Protected)`,
    sessions,
  };

  db.setStudyPlan(newPlan);
  return newPlan;
}

export function rescheduleIncompleteTasks(): { rescheduledCount: number; plan: StudyPlan | null } {
  const plan = db.getStudyPlan();
  if (!plan) return { rescheduledCount: 0, plan: null };

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueSessions = plan.sessions.filter((s) => s.date <= todayStr && !s.completed && s.type !== 'break');

  if (overdueSessions.length === 0) {
    return { rescheduledCount: 0, plan };
  }

  // Move them to upcoming available days
  const futureDates = Array.from(new Set(plan.sessions.map((s) => s.date).filter((d) => d > todayStr))).sort();

  let reassigned = 0;
  for (const session of overdueSessions) {
    if (futureDates.length > 0) {
      const targetDate = futureDates[reassigned % futureDates.length];
      session.date = targetDate;
      session.rescheduled = true;
      reassigned++;
    }
  }

  db.setStudyPlan(plan);
  return { rescheduledCount: reassigned, plan };
}
