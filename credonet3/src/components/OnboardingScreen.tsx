import React, { useState } from "react";
import { User, Sparkles, BookOpen, GraduationCap, Briefcase, UserCheck } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: (name: string, role: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [error, setError] = useState("");

  const roles = [
    { id: "Student", label: "Student", desc: "For learners, high schoolers, and college students", icon: GraduationCap, color: "text-sky-400 border-sky-500/20 hover:border-sky-500/50 bg-sky-500/5" },
    { id: "Teacher", label: "Teacher", desc: "For educators, professors, and mentors", icon: BookOpen, color: "text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5" },
    { id: "Working Professional", label: "Working Professional", desc: "For career builders, developers, and corporate roles", icon: Briefcase, color: "text-purple-400 border-purple-500/20 hover:border-purple-500/50 bg-purple-500/5" },
    { id: "Other", label: "Other", desc: "For lifelong learners and general use", icon: UserCheck, color: "text-slate-400 border-slate-500/20 hover:border-slate-500/50 bg-slate-500/5" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to start.");
      return;
    }
    if (!role) {
      setError("Please select a primary role.");
      return;
    }
    if (role === "Other" && !customRole.trim()) {
      setError("Please write down your custom designation/role.");
      return;
    }
    setError("");
    const finalRole = role === "Other" ? customRole.trim() : role;
    onComplete(name.trim(), finalRole);
  };

  return (
    <div id="onboarding-container" className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B14] overflow-y-auto px-4 py-8">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#0D1527] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/25 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Digital India 2047 · CredoNet
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-purple-400">CredoNet</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set up your name and role to tailor your workspace and personalize your companion <span className="text-sky-400 font-bold">SIA</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              What should SIA call you?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="Enter your name (e.g. Arjun Kumar)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select your primary role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Briefcase className="w-4 h-4" />
              </div>
              <select
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError("");
                }}
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">Choose a designation...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === "Other" && (
            <div className="space-y-2 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Please specify your custom designation / role
              </label>
              <input
                type="text"
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium animate-pulse"
                placeholder="Enter your custom role (e.g. Graphic Designer, Farmer, Scientist)"
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                required
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-xs text-rose-400 text-center font-medium bg-rose-500/5 border border-rose-500/10 rounded-lg py-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Let's Get Started</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
