import React, { useState } from "react";
import { Smile, MessageSquare, History, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MoodEntry } from "../types";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface MoodScreenProps {
  moodJournal: MoodEntry[];
  saveMoodEntry: (label: string, note: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function MoodScreen({ moodJournal, saveMoodEntry, userProfile }: MoodScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const moods = [
    { label: "Happy", code: "HP", color: "border-emerald-500 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" },
    { label: "Neutral", code: "NT", color: "border-amber-500 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
    { label: "Stressed", code: "ST", color: "border-red-500 text-red-400 bg-red-500/5 hover:bg-red-500/10" },
    { label: "Tired", code: "TR", color: "border-purple-500 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10" },
  ];

  const handleSelectMood = (idx: number) => {
    setSelectedIdx(idx);
    setShowNoteForm(true);
  };

  const handleSave = () => {
    if (selectedIdx === null) return;
    saveMoodEntry(moods[selectedIdx].label, note);
    // Reset form
    setSelectedIdx(null);
    setNote("");
    setShowNoteForm(false);
  };

  const handleCancel = () => {
    setSelectedIdx(null);
    setNote("");
    setShowNoteForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
          Mental Wellness
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          How are you feeling?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Log your mood to help SIA give better support and insights.{" "}
          <span className="text-amber-400 font-bold">+20 XP</span>
        </p>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="mood"
        contextData={moodJournal.slice(0, 5).map((m) => ({ mood: m.label, note: m.note, time: m.timestamp }))}
        userProfile={userProfile}
      />

      {/* Mood Buttons Selector */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Select your current mood
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moods.map((m, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={m.label}
                onClick={() => handleSelectMood(idx)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected ? "bg-sky-500/10 border-sky-400 text-sky-400 font-bold" : m.color
                }`}
              >
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px] font-bold mt-1 tracking-wider opacity-80">{m.code}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Note Form */}
        <AnimatePresence initial={false}>
          {showNoteForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-3 pt-3 border-t border-white/5 overflow-hidden"
            >
              <textarea
                className="w-full bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-200 placeholder-slate-600 p-3 h-20 outline-none focus:border-blue-500/50 resize-none transition-colors"
                placeholder="What's on your mind? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Save Mood
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly visualizer placeholder */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Week</h3>
          <div className="flex items-end gap-3 h-16 pt-2">
            {[30, 60, 45, 90, 75, 80, 50].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                  className="w-full rounded-sm bg-gradient-to-t from-sky-500 to-teal-400 opacity-80"
                />
                <span className="text-[9px] text-slate-500 font-semibold">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SIA Mood Analysis */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" /> AI Mood Analysis
          </h3>
          <div className="bg-blue-950/20 border border-blue-500/25 rounded-lg p-3 text-xs leading-relaxed text-slate-300">
            Your mood has been <strong className="text-emerald-400">60% positive</strong> this week. Best days: Tuesday & Thursday. You tend to feel low after long study sessions — try a 5-minute walk or a meditation cycle.
          </div>
        </div>
      </div>

      {/* Mood Journal history */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-sky-400" /> Mood Journal
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-950">
          {moodJournal.length > 0 ? (
            <AnimatePresence initial={false}>
              {moodJournal.map((entry, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  key={idx}
                  className="p-3 bg-slate-950/40 rounded-lg border border-white/5 flex justify-between items-start text-xs"
                >
                  <div>
                    <span className="font-bold text-sky-400">{entry.label}</span>
                    <p className="text-slate-400 mt-1">{entry.note}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-4">
                    {entry.timestamp}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-xs text-slate-500 py-6 text-center">No mood logs saved yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
