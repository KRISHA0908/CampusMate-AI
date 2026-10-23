import fs from 'fs';
import path from 'path';

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

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string;
  type: 'theory' | 'lab';
  status: 'attended' | 'missed' | 'cancelled';
  remarks?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  type: 'theory' | 'lab';
  startTime: string; // e.g., '09:00'
  endTime: string;   // e.g., '10:00'
  room: string;
  durationMinutes: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // '10:00 AM'
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
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
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
  dueDate: string; // YYYY-MM-DD or ISO
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  source: 'manual' | 'study_plan' | 'campus_update' | 'voice_ai';
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // ISO string or YYYY-MM-DDTHH:mm
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
  date: string; // YYYY-MM-DD
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
  wakeTime: string; // '07:00'
  sleepTime: string; // '23:30'
  studyHoursPerDay: number;
  isDemoMode: boolean;
  voiceAutoSpeak: boolean;
}

export interface DatabaseState {
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  timetable: TimetableSlot[];
  exams: Exam[];
  syllabus: SyllabusTopic[];
  studyPlan: StudyPlan | null;
  tasks: Task[];
  reminders: Reminder[];
  campusUpdates: CampusUpdate[];
  settings: UserSettings;
}

const DB_FILE = path.join(process.cwd(), 'campusmate_db.json');

