import React, { useEffect, useRef, useState } from 'react';

interface FrequencyOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  volume: number;
  analyzer: AnalyserNode | null;
}

const FrequencyOrb: React.FC<FrequencyOrbProps> = ({ isActive, isSpeaking, isUserSpeaking, volume, analyzer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const smoothedVolume = useRef(0);
  const [orbSize, setOrbSize] = useState(384);

  // Responsive scaling for the orb centerpiece
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth - 40, 420);
      setOrbSize(size);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getEmotionalClass = () => {
    if (isSpeaking) return 'calm';
    if (isUserSpeaking) return 'alert';
    if (isActive) return 'happy';
    return '';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      
      smoothedVolume.current += (volume - smoothedVolume.current) * 0.1;
      const baseR = isActive ? (orbSize / 4.5) + (smoothedVolume.current / 2) : (orbSize / 5);

      ctx.clearRect(0, 0, w, h);

      if (isActive && analyzer) {
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyzer.getByteFrequencyData(dataArray);

        // 1. Background Ambient Neural Mesh
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + (orbSize / 8), 0, Math.PI * 2);
        const outerGrad = ctx.createRadialGradient(cx, cy, baseR - 40, cx, cy, baseR + 120);
        outerGrad.addColorStop(0, isSpeaking ? 'rgba(99, 102, 241, 0.15)' : 'rgba(139, 92, 246, 0.1)');
        outerGrad.addColorStop(1, 'rgba(12, 10, 9, 0)');
        ctx.fillStyle = outerGrad;
        ctx.fill();
        ctx.restore();

        // 2. Secondary Floating Ring
        const time = Date.now() / 1500;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 25 + Math.sin(time) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = isUserSpeaking ? 'rgba(244, 63, 94, 0.2)' : 'rgba(165, 180, 252, 0.15)';
        ctx.setLineDash([5, 15]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // 3. High-Fidelity Frequency Waves (Dual Layer)
        const renderWave = (multiplier: number, opacity: number, color: string) => {
          ctx.beginPath();
          for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const amp = dataArray[i];
            const r = baseR + (amp * (isSpeaking ? multiplier : multiplier * 0.5));
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = color;
          ctx.lineWidth = isSpeaking ? 3 : 2;
          ctx.globalAlpha = opacity;
          ctx.stroke();
        };

        renderWave(0.8, 0.8, isSpeaking ? '#818cf8' : '#6366f1');
        renderWave(0.4, 0.4, isSpeaking ? '#c4b5fd' : '#8b5cf6');

        // 4. Inner Luminescent Core
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR - 10);
        innerGrad.addColorStop(0, isSpeaking ? 'rgba(129, 140, 248, 0.7)' : 'rgba(255, 255, 255, 0.3)');
        innerGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.1)');
        innerGrad.addColorStop(1, 'rgba(12, 10, 9, 0)');
        ctx.fillStyle = innerGrad;
        ctx.globalAlpha = 1;
        ctx.fill();

      } else {
        const time = Date.now() / 1200;
        const breath = Math.sin(time) * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + breath, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(165, 180, 252, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, isSpeaking, isUserSpeaking, volume, analyzer, orbSize]);

  // Thinking particles refined logic
  useEffect(() => {
    if ((isSpeaking || isUserSpeaking) && particleContainerRef.current) {
       const container = particleContainerRef.current;
       const p = document.createElement('div');
       p.className = 'particle';
       p.style.left = `${Math.random() * 80 + 10}%`;
       p.style.bottom = '30%';
       p.style.animationDuration = `${Math.random() * 2 + 3}s`;
       p.style.backgroundColor = isSpeaking ? 'rgba(129, 140, 248, 0.6)' : 'rgba(99, 102, 241, 0.6)';
       container.appendChild(p);
       setTimeout(() => p.remove(), 4000);
    }
  }, [isSpeaking, isUserSpeaking]);

  return (
    <div 
      className={`relative flex items-center justify-center core-node ${getEmotionalClass()}`} 
      style={{ width: orbSize, height: orbSize }}
    >
      <div ref={particleContainerRef} className="neural-particles" />
      <canvas 
        ref={canvasRef} 
        width={orbSize} 
        height={orbSize} 
        className="transition-all duration-1000 pointer-events-none drop-shadow-[0_0_60px_rgba(99,102,241,0.2)]" 
      />
      {isActive && (isSpeaking || isUserSpeaking) && (
        <div 
          className={`absolute rounded-full animate-[ping_3s_ease-out_infinite] border border-indigo-500/10 pointer-events-none ${isUserSpeaking ? 'opacity-100' : 'opacity-40'}`}
          style={{ width: orbSize * 0.7, height: orbSize * 0.7 }}
        />
      )}
    </div>
  );
};

export default FrequencyOrb;