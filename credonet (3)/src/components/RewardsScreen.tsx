import React from "react";
import { Coins, Award, Clock, Sparkles } from "lucide-react";
import { XPLog, Quest } from "../types";

interface RewardsScreenProps {
  xp: number;
  levelInfo: {
    level: number;
    title: string;
    xpProgress: number;
    xpNeededForNext: number;
    percentage: number;
  };
  quests: Quest[];
  xpLogs: XPLog[];
}

export default function RewardsScreen({
  xp,
  levelInfo,
  quests,
  xpLogs,
}: RewardsScreenProps) {
  const milestoneBadges = [
    { id: "b1", name: "Mindfulness", req: 1, desc: "Level 1 Reached", emoji: "🧘" },
    { id: "b2", name: "Acolyte", req: 2, desc: "Level 2 Reached", emoji: "⚡" },
    { id: "b3", name: "Innovator", req: 4, desc: "Level 4 Reached", emoji: "🚀" },
    { id: "b4", name: "Elite Sage", req: 7, desc: "Level 7 Reached", emoji: "👑" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
          Gamified Engagement
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          XP & Point Rewards System
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gain XP for every productive activity you do. Complete challenges to rank up your profile!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
              Your Milestones
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-amber-400">Level {levelInfo.level}</span>
              <span className="text-xs text-slate-400">{levelInfo.title} Rank</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every action you take feeds directly into the progress engine. Leveling up unlocks status and exclusive achievements.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
              <span>XP Progress</span>
              <span>
                {levelInfo.xpProgress.toLocaleString()} / {levelInfo.xpNeededForNext.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Earning Guide */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">How to Earn XP</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { act: "📋 Plan a Goal", val: "+100 XP" },
              { act: "🎯 Complete a Task", val: "+50 XP" },
              { act: "✨ Run AI Scheduling", val: "+40 XP" },
              { act: "💧 Check Habit Tracker", val: "+30 XP" },
              { act: "🧘 Meditation Cycle", val: "+15 XP" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-slate-950/40 border border-white/5 rounded-lg text-xs"
              >
                <span className="text-slate-300 font-medium">{item.act}</span>
                <span className="text-emerald-400 font-bold">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Quests */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Daily Quests
          </h3>
          <div className="space-y-2">
            {quests.map((q) => (
              <div
                key={q.id}
                className={`flex items-center justify-between text-xs p-2.5 bg-slate-950/50 rounded-lg border border-white/5 ${
                  q.done ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center font-bold text-[9px] ${
                      q.done ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-600 text-slate-400"
                    }`}
                  >
                    {q.done && "✓"}
                  </div>
                  <span className="text-slate-300 font-medium">{q.text}</span>
                </div>
                <span className={`font-semibold ${q.done ? "text-emerald-400" : "text-amber-400"}`}>
                  {q.done ? "Completed" : `+${q.xp} XP`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-sky-400" /> Milestone Badges
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {milestoneBadges.map((b) => {
              const isUnlocked = levelInfo.level >= b.req;
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                    isUnlocked
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
                      : "border-white/5 bg-slate-950/20 text-slate-500"
                  }`}
                >
                  <div className="text-xl mb-1">{isUnlocked ? b.emoji : "🔒"}</div>
                  <div className="text-[11px] font-bold truncate w-full">{b.name}</div>
                  <div className="text-[9px] opacity-75">{b.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Logs */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-400" /> XP Transaction Logs
        </h3>
        <p className="text-[11px] text-slate-500">Historical ledger of points generated in this session.</p>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-slate-900">
          {xpLogs.length > 0 ? (
            xpLogs.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 bg-slate-950/40 rounded-lg border border-white/5"
              >
                <span className="text-slate-300 font-medium">{log.desc}</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold font-mono">+{log.xp} XP</span>
                  <span className="text-[10px] text-slate-500">{log.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 py-4 text-center">No transactions recorded yet in this workspace session.</div>
          )}
        </div>
      </div>
    </div>
  );
}
