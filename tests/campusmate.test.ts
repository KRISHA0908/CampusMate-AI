import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateSubjectAttendance, calculateOverallAttendance, simulateWhatIfBunk } from '../server/attendanceMath.js';
import { db } from '../server/db.js';
import { executeMcpTool, MCP_TOOLS, MCP_PROTOCOL_VERSION } from '../server/mcpServer.js';
import { generateIntelligentStudyPlan } from '../server/studyPlannerEngine.js';
import { processVoiceCommand } from '../server/voiceAssistant.js';

describe('CampusMate AI - Core Mathematical & System Tests', () => {
  test('Attendance calculation accurately computes percentage and safe bunk margin', () => {
    // Subject with 24/30 theory (80%) and 9/12 lab (75%) -> combined 33/42 (78.57%)
    const stats = calculateSubjectAttendance({
      id: 'test_sub',
      name: 'DBMS',
      code: 'CS601',
      targetPercentage: 75,
      theoryAttended: 24,
      theoryTotal: 30,
      labAttended: 9,
      labTotal: 12,
    });

    assert.strictEqual(stats.theory.percentage, 80);
    assert.strictEqual(stats.lab.percentage, 75);
    assert.strictEqual(stats.combined.attended, 33);
    assert.strictEqual(stats.combined.total, 42);
    assert.strictEqual(stats.combined.percentage, 78.57);
    assert.strictEqual(stats.status, 'warning'); // between 75% and 80%

    // Safe bunks margin at 75% target:
    // 33 / (42 + y) >= 0.75 -> 33 >= 31.5 + 0.75y -> 1.5 >= 0.75y -> y = 2
    assert.strictEqual(stats.safeBunkCount, 2);
    assert.strictEqual(stats.classesNeededToTarget, 0);
  });

  test('Attendance calculation correctly detects critical shortage and classes needed to recover', () => {
    // 15/25 = 60%, target 75%
    // Classes needed: (0.75 * 25 - 15) / (1 - 0.75) = (18.75 - 15) / 0.25 = 3.75 -> 4
    const stats = calculateSubjectAttendance({
      id: 'test_os',
      name: 'Operating Systems',
      code: 'CS602',
      targetPercentage: 75,
      theoryAttended: 15,
      theoryTotal: 25,
      labAttended: 0,
      labTotal: 0,
    });

    assert.strictEqual(stats.combined.percentage, 60);
    assert.strictEqual(stats.status, 'critical');
    assert.strictEqual(stats.safeBunkCount, 0);
    assert.strictEqual(stats.classesNeededToTarget, 15); // (0.75 * 25 - 15) / 0.25 = 3.75 / 0.25 = 15!
  });

  test('What If I Bunk simulation accurately calculates drop and warns below target', () => {
    const subjects = db.getSubjects();
    // DBMS currently: 24/30 theory, 9/12 lab = 33/42 (78.57%)
    // Bunk 1 theory & 1 lab -> new: 33 / 44 = 75.0%
    const result = simulateWhatIfBunk(subjects, 'sub_dbms', 1, 1);
    assert.ok(result);
    assert.strictEqual(result.currentPercentage, 78.57);
    assert.strictEqual(result.predictedPercentage, 75);
    assert.strictEqual(result.theoryDetails.classesMissedDelta, 1);
    assert.strictEqual(result.labDetails.classesMissedDelta, 1);
  });

  test('MCP Protocol 2025-11-25 exposes all 14 required tools with schemas', async () => {
    assert.strictEqual(MCP_PROTOCOL_VERSION, '2025-11-25');
    assert.strictEqual(MCP_TOOLS.length, 14);

    const toolNames = MCP_TOOLS.map((t) => t.name);
    assert.ok(toolNames.includes('get_student_attendance'));
    assert.ok(toolNames.includes('calculate_attendance_prediction'));
    assert.ok(toolNames.includes('calculate_required_attendance'));
    assert.ok(toolNames.includes('get_student_timetable'));
    assert.ok(toolNames.includes('get_exam_schedule'));
    assert.ok(toolNames.includes('get_student_syllabus'));
    assert.ok(toolNames.includes('create_study_plan'));
    assert.ok(toolNames.includes('get_today_study_tasks'));
    assert.ok(toolNames.includes('update_study_task'));
    assert.ok(toolNames.includes('create_reminder'));
    assert.ok(toolNames.includes('get_upcoming_reminders'));
    assert.ok(toolNames.includes('get_campus_updates'));
    assert.ok(toolNames.includes('search_assignments'));
    assert.ok(toolNames.includes('get_daily_briefing'));
  });

  test('MCP tool execution returns valid structured data', async () => {
    const res = await executeMcpTool('get_student_attendance', {});
    assert.ok(res.content);
    assert.ok(res.structuredData);
    assert.ok(typeof res.structuredData.overallPercentage === 'number');

    const predRes = await executeMcpTool('calculate_attendance_prediction', {
      subjectNameOrCode: 'DBMS',
      missTheoryCount: 2,
      missLabCount: 0,
    });
    assert.ok(predRes.structuredData);
    assert.strictEqual(predRes.structuredData.subjectCode, 'CS601');
  });

  test('Study Planner generates conflict-free plan with study blocks and rest', async () => {
    const plan = await generateIntelligentStudyPlan({ totalDays: 3, availableHoursPerDay: 4 });
    assert.ok(plan);
    assert.strictEqual(plan.totalDays, 3);
    assert.ok(plan.sessions.length >= 6);

    // Verify break sessions exist
    const breaks = plan.sessions.filter((s) => s.type === 'break');
    assert.ok(breaks.length > 0);
  });

  test('Voice Assistant handles required hackathon voice commands', async () => {
    // 1. Check attendance
    const r1 = await processVoiceCommand('Check my attendance in all subjects.');
    assert.ok(r1.replyText.includes('Attendance'));
    assert.ok(r1.toolExecuted);

    // 2. What if bunk
    const r2 = await processVoiceCommand('If I bunk tomorrow\'s DBMS lab, what will happen?');
    assert.ok(r2.replyText.includes('What If I Bunk'));
    assert.ok(r2.spokenText.length > 0);

    // 3. Make study plan
    const r3 = await processVoiceCommand('I have exams in five days. Make a study plan.');
    assert.ok(r3.replyText.includes('Plan'));

    // 4. Create task
    const r4 = await processVoiceCommand('Create a task to revise DBMS tonight.');
    assert.ok(r4.replyText.includes('Task Created'));

    // 5. Remind me
    const r5 = await processVoiceCommand('Remind me to revise Python tomorrow at 7 PM.');
    assert.ok(r5.replyText.includes('Reminder'));
  });
});
