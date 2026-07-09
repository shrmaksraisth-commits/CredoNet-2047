import React, { useState } from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { Goal } from "../types";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface GoalsScreenProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function GoalsScreen({ goals, setGoals, addXP, userProfile }: GoalsScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("EDU");
  const [pct, setPct] = useState(0);
  const [color, setColor] = useState("#2563EB");

  const handleSaveGoal = () => {
    if (!name.trim()) return;

    const newGoal: Goal = {
      id: Date.now(),
      name,
      pct,
      deadline: "Ongoing",
      color,
      code: code.toUpperCase().trim(),
    };

    setGoals((prev) => [...prev, newGoal]);
    addXP(100, `Initiated new goal track: "${name}"`);
    setName("");
    setCode("EDU");
    setPct(0);
    setColor("#2563EB");
    setShowAddForm(false);
  };

  const handleDeleteGoal = (id: number) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    addXP(10, "Goal archive tracked");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">Goal Planner</h2>
          <p className="text-xs text-slate-400 mt-1">
            AI breaks your goals into daily actions.{" "}
            <span className="text-amber-400 font-bold">+100 XP</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Goal</span>
        </button>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="goals"
        contextData={goals.map((g) => ({ title: g.name, progress: g.pct, category: g.code, deadline: g.deadline }))}
        userProfile={userProfile}
      />

      {/* Add Goal form inline */}
      {showAddForm && (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Goal Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-600 px-3.5 py-2 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="e.g., Learn React hooks & structures"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category Code</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-600 px-3.5 py-2 outline-none focus:border-blue-500/50 transition-colors"
                placeholder="e.g., EDU, FIT, DEV"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Completion %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3.5 py-2 outline-none"
                value={pct}
                onChange={(e) => setPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Color Theme</label>
            <select
              className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="#2563EB">Blue</option>
              <option value="#22C55E">Green</option>
              <option value="#7C3AED">Purple</option>
              <option value="#F59E0B">Amber</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={handleSaveGoal}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Save Goal
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goal Items List */}
      <div className="space-y-3">
        {goals.map((g) => (
          <div key={g.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {g.code}
                </span>
                <span className="text-sm font-semibold text-slate-200">{g.name}</span>
              </div>
              <span className="text-xs font-bold text-sky-400">{g.pct}%</span>
            </div>
            <div className="bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${g.pct}%`, backgroundColor: g.color }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Deadline: {g.deadline}</span>
              <button
                onClick={() => handleDeleteGoal(g.id)}
                className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider text-[10px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
