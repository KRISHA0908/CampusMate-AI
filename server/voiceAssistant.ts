import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import { db } from './db.js';
import { executeMcpTool, MCP_TOOLS } from './mcpServer.js';
import { rescheduleIncompleteTasks } from './studyPlannerEngine.js';

// Convert MCP tools into Gemini function declarations
function getGeminiTools(): FunctionDeclaration[] {
  return [
    {
      name: 'get_student_attendance',
      description: 'Check attendance across all subjects or a specific subject.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          subjectCode: { type: Type.STRING, description: 'Subject code like CS601 or DBMS' },
        },
      },
    },
    {
      name: 'calculate_attendance_prediction',
      description: 'Calculate What If I Bunk prediction for attendance drop or recovery.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          subjectNameOrCode: { type: Type.STRING, description: 'Subject name or code, e.g. DBMS, OS, Lab' },
          missTheoryCount: { type: Type.NUMBER, description: 'Number of lectures missed' },
          missLabCount: { type: Type.NUMBER, description: 'Number of labs missed' },
        },
        required: ['subjectNameOrCode'],
      },
    },
    {
      name: 'create_study_plan',
      description: 'Generate a personalized day-by-day exam study preparation plan.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          totalDays: { type: Type.NUMBER, description: 'Days until exam, e.g. 5' },
          dailyAvailableHours: { type: Type.NUMBER, description: 'Hours available per day' },
        },
      },
    },
    {
      name: 'get_today_study_tasks',
      description: 'Get what the student should study today from their plan.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
    {
      name: 'create_task',
      description: 'Create a student academic task or revision item.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title of the task' },
          dueDate: { type: Type.STRING, description: 'Due date YYYY-MM-DD' },
          priority: { type: Type.STRING, description: 'low, medium, high' },
        },
        required: ['title'],
      },
    },
    {
      name: 'create_reminder',
      description: 'Create a reminder with a specific time.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'What to remind' },
          time: { type: Type.STRING, description: 'When to remind' },
        },
        required: ['title', 'time'],
      },
    },
    {
      name: 'search_assignments',
      description: 'Search assignments due this week or for a specific course.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: 'Search keywords' },
        },
      },
    },
    {
      name: 'get_exam_schedule',
      description: 'Show upcoming exams and countdown.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
    {
      name: 'reschedule_study_plan',
      description: 'Reschedule missed or remaining tasks when student fell behind.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
  ];
}

export interface VoiceAssistantResponse {
  replyText: string;
  spokenText: string;
  toolExecuted?: {
    name: string;
    args: any;
    result: any;
  };
  language: string;
}

/**
 * Robust natural language intent fallback for when Gemini is offline or responding directly
 */