// Default initial realistic seed data for college student
export function getInitialSeedData(): DatabaseState {
  return {
    settings: {
      studentName: 'Alex Rivera',
      collegeName: 'National Institute of Technology & Engineering',
      semester: 6,
      targetPercentage: 75,
      language: 'en-US',
      wakeTime: '07:00',
      sleepTime: '23:30',
      studyHoursPerDay: 5,
      isDemoMode: true,
      voiceAutoSpeak: true,
    },
    subjects: [
      {
        id: 'sub_dbms',
        name: 'Database Management Systems',
        code: 'CS601',
        targetPercentage: 75,
        theoryAttended: 24,
        theoryTotal: 30, // 80.0%
        labAttended: 9,
        labTotal: 12,    // 75.0%
        credits: 4,
      },
      {
        id: 'sub_os',
        name: 'Operating Systems & Kernels',
        code: 'CS602',
        targetPercentage: 75,
        theoryAttended: 19,
        theoryTotal: 28, // 67.86% (Critical/At Risk!)
        labAttended: 8,
        labTotal: 10,    // 80.0%
        credits: 4,
      },
      {
        id: 'sub_cn',
        name: 'Computer Networks',
        code: 'CS603',
        targetPercentage: 75,
        theoryAttended: 22,
        theoryTotal: 29, // 75.86% (Warning/Borderline)
        labAttended: 10,
        labTotal: 12,    // 83.33%
        credits: 4,
      },
      {
        id: 'sub_toc',
        name: 'Theory of Computation',
        code: 'CS604',
        targetPercentage: 75,
        theoryAttended: 26,
        theoryTotal: 32, // 81.25% (Safe)
        labAttended: 0,
        labTotal: 0,     // No lab
        credits: 3,
      },
      {
        id: 'sub_web',
        name: 'Web Technologies & Frameworks',
        code: 'CS605',
        targetPercentage: 75,
        theoryAttended: 21,
        theoryTotal: 26, // 80.77%
        labAttended: 11,
        labTotal: 12,    // 91.67%
        credits: 3,
      },
      {
        id: 'sub_ml',
        name: 'Machine Learning Lab',
        code: 'CS606',
        targetPercentage: 75,
        theoryAttended: 16,
        theoryTotal: 22, // 72.73% (Critical/At Risk!)
        labAttended: 9,
        labTotal: 12,    // 75.0%
        credits: 3,
      },
    ],
    attendanceRecords: [
      { id: 'att_1', subjectId: 'sub_dbms', date: '2026-10-12', type: 'theory', status: 'attended', remarks: 'Relational Algebra' },
      { id: 'att_2', subjectId: 'sub_os', date: '2026-10-12', type: 'theory', status: 'missed', remarks: 'Semaphore synchronization' },
      { id: 'att_3', subjectId: 'sub_cn', date: '2026-10-12', type: 'theory', status: 'attended', remarks: 'TCP Congestion Control' },
      { id: 'att_4', subjectId: 'sub_dbms', date: '2026-10-11', type: 'lab', status: 'attended', remarks: 'SQL Indexing & Query Tuning' },
      { id: 'att_5', subjectId: 'sub_ml', date: '2026-10-11', type: 'lab', status: 'attended', remarks: 'Decision Trees in Scikit-Learn' },
      { id: 'att_6', subjectId: 'sub_toc', date: '2026-10-10', type: 'theory', status: 'attended', remarks: 'Turing Machines' },
      { id: 'att_7', subjectId: 'sub_web', date: '2026-10-10', type: 'theory', status: 'attended', remarks: 'REST APIs & JWT' },
      { id: 'att_8', subjectId: 'sub_os', date: '2026-10-09', type: 'lab', status: 'attended', remarks: 'Paging & Memory Management' },
    ],
    timetable: [
      // Monday
      { id: 'tt_1', dayOfWeek: 'Monday', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', subjectCode: 'CS601', type: 'theory', startTime: '09:00', endTime: '10:00', room: 'Hall 201', durationMinutes: 60 },
      { id: 'tt_2', dayOfWeek: 'Monday', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', subjectCode: 'CS602', type: 'theory', startTime: '10:15', endTime: '11:15', room: 'Hall 203', durationMinutes: 60 },
      { id: 'tt_3', dayOfWeek: 'Monday', subjectId: 'sub_cn', subjectName: 'Computer Networks', subjectCode: 'CS603', type: 'theory', startTime: '11:30', endTime: '12:30', room: 'Hall 105', durationMinutes: 60 },
      { id: 'tt_4', dayOfWeek: 'Monday', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', subjectCode: 'CS601', type: 'lab', startTime: '14:00', endTime: '16:00', room: 'Database Lab 3', durationMinutes: 120 },

      // Tuesday
      { id: 'tt_5', dayOfWeek: 'Tuesday', subjectId: 'sub_toc', subjectName: 'Theory of Computation', subjectCode: 'CS604', type: 'theory', startTime: '09:00', endTime: '10:00', room: 'Hall 201', durationMinutes: 60 },
      { id: 'tt_6', dayOfWeek: 'Tuesday', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', subjectCode: 'CS605', type: 'theory', startTime: '10:15', endTime: '11:15', room: 'Hall 102', durationMinutes: 60 },
      { id: 'tt_7', dayOfWeek: 'Tuesday', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', subjectCode: 'CS606', type: 'theory', startTime: '11:30', endTime: '12:30', room: 'Hall 305', durationMinutes: 60 },
      { id: 'tt_8', dayOfWeek: 'Tuesday', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', subjectCode: 'CS602', type: 'lab', startTime: '14:00', endTime: '16:00', room: 'OS Systems Lab', durationMinutes: 120 },

      // Wednesday
      { id: 'tt_9', dayOfWeek: 'Wednesday', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', subjectCode: 'CS601', type: 'theory', startTime: '09:00', endTime: '10:00', room: 'Hall 201', durationMinutes: 60 },
      { id: 'tt_10', dayOfWeek: 'Wednesday', subjectId: 'sub_cn', subjectName: 'Computer Networks', subjectCode: 'CS603', type: 'lab', startTime: '10:15', endTime: '12:15', room: 'Networking Lab 2', durationMinutes: 120 },
      { id: 'tt_11', dayOfWeek: 'Wednesday', subjectId: 'sub_toc', subjectName: 'Theory of Computation', subjectCode: 'CS604', type: 'theory', startTime: '14:00', endTime: '15:00', room: 'Hall 201', durationMinutes: 60 },

      // Thursday
      { id: 'tt_12', dayOfWeek: 'Thursday', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', subjectCode: 'CS602', type: 'theory', startTime: '09:00', endTime: '10:00', room: 'Hall 203', durationMinutes: 60 },
      { id: 'tt_13', dayOfWeek: 'Thursday', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', subjectCode: 'CS605', type: 'lab', startTime: '10:15', endTime: '12:15', room: 'Web Computing Lab', durationMinutes: 120 },
      { id: 'tt_14', dayOfWeek: 'Thursday', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', subjectCode: 'CS606', type: 'theory', startTime: '14:00', endTime: '15:00', room: 'Hall 305', durationMinutes: 60 },

      // Friday
      { id: 'tt_15', dayOfWeek: 'Friday', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', subjectCode: 'CS606', type: 'lab', startTime: '09:00', endTime: '11:00', room: 'AI & Data Lab', durationMinutes: 120 },
      { id: 'tt_16', dayOfWeek: 'Friday', subjectId: 'sub_cn', subjectName: 'Computer Networks', subjectCode: 'CS603', type: 'theory', startTime: '11:15', endTime: '12:15', room: 'Hall 105', durationMinutes: 60 },
      { id: 'tt_17', dayOfWeek: 'Friday', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', subjectCode: 'CS601', type: 'theory', startTime: '14:00', endTime: '15:00', room: 'Hall 201', durationMinutes: 60 },
    ],
    exams: [
      { id: 'ex_1', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', subjectCode: 'CS601', examDate: '2026-10-18', startTime: '09:30 AM', durationHours: 3, room: 'Exam Hall A', totalMarks: 100, weightagePercentage: 40 },
      { id: 'ex_2', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', subjectCode: 'CS602', examDate: '2026-10-20', startTime: '09:30 AM', durationHours: 3, room: 'Exam Hall B', totalMarks: 100, weightagePercentage: 40 },
      { id: 'ex_3', subjectId: 'sub_cn', subjectName: 'Computer Networks', subjectCode: 'CS603', examDate: '2026-10-22', startTime: '09:30 AM', durationHours: 3, room: 'Exam Hall A', totalMarks: 100, weightagePercentage: 40 },
      { id: 'ex_4', subjectId: 'sub_toc', subjectName: 'Theory of Computation', subjectCode: 'CS604', examDate: '2026-10-24', startTime: '02:00 PM', durationHours: 3, room: 'Exam Hall C', totalMarks: 100, weightagePercentage: 40 },
      { id: 'ex_5', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', subjectCode: 'CS605', examDate: '2026-10-26', startTime: '09:30 AM', durationHours: 3, room: 'Exam Hall B', totalMarks: 100, weightagePercentage: 40 },
      { id: 'ex_6', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', subjectCode: 'CS606', examDate: '2026-10-28', startTime: '02:00 PM', durationHours: 3, room: 'AI Testing Lab', totalMarks: 100, weightagePercentage: 40 },
    ],
    syllabus: [
      // DBMS
      { id: 'syl_1', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', chapterNumber: 1, topicName: 'Relational Algebra & Tuple Calculus', difficulty: 'easy', estimatedHours: 3, completed: true },
      { id: 'syl_2', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', chapterNumber: 2, topicName: 'Normalization (BCNF, 3NF, 4NF)', difficulty: 'medium', estimatedHours: 4, completed: true },
      { id: 'syl_3', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', chapterNumber: 3, topicName: 'Transactions & ACID Properties', difficulty: 'medium', estimatedHours: 3, completed: false },
      { id: 'syl_4', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', chapterNumber: 4, topicName: 'Concurrency Control (2PL, Timestamp, Deadlocks)', difficulty: 'hard', estimatedHours: 5, completed: false },
      { id: 'syl_5', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', chapterNumber: 5, topicName: 'B+ Trees & Query Optimization', difficulty: 'hard', estimatedHours: 4, completed: false },

      // OS
      { id: 'syl_6', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', chapterNumber: 1, topicName: 'Process Scheduling & Fork/Exec', difficulty: 'easy', estimatedHours: 2.5, completed: true },
      { id: 'syl_7', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', chapterNumber: 2, topicName: 'Synchronization: Semaphores & Monitors', difficulty: 'hard', estimatedHours: 5, completed: false },
      { id: 'syl_8', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', chapterNumber: 3, topicName: 'Deadlock Avoidance & Banker Algorithm', difficulty: 'medium', estimatedHours: 3.5, completed: false },
      { id: 'syl_9', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', chapterNumber: 4, topicName: 'Virtual Memory & Page Replacement (LRU, Clock)', difficulty: 'hard', estimatedHours: 4.5, completed: false },
      { id: 'syl_10', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', chapterNumber: 5, topicName: 'File Systems & Disk Scheduling (SCAN, C-LOOK)', difficulty: 'medium', estimatedHours: 3, completed: false },

      // CN
      { id: 'syl_11', subjectId: 'sub_cn', subjectName: 'Computer Networks', chapterNumber: 1, topicName: 'OSI vs TCP/IP Layers & Encapsulation', difficulty: 'easy', estimatedHours: 2, completed: true },
      { id: 'syl_12', subjectId: 'sub_cn', subjectName: 'Computer Networks', chapterNumber: 2, topicName: 'Subnetting, CIDR & IP Addressing', difficulty: 'medium', estimatedHours: 3.5, completed: true },
      { id: 'syl_13', subjectId: 'sub_cn', subjectName: 'Computer Networks', chapterNumber: 3, topicName: 'TCP Sliding Window & Congestion Control', difficulty: 'hard', estimatedHours: 4.5, completed: false },
      { id: 'syl_14', subjectId: 'sub_cn', subjectName: 'Computer Networks', chapterNumber: 4, topicName: 'Routing Protocols: OSPF, BGP, Distance Vector', difficulty: 'medium', estimatedHours: 4, completed: false },
      { id: 'syl_15', subjectId: 'sub_cn', subjectName: 'Computer Networks', chapterNumber: 5, topicName: 'DNS, HTTP/2, TLS Handshake & Network Security', difficulty: 'medium', estimatedHours: 3.5, completed: false },

      // TOC
      { id: 'syl_16', subjectId: 'sub_toc', subjectName: 'Theory of Computation', chapterNumber: 1, topicName: 'DFA, NFA & Regular Expressions', difficulty: 'medium', estimatedHours: 3, completed: true },
      { id: 'syl_17', subjectId: 'sub_toc', subjectName: 'Theory of Computation', chapterNumber: 2, topicName: 'Pumping Lemma for Regular Languages', difficulty: 'hard', estimatedHours: 4, completed: false },
      { id: 'syl_18', subjectId: 'sub_toc', subjectName: 'Theory of Computation', chapterNumber: 3, topicName: 'Context-Free Grammars & Pushdown Automata', difficulty: 'medium', estimatedHours: 4, completed: false },
      { id: 'syl_19', subjectId: 'sub_toc', subjectName: 'Theory of Computation', chapterNumber: 4, topicName: 'Turing Machines & Decidability (Halting Problem)', difficulty: 'hard', estimatedHours: 5, completed: false },

      // Web Tech
      { id: 'syl_20', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', chapterNumber: 1, topicName: 'TypeScript & Modern React Architecture', difficulty: 'easy', estimatedHours: 2, completed: true },
      { id: 'syl_21', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', chapterNumber: 2, topicName: 'REST APIs, WebSockets & Server Sent Events', difficulty: 'medium', estimatedHours: 3, completed: true },
      { id: 'syl_22', subjectId: 'sub_web', subjectName: 'Web Technologies & Frameworks', chapterNumber: 3, topicName: 'Authentication: OAuth2, JWT & RBAC', difficulty: 'medium', estimatedHours: 3.5, completed: false },

      // ML Lab
      { id: 'syl_23', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', chapterNumber: 1, topicName: 'Linear & Logistic Regression Implementations', difficulty: 'medium', estimatedHours: 3, completed: true },
      { id: 'syl_24', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', chapterNumber: 2, topicName: 'Support Vector Machines & Kernel Tricks', difficulty: 'hard', estimatedHours: 4, completed: false },
      { id: 'syl_25', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', chapterNumber: 3, topicName: 'Neural Networks & Backpropagation Math', difficulty: 'hard', estimatedHours: 5, completed: false },
    ],
    studyPlan: {
      id: 'plan_5day_master',
      title: '5-Day Comprehensive Exam Sprint',
      totalDays: 5,
      generatedAt: '2026-10-13T09:00:00Z',
      dailyAvailableHours: 5,
      sleepSchedule: '23:30 - 07:00 (7.5 hrs rest)',
      sessions: [
        // Day 1 (Today: Oct 13)
        { id: 'sess_1', date: '2026-10-13', startTime: '16:30', endTime: '18:00', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicId: 'syl_3', topicName: 'Transactions & ACID Properties', type: 'study', completed: true },
        { id: 'sess_2', date: '2026-10-13', startTime: '18:00', endTime: '18:20', subjectId: 'break', subjectName: 'Evening Break', topicName: 'Mindful Walk & Hydration', type: 'break', completed: true },
        { id: 'sess_3', date: '2026-10-13', startTime: '18:20', endTime: '19:50', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicId: 'syl_4', topicName: 'Concurrency Control (2PL & Deadlocks)', type: 'study', completed: false },
        { id: 'sess_4', date: '2026-10-13', startTime: '20:30', endTime: '22:00', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', topicId: 'syl_7', topicName: 'Semaphores & Classical Sync Problems', type: 'practice', completed: false },

        // Day 2 (Oct 14)
        { id: 'sess_5', date: '2026-10-14', startTime: '16:30', endTime: '18:00', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicId: 'syl_5', topicName: 'B+ Trees Indexing & Query Tuning', type: 'study', completed: false },
        { id: 'sess_6', date: '2026-10-14', startTime: '18:00', endTime: '18:20', subjectId: 'break', subjectName: 'Short Rest', topicName: 'Coffee & Stretch Break', type: 'break', completed: false },
        { id: 'sess_7', date: '2026-10-14', startTime: '18:20', endTime: '19:50', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', topicId: 'syl_9', topicName: 'Virtual Memory & Page Replacement', type: 'study', completed: false },
        { id: 'sess_8', date: '2026-10-14', startTime: '20:30', endTime: '22:00', subjectId: 'sub_cn', subjectName: 'Computer Networks', topicId: 'syl_13', topicName: 'TCP Sliding Window & Congestion Control', type: 'study', completed: false },

        // Day 3 (Oct 15)
        { id: 'sess_9', date: '2026-10-15', startTime: '16:00', endTime: '17:30', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicName: 'Full Mock Test: DBMS Solved Papers', type: 'mock_test', completed: false },
        { id: 'sess_10', date: '2026-10-15', startTime: '18:00', endTime: '19:30', subjectId: 'sub_toc', subjectName: 'Theory of Computation', topicId: 'syl_17', topicName: 'Pumping Lemma & Regular Languages Proofs', type: 'study', completed: false },
        { id: 'sess_11', date: '2026-10-15', startTime: '20:00', endTime: '21:30', subjectId: 'sub_ml', subjectName: 'Machine Learning Lab', topicId: 'syl_24', topicName: 'SVMs & Decision Boundaries Practice', type: 'practice', completed: false },

        // Day 4 (Oct 16)
        { id: 'sess_12', date: '2026-10-16', startTime: '16:00', endTime: '18:00', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicName: 'Final Rapid Revision & High-Yield Formulae', type: 'revision', completed: false },
        { id: 'sess_13', date: '2026-10-16', startTime: '18:30', endTime: '20:30', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', topicId: 'syl_8', topicName: 'Banker Algorithm & Deadlock Avoidance', type: 'practice', completed: false },

        // Day 5 (Oct 17 - Day Before First Exam)
        { id: 'sess_14', date: '2026-10-17', startTime: '10:00', endTime: '12:30', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicName: 'DBMS Pre-Exam Comprehensive Review', type: 'revision', completed: false },
        { id: 'sess_15', date: '2026-10-17', startTime: '15:00', endTime: '17:00', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', topicName: 'Formula Sheet, Normal Forms & Query Cheat Sheet', type: 'revision', completed: false },
      ],
    },
    tasks: [
      { id: 'task_1', title: 'Revise DBMS Concurrency & 2PL tonight', description: 'Focus on strict 2PL vs rigorous 2PL and deadlock detection wait-for graphs.', subjectId: 'sub_dbms', subjectName: 'Database Management Systems', dueDate: '2026-10-13', priority: 'high', completed: false, source: 'voice_ai', createdAt: '2026-10-13T10:00:00Z' },
      { id: 'task_2', title: 'Submit OS Lab Exercise 5', description: 'Producer-Consumer problem with POSIX semaphores.', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', dueDate: '2026-10-14', priority: 'high', completed: false, source: 'campus_update', createdAt: '2026-10-12T14:00:00Z' },
      { id: 'task_3', title: 'Review Computer Networks Wireshark Lab', description: 'Analyze 3-way TCP handshake and FIN packets.', subjectId: 'sub_cn', subjectName: 'Computer Networks', dueDate: '2026-10-15', priority: 'medium', completed: true, source: 'manual', createdAt: '2026-10-11T09:00:00Z' },
      { id: 'task_4', title: 'Verify Mid-Semester Attendance Signatures', description: 'Meet Prof. Nair for Operating Systems attendance correction.', subjectId: 'sub_os', subjectName: 'Operating Systems & Kernels', dueDate: '2026-10-16', priority: 'high', completed: false, source: 'manual', createdAt: '2026-10-13T08:00:00Z' },
    ],
    reminders: [
      { id: 'rem_1', title: 'DBMS Concurrency Revision session at 6:20 PM', time: '2026-10-13T18:20:00', type: 'study', isSnoozed: false, completed: false, createdAt: '2026-10-13T09:00:00Z' },
      { id: 'rem_2', title: 'Revise Python/ML algorithms tomorrow at 7:00 PM', time: '2026-10-14T19:00:00', type: 'study', isSnoozed: false, completed: false, createdAt: '2026-10-13T09:30:00Z' },
      { id: 'rem_3', title: 'Operating Systems Lab Submission Deadline', time: '2026-10-14T23:59:00', type: 'assignment', isSnoozed: false, completed: false, createdAt: '2026-10-12T11:00:00Z' },
      { id: 'rem_4', title: 'First End-Semester Exam: DBMS (Hall 201)', time: '2026-10-18T09:30:00', type: 'exam', isSnoozed: false, completed: false, createdAt: '2026-10-10T10:00:00Z' },
    ],
    campusUpdates: [
      {
        id: 'upd_1',
        title: 'Mid-Sem Exam Timetable Released & Seating Arrangement',
        source: 'College Notice',
        date: '2026-10-12',
        deadline: '2026-10-18',
        category: 'Exams',
        content: 'Dean of Examinations has published the final 6th Semester theory examination schedule. Hall tickets will be issued starting October 15. Please ensure your attendance is at or above 75% to sit for the examinations.',
        actionRequired: true,
        verifiedDate: true,
        read: false,
        important: true,
      },
      {
        id: 'upd_2',
        title: 'DBMS Assignment 3: Relational Query Tuning & B+ Trees Due Friday',
        source: 'Google Classroom',
        date: '2026-10-12',
        deadline: '2026-10-16',
        category: 'Assignments',
        content: 'Prof. Sharma uploaded Assignment 3 to Classroom. Solve 5 problems on query plan cost estimation. Late submissions will attract a 10% penalty.',
        actionRequired: true,
        verifiedDate: true,
        read: false,
        important: true,
      },
      {
        id: 'upd_3',
        title: 'WhatsApp Class Rep Notice: DBMS Assignment 3 Deadline Details',
        source: 'WhatsApp',
        date: '2026-10-12',
        deadline: '2026-10-16',
        category: 'Assignments',
        content: '[12/10/26, 11:15 AM] CR Vikram: Guys please note, DBMS assignment 3 submission is strict Friday 5 PM on Google Classroom. Sir said no extensions.',
        actionRequired: false,
        isDuplicateOf: 'upd_2',
        duplicateCount: 1,
        verifiedDate: true,
        read: true,
        important: false,
      },
      {
        id: 'upd_4',
        title: 'Google Cloud & AI Developer Summer Internship 2027 Drive',
        source: 'Gmail',
        date: '2026-10-11',
        deadline: '2026-10-25',
        category: 'Internships',
        content: 'Campus Placement Cell: Applications open for Google Student Training in Engineering Program (STEP) and Summer Internship. Pre-placement talk on Oct 20 in Auditorium 1.',
        actionRequired: true,
        verifiedDate: true,
        read: true,
        important: true,
      },
      {
        id: 'upd_5',
        title: 'Hands-on Generative AI & Alexa Voice Workshop This Saturday',
        source: 'Social Media',
        date: '2026-10-10',
        deadline: '2026-10-17',
        category: 'Workshops',
        content: 'IEEE Student Branch is hosting a full-day hackathon bootcamp on building Alexa+ Voice Skills with Model Context Protocol (MCP). Registration is free for college students.',
        actionRequired: false,
        verifiedDate: true,
        read: true,
        important: false,
      },
      {
        id: 'upd_6',
        title: 'National Merit Scholarship Renewal Notification',
        source: 'College Notice',
        date: '2026-10-09',
        deadline: '2026-10-31',
        category: 'Scholarships',
        content: 'Eligible students must submit income certificates and verified grade cards to the Dean of Student Affairs by month-end.',
        actionRequired: false,
        verifiedDate: false,
        read: true,
        important: false,
      },
    ],
  };
}

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all top-level keys exist
        const seed = getInitialSeedData();
        return {
          ...seed,
          ...parsed,
          settings: { ...seed.settings, ...(parsed.settings || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to read db file, initializing with seed data', e);
    }
    const seed = getInitialSeedData();
    this.save(seed);
    return seed;
  }

  private save(data?: DatabaseState) {
    try {
      const toSave = data || this.state;
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to db file', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToSeed() {
    this.state = getInitialSeedData();
    this.save();
    return this.state;
  }

  public clearAllStudentData() {
    const seed = getInitialSeedData();
    this.state = {
      settings: { ...seed.settings, isDemoMode: false },
      subjects: [],
      attendanceRecords: [],
      timetable: [],
      exams: [],
      syllabus: [],
      studyPlan: null,
      tasks: [],
      reminders: [],
      campusUpdates: [],
    };
    this.save();
    return this.state;
  }

  // Subjects
  public getSubjects() {
    return this.state.subjects;
  }

  public addSubject(subject: Omit<Subject, 'id'>) {
    const newSub: Subject = {
      ...subject,
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    this.state.subjects.push(newSub);
    this.save();
    return newSub;
  }

  public updateSubject(id: string, updates: Partial<Subject>) {
    const index = this.state.subjects.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.state.subjects[index] = { ...this.state.subjects[index], ...updates };
    this.save();
    return this.state.subjects[index];
  }

  public deleteSubject(id: string) {
    this.state.subjects = this.state.subjects.filter((s) => s.id !== id);
    this.state.timetable = this.state.timetable.filter((t) => t.subjectId !== id);
    this.state.exams = this.state.exams.filter((e) => e.subjectId !== id);
    this.state.syllabus = this.state.syllabus.filter((s) => s.subjectId !== id);
    this.save();
    return true;
  }

  // Attendance Records
  public addAttendanceRecord(rec: Omit<AttendanceRecord, 'id'>) {
    const newRec: AttendanceRecord = {
      ...rec,
      id: 'att_' + Date.now(),
    };
    this.state.attendanceRecords.unshift(newRec);

    // Also update subject stats
    const sub = this.state.subjects.find((s) => s.id === rec.subjectId);
    if (sub) {
      if (rec.type === 'theory') {
        if (rec.status === 'attended') {
          sub.theoryAttended += 1;
          sub.theoryTotal += 1;
        } else if (rec.status === 'missed') {
          sub.theoryTotal += 1;
        }
      } else {
        if (rec.status === 'attended') {
          sub.labAttended += 1;
          sub.labTotal += 1;
        } else if (rec.status === 'missed') {
          sub.labTotal += 1;
        }
      }
    }

    this.save();
    return newRec;
  }

  // Timetable
  public getTimetable() {
    return this.state.timetable;
  }

  public setTimetable(timetable: TimetableSlot[]) {
    this.state.timetable = timetable;
    this.save();
    return this.state.timetable;
  }

  public addTimetableSlot(slot: Omit<TimetableSlot, 'id'>) {
    const newSlot: TimetableSlot = {
      ...slot,
      id: 'tt_' + Date.now(),
    };
    this.state.timetable.push(newSlot);
    this.save();
    return newSlot;
  }

  public deleteTimetableSlot(id: string) {
    this.state.timetable = this.state.timetable.filter((t) => t.id !== id);
    this.save();
    return true;
  }

  // Exams
  public getExams() {
    return this.state.exams;
  }

  public setExams(exams: Exam[]) {
    this.state.exams = exams;
    this.save();
    return this.state.exams;
  }

  // Syllabus
  public getSyllabus() {
    return this.state.syllabus;
  }

  public setSyllabus(syllabus: SyllabusTopic[]) {
    this.state.syllabus = syllabus;
    this.save();
    return this.state.syllabus;
  }

  public toggleSyllabusTopic(id: string) {
    const topic = this.state.syllabus.find((s) => s.id === id);
    if (!topic) return null;
    topic.completed = !topic.completed;
    this.save();
    return topic;
  }

  // Study Plan
  public getStudyPlan() {
    return this.state.studyPlan;
  }

  public setStudyPlan(plan: StudyPlan) {
    this.state.studyPlan = plan;
    this.save();
    return this.state.studyPlan;
  }

  public updateStudySession(sessionId: string, updates: Partial<StudySession>) {
    if (!this.state.studyPlan) return null;
    const session = this.state.studyPlan.sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    Object.assign(session, updates);
    this.save();
    return session;
  }

  // Tasks
  public getTasks() {
    return this.state.tasks;
  }

  public addTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.state.tasks.unshift(newTask);
    this.save();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>) {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, updates);
    this.save();
    return task;
  }

  public deleteTask(id: string) {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.save();
    return true;
  }

  // Reminders
  public getReminders() {
    return this.state.reminders;
  }

  public addReminder(rem: Omit<Reminder, 'id' | 'createdAt' | 'isSnoozed' | 'completed'>) {
    const newRem: Reminder = {
      ...rem,
      id: 'rem_' + Date.now(),
      isSnoozed: false,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.state.reminders.unshift(newRem);
    this.save();
    return newRem;
  }

  public updateReminder(id: string, updates: Partial<Reminder>) {
    const rem = this.state.reminders.find((r) => r.id === id);
    if (!rem) return null;
    Object.assign(rem, updates);
    this.save();
    return rem;
  }

  public deleteReminder(id: string) {
    this.state.reminders = this.state.reminders.filter((r) => r.id !== id);
    this.save();
    return true;
  }

  // Campus Updates
  public getCampusUpdates() {
    return this.state.campusUpdates;
  }

  public addCampusUpdate(upd: Omit<CampusUpdate, 'id' | 'read'>) {
    // Check duplicate
    let duplicateOf: string | undefined;
    const lowerTitle = upd.title.toLowerCase();
    const existing = this.state.campusUpdates.find(
      (c) =>
        c.title.toLowerCase() === lowerTitle ||
        (upd.deadline && c.deadline === upd.deadline && c.category === upd.category)
    );

    if (existing) {
      duplicateOf = existing.id;
      existing.duplicateCount = (existing.duplicateCount || 0) + 1;
    }

    const newUpd: CampusUpdate = {
      ...upd,
      id: 'upd_' + Date.now(),
      read: false,
      isDuplicateOf: duplicateOf,
    };
    this.state.campusUpdates.unshift(newUpd);
    this.save();
    return newUpd;
  }

  public markUpdateRead(id: string, read = true) {
    const upd = this.state.campusUpdates.find((u) => u.id === id);
    if (!upd) return null;
    upd.read = read;
    this.save();
    return upd;
  }

  // Settings
  public getSettings() {
    return this.state.settings;
  }

  public updateSettings(updates: Partial<UserSettings>) {
    this.state.settings = { ...this.state.settings, ...updates };
    this.save();
    return this.state.settings;
  }
}

export const db = new Database();
