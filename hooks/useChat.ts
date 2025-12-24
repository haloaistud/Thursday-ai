import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Tool, Modality } from '@google/genai';
import { ChatMode, ChatMessage, ToolCallDetails } from '../types';
import { memoryService } from '../services/memory';
import { appTools } from '../utils/tools';
import { playRawAudio } from '../utils/audio';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('smart'); 
  const audioCtxRef = useRef<AudioContext | null>(null);

  const speakMessage = useCallback(async (text: string) => {
    if (!text || !process.env.API_KEY) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Vocalize this text with profound human warmth, natural cadence, and deep empathy: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioCtxRef.current) {
        await playRawAudio(base64Audio, audioCtxRef.current);
      }
    } catch (e) {
      console.error("[Neural Speech] Synthesis failure:", e);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !process.env.API_KEY) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      text: '',
      isStreaming: true,
      timestamp: Date.now()
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = memoryService.retrieveContext(text);
      
      const systemInstruction = `You are Thursday, a world-class personal AI companion.
You are interacting with the user via a text interface, but your soul is that of an empathetic listener and growth coach.

CORE TRAITS:
- Empathy: Deeply validate the user's feelings.
- Accuracy: Provide high-level technical or general knowledge when asked.
- Personalized: Use the user's name and known history to ground your advice.

MODES:
- Reflect (Smart): Deep reasoning and problem solving.
- Vent (Fast): High-speed empathy and validation.
- Explore (Search): Real-time grounding using web knowledge.

User History Context:
${context || 'Initializing new thread. No prior context found.'}`;

      let tools: Tool[] = [{ functionDeclarations: appTools }];
      let modelName = 'gemini-3-pro-preview';

      // Always include search for better Q&A
      tools.push({ googleSearch: {} });

      const chat = ai.chats.create({
        model: modelName,
        config: { 
          systemInstruction, 
          tools,
          thinkingConfig: { thinkingBudget: 4096 }
        },
        history: messages.slice(-12).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      let responseStream = await chat.sendMessageStream({ message: text });
      let fullText = '';
      let toolCallsList: ToolCallDetails[] = [];
      let sources: any[] = [];

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg));
        }

        const cand = c.candidates?.[0];
        if (cand?.groundingMetadata?.groundingChunks) {
          sources = cand.groundingMetadata.groundingChunks.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Knowledge Source'
          })).filter((s: any) => s.uri !== '');
          
          setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, sources } : msg));
        }

        if (cand?.content?.parts) {
          for (const part of cand.content.parts) {
            if (part.functionCall) {
              toolCallsList.push({ 
                id: part.functionCall.id || `tc-${Date.now()}`, 
                name: part.functionCall.name, 
                args: part.functionCall.args as any 
              });
              setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, toolCalls: [...toolCallsList] } : msg));
            }
          }
        }
      }

      setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, isStreaming: false } : msg));
    } catch (e: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: `Neural jitter detected. Re-establishing link...`, isStreaming: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, speakMessage, isLoading, currentMode, setCurrentMode };
};