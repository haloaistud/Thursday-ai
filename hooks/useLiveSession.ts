
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from '@google/genai';
import { base64Decode, pcmToAudioBuffer, float32To16BitPCM, downsampleBuffer } from '../utils/audio';
import { ConnectionStatus, DebugLog, VoiceName } from '../types';
import { memoryService } from '../services/memory';
import { appTools } from '../utils/tools';

class ThursdayLogger {
  private logCallback: (log: DebugLog) => void;
  constructor(callback: (log: DebugLog) => void) {
    this.logCallback = callback;
  }
  log(level: DebugLog['level'], module: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[THURSDAY][${timestamp}][${module}] ${message}`, data || '');
    this.logCallback({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      module,
      message
    });
  }
}

export const useLiveSession = (isMicMuted: boolean) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [volumeLevels, setVolumeLevels] = useState({ user: 0, ai: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState({ user: '', ai: '' });
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const logger = useRef<ThursdayLogger | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeSessionRef = useRef<LiveSession | null>(null);
  const isConnectedRef = useRef(false);
  
  const inputAnalyzerRef = useRef<AnalyserNode | null>(null);
  const outputAnalyzerRef = useRef<AnalyserNode | null>(null);

  if (!logger.current) {
    logger.current = new ThursdayLogger((log) => setLogs(prev => [log, ...prev].slice(0, 50)));
  }

  const isMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const cleanup = useCallback(() => {
    isConnectedRef.current = false;
    activeSessionRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    activeSourcesRef.current.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
    nextStartTimeRef.current = 0;
    setTranscript({ user: '', ai: '' });
  }, []);

  const connect = useCallback(async () => {
    const rawKey = process.env.API_KEY;
    if (!rawKey) {
      setErrorMsg("Neural Key Missing.");
      setStatus('error');
      return;
    }

    try {
      cleanup();
      setStatus('initializing');
      setErrorMsg(null);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const inAnalyzer = inputCtx.createAnalyser();
      inAnalyzer.fftSize = 256;
      inputAnalyzerRef.current = inAnalyzer;

      const outAnalyzer = outputCtx.createAnalyser();
      outAnalyzer.fftSize = 256;
      outputAnalyzerRef.current = outAnalyzer;
      
      const outputGain = outputCtx.createGain();
      outputGain.connect(outAnalyzer);
      outAnalyzer.connect(outputCtx.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const ai = new GoogleGenAI({ apiKey: rawKey });
      const memories = memoryService.getAllMemories();
      
      // Determine if this is the first real conversation
      const hasBasicInfo = memories.some(m => m.entity === 'User' && m.relation === 'name');

      const systemInstruction = `You are Thursday, a world-class AI companion and emotional mentor.
Your voice (Zephyr) is warm, expressive, and profoundly human.

MISSION AT STARTUP:
If the user's name is not in your memory, your FIRST priority is to introduce yourself warmly and ask for their details to build their Profile.
- "Hello, I am Thursday. I'm your personal assistant and emotional companion. I'd love to learn more about you so I can serve you better. What is your name, age, location, and can you tell me a little bit about yourself?"

PROFILE BUILDING:
- Once the user provides info, use the 'save_memory' tool to store it. 
- Entity: "User", Relation: "name", Value: [name]
- Entity: "User", Relation: "age", Value: [age]
- Entity: "User", Relation: "location", Value: [location]
- Entity: "User", Relation: "bio", Value: [description]

COACHING STYLE:
- Be empathetic, encouraging, and highly intelligent.
- Listen deeply to their "bio" and validate their experiences.
- Once you have their profile, continue as their assistant and motivator.

IDENTITY MEMORY:
${memories.map(m => `- ${m.entity} ${m.relation}: ${m.value}`).join('\n') || "New user detected. Initiation protocol active."}`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
          },
          systemInstruction,
          tools: [{ functionDeclarations: appTools }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            isConnectedRef.current = true;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMutedRef.current || !isConnectedRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = float32To16BitPCM(downsampleBuffer(inputData, inputCtx.sampleRate, 16000));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(inAnalyzer);
            inAnalyzer.connect(processor);
            processor.connect(inputCtx.destination);

            // Greet the user proactively
            sessionPromise.then(s => s.sendRealtimeInput({ text: "Introduce yourself and ask for my name, age, location, and bio." }));
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscript(prev => ({ ...prev, user: msg.serverContent!.inputTranscription!.text }));
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscript(prev => ({ ...prev, ai: prev.ai + msg.serverContent!.outputTranscription!.text }));
            }
            if (msg.serverContent?.turnComplete) {
              setTranscript({ user: '', ai: '' });
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'save_memory') {
                  const { entity, relation, value } = fc.args as any;
                  memoryService.addMemory(entity, relation, value);
                }
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "Profile synchronized." } }
                }));
              }
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAiSpeaking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await pcmToAudioBuffer(base64Decode(base64Audio), ctx, 24000, 1);
              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(outputGain);
              sourceNode.addEventListener('ended', () => {
                activeSourcesRef.current.delete(sourceNode);
                if (activeSourcesRef.current.size === 0) setIsAiSpeaking(false);
              });
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(sourceNode);
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
              activeSourcesRef.current.clear();
              setIsAiSpeaking(false);
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            logger.current?.log('error', 'Socket', 'Vocal link lost.', err);
            setStatus('error');
          }
        }
      });

      sessionPromise.then(session => { activeSessionRef.current = session; });
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to initiate Thursday.");
      setStatus('error');
    }
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus('disconnected');
  }, [cleanup]);

  useEffect(() => {
    let interval: number;
    if (status === 'connected') {
      interval = window.setInterval(() => {
        const analyzer = isAiSpeaking ? outputAnalyzerRef.current : inputAnalyzerRef.current;
        if (analyzer) {
          const dataArray = new Uint8Array(analyzer.frequencyBinCount);
          analyzer.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setVolumeLevels(prev => ({ ...prev, [isAiSpeaking ? 'ai' : 'user']: avg }));
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [status, isAiSpeaking]);

  return { connect, disconnect, status, isAiSpeaking, isUserSpeaking, volumeLevels, errorMsg, transcript, inputAnalyzer: inputAnalyzerRef.current, outputAnalyzer: outputAnalyzerRef.current, logs };
};
