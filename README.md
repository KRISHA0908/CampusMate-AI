# CampusMate AI — Your Intelligent Campus & Study Companion
**Built for the Amazon Alexa+ Developer Hackathon 2026**

CampusMate AI is an intelligent college student companion featuring a real Alexa-style voice assistant, a mathematically rigorous Attendance & "What-If-I-Bunk" simulation engine, an AI exam study planner, persistent reminders, and a unified campus updates inbox. It exposes a compliant **Model Context Protocol (MCP) version 2025-11-25** server over Streamable HTTP.

---

## 1. Core Features

### A. Student Attendance & "What If I Bunk?" Engine
- **Precise Mathematical Calculations**: Separates classroom theory lectures and practical labs with configurable target attendance (default: 75%).
- **Key Metrics**:
  - Combined %, Theory %, and Lab % for every enrolled subject.
  - Safe Bunk Count ($y = \lfloor (A - T \times N) / T \rfloor$): Exact number of classes a student can safely miss without falling below their requirement.
  - Required Attendance Recovery ($x = \lceil (T \times N - A) / (1 - T) \rceil$): Consecutive classes needed to recover from critical shortages.
- **"What If I Bunk?" Simulator**:
  - Evaluates questions like: *"If I miss tomorrow's DBMS lecture and one lab, what will happen to my attendance?"*
  - Predicts post-bunk percentage drops for theory, lab, combined subject, and overall semester attendance with clear risk status alerts.

### B. Intelligent AI Study Planner for Exams
- **Multi-Subject Syllabus Tracker**: Tracks chapters, estimated study hours, difficulty ratings (Easy, Medium, Hard), and completion states.
- **Adaptive Timetable Generation**:
  - Dynamically schedules 90-minute study blocks, structured 20-minute rest breaks, active recall practice, and mock exams.
  - Protects student sleep schedules (e.g. 11:30 PM – 7:00 AM) and avoids overlapping with college timetable lecture/lab hours.
- **Dynamic Rescheduling**: Automatically redistributes missed or overdue study sessions across remaining days without cramming.

### C. Alexa-Style Voice Assistant (Web Speech + Gemini)
- **Audio Visualizer**: Ambient glowing ring with live states (Listening, Processing, Speaking, Idle).
- **Speech Input & Output**:
  - Captures voice using browser Web Speech Recognition (`webkitSpeechRecognition`).
  - Reads aloud synthesized answers via Web Speech Synthesis (`SpeechSynthesisUtterance`) with Play, Pause, and Replay controls.
  - Supports English (`en-US`), Hindi (`hi-IN`), and Gujarati (`gu-IN`).
  - Full fallback text chat input for non-voice environments.
- **Mandatory Working Voice Commands**:
  1. *"Check my attendance in all subjects."*
  2. *"If I bunk tomorrow's lab, what will happen?"*
  3. *"I have exams in five days. Make a study plan."*
  4. *"What should I study today?"*
  5. *"Create a task to revise DBMS tonight."*
  6. *"What assignments are due this week?"*
  7. *"Remind me to revise Python tomorrow at 7 PM."*
  8. *"Show my upcoming exams."*
  9. *"I couldn't complete today's plan. Reschedule my remaining tasks."*

### D. Unified Campus Updates Inbox
- Aggregates notices across Gmail, Google Classroom, WhatsApp, and College Bulletins.
- **WhatsApp TXT Importer**: Parses exported chat `.txt` files to extract academic deadlines, exam notices, and workshop announcements.
- **Deduplication**: Identifies and links identical notices across different platforms.
- **1-Click Conversion**: Converts any notice directly into a student task and persistent reminder.

### E. Amazon Alexa+ Hackathon MCP 2025-11-25 Server
- Full Model Context Protocol implementation at `/mcp` and `/api/mcp` supporting JSON-RPC 2.0 and Streamable HTTP Server-Sent Events (SSE).
- Exposes 14 verified tools:
  - `get_student_attendance`
  - `calculate_attendance_prediction`
  - `calculate_required_attendance`
  - `get_student_timetable`
  - `get_exam_schedule`
  - `get_student_syllabus`
  - `create_study_plan`
  - `get_today_study_tasks`
  - `update_study_task`
  - `create_reminder`
  - `get_upcoming_reminders`
  - `get_campus_updates`
  - `search_assignments`
  - `get_daily_briefing`
- Includes an in-app **MCP Inspector** where judges can browse JSON schemas, execute live tools, and inspect JSON-RPC request/response payloads.

---

## 2. Installation & Run Commands (Windows / VS Code / Linux)

### Prerequisites
- Node.js 20+ installed
- npm or pnpm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is specified if connecting to live Gemini models (CampusMate AI also includes a deterministic algorithmic engine that guarantees all commands work even without an external API key).

### Step 3: Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Step 4: Run Tests
```bash
npx tsx --test tests/campusmate.test.ts
```

### Step 5: Production Build
```bash
npm run build
npm start
```

---

## 3. Test Results Summary

Automated tests verified all core systems:
- **Attendance Math**: Confirmed calculation of safe bunk margins ($y = 2$ on 33/42 at 75% target) and shortage recovery ($x = 15$ on 15/25).
- **What-If-I-Bunk Simulation**: Validated theory & lab drops and threshold breach warnings.
- **MCP 2025-11-25**: Tested protocol handshake, tool discovery (`tools/list`), and tool execution (`tools/call`).
- **Voice Assistant**: Verified all 9 required voice queries execute real backend tool calls and synthesize conversational replies.

---

## 4. Hackathon Demo Walkthrough Steps

1. **Morning Briefing**: Open the **Dashboard** and click **"Listen to Morning Briefing"** to hear Alexa summarize today's college schedule, attendance health, and exam countdown.
2. **Attendance & Bunk Simulation**:
   - Go to **Attendance** &rarr; see subject cards with separate theory/lab statistics.
   - In **"What If I Bunk?" Simulator**, pick DBMS, set 1 theory and 1 lab, and click **"Simulate Attendance Impact"** to view the post-bunk percentage and mathematical breakdown.
3. **Voice Interaction**:
   - Tap **"Talk to AI"** in the navigation bar or the floating Alexa orb.
   - Tap the microphone or click any suggested prompt chip (e.g., *"If I bunk tomorrow's lab, what will happen?"*).
   - Watch the audio visualizer pulse, view the live transcription, inspect the tool execution card, and listen to the spoken answer.
4. **Study Planner**:
   - Open **Study Planner** &rarr; view the 5-day exam countdown.
   - Click **"Generate Adaptive Exam Plan"** &rarr; inspect the generated sessions with breaks and protected sleep schedule.
   - Click **"Reschedule Incomplete"** to observe automatic re-balancing.
5. **Campus Updates & WhatsApp Importer**:
   - Open **Campus Updates** &rarr; click **"Import WhatsApp Chat TXT"**.
   - Paste sample chat messages and extract academic announcements automatically.
   - Click **"Convert to Task & Reminder"** on any update.
6. **Hackathon MCP Inspector**:
   - Open **MCP & Hackathon** tab.
   - Browse the 14 tool definitions and click **"Invoke Tool"** to see live JSON-RPC 2.0 communication over `/mcp`.
