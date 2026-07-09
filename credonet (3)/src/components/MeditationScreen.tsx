import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface MeditationScreenProps {
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function MeditationScreen({ addXP, userProfile }: MeditationScreenProps) {
  const [breatheRunning, setBreatheRunning] = useState(false);
  const [breathePhase, setBreathePhase] = useState(0); // 0 = Inhale, 1 = Hold, 2 = Exhale
  const [breatheSeconds, setBreatheSeconds] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const breatheSequence = [
    { label: "Breathe In", dur: 4, phase: "Inhale 4s", scale: "scale-115" },
    { label: "Hold", dur: 7, phase: "Hold 7s", scale: "scale-115" },
    { label: "Breathe Out", dur: 8, phase: "Exhale 8s", scale: "scale-100" },
  ];

  const handleStartStop = () => {
    if (breatheRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setBreatheRunning(false);
      setBreathePhase(0);
      setBreatheSeconds(4);
    } else {
      setBreatheRunning(true);
      setBreathePhase(0);
      setBreatheSeconds(4);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBreatheRunning(false);
    setBreathePhase(0);
    setBreatheSeconds(4);
  };

  useEffect(() => {
    if (breatheRunning) {
      timerRef.current = setInterval(() => {
        setBreatheSeconds((prevSecs) => {
          if (prevSecs <= 1) {
            // Transition to the next phase
            const nextPhase = (breathePhase + 1) % breatheSequence.length;
            setBreathePhase(nextPhase);
            addXP(15, "Completed breathing meditation stage cycle");
            return breatheSequence[nextPhase].dur;
          }
          return prevSecs - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breatheRunning, breathePhase]);

  const currentSeq = breatheSequence[breathePhase];

  // Determine breath scale based on current stage
  let animateScale = 1.0;
  if (breatheRunning) {
    if (breathePhase === 0) {
      animateScale = 1.35; // Grow
    } else if (breathePhase === 1) {
      animateScale = 1.35; // Hold expanded
    } else {
      animateScale = 1.0; // Shrink
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
          Wellness Loop
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Meditation & Mindfulness
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          AI-guided sessions tailored to your current stress level.{" "}
          <span className="text-amber-400 font-bold">+15 XP per cycle</span>
        </p>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="meditation"
        contextData={{
          sessionName: "4-7-8 Breathing",
          isRunning: breatheRunning,
          currentPhase: currentSeq.label,
          currentStage: currentSeq.phase,
        }}
        userProfile={userProfile}
      />

      {/* Breathing Guide Area */}
      <div className="bg-gradient-to-br from-teal-950/20 to-blue-950/20 border border-teal-500/15 rounded-2xl p-6 text-center space-y-6">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Current Session</div>
          <h3 className="text-lg font-bold text-white mt-1">4-7-8 Breathing</h3>
        </div>

        {/* Breathing Animation Circle */}
        <div className="relative flex items-center justify-center py-6 h-48">
          {breatheRunning && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.3 }}
              animate={{ 
                scale: animateScale * 1.3, 
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4, 
                ease: "easeInOut" 
              }}
              className="absolute w-36 h-36 rounded-full bg-teal-500/10 border border-teal-400/30 pointer-events-none"
            />
          )}

          <motion.div
            animate={{ scale: animateScale }}
            transition={{ 
              duration: breathePhase === 0 ? 4 : breathePhase === 2 ? 8 : 0.8, 
              ease: "easeInOut" 
            }}
            className="w-36 h-36 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/10 border-2 border-teal-400/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.15)] z-10"
          >
            <span className="text-sm font-bold text-teal-400">
              {breatheRunning ? `${currentSeq.label} (${breatheSeconds}s)` : "Ready"}
            </span>
            {breatheRunning && (
              <span className="text-[10px] text-slate-400 mt-1">{currentSeq.phase}</span>
            )}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartStop}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>{breatheRunning ? "Stop" : "Start"}</span>
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
