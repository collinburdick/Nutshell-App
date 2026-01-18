
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Insight, InsightType, AgendaItem } from '../types';
import { Mic, MicOff, Pause, Play, Star, Clock, ChevronDown, ChevronUp, LogOut, Megaphone, X, CheckCircle, Trash2, ArrowRight, Save, ShieldCheck, Sparkles, Smartphone, LogIn, AlertCircle, MessageSquare, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { api, notifyError, wsClient } from '../services/api';
import { convertApiInsightToFrontend, getDbIdFromTable } from '../services/typeConverters';
import type { ApiInsight, ApiTranscript } from '../services/api';
import QRCode from 'qrcode';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SessionSummary {
  summary: string;
  actionItems: string[];
  openQuestions: string[];
  themes: string[];
  transcriptCount: number;
}

interface FacilitatorScreenProps {
  table: Table;
  onExit: () => void;
  notices: string[];
  defaultAgenda: AgendaItem[];
}

export const FacilitatorScreen: React.FC<FacilitatorScreenProps> = ({ table, onExit, notices, defaultAgenda }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>('p2');
  const [localSummary, setLocalSummary] = useState<string[]>([]);
  const [showNuggetToast, setShowNuggetToast] = useState(false);
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [pendingVoiceCommand, setPendingVoiceCommand] = useState(false);
  
  const activeAgenda = table.customAgenda && table.customAgenda.length > 0 ? table.customAgenda : defaultAgenda;
  const transferCode = `${table.id}-TRF`;

  const [showCoachTip, setShowCoachTip] = useState(false);
  const [coachTipText, setCoachTipText] = useState("Tip: We haven't heard much about *budget implications* yet. Consider asking about costs.");

  const [isReviewMode, setIsReviewMode] = useState(false);
  const [actionItems, setActionItems] = useState<Insight[]>([]);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [showHandoffCode, setShowHandoffCode] = useState(false);
  const [handoffQrCode, setHandoffQrCode] = useState<string | null>(null);

  const [sessionSummary, setSessionSummary] = useState<SessionSummary>({
    summary: "Start recording to capture the discussion...",
    actionItems: [],
    openQuestions: [],
    themes: [],
    transcriptCount: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcriptsSent, setTranscriptsSent] = useState(0);
  
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'recording' | 'uploading' | 'transcribing'>('idle');
  const [lastTranscribed, setLastTranscribed] = useState<string>("");
  const [audioChunksCount, setAudioChunksCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const voiceCommandRecognitionRef = useRef<any>(null);
  const voiceCommandTimeoutRef = useRef<number | null>(null);
  const pendingVoiceCommandRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  const fetchActionItems = useCallback(async () => {
    const eventDbId = parseInt(table.eventId);
    const tableDbId = getDbIdFromTable(table);
    if (isNaN(eventDbId) || !tableDbId) return;
    
    try {
      const apiInsights = await api.insights.list(eventDbId);
      const items = apiInsights
        .filter((i: ApiInsight) => 
          (i.type === 'ACTION_ITEM' || i.type === 'QUESTION') && 
          i.relatedTableIds.includes(tableDbId)
        )
        .map(convertApiInsightToFrontend);
      setActionItems(items);
    } catch (error) {
      notifyError('Failed to fetch action items', error);
    }
  }, [table]);

  useEffect(() => {
    fetchActionItems();
  }, [fetchActionItems]);

  // Effect to show new notices when they arrive
  useEffect(() => {
    if (notices.length > 0) {
        setActiveNotice(notices[notices.length - 1]);
    }
  }, [notices]);

  const fetchCoachTip = useCallback(async () => {
    const tableDbId = getDbIdFromTable(table);
    if (!tableDbId) return;
    
    try {
      const result = await api.ai.getCoachTip(tableDbId, activeAgenda);
      if (result.tip) {
        setCoachTipText(result.tip);
        setShowCoachTip(true);
      }
    } catch (error) {
      notifyError('Failed to get coach tip', error);
    }
  }, [table, activeAgenda]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoachTip();
    }, 10000);
    return () => clearTimeout(timer);
  }, [fetchCoachTip]);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    pendingVoiceCommandRef.current = pendingVoiceCommand;
  }, [pendingVoiceCommand]);

  useEffect(() => {
    if (!showHandoffCode) {
      setHandoffQrCode(null);
      return;
    }
    QRCode.toDataURL(transferCode, { margin: 1, width: 192 })
      .then(setHandoffQrCode)
      .catch((error) => notifyError('Failed to generate transfer QR code', error));
  }, [showHandoffCode, transferCode]);

  const fetchSessionSummary = useCallback(async () => {
    const tableDbId = getDbIdFromTable(table);
    if (!tableDbId) return;
    
    setSummaryLoading(true);
    try {
      const summary = await api.ai.getSessionSummary(tableDbId);
      setSessionSummary(summary);
    } catch (error) {
      notifyError('Failed to fetch session summary', error);
    }
    setSummaryLoading(false);
  }, [table]);

  useEffect(() => {
    fetchSessionSummary();
  }, [fetchSessionSummary]);

  useEffect(() => {
    if (transcriptsSent > 0 && transcriptsSent % 3 === 0) {
      fetchSessionSummary();
    }
  }, [transcriptsSent, fetchSessionSummary]);

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    const tableDbId = getDbIdFromTable(table);
    if (!tableDbId || audioBlob.size < 1000) return;
    
    setProcessingStatus('uploading');
    setAudioChunksCount(prev => prev + 1);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('tableId', tableDbId.toString());
      formData.append('speaker', 'Participant');
      
      setProcessingStatus('transcribing');
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success && result.text) {
        setLastTranscribed(result.text);
        setTranscriptsSent(prev => prev + 1);
        setLocalSummary(prev => [
          `Transcribed: ${result.text.substring(0, 50)}${result.text.length > 50 ? '...' : ''}`,
          ...prev
        ].slice(0, 5));
      } else if (result.error) {
        console.error('[Transcription error]', result.error);
      }
    } catch (error) {
      console.error('[Upload error]', error);
    } finally {
      if (isRecordingRef.current) {
        setProcessingStatus('recording');
      } else {
        setProcessingStatus('idle');
      }
    }
  };

  const startRecording = async () => {
    const tableDbId = getDbIdFromTable(table);
    if (!tableDbId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateMicLevel = () => {
        if (analyserRef.current && isRecordingRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setMicLevel((average / 255) * 100);
          requestAnimationFrame(updateMicLevel);
        }
      };
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          await sendAudioForTranscription(audioBlob);
        }
      };
      
      isRecordingRef.current = true;
      setIsRecording(true);
      setProcessingStatus('recording');
      setAudioChunksCount(0);
      
      mediaRecorderRef.current.start();
      requestAnimationFrame(updateMicLevel);
      
      recordingIntervalRef.current = window.setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 10000);
      
    } catch (error) {
      notifyError('Failed to start recording. Please allow microphone access.', error);
      setSpeechSupported(false);
    }
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    clearVoiceCommandState();
    setIsRecording(false);
    setMicLevel(0);
    setCurrentTranscript('');
    setProcessingStatus('idle');
    
    setTimeout(() => fetchSessionSummary(), 2000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const fetchRecentSummary = useCallback(async () => {
    const tableDbId = getDbIdFromTable(table);
    if (!tableDbId) return;
    
    try {
      const transcripts = await api.transcripts.listByTable(tableDbId);
      if (transcripts.length > 0) {
        const recentTranscripts = transcripts.slice(0, 3);
        const summaries = recentTranscripts.map(t => {
          const prefix = t.sentiment && t.sentiment > 0.3 ? 'Positive: ' : 
                        t.sentiment && t.sentiment < -0.3 ? 'Concern: ' : 'Noted: ';
          return `${prefix}${t.text.substring(0, 60)}${t.text.length > 60 ? '...' : ''}`;
        });
        setLocalSummary(summaries);
      }
    } catch (error) {
      notifyError('Failed to fetch recent summary', error);
    }
  }, [table]);

  useEffect(() => {
    fetchRecentSummary();
  }, [fetchRecentSummary]);

  useEffect(() => {
    wsClient.connect();
    const tableDbId = getDbIdFromTable(table);
    
    const unsubTranscript = wsClient.subscribe('transcript_added', (data: ApiTranscript) => {
      if (tableDbId && data.tableId === tableDbId) {
        const sentiment = data.sentiment || 0;
        const prefix = sentiment > 0.3 ? 'Positive: ' : 
                      sentiment < -0.3 ? 'Concern: ' : 'Noted: ';
        const summary = `${prefix}${data.text.substring(0, 60)}${data.text.length > 60 ? '...' : ''}`;
        setLocalSummary(prev => [summary, ...prev].slice(0, 3));
      }
    });
    
    const unsubInsight = wsClient.subscribe('insight_added', (data: ApiInsight) => {
      if (tableDbId && data.relatedTableIds.includes(tableDbId) && 
          (data.type === 'ACTION_ITEM' || data.type === 'QUESTION')) {
        const insight = convertApiInsightToFrontend(data);
        setActionItems(prev => [insight, ...prev.filter(i => i.id !== insight.id)]);
      }
    });
    
    return () => {
      unsubTranscript();
      unsubInsight();
    };
  }, [table]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearVoiceCommandState = () => {
      setVoiceCommandActive(false);
      setPendingVoiceCommand(false);
      pendingVoiceCommandRef.current = false;
      if (voiceCommandTimeoutRef.current) {
          window.clearTimeout(voiceCommandTimeoutRef.current);
          voiceCommandTimeoutRef.current = null;
      }
  };

  const createActionItemFromText = async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const eventDbId = parseInt(table.eventId);
      const tableDbId = getDbIdFromTable(table);
      if (isNaN(eventDbId) || !tableDbId) {
          notifyError('Unable to capture action item', 'Missing table context.');
          return;
      }
      const title = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
      try {
          const created = await api.insights.create(eventDbId, {
              type: InsightType.ACTION_ITEM,
              title,
              description: trimmed,
              confidence: 0.9,
              relatedTableIds: [tableDbId],
              evidenceCount: 1,
          });
          const insight = convertApiInsightToFrontend(created);
          setActionItems(prev => [insight, ...prev.filter(i => i.id !== insight.id)]);
          setLocalSummary(prev => [`Action item captured: ${title}`, ...prev].slice(0, 3));
      } catch (error) {
          notifyError('Failed to save action item', error);
      }
  };

  const handleGoldenNugget = async () => {
      const note = window.prompt('Enter the quote or insight to mark as a Golden Nugget.');
      if (!note) return;
      const trimmed = note.trim();
      if (!trimmed) return;
      const eventDbId = parseInt(table.eventId);
      const tableDbId = getDbIdFromTable(table);
      if (isNaN(eventDbId) || !tableDbId) {
          notifyError('Unable to mark Golden Nugget', 'Missing table context.');
          return;
      }
      const title = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
      try {
          await api.insights.create(eventDbId, {
              type: InsightType.GOLDEN_NUGGET,
              title,
              description: trimmed,
              confidence: 1,
              relatedTableIds: [tableDbId],
              evidenceCount: 1,
          });
          setShowNuggetToast(true);
          setTimeout(() => setShowNuggetToast(false), 3000);
          setLocalSummary(prev => [`Golden Nugget captured: ${title}`, ...prev].slice(0, 3));
      } catch (error) {
          notifyError('Failed to save Golden Nugget', error);
      }
  };

  const handleVoiceCommandTrigger = () => {
      if (voiceCommandActive) return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          const manual = window.prompt('Type the action item to capture.');
          if (manual) {
              void createActionItemFromText(manual);
          }
          return;
      }
      if (isRecording) {
          setPendingVoiceCommand(true);
          pendingVoiceCommandRef.current = true;
          setVoiceCommandActive(true);
          if (voiceCommandTimeoutRef.current) {
              window.clearTimeout(voiceCommandTimeoutRef.current);
          }
          voiceCommandTimeoutRef.current = window.setTimeout(() => {
              clearVoiceCommandState();
          }, 10000);
          return;
      }
      setVoiceCommandActive(true);
      const recognition = new SpeechRecognition();
      voiceCommandRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
              void createActionItemFromText(transcript);
          }
      };
      recognition.onerror = (event: any) => {
          notifyError('Voice command failed', event.error);
      };
      recognition.onend = () => {
          voiceCommandRecognitionRef.current = null;
          clearVoiceCommandState();
      };
      recognition.start();
  };

  const toggleItemReview = (id: string) => {
      setReviewedItems(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };
  
  const handleRemoveItem = (id: string) => {
      setActionItems(prev => prev.filter(i => i.id !== id));
  };

  const handleFinishSession = () => {
      // Logic to submit approved items would go here
      onExit();
  };

  // --- RENDER HANDOFF MODE ---
  if (showHandoffCode) {
      return (
          <div className="h-full w-full bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-indigo-600 p-4 rounded-full mb-6 shadow-lg shadow-indigo-900/50">
                  <Smartphone className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Device Transfer</h2>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                  Scan this code or enter the key on your new device to resume this session instantly.
              </p>
              
              <div className="bg-white p-6 rounded-2xl mb-6">
                  {handoffQrCode ? (
                      <img src={handoffQrCode} alt="Transfer QR code" className="w-48 h-48" />
                  ) : (
                      <div className="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                          Generating QR code...
                      </div>
                  )}
              </div>

              <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 font-mono text-2xl tracking-widest font-bold mb-8">
                  {transferCode}
              </div>

              <button 
                  onClick={() => setShowHandoffCode(false)}
                  className="w-full max-w-sm h-14 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-lg transition-colors border border-slate-600"
              >
                  Cancel Transfer
              </button>
          </div>
      );
  }

  // --- RENDER REVIEW MODE ---
  if (isReviewMode) {
      return (
        <div className="h-full w-full bg-slate-900 text-white flex flex-col font-sans relative">
            <div className="px-6 py-6 border-b border-slate-700 bg-slate-800">
                <h1 className="text-2xl font-bold mb-1">Session Wrap-Up</h1>
                <p className="text-slate-400">Review and approve captured items before closing.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {actionItems.map(item => (
                    <div key={item.id} className={clsx(
                        "bg-slate-800 rounded-xl p-4 border transition-all duration-300",
                        reviewedItems.has(item.id) ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700"
                    )}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                item.type === InsightType.ACTION_ITEM ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            )}>
                                {item.type.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-slate-400 text-sm mb-4">{item.description}</p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => toggleItemReview(item.id)}
                                className={clsx(
                                    "flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors",
                                    reviewedItems.has(item.id) ? "bg-emerald-500 text-white" : "bg-slate-700 hover:bg-slate-600"
                                )}
                            >
                                <CheckCircle className="w-5 h-5" />
                                {reviewedItems.has(item.id) ? "Approved" : "Approve"}
                            </button>
                            <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="px-4 py-3 bg-slate-700 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {actionItems.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No pending items to review.
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                <button 
                    onClick={handleFinishSession}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                >
                    <Save className="w-5 h-5" />
                    Finalize & Close Session
                </button>
                <button 
                    onClick={() => setIsReviewMode(false)}
                    className="w-full py-4 text-slate-500 hover:text-white mt-2"
                >
                    Back to Discussion
                </button>
            </div>
        </div>
      );
  }

  // --- RENDER STANDARD MODE ---
  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col font-sans relative">
      
      {/* Nudge Banner (Admin Notice) */}
      {activeNotice && (
          <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white p-4 z-50 animate-in slide-in-from-top duration-300 shadow-xl border-b border-indigo-400">
              <div className="flex items-start gap-3">
                  <Megaphone className="w-6 h-6 shrink-0 animate-pulse" />
                  <div className="flex-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider opacity-90">Admin Message</h4>
                      <p className="text-lg font-medium leading-snug mt-1">{activeNotice}</p>
                  </div>
                  <button onClick={() => setActiveNotice(null)} className="p-1 hover:bg-indigo-500 rounded"><X className="w-5 h-5"/></button>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{table.session}</h2>
          <h1 className="text-lg font-bold text-white truncate max-w-[200px]">{table.topic}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
             <div className={clsx("w-2 h-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-500")}></div>
             <span className="font-mono text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
          
          <button 
            onClick={() => setShowHandoffCode(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Transfer Session"
          >
              <Smartphone className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setIsReviewMode(true)} 
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-600 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      {/* Mic Status Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden flex">
          {Array.from({ length: 20 }).map((_, i) => (
             <div 
                key={i} 
                className="flex-1 h-full border-r border-slate-900 transition-colors duration-75"
                style={{ backgroundColor: isRecording && (i * 5) < micLevel ? (micLevel > 80 ? '#ef4444' : '#10b981') : 'transparent' }}
             ></div>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        
        {/* Discussion Guide */}
        <div className="p-4 space-y-4">
           <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discussion Guide</h3>
                {table.customAgenda && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Custom Agenda</span>
                )}
           </div>
           
           {activeAgenda.map(prompt => (
             <div 
                key={prompt.id} 
                onClick={() => setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id)}
                className={clsx(
                    "border rounded-xl transition-all duration-300 overflow-hidden cursor-pointer",
                    expandedPromptId === prompt.id ? "bg-indigo-600 border-indigo-500 shadow-lg scale-[1.02]" : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                )}
             >
                <div className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{prompt.phase}</span>
                        {prompt.durationMinutes > 0 && <span className="text-xs text-indigo-300 bg-indigo-900/50 px-1.5 py-0.5 rounded-full">{prompt.durationMinutes}m</span>}
                    </div>
                    {expandedPromptId === prompt.id ? <ChevronUp className="w-5 h-5 opacity-70" /> : <ChevronDown className="w-5 h-5 opacity-50" />}
                </div>
                {expandedPromptId === prompt.id && (
                    <div className="px-4 pb-4 pt-1 text-indigo-100 text-lg leading-snug font-medium border-t border-white/10">
                        {prompt.text}
                    </div>
                )}
             </div>
           ))}
        </div>

        {/* Coach Tip */}
        {showCoachTip && (
            <div className="mx-4 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
                <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shrink-0">
                            <Sparkles className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-indigo-200 uppercase tracking-wide mb-1">Coach Tip</h4>
                            <p className="text-white font-medium leading-snug">
                                {coachTipText}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowCoachTip(false)} 
                            className="p-1 hover:bg-white/10 rounded-full text-indigo-300"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
                </div>
            </div>
        )}

        {/* Live Session Summary Panel */}
        <div className="px-4 pb-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={clsx("w-2 h-2 rounded-full", isRecording ? "bg-emerald-400 animate-pulse" : "bg-slate-500")}></div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Session Summary</span>
              </div>
              <button 
                onClick={fetchSessionSummary}
                disabled={summaryLoading}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                title="Refresh Summary"
              >
                <RefreshCw className={clsx("w-4 h-4", summaryLoading && "animate-spin")} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {summaryLoading ? (
                    <span className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing discussion...
                    </span>
                  ) : sessionSummary.summary}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {sessionSummary.transcriptCount} transcript segments captured
                </p>
              </div>

              {sessionSummary.themes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Emerging Themes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sessionSummary.themes.map((theme, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sessionSummary.actionItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Action Items</span>
                  </div>
                  <ul className="space-y-1">
                    {sessionSummary.actionItems.map((item, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sessionSummary.openQuestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Open Questions</span>
                  </div>
                  <ul className="space-y-1">
                    {sessionSummary.openQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Processing Status */}
        {isRecording && (
          <div className="mx-4 mb-2 animate-in fade-in duration-200">
            <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {processingStatus === 'recording' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Recording Audio</span>
                    </>
                  )}
                  {processingStatus === 'uploading' && (
                    <>
                      <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Uploading Audio...</span>
                    </>
                  )}
                  {processingStatus === 'transcribing' && (
                    <>
                      <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Transcribing...</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-slate-500">Chunks: {audioChunksCount}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 w-8">{Math.round(micLevel)}%</span>
              </div>
              
              {lastTranscribed && (
                <div className="bg-slate-900/50 rounded p-2 mt-2">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Last Transcribed:</p>
                  <p className="text-xs text-slate-300">{lastTranscribed.substring(0, 100)}{lastTranscribed.length > 100 ? '...' : ''}</p>
                </div>
              )}
              
              <p className="text-[10px] text-slate-500 mt-2">
                Audio sent to OpenAI Whisper every 10 seconds for transcription
              </p>
            </div>
          </div>
        )}

        {/* Privacy Reassurance Card */}
        <div className="px-4 pb-4">
             <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-3 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
                 <div>
                     <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Privacy Active</p>
                     <p className="text-[10px] text-slate-500">Audio is transcribed in real-time. PII redacted.</p>
                 </div>
             </div>
        </div>

        <div className="flex-1"></div>

        {/* Recent Activity Stream */}
        {localSummary.length > 0 && (
          <div className="bg-slate-800/50 p-4 border-t border-slate-700">
               <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                   <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recent Activity</span>
               </div>
               <div className="space-y-2">
                   {localSummary.map((msg, i) => (
                       <div key={i} className={clsx("text-sm transition-opacity duration-500", i === 0 ? "text-white font-medium" : "text-slate-500")}>
                           {msg}
                       </div>
                   ))}
               </div>
          </div>
        )}

      </div>

      {/* Voice Command Overlay */}
      {voiceCommandActive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse mb-4">
                      <Mic className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">Listening...</h3>
                  <p className="text-slate-400">Say the action item you want captured.</p>
              </div>
          </div>
      )}

      {/* Microphone Not Supported Warning */}
      {!speechSupported && (
        <div className="mx-4 mb-2 bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            Microphone access is required for transcription. Please allow microphone access in your browser settings.
          </p>
        </div>
      )}

      {/* Controls Footer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 pb-8">
          
          {/* Main Recording Button */}
          <button 
            onClick={toggleRecording}
            disabled={!speechSupported}
            className={clsx(
                "w-full flex items-center justify-center gap-3 h-16 rounded-xl font-bold text-lg transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed",
                isRecording 
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/50 animate-pulse" 
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
             {isRecording ? (
               <><MicOff className="w-6 h-6" /> Stop Recording</>
             ) : (
               <><Mic className="w-6 h-6" /> Start Recording</>
             )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
               onClick={handleVoiceCommandTrigger}
               className="flex items-center justify-center gap-2 h-12 bg-indigo-600 text-white rounded-xl font-bold transition-colors hover:bg-indigo-700"
            >
                <Sparkles className="w-5 h-5" /> Voice Command
            </button>
            
            <button 
              onClick={handleGoldenNugget}
              className="flex items-center justify-center gap-2 h-12 bg-amber-500 text-slate-900 rounded-xl font-bold shadow-lg shadow-amber-900/20 active:scale-95 transition-transform"
            >
               <Star className="w-5 h-5 fill-slate-900" />
               Golden Nugget
            </button>
          </div>
      </div>

      {/* Toast Notification */}
      {showNuggetToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-top-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Nugget Captured!
          </div>
      )}

    </div>
  );
};
