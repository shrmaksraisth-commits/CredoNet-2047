import React, { useState } from "react";
import { User, Award, ShieldAlert, Edit2, Check, X, GraduationCap, BookOpen, Briefcase, UserCheck } from "lucide-react";

interface ProfileScreenProps {
  xp: number;
  levelInfo: {
    level: number;
    title: string;
    xpProgress: number;
    xpNeededForNext: number;
    percentage: number;
  };
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
  setUserProfile: React.Dispatch<React.SetStateAction<{ name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null>>;
  onSignOut?: () => void;
}

export default function ProfileScreen({ xp, levelInfo, userProfile, setUserProfile, onSignOut }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || "");
  const [error, setError] = useState("");

  const roles = ["Student", "Teacher", "Working Professional", "Other"];

  const initialIsOther = userProfile?.role && !["Student", "Teacher", "Working Professional"].includes(userProfile.role);
  const [editRole, setEditRole] = useState(initialIsOther ? "Other" : (userProfile?.role || ""));
  const [customRole, setCustomRole] = useState(initialIsOther ? userProfile!.role : "");
  const [editTheme, setEditTheme] = useState<"light" | "dark">(userProfile?.theme || "dark");

  const getInitials = (fullName: string) => {
    const cleanName = fullName.trim();
    if (!cleanName) return "U";
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  const handleSave = () => {
    if (!editName.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!editRole) {
      setError("Please select a role.");
      return;
    }
    if (editRole === "Other" && !customRole.trim()) {
      setError("Please write down your custom designation.");
      return;
    }
    setUserProfile({
      name: editName.trim(),
      role: editRole === "Other" ? customRole.trim() : editRole,
      theme: editTheme,
    });
    setIsEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setEditName(userProfile?.name || "");
    const initialIsOther = userProfile?.role && !["Student", "Teacher", "Working Professional"].includes(userProfile.role);
    setEditRole(initialIsOther ? "Other" : (userProfile?.role || ""));
    setCustomRole(initialIsOther ? userProfile!.role : "");
    setEditTheme(userProfile?.theme || "dark");
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/15 rounded-2xl p-6 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {!isEditing ? (
          <div className="text-center space-y-4">
            {/* Avatar */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 border-2 border-white/10 shadow-xl select-none">
              <span className="text-2xl font-extrabold text-white">
                {getInitials(userProfile?.name || "Arjun Kumar")}
              </span>
            </div>

            {/* Username & Role */}
            <div>
              <h2 className="text-lg font-bold text-white leading-none flex items-center justify-center gap-2">
                <span>{userProfile?.name || "Arjun Kumar"}</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium block mt-1.5 bg-slate-900/60 border border-white/5 rounded-full px-3 py-1 inline-block">
                {userProfile?.role || "Student"}
              </span>
            </div>

            {/* Badges pills */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                Level {levelInfo.level}
              </span>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                {levelInfo.title} Tier
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                CredoNet Explorer
              </span>
            </div>

            {/* Edit Button */}
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setEditName(userProfile?.name || "");
                  const initialIsOther = userProfile?.role && !["Student", "Teacher", "Working Professional"].includes(userProfile.role);
                  setEditRole(initialIsOther ? "Other" : (userProfile?.role || ""));
                  setCustomRole(initialIsOther ? userProfile!.role : "");
                  setEditTheme(userProfile?.theme || "dark");
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Profile Details</span>
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500/10 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
                >
                  <X className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-white">Update Profile</h3>
            
            {/* Edit Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/40"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
              />
            </div>

            {/* Edit Role */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Your Role
              </label>
              <select
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">Select role...</option>
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {editRole === "Other" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Custom Designation
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/40"
                  value={customRole}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  placeholder="Enter your custom role (e.g. Graphic Designer)"
                />
              </div>
            )}

            {/* Edit Theme */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Theme
              </label>
              <select
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                value={editTheme}
                onChange={(e) => setEditTheme(e.target.value as "light" | "dark")}
              >
                <option value="light" className="bg-slate-900 text-white">Light Mode</option>
                <option value="dark" className="bg-slate-900 text-white">Dark Mode</option>
              </select>
            </div>

            {/* Error */}
            {error && <div className="text-rose-400 text-[10px] font-semibold">{error}</div>}

            {/* Form actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* XP Status bar */}
        <div className="space-y-2 pt-6 mt-6 border-t border-white/5 text-left max-w-sm mx-auto">
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span>XP Progress</span>
            <span>
              {levelInfo.xpProgress.toLocaleString()} / {levelInfo.xpNeededForNext.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 text-center">
            {levelInfo.xpNeededForNext - levelInfo.xpProgress} XP until your next leveling milestone
          </div>
        </div>
      </div>
    </div>
  );
}
