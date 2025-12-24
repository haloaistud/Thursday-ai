
import React, { useState } from 'react';
import { Heart, Mic, Loader2, ChevronRight, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onComplete();
    } catch (e) {
      setError("I need microphone access to talk to you.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-rose-600/10 rounded-full blur-[160px] animate-pulse-slow" />
      </div>

      <div className="max-w-md w-full space-y-12 z-10 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-400 via-violet-600 to-rose-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Heart className="text-white" size={48} fill="currentColor" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">THURSDAY</h1>
            <p className="text-stone-500 font-mono text-[10px] tracking-[0.4em] uppercase">Vocal Intelligence Sanctuary</p>
          </div>
        </div>

        <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-[2.5rem] backdrop-blur-xl space-y-8">
          <div className="space-y-3">
            <div className="flex justify-center mb-4">
               <ShieldCheck className="text-indigo-400" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Neural Bridge Request</h2>
            <p className="text-stone-400 text-sm leading-relaxed">
              To communicate effectively, I need access to your microphone. Your voice data is processed securely to build our connection.
            </p>
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-mono uppercase tracking-widest bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          <button 
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full py-5 bg-white text-stone-950 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-stone-50 transition-all active:scale-95 shadow-2xl text-lg tracking-widest disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                INITIALIZE VOICE <Mic size={20} />
              </>
            )}
          </button>
        </div>

        <p className="text-stone-600 text-[9px] font-mono uppercase tracking-[0.2em]">
          By proceeding, you enter the Sanctuary Protocol.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
