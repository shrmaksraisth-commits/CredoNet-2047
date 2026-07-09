import React, { useState, useEffect, useMemo, useRef } from "react";
import { Zap, Sparkles, Plus, Play, MessageSquare, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Habit, Goal, CalendarEvent, XPLog, MoodEntry } from "../types";
import ConfettiCanvas from "./ConfettiCanvas";

interface DashboardScreenProps {
  xp: number;
  tasks: Task[];
  toggleTask: (id: number) => void;
  setScreen: (screen: string) => void;
  levelInfo: {
    level: number;
    title: string;
    xpProgress: number;
    xpNeededForNext: number;
    percentage: number;
  };
  moodText: string;
  moodJournalLength: number;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
  habits: Habit[];
  goals: Goal[];
  calendarEvents: Record<string, CalendarEvent[]>;
  xpLogs: XPLog[];
  moodJournal: MoodEntry[];
}

export default function DashboardScreen({
  xp,
  tasks,
  toggleTask,
  setScreen,
  levelInfo,
  moodText,
  moodJournalLength,
  userProfile,
  habits,
  goals,
  calendarEvents,
  xpLogs,
  moodJournal,
}: DashboardScreenProps) {
  const [aiInsight, setAiInsight] = useState<string>("Your gaming level increases as you complete habits and schedule assignments! Hit your daily habit targets today for a massive +150 XP burst bonus.");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // Level up tracking state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string } | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize the level ref on mount
    if (prevLevelRef.current === null) {
      prevLevelRef.current = levelInfo.level;
      return;
    }

    // Trigger level up modal and confetti if current level exceeds previous level
    if (levelInfo.level > prevLevelRef.current) {
      setLevelUpData({
        level: levelInfo.level,
        title: levelInfo.title,
      });
      setShowLevelUp(true);
      setConfettiActive(true);

      // Reset confetti status after 5 seconds
      const timer = setTimeout(() => {
        setConfettiActive(false);
      }, 5000);

      prevLevelRef.current = levelInfo.level;
      return () => clearTimeout(timer);
    } else {
      // Keep ref synchronized if level drops or changes in other ways
      prevLevelRef.current = levelInfo.level;
    }
  }, [levelInfo.level, levelInfo.title]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchInsight = async () => {
      setIsInsightLoading(true);
      try {
        const prompt = `You are SIA, an AI companion. Give a 1-2 sentence insightful and encouraging message based on the user's current status:
User: ${userProfile?.name || "Player"} (${userProfile?.role || "Student"})
Level: ${levelInfo.level} (${levelInfo.title})
XP: ${xp}
Latest Mood: ${moodText}
Total Tasks: ${tasks.length} (Completed: ${tasks.filter(t => t.done).length})
Active Habits: ${habits.length}
Active Goals: ${goals.length}

Keep it brief, highly personalized, actionable, and friendly. Do NOT use emojis. Write in standard English with a touch of Hinglish if appropriate.`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: "You are SIA, generating a brief daily dashboard insight. Keep it 1-2 sentences maximum. No emojis.",
            model: "gemini-3.5-flash"
          })
        });

        if (response.ok) {
          const data = await response.json();
          let insight = "";
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            insight = data.candidates[0].content.parts[0].text;
          } else if (data.text) {
            insight = data.text;
          }
          if (insight) setAiInsight(insight.trim());
        }
      } catch (err) {
        console.error("Failed to fetch insight:", err);
      } finally {
        setIsInsightLoading(false);
      }
    };

    fetchInsight();
  }, []);

  const weeklyStats = useMemo(() => {
    const stats = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
      const dayName = weekdayNames[i];

      // Filter xp logs that happened on this day
      const dayLogs = xpLogs.filter(log => {
        if (!log.time) return false;
        if (/^\d{4}-\d{2}-\d{2}/.test(log.time)) {
          return log.time.startsWith(dateStr);
        }
        // Fallback to today if timestamp format is relative
        const todayStr = new Date().toLocaleDateString('en-CA');
        return dateStr === todayStr;
      });

      // 1. Completed tasks today (from xpLogs of task completion)
      const completedTasks = dayLogs.filter(l => 
        l.desc && l.desc.startsWith("Completed task:")
      ).length;

      // 2. Habits checked off for this day (direct from real habits checkboxes!)
      const activeHabits = habits.filter(h => h.days[i]).length;

      // 3. Events scheduled for this day
      const eventsCount = calendarEvents[dateStr]?.length || 0;

      // 4. Meditation logs on this day
      const meditationCount = dayLogs.filter(l => 
        l.desc && (l.desc.toLowerCase().includes("meditat") || l.desc.toLowerCase().includes("breathing"))
      ).length;

      // 5. Avg Mood score on this day (1-5 scale)
      const dayMoods = moodJournal.filter(m => {
        if (!m.timestamp) return false;
        if (/^\d{4}-\d{2}-\d{2}/.test(m.timestamp)) {
          return m.timestamp.startsWith(dateStr);
        }
        const todayStr = new Date().toLocaleDateString('en-CA');
        return dateStr === todayStr;
      });

      let avgMood = 0;
      if (dayMoods.length > 0) {
        const sum = dayMoods.reduce((acc, m) => {
          const lbl = m.label ? m.label.toLowerCase() : "";
          if (lbl.includes("happy") || lbl.includes("excited")) return acc + 5;
          if (lbl.includes("sad") || lbl.includes("anxious")) return acc + 1;
          return acc + 3; // stable/neutral default
        }, 0);
        avgMood = Math.round(sum / dayMoods.length);
      } else {
        // Fallback check in dayLogs for mood gains if moodJournal was empty or desynced
        const loggedMoodsFromXP = dayLogs.filter(l => l.desc && l.desc.startsWith("Logged daily mood:"));
        if (loggedMoodsFromXP.length > 0) {
          const sum = loggedMoodsFromXP.reduce((acc, l) => {
            const lbl = l.desc.toLowerCase();
            if (lbl.includes("happy") || lbl.includes("excited")) return acc + 5;
            if (lbl.includes("sad") || lbl.includes("anxious")) return acc + 1;
            return acc + 3;
          }, 0);
          avgMood = Math.round(sum / loggedMoodsFromXP.length);
        }
      }

      // Total daily sum
      const totalRaw = completedTasks + activeHabits + eventsCount + meditationCount + avgMood;

      stats.push({
        dayName,
        tasks: completedTasks * 15,
        habits: activeHabits * 15,
        events: eventsCount * 15,
        meditations: meditationCount * 15,
        mood: avgMood * 15,
        tasksRaw: completedTasks,
        habitsRaw: activeHabits,
        eventsRaw: eventsCount,
        meditationsRaw: meditationCount,
        moodRaw: avgMood,
        total: totalRaw * 15,
      });
    }

    // Normalize max to at least 100 for visual appeal, or dynamic max of actual scores
    const maxScore = Math.max(...stats.map(s => s.total), 100);
    return stats.map(s => ({
      ...s,
      tasksPct: (s.tasks / maxScore) * 100,
      habitsPct: (s.habits / maxScore) * 100,
      eventsPct: (s.events / maxScore) * 100,
      meditationsPct: (s.meditations / maxScore) * 100,
      moodPct: (s.mood / maxScore) * 100,
      totalPct: (s.total / maxScore) * 100
    }));
  }, [tasks, habits, calendarEvents, xpLogs, moodJournal]);

  const todayTasks = tasks.filter((t) => t.due === "Today").slice(0, 3);

  return (
    <div className="space-y-6 relative">
      <ConfettiCanvas active={confettiActive} />
      {/* Greeting and header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
            Digital India 2047 · {userProfile?.role || "Student"} Workspace
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            Good morning, {userProfile?.name || "Arjun"}
          </h2>
        </div>
        <button
          onClick={() => setScreen("rewards")}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-amber-500/20 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Level {levelInfo.level} — {levelInfo.title}
        </button>
      </div>

      {/* Metrics Row */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <motion.div 
          whileHover={{ scale: 1.02, translateY: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Gamified Level
            </div>
            <div className="text-2xl font-bold text-sky-400 font-sans">
              Lvl {levelInfo.level}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            XP: {levelInfo.xpProgress.toLocaleString()} / {levelInfo.xpNeededForNext.toLocaleString()}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, translateY: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Current Mood
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-sans">
              {moodText}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {moodJournalLength > 0 ? `${moodJournalLength} log(s) this session` : "No entries logged yet"}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, translateY: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Total XP Points
            </div>
            <div className="text-2xl font-bold text-purple-400 font-sans">
              {xp.toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2 text-emerald-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" /> +120 gained today
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* SIA Insight card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.005 }}
            className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white shrink-0 animate-pulse">
              SIA
            </div>
            <div>
              <div className="text-xs font-bold text-sky-400 mb-1">
                SIA Assistant Insight {isInsightLoading && <span className="text-sky-500/50 animate-pulse">...</span>}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
                {aiInsight}
              </p>
            </div>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Today's Tasks</h3>
              <button
                onClick={() => setScreen("tasks")}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.map((t, index) => (
                  <motion.div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-between p-2.5 bg-slate-900/50 hover:bg-slate-800/40 border border-white/5 rounded-lg cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all ${
                          t.done
                            ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold"
                            : "border-slate-600 hover:border-sky-400"
                        }`}
                      >
                        {t.done && "✓"}
                      </div>
                      <span className={`text-xs ${t.done ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {t.text}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        t.priority === "high"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : t.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">No tasks due today.</div>
              )}
            </div>
          </motion.div>

          {/* Activity charts */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Weekly Activity Score</h3>
              <div className="flex items-center gap-2 text-[9px] text-slate-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Tasks</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Habits</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Events</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div>Meditation</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-400"></div>Mood</div>
              </div>
            </div>
            <div className="flex items-end gap-3 h-24 px-2 pt-2">
              {weeklyStats.map((stat, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex flex-col justify-end h-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-950 border border-white/10 text-[9px] text-white rounded px-1.5 py-1 transition-opacity pointer-events-none z-10 w-max text-center">
                      <div className="font-bold text-sky-400 mb-0.5">{stat.dayName}</div>
                      {stat.tasksRaw > 0 && <div>Tasks: {stat.tasksRaw}</div>}
                      {stat.habitsRaw > 0 && <div>Habits: {stat.habitsRaw}</div>}
                      {stat.eventsRaw > 0 && <div>Events: {stat.eventsRaw}</div>}
                      {stat.meditationsRaw > 0 && <div>Zen: {stat.meditationsRaw}</div>}
                      {stat.moodRaw > 0 && <div>Mood: {stat.moodRaw}/5</div>}
                    </div>
                    {/* Stacked Bars */}
                    <div className="w-full flex flex-col justify-end h-full gap-[1px]">
                      {stat.moodPct > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${stat.moodPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="w-full bg-pink-400 opacity-80 group-hover:opacity-100 rounded-t-sm"
                        />
                      )}
                      {stat.meditationsPct > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${stat.meditationsPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
                          className="w-full bg-amber-400 opacity-80 group-hover:opacity-100"
                        />
                      )}
                      {stat.eventsPct > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${stat.eventsPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          className="w-full bg-purple-500 opacity-80 group-hover:opacity-100"
                        />
                      )}
                      {stat.habitsPct > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${stat.habitsPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                          className="w-full bg-emerald-500 opacity-80 group-hover:opacity-100"
                        />
                      )}
                      {stat.tasksPct > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${stat.tasksPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="w-full bg-blue-500 opacity-80 group-hover:opacity-100"
                        />
                      )}
                      
                      {/* Empty state fallback */}
                      {stat.tasksRaw === 0 && stat.habitsRaw === 0 && stat.eventsRaw === 0 && stat.meditationsRaw === 0 && stat.moodRaw === 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `10%` }}
                          transition={{ duration: 0.5 }}
                          className="w-full bg-white/5 opacity-50 group-hover:opacity-100 rounded-sm"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">{stat.dayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="space-y-6">
          {/* Wellness wheel stats */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-slate-400 mb-4">Wellness Balance</h3>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r="45"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 60 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                  className="opacity-90"
                />
                <circle cx="55" cy="55" r="33" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r="33"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="6"
                  strokeDasharray="207"
                  initial={{ strokeDashoffset: 207 }}
                  animate={{ strokeDashoffset: 55 }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  strokeLinecap="round"
                  className="opacity-85"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm font-bold text-white leading-none"
                >
                  88%
                </motion.span>
                <span className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                  overall
                </span>
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mood (79%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Focus (73%)</span>
              </div>
            </div>
          </div>
 
          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3"
          >
            <h3 className="text-xs font-semibold text-slate-400">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setScreen("focus")}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/5 bg-slate-900/60 hover:bg-slate-800/60 hover:border-blue-500/30 text-center gap-2 transition-all group shrink-0 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center transition-colors group-hover:bg-blue-500/20">
                  <Play className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Focus Mode</span>
              </motion.button>
 
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setScreen("ai")}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/5 bg-slate-900/60 hover:bg-slate-800/60 hover:border-teal-500/30 text-center gap-2 transition-all group shrink-0 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center transition-colors group-hover:bg-teal-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Talk to SIA</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Level Up Celebration Popup Overlay */}
      <AnimatePresence>
        {showLevelUp && levelUpData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            {/* Real-time Interactive Physics Confetti */}
            <ConfettiCanvas active={confettiActive} />

            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden"
            >
              {/* Ambient Background Glow inside Card */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing Trophy Badge */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.4)] relative">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
              </div>

              {/* Content text */}
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-tight font-sans mb-1 uppercase">
                Level Up!
              </h3>
              <p className="text-slate-400 text-xs mb-6 font-sans">
                Congratulations! Your active habits and task completions have raised your status on CredoNet!
              </p>

              {/* Level Comparison */}
              <div className="bg-slate-950/80 border border-white/5 rounded-xl p-4 mb-6 flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Previous</div>
                  <div className="text-xl font-bold text-slate-400 font-sans font-medium">Level {levelUpData.level - 1}</div>
                </div>
                <div className="text-amber-500 text-lg font-black">➔</div>
                <div>
                  <div className="text-[10px] text-amber-500 uppercase tracking-widest font-black mb-1">New Rank</div>
                  <div className="text-2xl font-black text-amber-400 animate-pulse font-sans">Level {levelUpData.level}</div>
                  <div className="text-[10px] font-bold text-slate-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mt-1 inline-block font-sans">
                    {levelUpData.title}
                  </div>
                </div>
              </div>

              {/* Unlocked Perks list */}
              <div className="text-left space-y-2.5 mb-6 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Rewards Unlocked:</div>
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300"><span className="font-semibold text-white">+200 XP Limit</span> unlocked for your progress</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300"><span className="font-semibold text-white">SIA's Friendly Mode Options</span> activated for your assistant chat</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300"><span className="font-semibold text-white">CredoNet Level Badge</span> added to your profile card</span>
                </div>
              </div>

              {/* Continue / Claim Button */}
              <button
                onClick={() => {
                  setShowLevelUp(false);
                  setConfettiActive(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.35)] cursor-pointer active:scale-[0.98] font-sans"
              >
                Claim Rewards & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
