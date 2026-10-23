import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { calculateOverallAttendance, simulateWhatIfBunk } from './server/attendanceMath.js';
import { generateIntelligentStudyPlan, rescheduleIncompleteTasks } from './server/studyPlannerEngine.js';
import { handleMcpJsonRpc, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO, MCP_TOOLS } from './server/mcpServer.js';
import { processVoiceCommand } from './server/voiceAssistant.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev server strictly runs on port 3000
const port = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    name: 'CampusMate AI API',
    mcpProtocol: MCP_PROTOCOL_VERSION,
  });
});

// Full state
app.get('/api/state', (_req: Request, res: Response) => {
  const state = db.getState();
  const attendanceSummary = calculateOverallAttendance(state.subjects, state.settings.targetPercentage);
  res.json({
    ...state,
    attendanceSummary,
  });
});

// Reset / Clear Demo
app.post('/api/reset-seed', (_req: Request, res: Response) => {
  const state = db.resetToSeed();
  res.json({ message: 'Reset to demo seed data successfully', state });
});

app.post('/api/clear-data', (_req: Request, res: Response) => {
  const state = db.clearAllStudentData();
  res.json({ message: 'All student data cleared', state });
});

// Attendance Endpoints
app.get('/api/attendance', (_req: Request, res: Response) => {
  const subjects = db.getSubjects();
  const summary = calculateOverallAttendance(subjects, db.getSettings().targetPercentage);
  res.json(summary);
});

app.post('/api/attendance/subject', (req: Request, res: Response) => {
  const { name, code, targetPercentage, theoryAttended, theoryTotal, labAttended, labTotal, credits } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Name and Code are required' });
  }
  const created = db.addSubject({
    name,
    code,
    targetPercentage: Number(targetPercentage || 75),
    theoryAttended: Number(theoryAttended || 0),
    theoryTotal: Number(theoryTotal || 0),
    labAttended: Number(labAttended || 0),
    labTotal: Number(labTotal || 0),
    credits: Number(credits || 3),
  });
  res.json(created);
});

