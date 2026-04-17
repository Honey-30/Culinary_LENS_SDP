import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface CookingTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  label?: string;
  suggested?: boolean;
}

export const CookingTimer: React.FC<CookingTimerProps> = ({ duration, onComplete, autoStart = false, label = 'Step Timer', suggested = false }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(autoStart);
  }, [duration, autoStart]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete?.();
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.4)]">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-zinc-200"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="175.9"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 175.9 * (1 - progress / 100) }}
            className="text-blue-600"
          />
        </svg>
        <span className="absolute text-xs font-mono font-bold text-zinc-900">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex-1">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggle}
            className={`p-2 rounded-lg transition-all ${isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={reset}
            className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        {suggested && (
          <p className="text-[10px] text-zinc-400 italic mt-1">Suggested</p>
        )}
      </div>
    </div>
  );
};
