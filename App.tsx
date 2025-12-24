
import React, { useState, useEffect } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import FrequencyOrb from './components/FrequencyOrb';
import ChatInterface from './components/ChatInterface';
import MemoryPanel from './components/MemoryPanel';
import Onboarding from './components/Onboarding';
import { 
  Mic, MicOff, Heart, Square, Loader2, MessageSquare, 
  Database, Activity, Terminal, X, Zap, RefreshCw, Info
} from 'lucide-react';

const App: React.FC = () => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const { 
    connect, disconnect, status, isAiSpeaking, isUserSpeaking, volumeLevels, errorMsg, transcript,
    inputAnalyzer, outputAnalyzer, logs 
  } = useLiveSession(isMicMuted);

  useEffect(() => {
    const seen = localStorage.getItem('thursday_onboarding_seen');
    if (seen) setShowOnboarding(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('thursday_onboarding_seen', 'true');
    setShowOnboarding(false);
    setTimeout(() => {
      connect();
    }, 800);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 via-violet-600 to-rose-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Heart className="text-white" size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-white uppercase italic">THURSDAY</h1>
            <p className="text-[8px] text-stone-500 tracking-[0.4em] font-mono uppercase">Vocal Successor v3.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-stone-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-800/50">
           <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse' : 
                status === 'error' ? 'bg-rose-500' : 'bg-stone-700'
              }`} />
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
                {status}
              </span>
           </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[160px] animate-pulse" />
        </div>

        {errorMsg && (
          <div className="absolute top-10 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-6 py-3 rounded-2xl flex flex-col items-center gap-3 z-30 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 shadow-2xl">
            <div className="flex items-center gap-3">
               <Activity size={18} className="text-rose-500" />
               <span className="font-mono text-[11px] uppercase tracking-tighter">{errorMsg}</span>
            </div>
            <button onClick={() => connect()} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold rounded-xl flex items-center gap-2 transition-all uppercase tracking-widest">
               <RefreshCw size={12} /> Sync Link
            </button>
          </div>
        )}

        <div className="z-10 flex flex-col items-center transition-all duration-700 w-full" style={{ 
          opacity: isChatOpen || isMemoryOpen || isDebugOpen ? 0.05 : 1, 
          transform: `scale(${isChatOpen || isMemoryOpen || isDebugOpen ? 0.8 : 1})` 
        }}>
          <FrequencyOrb 
            isActive={status === 'connected'} 
            isSpeaking={isAiSpeaking} 
            isUserSpeaking={isUserSpeaking}
            volume={isAiSpeaking ? volumeLevels.ai : volumeLevels.user}
            analyzer={isAiSpeaking ? outputAnalyzer : inputAnalyzer}
          />
          
          <div className="text-center mt-12 min-h-[160px] max-w-xl w-full flex flex-col items-center justify-center space-y-6">
            {status === 'connected' ? (
              <div className="space-y-6 w-full px-4">
                 <div className="space-y-1">
                    <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
                      {isAiSpeaking ? "Thursday is speaking..." : isUserSpeaking ? "Hearing you..." : "Ready to listen"}
                    </h2>
                    <p className="text-indigo-400/60 font-mono text-[10px] tracking-[0.4em] uppercase italic">
                      Sanctuary Link Established
                    </p>
                 </div>
                 
                 <div className="bg-stone-900/40 border border-stone-800/50 backdrop-blur-md px-8 py-4 rounded-3xl w-full max-w-lg min-h-[80px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                    {transcript.ai ? (
                      <p className="text-indigo-100 text-sm md:text-base italic font-medium leading-relaxed text-center">"{transcript.ai}"</p>
                    ) : transcript.user ? (
                      <p className="text-stone-400 text-sm md:text-base leading-relaxed text-center">"{transcript.user}"</p>
                    ) : (
                      <p className="text-stone-600 text-[10px] font-mono uppercase tracking-[0.3em]">Sanctuary Silence</p>
                    )}
                 </div>
              </div>
            ) : status === 'connecting' || status === 'initializing' ? (
              <div className="space-y-8 w-full max-w-xs">
                 <h2 className="text-xl font-bold text-stone-400 tracking-[0.3em] animate-pulse italic uppercase text-center">Initiating Sync...</h2>
                 <div className="relative w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-600 animate-[progress_2s_linear_infinite]" />
                 </div>
              </div>
            ) : (
              <button onClick={() => connect()} className="group relative flex flex-col items-center transition-all hover:scale-105 active:scale-95">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white text-stone-950 flex items-center justify-center shadow-2xl relative z-10">
                   <Zap size={36} fill="currentColor" />
                </div>
                <h2 className="mt-8 text-2xl md:text-4xl font-black text-white tracking-widest uppercase italic group-hover:text-indigo-400 transition-colors text-center">INITIALIZE LINK</h2>
              </button>
            )}
          </div>
        </div>

        <MemoryPanel isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
        <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {isDebugOpen && (
          <div className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-stone-950/98 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 flex flex-col">
            <div className="p-6 border-b border-stone-800 flex items-center justify-between">
              <h2 className="text-stone-100 font-mono text-sm tracking-widest uppercase">Link Diagnostics</h2>
              <button onClick={() => setIsDebugOpen(false)} className="text-stone-500 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 custom-scrollbar">
              {logs.map(log => (
                <div key={log.id} className="p-2 bg-stone-900/50 rounded-lg border border-stone-800/30">
                  <span className={`font-bold ${log.level === 'error' ? 'text-rose-500' : 'text-indigo-400'}`}>{log.level.toUpperCase()}</span>
                  <p className="text-stone-300 mt-1">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* UI Controls */}
      <footer className="p-6 md:p-10 flex justify-center z-20">
        <div className="bg-stone-900/70 backdrop-blur-3xl border border-stone-800/40 rounded-[3rem] px-8 py-4 flex items-center gap-6 md:gap-10 shadow-2xl">
          <ControlBtn active={isMemoryOpen} onClick={() => setIsMemoryOpen(!isMemoryOpen)} icon={<Database size={22} />} />
          
          <div className="relative group">
            {status === 'connected' ? (
              <button 
                onClick={() => setIsMicMuted(!isMicMuted)} 
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${isMicMuted ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/50' : 'bg-white text-stone-950'}`}
              >
                {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            ) : (
              <button onClick={() => connect()} className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center transition-all shadow-xl hover:bg-indigo-500 active:scale-95">
                <Zap size={24} fill="currentColor" />
              </button>
            )}
          </div>

          <ControlBtn active={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} icon={<MessageSquare size={22} />} />
          <ControlBtn active={isDebugOpen} onClick={() => setIsDebugOpen(!isDebugOpen)} icon={<Terminal size={22} />} />
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const ControlBtn = ({ active, onClick, icon }: any) => (
  <button 
    className={`p-4 md:p-5 rounded-full transition-all ${active ? 'bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg' : 'bg-stone-800/50 text-stone-500 hover:text-stone-300'}`} 
    onClick={onClick}
  >
    {icon}
  </button>
);

export default App;
