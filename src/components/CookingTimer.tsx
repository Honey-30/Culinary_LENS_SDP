import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface CookingTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
}

export const CookingTimer: React.FC<CookingTimerProps> = ({ duration, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-zinc-800"
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
            className="text-blue-500"
          />
        </svg>
        <span className="absolute text-xs font-mono font-bold text-white">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex-1">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Step Timer</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggle}
            className={`p-2 rounded-lg transition-all ${isActive ? 'bg-zinc-800 text-zinc-400' : 'bg-blue-600 text-white'}`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={reset}
            className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
