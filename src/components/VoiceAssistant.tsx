import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  Play, 
  Square,
  ArrowRight
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolExecuted?: {
    name: string;
    args: any;
    result: any;
  };
}

interface VoiceAssistantProps {
  onStateUpdate: () => void;
  language: 'en-US' | 'hi-IN' | 'gu-IN';
  onLanguageChange: (lang: 'en-US' | 'hi-IN' | 'gu-IN') => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onStateUpdate,
  language,
  onLanguageChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello Alex! I am CampusMate AI, your Alexa+ campus companion. Tap the microphone and speak naturally, or click any suggestion chip below. I will calculate your attendance, simulate bunks, generate exam study plans, and manage your college schedule.',
      timestamp: 'Just now',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Refs to avoid stale closures in recognition event callbacks
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  // Scroll to bottom whenever messages or processing state change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Clean markdown and symbols for speech synthesis
  const cleanSpokenText = (text: string): string => {
    return text
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[-*•]\s+/g, ', ')
      .trim();
  };

  // Text-To-Speech Output
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop any active speech
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleanSpeech = cleanSpokenText(text);
      if (!cleanSpeech) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = language.split('-')[0].toLowerCase();
        const match = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (match) {
          utterance.voice = match;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  }, [language]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Core User Command Dispatcher
  const handleUserCommand = async (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Stop listening while processing
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    setIsListening(false);
    isListeningRef.current = false;
    transcriptRef.current = '';
    setTranscript('');
    setTextInput('');
    setIsProcessing(true);
    isProcessingRef.current = true;
    setErrorMsg(null);

    // Append user message
    const userMsg: VoiceMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/voice-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, language }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: VoiceMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecuted: data.toolExecuted,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
      isProcessingRef.current = false;

      // Trigger state refresh for attendance, tasks, and study plan
      onStateUpdate();

      // Read aloud spoken response
      const speechToPlay = data.spokenText || data.replyText;
      if (speechToPlay) {
        speakText(speechToPlay);
      }
    } catch (err: any) {
      setIsProcessing(false);
      isProcessingRef.current = false;
      setErrorMsg(`Request failed: ${err.message}. You can retry or rephrase.`);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          sender: 'assistant',
          text: `I encountered an issue processing that: ${err.message}. Please try again or tap one of the suggested prompts below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Initialize Speech Recognition once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      // Ensure voices are loaded
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // allow continuous listening until pause
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          let currentSessionText = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentSessionText += event.results[i][0].transcript;
          }

          const captured = currentSessionText.trim();
          if (captured) {
            transcriptRef.current = captured;
            setTranscript(captured);

            // Auto-submit on speech pause (1.4 seconds of silence)
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              if (transcriptRef.current.trim() && !isProcessingRef.current) {
                const textToSend = transcriptRef.current.trim();
                transcriptRef.current = '';
                handleUserCommand(textToSend);
              }
            }, 1400);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          if (event.error === 'not-allowed') {
            setIsListening(false);
            isListeningRef.current = false;
            setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
          } else if (event.error === 'no-speech') {
            // ignore no-speech transient events in continuous mode
          } else {
            setIsListening(false);
            isListeningRef.current = false;
            setErrorMsg(`Microphone noticed: ${event.error}. You can also type or click prompt chips.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          isListeningRef.current = false;
          // If we stopped and have captured speech that was not yet sent, send it immediately!
          if (transcriptRef.current.trim() && !isProcessingRef.current) {
            const textToSend = transcriptRef.current.trim();
            transcriptRef.current = '';
            handleUserCommand(textToSend);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Toggle Microphone Button
  const toggleListening = () => {
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      // User manually stopped listening - trigger submission immediately if speech was captured
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const captured = transcriptRef.current.trim() || transcript.trim();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      isListeningRef.current = false;

      if (captured && !isProcessingRef.current) {
        transcriptRef.current = '';
        handleUserCommand(captured);
      }
    } else {
      // Start listening
      setTranscript('');
      transcriptRef.current = '';
      setErrorMsg(null);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start exception, retrying:', e);
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 100);
          } catch (err) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        }
      } else {
        setErrorMsg('Browser speech recognition is not supported in this browser. Please use the text input below.');
      }
    }
  };

  const sampleCommands = [
    'Check my attendance in all subjects.',
    'If I bunk tomorrow\'s lab, what will happen?',
    'I have exams in five days. Make a study plan.',
    'What should I study today?',
    'Create a task to revise DBMS tonight.',
    'What assignments are due this week?',
    'Remind me to revise Python tomorrow at 7 PM.',
    'Show my upcoming exams.',
    'I couldn\'t complete today\'s plan. Reschedule my remaining tasks.',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Alexa+ Ambient Visualizer Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 md:p-8 text-center shadow-2xl">
        {/* Ambient Aura Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Alexa-Style Interactive Orb Button */}
        <div className="relative mx-auto flex items-center justify-center w-36 h-36 mb-4">
          {/* Pulsing Concentric Aura on Listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-cyan-500/25 animate-ping"></div>
              <div className="absolute -inset-3 rounded-full border-2 border-cyan-400/50 animate-pulse"></div>
              <div className="absolute -inset-6 rounded-full border border-cyan-500/30"></div>
            </>
          )}

          {/* Glowing Aura on Speaking */}
          {isSpeaking && (
            <>
              <div className="absolute -inset-2 rounded-full border-2 border-indigo-400/70 animate-spin"></div>
              <div className="absolute -inset-5 rounded-full bg-indigo-500/20 animate-pulse"></div>
            </>
          )}

          {/* Rotating Spinner on Reasoning */}
          {isProcessing && (
            <div className="absolute -inset-2 rounded-full border-2 border-t-cyan-400 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin"></div>
          )}

          {/* Central Microphone / Orb */}
          <button
            onClick={toggleListening}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-cyan-500/50 scale-105 ring-4 ring-cyan-300/50'
                : isSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/50 ring-4 ring-indigo-300/40'
                : isProcessing
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-cyan-400 border border-slate-700 hover:border-cyan-500/70 hover:scale-105'
            }`}
          >
            {isListening ? (
              <Radio className="w-10 h-10 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : isProcessing ? (
              <RefreshCw className="w-9 h-9 animate-spin" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            <span className="text-[11px] font-bold tracking-wider mt-1 uppercase">
              {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Reasoning...' : 'Tap To Speak'}
            </span>
          </button>
        </div>

        {/* Live Audio & Transcript Preview with instant Send button */}
        {isListening && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-700 text-cyan-300 text-xs sm:text-sm font-medium animate-pulse mb-3 max-w-xl mx-auto shadow-lg">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              {transcript ? `"${transcript}"` : 'Listening to your voice... Speak your question'}
            </span>
            {transcript && (
              <button
                onClick={() => {
                  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                  handleUserCommand(transcript);
                }}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition shrink-0 cursor-pointer flex items-center space-x-1"
              >
                <span>Send</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Speaking Status Controls */}
        {isSpeaking && (
          <div className="flex items-center justify-center space-x-3 mb-3">
            <span className="text-xs text-indigo-300 font-medium flex items-center space-x-1.5">
              <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Alexa Voice speaking answer...</span>
            </span>
            <button
              onClick={stopSpeaking}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition flex items-center space-x-1 cursor-pointer"
            >
              <Square className="w-3 h-3" />
              <span>Stop Voice</span>
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs font-medium mb-3">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>CampusMate AI is evaluating your command and invoking tools...</span>
          </div>
        )}

        {/* Language Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mt-2">
          <span>Voice Language:</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as any)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="en-US">English (US / Global / India)</option>
            <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
          </select>
          <span className="text-[11px] text-slate-500">
            • Auto-submits on speech completion
          </span>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-center space-x-2 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Voice Commands */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hackathon 2026 Ready Voice Commands (Tap to execute)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sampleCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleUserCommand(cmd)}
              disabled={isProcessing}
              className="text-left px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-300 transition flex items-center space-x-2 group cursor-pointer disabled:opacity-50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 group-hover:bg-cyan-400 shrink-0"></div>
              <span className="truncate">{cmd}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History & Tool Output Cards */}
      <div className="mt-6 rounded-2xl bg-slate-900/70 border border-slate-800 p-4 md:p-6 min-h-[340px] flex flex-col justify-between shadow-xl">
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isUser ? 'You' : 'CampusMate AI'}
                  </span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-cyan-600/10'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Replay audio button */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Replay Voice</span>
                      </button>
                      {msg.toolExecuted && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          MCP Tool: {msg.toolExecuted.name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Structured Bunk Prediction Tool Card */}
                  {msg.toolExecuted?.result && msg.toolExecuted.name === 'calculate_attendance_prediction' && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-700 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="font-semibold text-cyan-400">What-If-Bunk Prediction</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            msg.toolExecuted.result.isBelowTarget
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {msg.toolExecuted.result.newStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-slate-400">Current</p>
                          <p className="text-sm font-bold text-slate-200">
                            {msg.toolExecuted.result.currentPercentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Predicted</p>
                          <p className="text-sm font-bold text-cyan-300">
                            {msg.toolExecuted.result.predictedPercentage}% (-{msg.toolExecuted.result.percentageDrop}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={chatBottomRef} />
        </div>

        {/* Text Fallback Input Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUserCommand(textInput);
              }
            }}
            placeholder="Type your question or voice command (e.g. 'Check my attendance', 'If I bunk lab...')"
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={() => handleUserCommand(textInput)}
            disabled={!textInput.trim() || isProcessing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-sm hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition flex items-center space-x-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
