import React, { useState } from "react";
import { Zap, Plus, Trash2 } from "lucide-react";
import { Habit } from "../types";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface HabitsScreenProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function HabitsScreen({ habits, setHabits, addXP, userProfile }: HabitsScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [streak, setStreak] = useState(0);

  const daysLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleSaveHabit = () => {
    if (!name.trim()) return;

    const newHabit: Habit = {
      id: Date.now(),
      name,
      streak,
      days: [false, false, false, false, false, false, false],
    };

    setHabits((prev) => [...prev, newHabit]);
    addXP(30, `Registered daily habit: "${name}"`);
    setName("");
    setStreak(0);
    setShowForm(false);
  };

  const handleToggleDay = (habitId: number, dayIdx: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updatedDays = [...h.days];
          updatedDays[dayIdx] = !updatedDays[dayIdx];
          
          let updatedStreak = h.streak;
          if (updatedDays[dayIdx]) {
            updatedStreak += 1;
            // Execute state callback safely inside React batch
            setTimeout(() => addXP(30, `Completed daily habit: "${h.name}"`), 10);
          } else {
            updatedStreak = Math.max(0, updatedStreak - 1);
          }

          return { ...h, days: updatedDays, streak: updatedStreak };
        }
        return h;
      })
    );
  };

  const handleDeleteHabit = (id: number) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    addXP(10, "Habit checklist archived");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">Habit Tracker</h2>
          <p className="text-xs text-slate-400 mt-1">
            Build atomic habits with dynamic streak tracking and daily checkmarks.{" "}
            <span className="text-amber-400 font-bold">+30 XP</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="habits"
        contextData={habits.map((h) => ({ name: h.name, streak: h.streak }))}
        userProfile={userProfile}
      />

      {/* Add form */}
      {showForm && (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Habit Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-600 px-3.5 py-2 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="e.g., Drink 3L water"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Starting Streak (days)</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3.5 py-2 outline-none focus:border-blue-500/50 transition-colors"
              value={streak}
              onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={handleSaveHabit}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Save Habit
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Habits rows */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4">
        {habits.length > 0 ? (
          habits.map((h) => (
            <div
              key={h.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 rounded-xl gap-4"
            >
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200">{h.name}</div>
                {/* Weekday boxes */}
                <div className="flex gap-1.5 mt-2.5">
                  {h.days.map((checked, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleDay(h.id, idx)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold border transition-all cursor-pointer ${
                        checked
                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                          : "border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                      title={daysLabels[idx]}
                    >
                      {daysLabels[idx].substring(0, 1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                <div className="text-right">
                  <div className="text-xs text-amber-400 font-bold flex items-center gap-1 justify-end">
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Streak: {h.streak}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHabit(h.id)}
                  className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 text-center py-6">No habits registered.</div>
        )}
      </div>
    </div>
  );
}
