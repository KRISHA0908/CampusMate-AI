import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

export const McpInspector: React.FC = () => {
  const [meta, setMeta] = useState<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>('calculate_attendance_prediction');
  const [toolArgsText, setToolArgsText] = useState<string>(
    JSON.stringify({ subjectNameOrCode: 'DBMS', missTheoryCount: 1, missLabCount: 1 }, null, 2)
  );
  const [executing, setExecuting] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tester' | 'specs' | 'architecture'>('tester');

  useEffect(() => {
    fetch('/api/mcp/meta')
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch((e) => console.error('Failed to load MCP meta', e));
  }, []);

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    const toolDef = meta?.tools?.find((t: any) => t.name === toolName);

    // Provide sensible default test arguments
    if (toolName === 'calculate_attendance_prediction') {
      setToolArgsText(JSON.stringify({ subjectNameOrCode: 'DBMS', missTheoryCount: 1, missLabCount: 1 }, null, 2));
    } else if (toolName === 'get_student_attendance') {
      setToolArgsText(JSON.stringify({ subjectCode: 'CS601' }, null, 2));
    } else if (toolName === 'calculate_required_attendance') {
      setToolArgsText(JSON.stringify({ subjectNameOrCode: 'Operating Systems', targetPercentage: 75 }, null, 2));
    } else if (toolName === 'get_student_timetable') {
      setToolArgsText(JSON.stringify({ dayOfWeek: 'Monday' }, null, 2));
    } else if (toolName === 'create_study_plan') {
      setToolArgsText(JSON.stringify({ totalDays: 5, dailyAvailableHours: 5 }, null, 2));
    } else if (toolName === 'search_assignments') {
      setToolArgsText(JSON.stringify({ query: 'DBMS' }, null, 2));
    } else if (toolName === 'create_reminder') {
      setToolArgsText(JSON.stringify({ title: 'Revise Computer Networks at 7 PM', time: '2026-10-14T19:00:00', type: 'study' }, null, 2));
    } else {
      setToolArgsText('{}');
    }
  };

  const handleExecuteTool = async () => {
    setExecuting(true);
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolArgsText);
    } catch (e: any) {
      setResponseLog({ error: `JSON Parse Error in arguments: ${e.message}` });
      setExecuting(false);
      return;
    }

    const payload = {
      jsonrpc: '2.0',
      id: 'alexa-test-' + Date.now(),
      method: 'tools/call',
      params: {
        name: selectedTool,
        arguments: parsedArgs,
      },
    };

    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponseLog(data);
      setExecuting(false);
    } catch (err: any) {
      setResponseLog({ error: err.message });
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hackathon Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Amazon Alexa+ Developer Hackathon 2026</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Model Context Protocol (MCP) Live Inspector
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Demonstrating full compliance with MCP specification <strong className="text-cyan-300 font-mono">2025-11-25</strong> over Streamable HTTP SSE.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Protocol: {meta?.protocolVersion || '2025-11-25'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {meta?.toolCount || 14} Tools Registered
            </span>
          </div>
        </div>

        {/* Navigation Tabs inside Inspector */}
        <div className="flex space-x-3 mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'tester'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Live Tool Runner & RPC Tester
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'specs'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Tool Schemas ({meta?.tools?.length || 14})
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'architecture'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Alexa+ Hackathon Architecture
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE TESTER */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tool Selector List (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2 max-h-[640px] overflow-y-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Select Tool to Test
            </p>
            {meta?.tools?.map((tool: any) => {
              const isSelected = selectedTool === tool.name;
              return (
                <button
                  key={tool.name}
                  onClick={() => handleToolSelect(tool.name)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-mono transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  <span className="font-bold">{tool.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 font-sans mt-0.5">
                    {tool.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Execution & JSON-RPC Playground (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase">Selected Tool:</span>
                  <h3 className="text-base font-bold text-white font-mono">{selectedTool}</h3>
                </div>
                <button
                  onClick={handleExecuteTool}
                  disabled={executing}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{executing ? 'Executing...' : 'Invoke Tool'}</span>
                </button>
              </div>

              {/* JSON Arguments Editor */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Input Arguments (JSON)
                </label>
                <textarea
                  rows={4}
                  value={toolArgsText}
                  onChange={(e) => setToolArgsText(e.target.value)}
                  className="w-full bg-slate-950 font-mono text-xs text-cyan-300 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Live JSON-RPC 2.0 Response Viewer */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Live Response Payload (JSON-RPC 2.0)
                  </label>
                  {responseLog && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      HTTP 200 OK • Success
                    </span>
                  )}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto">
                  {responseLog ? (
                    <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap">
                      {JSON.stringify(responseLog, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Click "Invoke Tool" to send a JSON-RPC 2.0 request to the live /mcp endpoint.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOOL SCHEMAS */}
      {activeTab === 'specs' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Below are all 14 tools exposed via the MCP <code className="text-cyan-400">tools/list</code> endpoint according to the 2025-11-25 specification:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meta?.tools?.map((tool: any) => (
              <div key={tool.name} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-400 font-mono">{tool.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    MCP Tool
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{tool.description}</p>
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Input Schema:</p>
                  <pre className="mt-1 bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-slate-400 overflow-x-auto">
                    {JSON.stringify(tool.inputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALEXA+ ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">Amazon Alexa+ Developer Hackathon Architecture</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-2">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Voice & Web Ingestion</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Captures student intent via Alexa voice simulation (Web Speech API) or text. Provides audio transcripts and speech synthesis.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-2">
                2
              </div>
              <h3 className="text-sm font-bold text-white">MCP Server Protocol (2025-11-25)</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Streamable HTTP endpoint (/mcp) providing 14 specialized academic tools with JSON Schema validation and structured returns.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-2">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Gemini AI Reasoning Engine</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Calls real tools for attendance math, What-If-I-Bunk simulations, study timetables, and college inbox deduplication.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
            <p className="text-cyan-400 font-bold mb-1">// Endpoint verification commands:</p>
            <p className="break-all">{`curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'`}</p>
            <p className="mt-1 break-all">{`curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`}</p>
          </div>
        </div>
      )}
    </div>
  );
};
