import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface FocusScreenProps {
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function FocusScreen({ addXP, userProfile }: FocusScreenProps) {
  const [mins, setMins] = useState(25);
  const [secs, setSecs] = useState(0);
  const [pomoType, setPomoType] = useState<"Work" | "Short Break" | "Long Break">("Work");
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs((prevSecs) => {
          if (prevSecs === 0) {
            if (mins === 0) {
              // Timer Finished
              setRunning(false);
              if (timerRef.current) clearInterval(timerRef.current);
              addXP(100, `Completed Pomodoro focus block: ${pomoType}`);
              // Auto-toggle to break or work
              if (pomoType === "Work") {
                setPomoType("Short Break");
                setMins(5);
              } else {
                setPomoType("Work");
                setMins(25);
              }
              return 0;
            }
            setMins((prevMins) => prevMins - 1);
            return 59;
          }
          return prevSecs - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mins, pomoType]);

  const setPomoConfig = (minutes: number, type: typeof pomoType) => {
    setRunning(false);
    setMins(minutes);
    setSecs(0);
    setPomoType(type);
  };

  const handleReset = () => {
    setRunning(false);
    setMins(pomoType === "Work" ? 25 : pomoType === "Short Break" ? 5 : 15);
    setSecs(0);
  };

  // Radial Ring Progress
  const totalSeconds = pomoType === "Work" ? 25 * 60 : pomoType === "Short Break" ? 5 * 60 : 15 * 60;
  const currentSeconds = mins * 60 + secs;
  const progressRatio = currentSeconds / totalSeconds;
  const strokeDashoffset = 377 * (1 - progressRatio);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
          Deep Work
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">Focus Mode</h2>
        <p className="text-xs text-slate-400 mt-1">
          Pomodoro-powered deep study sessions with gamified rewards.{" "}
          <span className="text-amber-400 font-bold">+100 XP</span>
        </p>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="focus"
        contextData={{
          timerType: pomoType,
          minutesRemaining: mins,
          secondsRemaining: secs,
          isTimerActive: running,
        }}
        userProfile={userProfile}
      />

      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 text-center space-y-6">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Pomodoro Timer</div>
          <h3 className="text-sm font-semibold text-sky-400 mt-1">{pomoType} Session</h3>
        </div>

        {/* Timer SVG */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="#2563EB"
              strokeWidth="6"
              strokeDasharray="377"
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extrabold text-white font-mono leading-none">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1.5">
              {running ? "Focusing..." : "Paused"}
            </span>
          </div>
        </div>

        {/* Configurations */}
        <div className="flex gap-2 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPomoConfig(25, "Work")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              pomoType === "Work"
                ? "bg-blue-600/10 border-blue-500/30 text-blue-400 font-bold"
                : "border-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            25m Work
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPomoConfig(5, "Short Break")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              pomoType === "Short Break"
                ? "bg-teal-600/10 border-teal-500/30 text-teal-400 font-bold"
                : "border-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            5m Break
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPomoConfig(15, "Long Break")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              pomoType === "Long Break"
                ? "bg-purple-600/10 border-purple-500/30 text-purple-400 font-bold"
                : "border-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            15m Break
          </motion.button>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(!running)}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {running ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
            <span>{running ? "Pause" : "Start"}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Reset</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
