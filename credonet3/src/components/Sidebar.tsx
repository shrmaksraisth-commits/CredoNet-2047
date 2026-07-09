import React from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Bot,
  Coins,
  Smile,
  Moon,
  CheckSquare,
  Timer,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";

interface SidebarProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  currentScreen,
  setScreen,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const mainNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ai", label: "AI Assistant (SIA)", icon: Bot },
    { id: "rewards", label: "Rewards & XP", icon: Coins, iconClass: "text-amber-400" },
  ];

  const wellnessNav = [
    { id: "mood", label: "Mood Tracker", icon: Smile },
    { id: "meditation", label: "Meditation", icon: Moon },
  ];

  const prodNav = [
    { id: "tasks", label: "Task Manager", icon: CheckSquare },
    { id: "focus", label: "Focus Mode", icon: Timer },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "goals", label: "Goal Planner", icon: Target },
    { id: "habits", label: "Habit Tracker", icon: Zap },
    { id: "gmail", label: "Gmail Inbox", icon: Mail },
  ];

  const accountNav = [
    { id: "sos", label: "Your Crises Manager", icon: AlertTriangle },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderSection = (title: string, items: typeof mainNav) => (
    <div className="mb-4">
      {!collapsed && (
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-4 mb-1">
          {title}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium border-l-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-sky-500/10 border-sky-400 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.iconClass || ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-[#080E1A] border-r border-white/5 flex flex-col h-full transition-all duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-white/5 cursor-pointer hover:bg-slate-800/20"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="2" fill="#60A5FA" />
            <circle cx="18" cy="6" r="2" fill="#A78BFA" />
            <circle cx="6" cy="18" r="2" fill="#2DD4BF" />
            <circle cx="18" cy="18" r="2" fill="#60A5FA" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold tracking-tight text-white font-sans">
              Credo<span className="text-sky-400">Net</span>
            </div>
            <div className="text-[9px] text-slate-500 tracking-wider uppercase font-medium">
              Digital India 2047
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto pt-4 select-none scrollbar-thin scrollbar-thumb-slate-800">
        {renderSection("Main", mainNav)}
        {renderSection("Wellness", wellnessNav)}
        {renderSection("Productivity", prodNav)}
        {renderSection("Account", accountNav)}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="border-t border-white/5 p-3 flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors w-full text-xs font-medium"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 mx-auto" />
        ) : (
          <>
            <ChevronLeft className="w-4 h-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </div>
  );
}