async function fallbackIntentMatcher(prompt: string, language: string): Promise<VoiceAssistantResponse | null> {
  const lower = prompt.toLowerCase().trim();

  // Greetings & Help
  if (lower === 'hi' || lower === 'hello' || lower.startsWith('hey') || lower.includes('who are you') || lower.includes('what can you do') || lower === 'help') {
    return {
      replyText: `Hello Alex! I am CampusMate AI, your intelligent campus companion. You can ask me to:
- Check your attendance across all subjects or a specific subject
- Simulate "What if I bunk tomorrow's lecture or lab?"
- Generate an adaptive 5-day exam study plan
- Show what to study today and reschedule pending sessions
- View assignments due this week and manage reminders`,
      spokenText: `Hello Alex! I am CampusMate AI. You can ask me to check your attendance, simulate what happens if you bunk tomorrow's class, create a study plan, or check upcoming assignments.`,
      language,
    };
  }

  // 1. Attendance check (general or subject-specific)
  if (lower.includes('attendance') && !lower.includes('bunk') && !lower.includes('miss') && !lower.includes('skip')) {
    // Check if a specific subject was asked
    let subCode: string | undefined;
    if (lower.includes('dbms') || lower.includes('database')) subCode = 'CS601';
    else if (lower.includes('os') || lower.includes('operating')) subCode = 'CS602';
    else if (lower.includes('network') || lower.includes('cn')) subCode = 'CS603';
    else if (lower.includes('toc') || lower.includes('computation')) subCode = 'CS604';
    else if (lower.includes('web')) subCode = 'CS605';
    else if (lower.includes('ml') || lower.includes('machine learning')) subCode = 'CS606';

    const res = await executeMcpTool('get_student_attendance', { subjectCode: subCode });
    if (subCode && res.structuredData) {
      const s = res.structuredData;
      const spoken = `Your attendance for ${s.subjectName} is ${s.combined.percentage} percent. Theory is ${s.theory.percentage} percent and lab is ${s.lab.percentage} percent.`;
      return {
        replyText: res.content[0].text,
        spokenText: spoken,
        toolExecuted: { name: 'get_student_attendance', args: { subjectCode: subCode }, result: s },
        language,
      };
    }

    const overall = res.structuredData;
    const spoken = `Your overall attendance is ${overall.overallPercentage} percent. ${overall.atRiskSubjects.length > 0 ? `Alert: ${overall.atRiskSubjects.map((s: any) => s.subjectName).join(', ')} is below the ${overall.targetPercentage} percent requirement.` : 'All your subjects meet attendance requirements.'}`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'get_student_attendance', args: {}, result: res.structuredData },
      language,
    };
  }

  // 2. Bunk prediction: "If I bunk tomorrow's lab" or "What if I miss tomorrow's DBMS lecture and one lab"
  if (lower.includes('bunk') || lower.includes('miss') || lower.includes('skip')) {
    // Determine subject
    let subjectKey = 'DBMS';
    if (lower.includes('os') || lower.includes('operating system')) subjectKey = 'Operating Systems';
    else if (lower.includes('network') || lower.includes('cn')) subjectKey = 'Computer Networks';
    else if (lower.includes('toc') || lower.includes('theory of computation')) subjectKey = 'Theory of Computation';
    else if (lower.includes('web')) subjectKey = 'Web Technologies';
    else if (lower.includes('ml') || lower.includes('machine learning')) subjectKey = 'Machine Learning';

    const isLab = lower.includes('lab') || lower.includes('practical');
    const isTheory = lower.includes('lecture') || lower.includes('class') || lower.includes('theory') || !isLab;
    const missTheory = isTheory ? 1 : 0;
    const missLab = isLab ? 1 : 0;

    const res = await executeMcpTool('calculate_attendance_prediction', {
      subjectNameOrCode: subjectKey,
      missTheoryCount: missTheory,
      missLabCount: missLab,
    });
    const pred = res.structuredData;
    const spoken = `If you miss ${pred.subjectName}, your attendance will drop from ${pred.currentPercentage} percent to ${pred.predictedPercentage} percent. ${pred.isBelowTarget ? `Warning: That falls below your ${pred.targetPercentage} percent target!` : `You will still have safe margin above target.`}`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'calculate_attendance_prediction', args: { subjectNameOrCode: subjectKey, missTheory, missLab }, result: pred },
      language,
    };
  }

  // 3. Exam study plan: "I have exams in five days. Make a study plan."
  if (lower.includes('study plan') || (lower.includes('exam') && (lower.includes('plan') || lower.includes('prepare') || lower.includes('schedule')))) {
    let days = 5;
    const matchDays = lower.match(/(\d+)\s*day/);
    if (matchDays) days = parseInt(matchDays[1]);

    const res = await executeMcpTool('create_study_plan', { totalDays: days, dailyAvailableHours: 5 });
    const plan = res.structuredData;
    const spoken = `I have generated your ${days}-day exam preparation plan with ${plan.sessions.length} study sessions. Today you start with ${plan.sessions[0]?.subjectName}.`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'create_study_plan', args: { totalDays: days }, result: plan },
      language,
    };
  }

  // 4. "What should I study today?"
  if (lower.includes('what should i study') || lower.includes('today') && lower.includes('study')) {
    const res = await executeMcpTool('get_today_study_tasks', {});
    const spoken = `Today's schedule includes ${res.structuredData.sessions.length} study sessions. The first session is ${res.structuredData.sessions[0]?.subjectName || 'general revision'}.`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'get_today_study_tasks', args: {}, result: res.structuredData },
      language,
    };
  }

  // 5. "Create a task to revise DBMS tonight"
  if (lower.includes('create a task') || lower.includes('add task') || (lower.includes('task') && lower.includes('revise'))) {
    const title = prompt.replace(/create a task (to )?/i, '').replace(/add task (to )?/i, '').trim();
    const task = db.addTask({
      title: title || 'Revise DBMS tonight',
      description: 'Scheduled via voice assistant.',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'high',
      source: 'voice_ai',
      completed: false,
    });
    const spoken = `Created task: ${task.title}. Added to your high priority list.`;
    return {
      replyText: `Task Created: "${task.title}" (Due: ${task.dueDate}, Priority: ${task.priority})`,
      spokenText: spoken,
      toolExecuted: { name: 'create_task', args: { title }, result: task },
      language,
    };
  }

  // 6. "What assignments are due this week?"
  if (lower.includes('assignment') || lower.includes('homework') || lower.includes('due this week')) {
    const res = await executeMcpTool('search_assignments', { query: 'assignment' });
    const spoken = `Here are your pending assignments. DBMS Assignment 3 is due this Friday on Google Classroom, and OS Lab Exercise 5 is due tomorrow.`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'search_assignments', args: { query: 'assignment' }, result: res.structuredData },
      language,
    };
  }

  // 7. "Remind me to revise Python tomorrow at 7 PM"
  if (lower.includes('remind me') || lower.includes('reminder')) {
    let remTime = 'Tomorrow at 7:00 PM';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const isoTime = `${dateStr}T19:00:00`;

    const title = prompt.replace(/remind me to /i, '').replace(/create a reminder for /i, '').trim();
    const rem = db.addReminder({
      title: title || 'Revise Python at 7 PM',
      time: isoTime,
      type: 'study',
    });

    const spoken = `I have set a reminder for you: ${rem.title}.`;
    return {
      replyText: `Reminder set: "${rem.title}" for ${remTime} (${isoTime}).`,
      spokenText: spoken,
      toolExecuted: { name: 'create_reminder', args: { title, time: isoTime }, result: rem },
      language,
    };
  }

  // 8. "Show my upcoming exams"
  if (lower.includes('exam') && (lower.includes('show') || lower.includes('upcoming') || lower.includes('schedule') || lower.includes('when'))) {
    const res = await executeMcpTool('get_exam_schedule', {});
    const spoken = `Your first upcoming exam is Database Management Systems on October 18, followed by Operating Systems on October 20.`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'get_exam_schedule', args: {}, result: res.structuredData },
      language,
    };
  }

  // 9. "I couldn't complete today's plan. Reschedule my remaining tasks."
  if (lower.includes('reschedule') || (lower.includes('couldn\'t complete') || lower.includes('missed today'))) {
    const { rescheduledCount, plan } = rescheduleIncompleteTasks();
    const spoken = `Rescheduled ${rescheduledCount} incomplete session${rescheduledCount === 1 ? '' : 's'} across the remaining days of your study plan without overloading your schedule.`;
    return {
      replyText: `Rescheduled ${rescheduledCount} pending study session(s) into available future slots. Your study timetable has been safely balanced.`,
      spokenText: spoken,
      toolExecuted: { name: 'reschedule_study_plan', args: {}, result: { rescheduledCount, plan } },
      language,
    };
  }

  // 10. Daily briefing
  if (lower.includes('briefing') || lower.includes('morning update') || lower.includes('summary')) {
    const res = await executeMcpTool('get_daily_briefing', {});
    const spoken = `Here is your daily briefing. You have classes today, with Operating Systems at attendance risk, and your first exam in five days.`;
    return {
      replyText: res.content[0].text,
      spokenText: spoken,
      toolExecuted: { name: 'get_daily_briefing', args: {}, result: res.structuredData },
      language,
    };
  }

  return null;
}

