import React, { useState } from "react";
import { Plus, CheckSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface TasksScreenProps {
  tasks: Task[];
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  addTask: (text: string, priority: "high" | "medium" | "low", due: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function TasksScreen({
  tasks,
  toggleTask,
  deleteTask,
  addTask,
  userProfile,
}: TasksScreenProps) {
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [due, setDue] = useState("Today");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "today") return t.due === "Today";
    if (filter === "pending") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const handleSaveTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText, priority, due);
    setNewTaskText("");
    setPriority("medium");
    setDue("Today");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Task Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage, categorize, and complete study targets.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{showAddForm ? "Close Form" : "Add Task"}</span>
        </motion.button>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="tasks"
        contextData={tasks.map((t) => ({ text: t.text, priority: t.priority, due: t.due, completed: t.done }))}
        userProfile={userProfile}
      />

      {/* Task Filters */}
      <div className="flex gap-1 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none relative">
        {(["all", "today", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold capitalize relative transition-all cursor-pointer ${
              filter === f ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f}
            {filter === f && (
              <motion.div
                layoutId="activeTaskFilter"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Add Task Form Modal Inline */}
      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Task Title</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-600 px-3.5 py-2 outline-none focus:border-blue-500/50 transition-colors"
                placeholder="e.g., Physics Practice Problems"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
                <select
                  className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Due</label>
                <select
                  className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveTask}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Save Task
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
        {filteredTasks.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredTasks.map((t) => (
                <motion.div
                  layout
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950/60 border border-white/5 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => toggleTask(t.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-all cursor-pointer ${
                        t.done
                          ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold"
                          : "border-slate-600 hover:border-sky-400"
                      }`}
                    >
                      {t.done && "✓"}
                    </motion.button>
                    <span className={`text-xs ${t.done ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {t.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        t.priority === "high"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : t.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{t.due}</span>
                    <motion.button
                      whileHover={{ scale: 1.1, textShadow: "0 0 8px rgb(239, 68, 68)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-8">No tasks match this filter.</div>
        )}
      </div>
    </div>
  );
}
