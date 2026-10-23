import { Request, Response } from 'express';
import { db } from './db.js';
import { calculateOverallAttendance, calculateSubjectAttendance, findSubjectByQuery, simulateWhatIfBunk } from './attendanceMath.js';
import { generateIntelligentStudyPlan } from './studyPlannerEngine.js';

export const MCP_PROTOCOL_VERSION = '2025-11-25';
export const MCP_SERVER_INFO = {
  name: 'CampusMate-MCP-Server',
  version: '1.2.0',
  description: 'Amazon Alexa+ Hackathon 2026 Compliant Model Context Protocol Server for College Students',
};

// Tool Definitions according to MCP Specification 2025-11-25
export const MCP_TOOLS = [
  {
    name: 'get_student_attendance',
    description: 'Retrieves current attendance summary for all enrolled college subjects, including separate theory and practical lab attendance, target thresholds, and status.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectCode: {
          type: 'string',
          description: 'Optional subject code (e.g., CS601) to query a specific course.',
        },
      },
    },
  },
  {
    name: 'calculate_attendance_prediction',
    description: 'Simulates the What-If-I-Bunk scenario. Calculates exact predicted attendance percentage separately for theory and lab if a student misses or attends upcoming classes.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectNameOrCode: {
          type: 'string',
          description: 'Name or code of the subject (e.g. "DBMS", "CS601", "Operating Systems").',
        },
        missTheoryCount: {
          type: 'number',
          description: 'Number of theory lectures the student plans to miss/bunk.',
          default: 1,
        },
        missLabCount: {
          type: 'number',
          description: 'Number of practical lab sessions the student plans to miss/bunk.',
          default: 0,
        },
        attendTheoryCount: {
          type: 'number',
          description: 'Number of upcoming theory lectures attended.',
          default: 0,
        },
        attendLabCount: {
          type: 'number',
          description: 'Number of upcoming labs attended.',
          default: 0,
        },
      },
      required: ['subjectNameOrCode'],
    },
  },
  {
    name: 'calculate_required_attendance',
    description: 'Calculates how many consecutive classes a student must attend to reach or maintain their target attendance percentage (e.g. 75%).',
    inputSchema: {
      type: 'object',
      properties: {
        subjectNameOrCode: {
          type: 'string',
          description: 'Subject name or code to evaluate.',
        },
        targetPercentage: {
          type: 'number',
          description: 'Configurable target attendance percentage, default 75.',
          default: 75,
        },
      },
      required: ['subjectNameOrCode'],
    },
  },
  {
    name: 'get_student_timetable',
    description: 'Retrieves the weekly college timetable including lecture/lab timings, rooms, and durations for a specific day or entire week.',
    inputSchema: {
      type: 'object',
      properties: {
        dayOfWeek: {
          type: 'string',
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'all'],
          description: 'Specific day to view timetable for, or "all" for full week.',
        },
      },
    },
  },
  {
    name: 'get_exam_schedule',
    description: 'Retrieves upcoming college end-semester or mid-semester exams sorted chronologically with countdowns and rooms.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_student_syllabus',
    description: 'Retrieves syllabus chapters, estimated study hours, difficulty ratings, and completion status for college subjects.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectId: {
          type: 'string',
          description: 'Optional subject ID or code to filter syllabus.',
        },
        uncompletedOnly: {
          type: 'boolean',
          description: 'Set to true to only view pending topics that require revision.',
          default: false,
        },
      },
    },
  },
  {
    name: 'create_study_plan',
    description: 'Generates an intelligent, conflict-free, day-by-day exam preparation plan divided into study blocks, breaks, practice, and mock tests around college hours and sleep schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        totalDays: {
          type: 'number',
          description: 'Number of days for exam preparation sprint (e.g., 5).',
          default: 5,
        },
        dailyAvailableHours: {
          type: 'number',
          description: 'Available study hours per day excluding college and sleep.',
          default: 5,
        },
      },
    },
  },
  {
    name: 'get_today_study_tasks',
    description: 'Retrieves the scheduled study sessions, practice topics, and exam revision tasks for today.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_study_task',
    description: 'Marks a study session complete, skipped, or requests rescheduling.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'ID of the study task or session to update.',
        },
        completed: {
          type: 'boolean',
          description: 'Mark as completed or incomplete.',
        },
      },
      required: ['taskId', 'completed'],
    },
  },
  {
    name: 'create_reminder',
    description: 'Creates a persistent reminder for an exam, study session, assignment due date, or lab.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the reminder (e.g., "Revise Python tomorrow at 7 PM").',
        },
        time: {
          type: 'string',
          description: 'ISO datetime or formatted time for the reminder.',
        },
        type: {
          type: 'string',
          enum: ['exam', 'assignment', 'study', 'lab', 'attendance', 'general'],
          default: 'study',
        },
      },
      required: ['title', 'time'],
    },
  },
  {
    name: 'get_upcoming_reminders',
    description: 'Retrieves all active reminders and notifications sorted by urgency.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_campus_updates',
    description: 'Fetches the unified campus inbox containing notices from Gmail, Google Classroom, WhatsApp, and College Bulletin.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['All', 'Exams', 'Assignments', 'Events', 'Internships', 'Workshops', 'Scholarships', 'General Notices'],
          default: 'All',
        },
        unreadOnly: {
          type: 'boolean',
          default: false,
        },
      },
    },
  },
  {
    name: 'search_assignments',
    description: 'Searches across campus updates, tasks, and classroom notices for assignments, due dates, and submissions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword to search for (e.g. "DBMS", "Lab 5", "due this week").',
        },
      },
    },
  },
  {
    name: 'get_daily_briefing',
    description: 'Provides a smart combined academic morning briefing: today\'s college classes, attendance alerts, exam countdowns, scheduled study tasks, and urgent campus deadlines.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function executeMcpTool(name: string, args: Record<string, any> = {}): Promise<any> {
  const subjects = db.getSubjects();
  const timetable = db.getTimetable();
  const exams = db.getExams();
  const syllabus = db.getSyllabus();
  const settings = db.getSettings();

  switch (name) {
    case 'get_student_attendance': {
      if (args.subjectCode) {
        const sub = subjects.find((s) => s.code.toLowerCase() === String(args.subjectCode).toLowerCase() || s.id === args.subjectCode);
        if (!sub) {
          throw new Error(`Subject with code "${args.subjectCode}" not found.`);
        }
        const calc = calculateSubjectAttendance(sub);
        return {
          content: [
            {
              type: 'text',
              text: `Attendance for ${sub.name} (${sub.code}):
- Overall: ${calc.combined.percentage}% (${calc.combined.attended}/${calc.combined.total} classes attended)
- Theory Lectures: ${calc.theory.percentage}% (${calc.theory.attended}/${calc.theory.total})
- Practical Labs: ${calc.lab.percentage}% (${calc.lab.attended}/${calc.lab.total})
- Status: ${calc.status.toUpperCase()} (Target: ${calc.targetPercentage}%)
- Safe Bunks: ${calc.safeBunkCount} class(es) can be missed safely
- Classes Needed to Reach Target: ${calc.classesNeededToTarget}`,
            },
          ],
          structuredData: calc,
        };
      }

      const overall = calculateOverallAttendance(subjects, settings.targetPercentage);
      const textLines = [
        `Overall Attendance: ${overall.overallPercentage}% (Target: ${overall.targetPercentage}%)`,
        `Theory Attendance: ${overall.theoryPercentage}%, Practical Labs: ${overall.labPercentage}%`,
        `Total Attended: ${overall.totalAttended} / ${overall.totalConducted} classes (Missed: ${overall.totalMissed})`,
        '',
        'Subject Breakdown:',
        ...overall.subjectStats.map(
          (s) =>
            `- ${s.subjectName} (${s.subjectCode}): ${s.combined.percentage}% [${s.status.toUpperCase()}] | Theory: ${s.theory.percentage}% | Lab: ${s.lab.percentage}% | Safe Bunks: ${s.safeBunkCount}`
        ),
      ];

      if (overall.atRiskSubjects.length > 0) {
        textLines.push('');
        textLines.push(`CRITICAL ATTENDANCE RISK (<${overall.targetPercentage}%):`);
        overall.atRiskSubjects.forEach((s) => {
          textLines.push(`* ${s.subjectName}: ${s.combined.percentage}% (Need to attend ${s.classesNeededToTarget} consecutive classes)`);
        });
      }

      return {
        content: [{ type: 'text', text: textLines.join('\n') }],
        structuredData: overall,
      };
    }

    case 'calculate_attendance_prediction': {
      const { subjectNameOrCode, missTheoryCount = 1, missLabCount = 0, attendTheoryCount = 0, attendLabCount = 0 } = args;
      const result = simulateWhatIfBunk(subjects, subjectNameOrCode, Number(missTheoryCount), Number(missLabCount), Number(attendTheoryCount), Number(attendLabCount));
      if (!result) {
        throw new Error(`Could not find subject "${subjectNameOrCode}". Enrolled subjects are: ${subjects.map((s) => s.code).join(', ')}.`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `What If I Bunk Prediction for ${result.subjectName} (${result.subjectCode}):
- Current Attendance: ${result.currentPercentage}%
- Predicted Attendance: ${result.predictedPercentage}% (Change: -${result.percentageDrop}%)
- Theory Impact: ${result.theoryDetails.current}% -> ${result.theoryDetails.predicted}% (${missTheoryCount} missed)
- Lab Impact: ${result.labDetails.current}% -> ${result.labDetails.predicted}% (${missLabCount} missed)
- New Status: ${result.newStatus.toUpperCase()} (Target: ${result.targetPercentage}%)
- Semester Overall: ${result.overallSemesterImpact.currentOverall}% -> ${result.overallSemesterImpact.predictedOverall}%

Analysis:
${result.explanation}`,
          },
        ],
        structuredData: result,
      };
    }

    case 'calculate_required_attendance': {
      const { subjectNameOrCode, targetPercentage = 75 } = args;
      const sub = findSubjectByQuery(subjects, subjectNameOrCode);
      if (!sub) {
        throw new Error(`Subject "${subjectNameOrCode}" not found.`);
      }

      const calc = calculateSubjectAttendance({ ...sub, targetPercentage });
      return {
        content: [
          {
            type: 'text',
            text: `Attendance Requirements for ${sub.name} (${sub.code}):
- Current: ${calc.combined.percentage}%
- Target: ${targetPercentage}%
- Classes needed to reach ${targetPercentage}%: ${calc.classesNeededToTarget} class(es)
- Classes you can safely bunk without falling below ${targetPercentage}%: ${calc.safeBunkCount} class(es)`,
          },
        ],
        structuredData: calc,
      };
    }

    case 'get_student_timetable': {
      const day = args.dayOfWeek || 'all';
      let slots = timetable;
      if (day !== 'all') {
        slots = timetable.filter((t) => t.dayOfWeek.toLowerCase() === String(day).toLowerCase());
      }

      const text = slots
        .map(
          (s) =>
            `[${s.dayOfWeek}] ${s.startTime} - ${s.endTime}: ${s.subjectName} (${s.type.toUpperCase()}) in ${s.room} [${s.durationMinutes}m]`
        )
        .join('\n');

      return {
        content: [{ type: 'text', text: text || 'No classes scheduled for the selected day.' }],
        structuredData: slots,
      };
    }

    case 'get_exam_schedule': {
      const sorted = [...exams].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
      const now = new Date();
      const list = sorted.map((e) => {
        const diffDays = Math.ceil((new Date(e.examDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        const countdown = diffDays >= 0 ? `(in ${diffDays} day${diffDays === 1 ? '' : 's'})` : '(completed)';
        return `- ${e.examDate} at ${e.startTime}: ${e.subjectName} (${e.subjectCode}) ${countdown} - Room: ${e.room || 'TBD'}`;
      });

      return {
        content: [{ type: 'text', text: `Upcoming Exams Schedule:\n${list.join('\n')}` }],
        structuredData: sorted,
      };
    }

    case 'get_student_syllabus': {
      let topics = syllabus;
      if (args.subjectId) {
        topics = topics.filter((t) => t.subjectId === args.subjectId || t.subjectName.toLowerCase().includes(String(args.subjectId).toLowerCase()));
      }
      if (args.uncompletedOnly) {
        topics = topics.filter((t) => !t.completed);
      }

      const summary = topics.map(
        (t) =>
          `[${t.completed ? 'DONE' : 'PENDING'}] ${t.subjectName} - Ch ${t.chapterNumber}: ${t.topicName} (${t.difficulty.toUpperCase()}, ~${t.estimatedHours}h)`
      );

      return {
        content: [{ type: 'text', text: `Syllabus Overview (${topics.length} topics):\n${summary.join('\n')}` }],
        structuredData: topics,
      };
    }

    case 'create_study_plan': {
      const plan = await generateIntelligentStudyPlan({
        totalDays: args.totalDays || 5,
        availableHoursPerDay: args.dailyAvailableHours || 5,
      });

      const sessionsSummary = plan.sessions.slice(0, 8).map(
        (s) => `- ${s.date} [${s.startTime}-${s.endTime}]: ${s.subjectName} - ${s.topicName} (${s.type})`
      );

      return {
        content: [
          {
            type: 'text',
            text: `Generated ${plan.title} (${plan.totalDays} Days):
Daily Study Hours: ${plan.dailyAvailableHours}h (Protected Sleep: ${plan.sleepSchedule})
Total Sessions: ${plan.sessions.length}

Sample Upcoming Sessions:
${sessionsSummary.join('\n')}
...and ${Math.max(0, plan.sessions.length - 8)} more scheduled sessions.`,
          },
        ],
        structuredData: plan,
      };
    }

    case 'get_today_study_tasks': {
      const plan = db.getStudyPlan();
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySessions = plan?.sessions.filter((s) => s.date === todayStr) || [];
      const tasks = db.getTasks().filter((t) => t.dueDate === todayStr);

      const lines = [
        `Today's Academic & Study Agenda (${todayStr}):`,
        '',
        'Study Plan Sessions:',
        ...(todaySessions.length > 0
          ? todaySessions.map((s) => `[${s.completed ? 'COMPLETED' : 'TODO'}] ${s.startTime} - ${s.endTime}: ${s.subjectName} - ${s.topicName} (${s.type})`)
          : ['No study sessions scheduled for today.']),
        '',
        'Tasks Due Today:',
        ...(tasks.length > 0 ? tasks.map((t) => `[${t.completed ? 'DONE' : 'PENDING'}] ${t.title} (Priority: ${t.priority})`) : ['No urgent tasks due today.']),
      ];

      return {
        content: [{ type: 'text', text: lines.join('\n') }],
        structuredData: { sessions: todaySessions, tasks },
      };
    }

    case 'update_study_task': {
      const session = db.updateStudySession(args.taskId, { completed: Boolean(args.completed) });
      const task = db.updateTask(args.taskId, { completed: Boolean(args.completed) });

      return {
        content: [
          {
            type: 'text',
            text: `Task / Session marked as ${args.completed ? 'completed' : 'incomplete'}.`,
          },
        ],
        structuredData: session || task,
      };
    }

    case 'create_reminder': {
      const rem = db.addReminder({
        title: args.title,
        time: args.time,
        type: args.type || 'study',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Reminder successfully created: "${rem.title}" set for ${rem.time}.`,
          },
        ],
        structuredData: rem,
      };
    }

    case 'get_upcoming_reminders': {
      const reminders = db.getReminders().filter((r) => !r.completed);
      const text = reminders.map((r) => `- [${r.type.toUpperCase()}] ${r.title} at ${r.time}`).join('\n');

      return {
        content: [{ type: 'text', text: text || 'No active reminders.' }],
        structuredData: reminders,
      };
    }

    case 'get_campus_updates': {
      let updates = db.getCampusUpdates();
      if (args.category && args.category !== 'All') {
        updates = updates.filter((u) => u.category.toLowerCase() === String(args.category).toLowerCase());
      }
      if (args.unreadOnly) {
        updates = updates.filter((u) => !u.read);
      }

      const text = updates
        .map(
          (u) =>
            `[${u.source}] ${u.title} (${u.category})${u.deadline ? ` - Due: ${u.deadline}` : ''}\n  ${u.content.substring(0, 120)}...`
        )
        .join('\n\n');

      return {
        content: [{ type: 'text', text: text || 'No updates found matching criteria.' }],
        structuredData: updates,
      };
    }

    case 'search_assignments': {
      const query = (args.query || '').toLowerCase();
      const updates = db.getCampusUpdates().filter(
        (u) =>
          u.category === 'Assignments' &&
          (u.title.toLowerCase().includes(query) || u.content.toLowerCase().includes(query))
      );
      const tasks = db.getTasks().filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );

      const results = [
        ...updates.map((u) => `[Notice - ${u.source}] ${u.title} (Deadline: ${u.deadline || 'N/A'})\n  ${u.content}`),
        ...tasks.map((t) => `[Task] ${t.title} (Due: ${t.dueDate})`),
      ];

      return {
        content: [{ type: 'text', text: results.length > 0 ? results.join('\n\n') : `No assignments found matching "${args.query}".` }],
        structuredData: { updates, tasks },
      };
    }

    case 'get_daily_briefing': {
      const todayStr = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const overall = calculateOverallAttendance(subjects, settings.targetPercentage);
      const todayClasses = timetable.filter((t) => t.dayOfWeek === dayName);
      const plan = db.getStudyPlan();
      const todaySessions = plan?.sessions.filter((s) => s.date === todayStr && !s.completed) || [];
      const urgentExams = exams.filter((e) => new Date(e.examDate) >= new Date()).slice(0, 2);
      const urgentUpdates = db.getCampusUpdates().filter((u) => u.actionRequired && !u.read);

      const lines = [
        `Good day, ${settings.studentName}! Here is your CampusMate AI Daily Briefing:`,
        '',
        `1. Attendance Status: Overall ${overall.overallPercentage}% (Target: ${overall.targetPercentage}%)`,
      ];

      if (overall.atRiskSubjects.length > 0) {
        lines.push(`   ATTENTION: ${overall.atRiskSubjects.length} subject(s) are below target: ${overall.atRiskSubjects.map((s) => `${s.subjectName} (${s.combined.percentage}%)`).join(', ')}!`);
      } else {
        lines.push('   All subjects are currently in the safe attendance zone.');
      }

      lines.push('');
      lines.push(`2. Today's Classes (${dayName}):`);
      if (todayClasses.length > 0) {
        todayClasses.forEach((c) => lines.push(`   * ${c.startTime} - ${c.endTime}: ${c.subjectName} (${c.type}) in ${c.room}`));
      } else {
        lines.push('   No college classes scheduled today (Weekend or Holiday).');
      }

      lines.push('');
      lines.push('3. Upcoming Exam Countdown:');
      if (urgentExams.length > 0) {
        urgentExams.forEach((e) => lines.push(`   * ${e.subjectName} on ${e.examDate} (${e.startTime})`));
      } else {
        lines.push('   No exams scheduled in the immediate future.');
      }

      lines.push('');
      lines.push(`4. Study Goals For Today: ${todaySessions.length} session(s) queued.`);
      todaySessions.forEach((s) => lines.push(`   * ${s.startTime}: ${s.subjectName} - ${s.topicName}`));

      if (urgentUpdates.length > 0) {
        lines.push('');
        lines.push(`5. Unread Campus Action Items: ${urgentUpdates.length} notice(s) require action.`);
        lines.push(`   * Latest: "${urgentUpdates[0].title}" (${urgentUpdates[0].source})`);
      }

      return {
        content: [{ type: 'text', text: lines.join('\n') }],
        structuredData: {
          attendance: overall,
          classes: todayClasses,
          exams: urgentExams,
          studySessions: todaySessions,
          urgentUpdates,
        },
      };
    }

    default:
      throw new Error(`Tool "${name}" not recognized by CampusMate MCP Server.`);
  }
}

/**
 * Handles JSON-RPC 2.0 requests over HTTP/Streamable SSE according to MCP Specification 2025-11-25
 */
export async function handleMcpJsonRpc(req: Request, res: Response) {
  // Support both POST JSON-RPC and Streamable HTTP GET SSE
  if (req.method === 'GET') {
    // SSE endpoint for streaming notifications
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/mcp', protocolVersion: MCP_PROTOCOL_VERSION })}\n\n`);
    res.write(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/ready', params: { server: MCP_SERVER_INFO } })}\n\n`);
    return;
  }

  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    });
  }

  try {
    switch (method) {
      case 'initialize': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            serverInfo: MCP_SERVER_INFO,
            capabilities: {
              tools: {
                listChanged: true,
              },
              logging: {},
            },
          },
        });
      }

      case 'notifications/initialized': {
        return res.status(204).end();
      }

      case 'ping': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { pong: true, timestamp: new Date().toISOString() },
        });
      }

      case 'tools/list': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        });
      }

      case 'tools/call': {
        const { name, arguments: toolArgs } = params || {};
        if (!name) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing tool name parameter in tools/call' },
          });
        }

        const result = await executeMcpTool(name, toolArgs || {});
        return res.json({
          jsonrpc: '2.0',
          id,
          result,
        });
      }

      default:
        return res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method "${method}" not found` },
        });
    }
  } catch (err: any) {
    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err.message || 'Internal tool execution error',
      },
    });
  }
}
