export interface Subject {
  id: string;
  name: string;
  code: string;
  targetPercentage: number;
  theoryAttended: number;
  theoryTotal: number;
  labAttended: number;
  labTotal: number;
  credits: number;
}

export interface AttendanceCalculation {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  targetPercentage: number;
  theory: {
    attended: number;
    total: number;
    percentage: number;
  };
  lab: {
    attended: number;
    total: number;
    percentage: number;
  };
  combined: {
    attended: number;
    total: number;
    percentage: number;
  };
  status: 'safe' | 'warning' | 'critical';
  classesNeededToTarget: number;
  safeBunkCount: number;
  theorySafeBunks: number;
  labSafeBunks: number;
}

export interface OverallAttendanceSummary {
  overallPercentage: number;
  theoryPercentage: number;
  labPercentage: number;
  totalConducted: number;
  totalAttended: number;
  totalMissed: number;
  targetPercentage: number;
  isBelowTarget: boolean;
  subjectStats: AttendanceCalculation[];
  atRiskSubjects: AttendanceCalculation[];
  warningSubjects: AttendanceCalculation[];
  safeSubjects: AttendanceCalculation[];
}

export interface BunkPredictionResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  currentPercentage: number;
  predictedPercentage: number;
  percentageDrop: number;
  newStatus: 'safe' | 'warning' | 'critical';
  targetPercentage: number;
  isBelowTarget: boolean;
  explanation: string;
  theoryDetails: {
    current: number;
    predicted: number;
    classesMissedDelta: number;
  };
  labDetails: {
    current: number;
    predicted: number;
    classesMissedDelta: number;
  };
  overallSemesterImpact: {
    currentOverall: number;
    predictedOverall: number;
  };
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  type: 'theory' | 'lab';
  startTime: string;
  endTime: string;
  room: string;
  durationMinutes: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examDate: string;
  startTime: string;
  durationHours: number;
  room?: string;
  totalMarks: number;
  weightagePercentage: number;
}

export interface SyllabusTopic {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
  completed: boolean;
  notes?: string;
}

export interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName: string;
  type: 'study' | 'revision' | 'practice' | 'break' | 'mock_test';
  completed: boolean;
  rescheduled?: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  totalDays: number;
  generatedAt: string;
  dailyAvailableHours: number;
  sleepSchedule: string;
  sessions: StudySession[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subjectId?: string;
  subjectName?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  source: 'manual' | 'study_plan' | 'campus_update' | 'voice_ai';
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  type: 'exam' | 'assignment' | 'study' | 'lab' | 'attendance' | 'general';
  isSnoozed: boolean;
  snoozedUntil?: string;
  completed: boolean;
  createdAt: string;
}

export interface CampusUpdate {
  id: string;
  title: string;
  source: 'Gmail' | 'Google Classroom' | 'WhatsApp' | 'College Notice' | 'Social Media';
  date: string;
  deadline?: string;
  category: 'Exams' | 'Assignments' | 'Events' | 'Internships' | 'Workshops' | 'Scholarships' | 'General Notices';
  content: string;
  actionRequired: boolean;
  rawSource?: string;
  isDuplicateOf?: string;
  duplicateCount?: number;
  verifiedDate: boolean;
  convertedToTaskId?: string;
  read: boolean;
  important: boolean;
}

export interface UserSettings {
  studentName: string;
  collegeName: string;
  semester: number;
  targetPercentage: number;
  language: 'en-US' | 'hi-IN' | 'gu-IN';
  wakeTime: string;
  sleepTime: string;
  studyHoursPerDay: number;
  isDemoMode: boolean;
  voiceAutoSpeak: boolean;
}

export interface AppState {
  subjects: Subject[];
  attendanceSummary: OverallAttendanceSummary;
  timetable: TimetableSlot[];
  exams: Exam[];
  syllabus: SyllabusTopic[];
  studyPlan: StudyPlan | null;
  tasks: Task[];
  reminders: Reminder[];
  campusUpdates: CampusUpdate[];
  settings: UserSettings;
}