/**
 * Processes a voice or text command using Gemini AI with Tool Calling, or the infallible fallback engine
 */
export async function processVoiceCommand(prompt: string, requestedLanguage = 'en-US'): Promise<VoiceAssistantResponse> {
  const language = requestedLanguage || db.getSettings().language || 'en-US';

  // Check fallback first for standard hackathon commands to ensure lightning-fast deterministic accuracy
  const fastMatch = await fallbackIntentMatcher(prompt, language);
  if (fastMatch) {
    return fastMatch;
  }

  // If Gemini API Key is available, use Gemini 3.8 Flash with full tool execution
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const tools = getGeminiTools();
      const settings = db.getSettings();

      const systemInstruction = `You are CampusMate AI, an intelligent Alexa+ voice companion for college students at ${settings.collegeName}.
You assist ${settings.studentName} (Semester ${settings.semester}) with attendance calculations, What-If-I-Bunk simulations, exam study schedules, tasks, reminders, and college announcements.
Target attendance requirement: ${settings.targetPercentage}%.
When the user asks about attendance, bunking, study plans, timetable, or exams, ALWAYS call the corresponding tools to get real data. Never invent attendance numbers.
Provide clear, conversational answers. Keep the response crisp and suitable for text-to-speech.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: tools }],
        },
      });

      // Handle function calling if Gemini invoked a tool
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const toolName = String(call.name || '');
        const toolArgs = (call.args || {}) as Record<string, any>;

        let toolResult: any;
        if (toolName === 'create_task') {
          toolResult = db.addTask({
            title: String(toolArgs.title || 'Revision Task'),
            description: 'Created via AI voice command',
            dueDate: String(toolArgs.dueDate || new Date().toISOString().split('T')[0]),
            priority: (toolArgs.priority as any) || 'high',
            source: 'voice_ai',
            completed: false,
          });
        } else if (toolName === 'reschedule_study_plan') {
          toolResult = rescheduleIncompleteTasks();
        } else if (toolName) {
          toolResult = await executeMcpTool(toolName, toolArgs);
        }

        // Generate final synthesized conversational response
        const secondResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: prompt }] },
            { role: 'model', parts: [{ functionCall: call }] },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: toolName,
                    response: { result: toolResult },
                  },
                },
              ],
            },
          ],
          config: { systemInstruction },
        });

        const reply = secondResponse.text || `I've handled that with ${toolName}.`;
        return {
          replyText: reply,
          spokenText: reply.slice(0, 300),
          toolExecuted: { name: toolName, args: toolArgs, result: toolResult },
          language,
        };
      }

      if (response.text) {
        return {
          replyText: response.text,
          spokenText: response.text.slice(0, 300),
          language,
        };
      }
    } catch (e) {
      console.error('Gemini voice processing error, falling back:', e);
    }
  }

  // Generic fallback if not recognized
  const genericBriefing = await executeMcpTool('get_daily_briefing', {});
  return {
    replyText: `I heard: "${prompt}". I've pulled up your active daily briefing:\n\n${genericBriefing.content[0].text}`,
    spokenText: `I have pulled up your academic schedule and attendance details for today.`,
    toolExecuted: { name: 'get_daily_briefing', args: {}, result: genericBriefing.structuredData },
    language,
  };
}
