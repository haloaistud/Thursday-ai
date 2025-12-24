
import React from 'react';
import { X, Check, Heart, Sparkles, Wind, Shield, Zap, Info } from 'lucide-react';
import { VoiceName, VoiceOption } from '../types';

interface PersonaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  status: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Zephyr',
    label: 'Zephyr',
    description: 'The standard profile. Warm, supportive, and exceptionally human.',
    traits: 'Empathetic • Balanced • Mentor'
  },
  {
    id: 'Puck',
    label: 'Puck',
    description: 'High energy and quick wit. Perfect for motivation and brainstorming.',
    traits: 'Energetic • Playful • Creative'
  },
  {
    id: 'Charon',
    label: 'Charon',
    description: 'A deep, steady presence. Excellent for focus and deep reflection.',
    traits: 'Calm • Philosophical • Stoic'
  },
  {
    id: 'Kore',
    label: 'Kore',
    description: 'Soft-spoken and gentle. Designed for emotional vulnerability and safety.',
    traits: 'Gentle • Compassionate • Quiet'
  },
  {
    id: 'Fenrir',
    label: 'Fenrir',
    description: 'Direct and authoritative. Best for productivity and goal-setting.',
    traits: 'Firm • Analytical • Direct'
  }
];

const PersonaPanel: React.FC<PersonaPanelProps> = ({ isOpen, onClose, selectedVoice, onVoiceChange, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-full md:w-[420px] bg-stone-900/98 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-out">
      <div className="p-7 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Sparkles className="text-indigo-400" size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-stone-100 font-semibold tracking-tight text-lg">Vocal Persona</h2>
            <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">Select Thursday's Essence</p>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-500 hover:text-white p-2 hover:bg-stone-800 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 bg-indigo-500/5 border-b border-stone-800/50 flex items-start gap-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
          <Info size={16} className="text-indigo-400" />
        </div>
        <p className="text-[11px] text-stone-400 leading-relaxed italic">
          Changing the persona updates Thursday's vocal characteristics and conversational tone. 
          {status === 'connected' && (
            <span className="block mt-1 text-amber-500/80 font-medium">
              Note: For a full personality shift, restart the neural link after changing.
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
        {VOICE_OPTIONS.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onVoiceChange(voice.id)}
            className={`w-full text-left group relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
              selectedVoice === voice.id
                ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/20'
                : 'bg-stone-800/30 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
            }`}
          >
            {selectedVoice === voice.id && (
              <div className="absolute top-0 right-0 p-4">
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Check size={14} className="text-white" />
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold tracking-tight ${selectedVoice === voice.id ? 'text-indigo-300' : 'text-stone-200'}`}>
                  {voice.label}
                </span>
                <span className="text-[9px] bg-stone-900/80 text-stone-500 px-2 py-0.5 rounded-full uppercase font-mono border border-stone-800/50">
                  {voice.traits}
                </span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed group-hover:text-stone-300 transition-colors">
                {voice.description}
              </p>
            </div>

            {/* Subtle highlight effect */}
            <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ${
              selectedVoice === voice.id ? 'w-full' : 'w-0'
            }`} />
          </button>
        ))}
      </div>

      <div className="p-6 bg-stone-950/40 border-t border-stone-800">
         <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
               {selectedVoice === 'Puck' ? <Wind className="text-amber-400" /> : 
                selectedVoice === 'Charon' ? <Shield className="text-indigo-400" /> :
                selectedVoice === 'Kore' ? <Heart className="text-rose-400" /> :
                selectedVoice === 'Fenrir' ? <Zap className="text-emerald-400" /> :
                <Sparkles className="text-indigo-400" />}
            </div>
            <div>
               <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">Active Resonance</p>
               <p className="text-sm text-stone-200 font-medium">Thursday is {selectedVoice}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PersonaPanel;