app.put('/api/attendance/subject/:id', (req: Request, res: Response) => {
  const updated = db.updateSubject(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Subject not found' });
  res.json(updated);
});

app.delete('/api/attendance/subject/:id', (req: Request, res: Response) => {
  db.deleteSubject(req.params.id);
  res.json({ success: true });
});

app.post('/api/attendance/record', (req: Request, res: Response) => {
  const { subjectId, date, type, status, remarks } = req.body;
  if (!subjectId || !date || !type || !status) {
    return res.status(400).json({ error: 'subjectId, date, type, and status are required' });
  }
  const record = db.addAttendanceRecord({ subjectId, date, type, status, remarks });
  res.json(record);
});

app.post('/api/attendance/bunk-calculator', (req: Request, res: Response) => {
  const { subjectId, missTheoryCount = 1, missLabCount = 0, attendTheoryCount = 0, attendLabCount = 0 } = req.body;
  const subjects = db.getSubjects();
  const result = simulateWhatIfBunk(
    subjects,
    subjectId,
    Number(missTheoryCount),
    Number(missLabCount),
    Number(attendTheoryCount),
    Number(attendLabCount)
  );
  if (!result) {
    return res.status(404).json({ error: 'Subject not found for simulation' });
  }
  res.json(result);
});

// Timetable Endpoints
app.get('/api/timetable', (_req: Request, res: Response) => {
  res.json(db.getTimetable());
});

app.post('/api/timetable', (req: Request, res: Response) => {
  const slot = db.addTimetableSlot(req.body);
  res.json(slot);
});

app.delete('/api/timetable/:id', (req: Request, res: Response) => {
  db.deleteTimetableSlot(req.params.id);
  res.json({ success: true });
});

// Exams Endpoints
app.get('/api/exams', (_req: Request, res: Response) => {
  res.json(db.getExams());
});

// Syllabus Endpoints
app.get('/api/syllabus', (_req: Request, res: Response) => {
  res.json(db.getSyllabus());
});

app.put('/api/syllabus/:id/toggle', (req: Request, res: Response) => {
  const topic = db.toggleSyllabusTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  res.json(topic);
});

// Study Planner Endpoints
app.get('/api/study-planner', (_req: Request, res: Response) => {
  res.json(db.getStudyPlan());
});

app.post('/api/study-planner/generate', async (req: Request, res: Response) => {
  const { totalDays, availableHoursPerDay, focusSubjectId } = req.body;
  const plan = await generateIntelligentStudyPlan({
    totalDays: Number(totalDays || 5),
    availableHoursPerDay: Number(availableHoursPerDay || 5),
    focusSubjectId,
  });
  res.json(plan);
});

app.put('/api/study-planner/session/:id', (req: Request, res: Response) => {
  const session = db.updateStudySession(req.params.id, req.body);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/study-planner/reschedule', (_req: Request, res: Response) => {
  const result = rescheduleIncompleteTasks();
  res.json(result);
});

// Tasks Endpoints
app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(db.getTasks());
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const task = db.addTask(req.body);
  res.json(task);
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const task = db.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

// Reminders Endpoints
app.get('/api/reminders', (_req: Request, res: Response) => {
  res.json(db.getReminders());
});

app.post('/api/reminders', (req: Request, res: Response) => {
  const rem = db.addReminder(req.body);
  res.json(rem);
});

app.put('/api/reminders/:id', (req: Request, res: Response) => {
  const rem = db.updateReminder(req.params.id, req.body);
  if (!rem) return res.status(404).json({ error: 'Reminder not found' });
  res.json(rem);
});

app.delete('/api/reminders/:id', (req: Request, res: Response) => {
  db.deleteReminder(req.params.id);
  res.json({ success: true });
});

// Campus Updates Endpoints
app.get('/api/campus-updates', (_req: Request, res: Response) => {
  res.json(db.getCampusUpdates());
});

app.post('/api/campus-updates', (req: Request, res: Response) => {
  const update = db.addCampusUpdate(req.body);
  res.json(update);
});

app.put('/api/campus-updates/:id/read', (req: Request, res: Response) => {
  const update = db.markUpdateRead(req.params.id, req.body.read !== false);
  res.json(update);
});

app.post('/api/campus-updates/parse-whatsapp', (req: Request, res: Response) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ error: 'rawText is required' });

  const lines = String(rawText).split('\n');
  const extracted: any[] = [];

  // Patterns for WhatsApp exported chat:
  // [12/10/26, 10:30 AM] Sender: Content
  // or 12/10/26, 10:30 - Sender: Content
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter lines that look like college announcements (contain assignment, exam, test, deadline, submission, due, holiday)
    const lower = trimmed.toLowerCase();
    const isAcademic =
      lower.includes('assignment') ||
      lower.includes('exam') ||
      lower.includes('test') ||
      lower.includes('submission') ||
      lower.includes('deadline') ||
      lower.includes('class') ||
      lower.includes('lab') ||
      lower.includes('workshop') ||
      lower.includes('internship') ||
      lower.includes('notice');

    if (isAcademic && trimmed.length > 20) {
      let category: any = 'General Notices';
      if (lower.includes('exam') || lower.includes('mid-sem') || lower.includes('hall ticket')) category = 'Exams';
      else if (lower.includes('assignment') || lower.includes('homework') || lower.includes('submission')) category = 'Assignments';
      else if (lower.includes('internship') || lower.includes('placement')) category = 'Internships';
      else if (lower.includes('workshop') || lower.includes('bootcamp')) category = 'Workshops';

      const update = db.addCampusUpdate({
        title: trimmed.slice(0, 70) + (trimmed.length > 70 ? '...' : ''),
        source: 'WhatsApp',
        date: new Date().toISOString().split('T')[0],
        category,
        content: trimmed,
        actionRequired: lower.includes('submit') || lower.includes('due') || lower.includes('register'),
        verifiedDate: false,
        rawSource: trimmed,
        important: lower.includes('urgent') || lower.includes('strict') || lower.includes('mandatory'),
      });
      extracted.push(update);
    }
  }

  res.json({ count: extracted.length, updates: extracted });
});

app.post('/api/campus-updates/convert-to-task', (req: Request, res: Response) => {
  const { updateId, dueDate, priority } = req.body;
  const updates = db.getCampusUpdates();
  const update = updates.find((u) => u.id === updateId);
  if (!update) return res.status(404).json({ error: 'Update not found' });

  const task = db.addTask({
    title: update.title,
    description: `From ${update.source}: ${update.content}`,
    dueDate: dueDate || update.deadline || new Date().toISOString().split('T')[0],
    priority: priority || (update.important ? 'high' : 'medium'),
    source: 'campus_update',
    completed: false,
  });

  update.convertedToTaskId = task.id;
  res.json({ task, update });
});

// Voice Assistant AI Endpoint
app.post('/api/voice-assistant/chat', async (req: Request, res: Response) => {
  const { prompt, language } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const result = await processVoiceCommand(prompt, language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing voice assistant request' });
  }
});

// Daily Briefing Endpoint
app.get('/api/daily-briefing', async (_req: Request, res: Response) => {
  const briefing = await processVoiceCommand('daily briefing');
  res.json(briefing);
});

// Settings Endpoints
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// MCP 2025-11-25 Endpoints
app.all('/mcp', handleMcpJsonRpc);
app.all('/api/mcp', handleMcpJsonRpc);

app.get('/api/mcp/meta', (_req: Request, res: Response) => {
  res.json({
    protocolVersion: MCP_PROTOCOL_VERSION,
    server: MCP_SERVER_INFO,
    toolCount: MCP_TOOLS.length,
    tools: MCP_TOOLS,
  });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[CampusMate AI] Server running on port ${port}`);
    console.log(`[CampusMate AI] MCP 2025-11-25 streamable HTTP live at http://0.0.0.0:${port}/mcp`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
