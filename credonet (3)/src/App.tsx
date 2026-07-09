import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import DashboardScreen from "./components/DashboardScreen";
import AIScreen from "./components/AIScreen";
import RewardsScreen from "./components/RewardsScreen";
import MoodScreen from "./components/MoodScreen";
import MeditationScreen from "./components/MeditationScreen";
import TasksScreen from "./components/TasksScreen";
import FocusScreen from "./components/FocusScreen";
import CalendarScreen from "./components/CalendarScreen";
import GoalsScreen from "./components/GoalsScreen";
import HabitsScreen from "./components/HabitsScreen";
import CrisisScreen from "./components/CrisisScreen";
import ProfileScreen from "./components/ProfileScreen";
import SettingsScreen from "./components/SettingsScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import GmailScreen from "./components/GmailScreen";
import TabTransitionPlane from "./components/TabTransitionPlane";

import { Task, Goal, Habit, CalendarEvent, MoodEntry, XPLog, Quest, ChatMessage } from "./types";
import { Search, Sparkles, LogIn, X, AlertCircle, AlertTriangle, Database } from "lucide-react";

import { auth, googleAuthProvider } from "./lib/firebase.ts";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser, GoogleAuthProvider } from "firebase/auth";

let nextToastId = 1;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [transitionKey, setTransitionKey] = useState("");

  const setScreen = (newScreen: string) => {
    if (newScreen === currentScreen) return;
    // 1. Immediately trigger the flying airplane animation
    setTransitionKey(newScreen + "_" + Date.now());
    // 2. Delay the actual screen mounting so the transition is perfectly covered by the paper airplane flight
    setTimeout(() => {
      setCurrentScreen(newScreen);
    }, 550);
  };

  const [collapsed, setCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Connecting to Cloud SQL...");
  const [saveStatusColor, setSaveStatusColor] = useState("bg-blue-500");
  const [userProfile, setUserProfile] = useState<{ name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean } | null>(null);

  // Auth and Synchronizing States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);

  // Sync Conflict Resolution States
  const [pendingConflict, setPendingConflict] = useState<{ local: any; cloud: any } | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);

  // App States
  const [xp, setXp] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [moodJournal, setMoodJournal] = useState<MoodEntry[]>([]);
  const [xpLogs, setXpLogs] = useState<XPLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Namaste! I'm SIA, your AI companion on CredoNet. I can manage your goals, set tasks, program habits, and dynamically schedule events using natural language. Try telling me \"Schedule an exam on July 4th at 2 PM for 2 hours\"!",
    },
  ]);

  // Quests list state derived or updated based on triggers
  const quests: Quest[] = [
    { id: "q1", text: "Complete a Task", xp: 50, done: tasks.some((t) => t.done), type: "task" },
    { id: "q2", text: "Log your Mood today", xp: 20, done: moodJournal.length > 1, type: "mood" },
    { id: "q3", text: "Do 1 cycle of Breathing Mindfulness", xp: 15, done: xpLogs.some((l) => l.desc.includes("Breathing") || l.desc.includes("breathing")), type: "meditate" },
    { id: "q4", text: "Schedule a Goal Action on Calendar", xp: 100, done: goals.length > 3, type: "goal" },
  ];

  // Helper: Detect mismatch between local device state and Cloud SQL
  const detectMismatch = (local: any, cloud: any) => {
    if (!local || !cloud) return false;
    // If cloud has profile but local doesn't, cloud is the source of truth, no conflict
    if (cloud.userProfile?.name && (!local.userProfile || !local.userProfile.name)) {
      return false;
    }
    
    // Compare essential fields
    if (local.xp !== cloud.xp) return true;
    
    // Compare tasks length or task content
    const localTasksCount = local.tasks?.length || 0;
    const cloudTasksCount = cloud.tasks?.length || 0;
    if (localTasksCount !== cloudTasksCount) return true;

    const localTasksKey = (local.tasks || []).map((t: any) => `${t.text}-${t.done}`).join("|");
    const cloudTasksKey = (cloud.tasks || []).map((t: any) => `${t.text}-${t.done}`).join("|");
    if (localTasksKey !== cloudTasksKey) return true;

    // Compare goals length
    const localGoalsCount = local.goals?.length || 0;
    const cloudGoalsCount = cloud.goals?.length || 0;
    if (localGoalsCount !== cloudGoalsCount) return true;

    // Compare habits length
    const localHabitsCount = local.habits?.length || 0;
    const cloudHabitsCount = cloud.habits?.length || 0;
    if (localHabitsCount !== cloudHabitsCount) return true;

    return false;
  };

  // Handle theme application based on user profile
  useEffect(() => {
    if (userProfile?.theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [userProfile?.theme]);

  // Helper: Apply cloud state completely to local React states
  const applyCloudState = (cloud: any) => {
    if (cloud.xp !== undefined) setXp(cloud.xp);
    if (cloud.tasks) setTasks(cloud.tasks);
    if (cloud.calendarEvents) setCalendarEvents(cloud.calendarEvents);
    if (cloud.goals) setGoals(cloud.goals);
    if (cloud.habits) setHabits(cloud.habits);
    if (cloud.moodJournal) setMoodJournal(cloud.moodJournal);
    if (cloud.xpLogs) setXpLogs(cloud.xpLogs);
    if (cloud.chatMessages) setChatMessages(cloud.chatMessages);
    if (cloud.userProfile) setUserProfile(cloud.userProfile);
  };

  // Helper: Keep local state (write to local storage & set loaded to trigger cloud save)
  const handleKeepLocal = () => {
    if (!pendingConflict || !pendingConflict.local) return;
    const local = pendingConflict.local;
    applyCloudState(local);
    try {
      localStorage.setItem("credonet_userdata_react", JSON.stringify(local));
    } catch (e) {
      console.error("Local save failed:", e);
    }
    setDataLoaded(true);
    setShowConflictModal(false);
    setPendingConflict(null);
    addToast("Keeping local state. Overwriting cloud with your local progress...", "blue");
  };

  // Helper: Overwrite with cloud state (set React states to cloud state & write to local storage)
  const handleOverwriteWithCloud = () => {
    if (!pendingConflict || !pendingConflict.cloud) return;
    const cloud = pendingConflict.cloud;
    applyCloudState(cloud);
    try {
      localStorage.setItem("credonet_userdata_react", JSON.stringify(cloud));
    } catch (e) {
      console.error("Local save of cloud state failed:", e);
    }
    setDataLoaded(true);
    setShowConflictModal(false);
    setPendingConflict(null);
    addToast("Overwritten with cloud state. Progress loaded successfully!", "green");
  };

  // 1. Initial Local Storage Restoration immediately on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("credonet_userdata_react");
      if (saved) {
        const restored = JSON.parse(saved);
        if (restored.xp !== undefined) setXp(restored.xp);
        if (restored.tasks) setTasks(restored.tasks);
        if (restored.calendarEvents) setCalendarEvents(restored.calendarEvents);
        if (restored.goals) setGoals(restored.goals);
        if (restored.habits) setHabits(restored.habits);
        if (restored.moodJournal) setMoodJournal(restored.moodJournal);
        if (restored.xpLogs) setXpLogs(restored.xpLogs);
        if (restored.chatMessages) setChatMessages(restored.chatMessages);
        if (restored.userProfile) setUserProfile(restored.userProfile);
      }
    } catch (e) {
      console.error("Local Storage restored error:", e);
    }
  }, []);

  // 2. Firebase Auth Listener & Cloud SQL Sync with Mismatch Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          setSaveStatus("Syncing with Cloud SQL...");
          setSaveStatusColor("bg-blue-400");
          
          const token = await user.getIdToken();
          const response = await fetch("/api/sync", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            // Fetch local state backup
            const savedLocal = localStorage.getItem("credonet_userdata_react");
            let localData = null;
            if (savedLocal) {
              try {
                localData = JSON.parse(savedLocal);
              } catch (e) {
                console.error("Failed to parse local storage data", e);
              }
            }

            // If the user profile is configured in Cloud SQL
            if (data.userProfile && data.userProfile.name) {
              // Check if we have local state and if they differ
              const hasConflict = detectMismatch(localData, data);
              if (hasConflict) {
                setPendingConflict({ local: localData, cloud: data });
                setShowConflictModal(true);
                setSaveStatus("Sync Conflict");
                setSaveStatusColor("bg-amber-500");
              } else {
                // No conflict, safe to apply cloud data
                applyCloudState(data);
                setSaveStatus("Cloud SQL Connected");
                setSaveStatusColor("bg-emerald-500");
                setDataLoaded(true);
              }
            } else {
              // New user in PostgreSQL: if we have local onboarding data, keep it; otherwise start onboarding
              if (localData && localData.userProfile && localData.userProfile.name) {
                applyCloudState(localData);
              } else {
                setUserProfile(null);
              }
              setSaveStatus("Cloud SQL Connected");
              setSaveStatusColor("bg-emerald-500");
              setDataLoaded(true);
            }
          } else {
            const errText = await response.text();
            console.warn("Failed to retrieve database sync state, utilizing local state. Status:", response.status, "Body:", errText);
            setSaveStatus("Sync Error");
            setSaveStatusColor("bg-amber-500");
            setDataLoaded(true); // fall back to local
          }
        } catch (e) {
          console.error("Network/Database Sync connection failed:", e);
          setSaveStatus("Sync Offline");
          setSaveStatusColor("bg-amber-500");
          setDataLoaded(true); // fall back to local
        }
      } else {
        setUserProfile(null);
        setDataLoaded(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Save changes to local storage and push synchronized transaction to PostgreSQL
  useEffect(() => {
    // Prevent overriding server data with empty state before load completes or during conflict resolution
    if (!currentUser || !dataLoaded || showConflictModal) return;

    setSaveStatus("Saving Progress...");
    setSaveStatusColor("bg-blue-400");

    const timer = setTimeout(async () => {
      const stateToSave = {
        xp,
        tasks,
        calendarEvents,
        goals,
        habits,
        moodJournal,
        xpLogs,
        chatMessages,
        userProfile,
      };

      // 1. Write immediately to local storage backup
      try {
        localStorage.setItem("credonet_userdata_react", JSON.stringify(stateToSave));
      } catch (err) {
        console.error("Local Storage fallback save failed:", err);
      }

      // 2. Synchronize transaction securely to PostgreSQL Cloud SQL
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(stateToSave),
        });

        if (response.ok) {
          setSaveStatus("Cloud SQL Synced");
          setSaveStatusColor("bg-emerald-500");
        } else {
          const errText = await response.text();
          console.warn("POST Sync Error:", response.status, errText);
          setSaveStatus("Sync Error");
          setSaveStatusColor("bg-red-500");
        }
      } catch (e) {
        console.error("Failed to sync state to server:", e);
        setSaveStatus("Sync Offline");
        setSaveStatusColor("bg-amber-500");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [xp, tasks, calendarEvents, goals, habits, moodJournal, xpLogs, chatMessages, userProfile, currentUser, dataLoaded, showConflictModal]);

  // Toast System Handler State
  const [toasts, setToasts] = useState<{ id: number; msg: string; color: string }[]>([]);
  const addToast = (msg: string, type: "green" | "blue" | "red" | "warn" = "blue") => {
    const id = nextToastId++;
    const borderColors = {
      green: "border-emerald-500",
      blue: "border-blue-500",
      red: "border-red-500",
      warn: "border-amber-500",
    };
    setToasts((prev) => [...prev, { id, msg, color: borderColors[type] }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // XP Gains handler
  const addXP = (amount: number, description: string) => {
    setXp((prev) => {
      const nextXp = prev + amount;
      const currentLevel = getLevelInfo(prev).level;
      const nextLevel = getLevelInfo(nextXp).level;
      
      addToast(`+${amount} XP: ${description}`, "green");
      if (nextLevel > currentLevel) {
        setTimeout(() => addToast(`🎉 Level Up! You reached Level ${nextLevel}!`, "blue"), 50);
      }
      return nextXp;
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fullTimeStr = `${dateStr} ${timeStr}`;

    setXpLogs((prev) => [
      {
        xp: amount,
        desc: description,
        time: fullTimeStr,
      },
      ...prev,
    ]);
  };

  // Level info helper
  const levelMilestones = [
    { level: 1, xpNeeded: 0, title: "Initiate" },
    { level: 2, xpNeeded: 200, title: "Acolyte" },
    { level: 3, xpNeeded: 500, title: "Apprentice" },
    { level: 4, xpNeeded: 900, title: "Pioneer" },
    { level: 5, xpNeeded: 1400, title: "Scholar" },
    { level: 6, xpNeeded: 2000, title: "High Scholar" },
    { level: 7, xpNeeded: 2800, title: "Sage" },
    { level: 8, xpNeeded: 3800, title: "Master Scholar" },
    { level: 9, xpNeeded: 5000, title: "Grandmaster" },
    { level: 10, xpNeeded: 6500, title: "Sovereign" },
  ];

  const getLevelInfo = (totalXp: number) => {
    let currentLvl = 1;
    let nextLvlThreshold = 200;
    let title = "Initiate";

    for (let i = 0; i < levelMilestones.length; i++) {
      if (totalXp >= levelMilestones[i].xpNeeded) {
        currentLvl = levelMilestones[i].level;
        title = levelMilestones[i].title;
        const nextMilestone = levelMilestones[i + 1];
        if (nextMilestone) {
          nextLvlThreshold = nextMilestone.xpNeeded;
        } else {
          nextLvlThreshold = levelMilestones[i].xpNeeded + 2000;
        }
      }
    }

    const prevThreshold = levelMilestones.find((m) => m.level === currentLvl)?.xpNeeded || 0;
    const range = nextLvlThreshold - prevThreshold;
    const earnedInRange = totalXp - prevThreshold;
    const percentage = Math.min(100, Math.floor((earnedInRange / range) * 100));

    return {
      level: currentLvl,
      title,
      xpProgress: totalXp,
      xpNeededForNext: nextLvlThreshold,
      percentage,
    };
  };

  const currentLevelInfo = getLevelInfo(xp);

  // Global search keywords maps
  const searchItems = [
    { title: "Dashboard", screen: "dashboard" },
    { title: "AI Assistant (SIA)", screen: "ai" },
    { title: "XP & Rewards", screen: "rewards" },
    { title: "Mood Tracker", screen: "mood" },
    { title: "Meditation Loop", screen: "meditation" },
    { title: "Task Manager", screen: "tasks" },
    { title: "Focus Mode Timer", screen: "focus" },
    { title: "Calendar Planner", screen: "calendar" },
    { title: "Goal Planner", screen: "goals" },
    { title: "Habit Tracker", screen: "habits" },
    { title: "Your Crises Manager", screen: "sos" },
    { title: "Profile Info", screen: "profile" },
    { title: "Settings Config", screen: "settings" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ title: string; screen: string }[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const matched = searchItems.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(matched);
  };

  const handleSelectResult = (screen: string) => {
    setScreen(screen);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Checklist Actions
  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedDone = !t.done;
          if (updatedDone) {
            addXP(50, `Completed task: "${t.text}"`);
          } else {
            addToast("Task marked incomplete", "warn");
          }
          return { ...t, done: updatedDone };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: number) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    addToast(target ? `Deleted task: "${target.text}"` : "Task deleted", "red");
  };

  const addTask = (text: string, priority: "high" | "medium" | "low", due: string) => {
    const newTask: Task = { id: Date.now(), text, done: false, priority, due };
    setTasks((prev) => [newTask, ...prev]);
    addXP(50, `Added new task: "${text}"`);
  };

  // Mood Entries Action
  const saveMoodEntry = (label: string, noteText: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fullTimeStr = `${dateStr} ${timeStr}`;

    const newEntry: MoodEntry = {
      label,
      note: noteText || "No comment logs",
      timestamp: fullTimeStr,
    };
    setMoodJournal((prev) => [newEntry, ...prev]);
    addXP(20, `Logged daily mood: ${label}`);
  };

  const handleOnboardingComplete = (name: string, role: string) => {
    const profile = { name, role, siaFriendStyle: true, siaHumorous: true };
    setUserProfile(profile);
    addXP(100, "Initialized your user profile");
    
    const greetingText = `Namaste ${name}! I'm SIA, your AI companion. I see you are a ${role}. I'm here to help you as a good friend with a great sense of humour (and maybe a little bit of playful charm!). I can manage your goals, set tasks, program habits, and dynamically schedule events. What are we working on today?`;
    
    setChatMessages([
      {
        role: "ai",
        text: greetingText,
      },
    ]);
  };

  // Return formatted display title for topbar
  const getScreenTitle = () => {
    const item = searchItems.find((s) => s.screen === currentScreen);
    return item ? item.title : "Workspace";
  };

  const handleGoogleSignIn = async () => {
    try {
      setSaveStatus("Connecting to Google...");
      setSaveStatusColor("bg-blue-400");
      setUnauthorizedDomainError(null);
      await signInWithPopup(auth, googleAuthProvider);
      addToast("Successfully signed in with Google!", "green");
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      if (err.code === "auth/unauthorized-domain" || String(err).includes("auth/unauthorized-domain")) {
        setUnauthorizedDomainError(window.location.hostname);
        addToast("Domain authorization required in Firebase Console!", "warn");
      } else {
        addToast(`Authentication failed: ${err.message || String(err)}`, "red");
      }
      setSaveStatus("Sign In Failed");
      setSaveStatusColor("bg-red-500");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setDataLoaded(false);
      setUserProfile(null);
      setGmailAccessToken(null);
      addToast("Successfully signed out", "blue");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading CredoNet Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center font-sans p-6">
        <div className="w-full max-w-md bg-[#0B1120] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          {/* Decorative background blur */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg select-none">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="6" r="2" fill="#60A5FA" />
              <circle cx="18" cy="6" r="2" fill="#A78BFA" />
              <circle cx="6" cy="18" r="2" fill="#2DD4BF" />
              <circle cx="18" cy="18" r="2" fill="#60A5FA" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Credo<span className="text-sky-400">Net</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-1">
              Digital India 2047
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-200">Unified Wellness & Productivity Workspace</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Welcome to CredoNet, powered by SIA AI. Monitor daily habits, schedule goals, track mental health, and level up your study or teaching workflows with a unified Cloud SQL database.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google Account
          </button>

          {unauthorizedDomainError && (
            <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 p-5 rounded-xl text-xs flex flex-col gap-3 text-left leading-relaxed animate-fadeIn">
              <div className="flex gap-2 items-start text-amber-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>Domain Authorization Required</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Firebase Authentication blocked this sign-in request because your current domain is not authorized in your Firebase Project Console.
              </p>
              
              <div className="bg-slate-950/80 p-2.5 rounded border border-white/5 font-mono text-[10px] text-slate-300 break-all flex items-center justify-between gap-2">
                <span>{unauthorizedDomainError}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomainError);
                    setDomainCopied(true);
                    setTimeout(() => setDomainCopied(false), 2000);
                  }}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-sans text-[10px] font-bold transition-all cursor-pointer shrink-0"
                >
                  {domainCopied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <p className="font-semibold text-white">How to fix this:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Open the{" "}
                    <a
                      href="https://console.firebase.google.com/project/vivid-lambda-3n50x/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Firebase Settings Console
                    </a>
                  </li>
                  <li>Click on the <strong>Authorized Domains</strong> tab.</li>
                  <li>Click <strong>Add domain</strong> and paste the copied domain.</li>
                  <li>Once added, reload this tab and sign in again!</li>
                </ol>
              </div>
            </div>
          )}

          {typeof window !== "undefined" && window.self !== window.top && (
            <div className="bg-amber-950/25 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-[11px] flex flex-col gap-2.5 text-left leading-relaxed">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                <span>
                  <strong>Popup Auto-Closed?</strong> Browsers block Google Authentication popups when running inside an iframe preview window due to third-party cookie restrictions.
                </span>
              </div>
              <button
                onClick={() => window.open(window.location.href, "_blank")}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer text-center active:scale-[0.97]"
              >
                Open in New Tab to Sign In 🚀
              </button>
              <p className="text-[9px] text-slate-400 text-center leading-normal">
                Logging in on a direct browser tab bypasses iframe sandbox limits!
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-500">
            Powered by Google Cloud SQL (PostgreSQL) and Firebase Auth
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex bg-[#0B1120] text-slate-100 h-screen overflow-hidden font-sans">
      {/* Tab switch flight animation overlay */}
      <TabTransitionPlane transitionKey={transitionKey} />

      {/* Toast popup alerts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-[#1E293B] border-l-4 ${toast.color} rounded-lg px-4 py-3 flex items-center justify-between shadow-2xl gap-4 animate-slideIn`}
          >
            <span className="text-xs font-semibold text-slate-200">{toast.msg}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-all cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        setScreen={setScreen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Primary Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Controls bar */}
        <div className="h-14 bg-[#0B1120] border-b border-white/5 flex items-center justify-between px-6 gap-4 select-none shrink-0">
          <h1 className="text-sm font-semibold text-slate-200">{getScreenTitle()}</h1>

          {/* Sync indicator, search, avatar */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Sync active pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-slate-900/50 text-[10px] font-semibold text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatusColor} animate-pulse`} />
              <span>{saveStatus}</span>
              {(saveStatus === "Sync Error" || saveStatus === "Sync Offline" || saveStatus === "Sync Conflict") && (
                <button
                  onClick={async () => {
                    setSaveStatus("Checking latest Cloud state...");
                    setSaveStatusColor("bg-blue-400");
                    try {
                      const token = await currentUser?.getIdToken();
                      if (!token) throw new Error("No user authenticated");
                      const response = await fetch("/api/sync", {
                        headers: {
                          "Authorization": `Bearer ${token}`
                        }
                      });
                      if (response.ok) {
                        const cloudData = await response.json();
                        const savedLocal = localStorage.getItem("credonet_userdata_react");
                        let localData = null;
                        if (savedLocal) {
                          localData = JSON.parse(savedLocal);
                        }
                        const hasConflict = detectMismatch(localData, cloudData);
                        if (hasConflict) {
                          setPendingConflict({ local: localData, cloud: cloudData });
                          setShowConflictModal(true);
                          setSaveStatus("Sync Conflict");
                          setSaveStatusColor("bg-amber-500");
                        } else {
                          applyCloudState(cloudData);
                          setSaveStatus("Cloud SQL Connected");
                          setSaveStatusColor("bg-emerald-500");
                          setDataLoaded(true);
                          addToast("Database synchronized successfully!", "green");
                        }
                      } else {
                        addToast("Could not contact server to resolve conflict.", "red");
                        setSaveStatus("Sync Offline");
                        setSaveStatusColor("bg-amber-500");
                      }
                    } catch (err) {
                      addToast("Network connection failed.", "red");
                      setSaveStatus("Sync Offline");
                      setSaveStatusColor("bg-amber-500");
                    }
                  }}
                  className="ml-1 px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-extrabold transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  Resolve / Retry
                </button>
              )}
            </div>

            {/* Global Search Bar */}
            <div className="relative w-44">
              <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  className="bg-transparent border-none text-[11px] text-white outline-none w-full placeholder-slate-500 font-medium"
                  placeholder="Search sections..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-xl w-52 shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(r.screen)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Initials Badge */}
            <button
              onClick={() => setScreen("profile")}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer shadow-md select-none active:scale-95 transition-all text-white"
            >
              {(() => {
                const fullName = userProfile?.name || "Arjun Kumar";
                const cleanName = fullName.trim();
                const parts = cleanName.split(/\s+/);
                if (parts.length >= 2) {
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                }
                return cleanName.substring(0, 2).toUpperCase();
              })()}
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-900">
          <AnimatePresence mode="wait">
            {currentScreen === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <DashboardScreen
                  xp={xp}
                  tasks={tasks}
                  toggleTask={toggleTask}
                  setScreen={setScreen}
                  levelInfo={currentLevelInfo}
                  moodText={moodJournal[0]?.label || "Stable"}
                  moodJournalLength={moodJournal.length}
                  userProfile={userProfile}
                  habits={habits}
                  goals={goals}
                  calendarEvents={calendarEvents}
                  xpLogs={xpLogs}
                  moodJournal={moodJournal}
                />
              </motion.div>
            )}

            {currentScreen === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <AIScreen
                  chatMessages={chatMessages}
                  setChatMessages={setChatMessages}
                  addXP={addXP}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  gmailAccessToken={gmailAccessToken}
                  setGmailAccessToken={setGmailAccessToken}
                />
              </motion.div>
            )}

            {currentScreen === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <RewardsScreen xp={xp} levelInfo={currentLevelInfo} quests={quests} xpLogs={xpLogs} />
              </motion.div>
            )}

            {currentScreen === "mood" && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <MoodScreen moodJournal={moodJournal} saveMoodEntry={saveMoodEntry} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "meditation" && (
              <motion.div
                key="meditation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <MeditationScreen addXP={addXP} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <TasksScreen
                  tasks={tasks}
                  toggleTask={toggleTask}
                  deleteTask={deleteTask}
                  addTask={addTask}
                  userProfile={userProfile}
                />
              </motion.div>
            )}

            {currentScreen === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <FocusScreen addXP={addXP} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <CalendarScreen
                  calendarEvents={calendarEvents}
                  setCalendarEvents={setCalendarEvents}
                  addXP={addXP}
                  userProfile={userProfile}
                />
              </motion.div>
            )}

            {currentScreen === "goals" && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <GoalsScreen goals={goals} setGoals={setGoals} addXP={addXP} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <HabitsScreen habits={habits} setHabits={setHabits} addXP={addXP} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "gmail" && (
              <motion.div
                key="gmail"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <GmailScreen
                  gmailAccessToken={gmailAccessToken}
                  setGmailAccessToken={setGmailAccessToken}
                  addXP={addXP}
                  userProfile={userProfile}
                  onAddTask={(text, priority) => {
                    const newTask: Task = {
                      id: Date.now(),
                      text,
                      done: false,
                      priority,
                      due: "Today",
                    };
                    setTasks((prev) => [newTask, ...prev]);
                    addToast(`SIA: Task added from Gmail inbox!`, "green");
                    addXP(25, "Transferred email action item to tasks");
                  }}
                />
              </motion.div>
            )}

            {currentScreen === "sos" && (
              <motion.div
                key="sos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <CrisisScreen setScreen={setScreen} chatMessages={chatMessages} setChatMessages={setChatMessages} addXP={addXP} userProfile={userProfile} />
              </motion.div>
            )}

            {currentScreen === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileScreen
                  xp={xp}
                  levelInfo={currentLevelInfo}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  onSignOut={handleSignOut}
                />
              </motion.div>
            )}

            {currentScreen === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsScreen currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sync Conflict Resolution Modal */}
      {showConflictModal && pendingConflict && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col p-6 space-y-6">
            {/* Header banner */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Sync Conflict Detected
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We detected a data mismatch between your current device (local state) and the Cloud SQL database. Please choose which version of your progress you would like to keep.
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-slate-900/50 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
              <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-2 bg-slate-900">
                <div>Metric</div>
                <div className="text-amber-400">Local State (This Device)</div>
                <div className="text-blue-400">Cloud State (SQL)</div>
              </div>
              
              <div className="grid grid-cols-3 text-xs px-4 py-2.5">
                <div className="font-medium text-slate-300">Level & XP</div>
                <div className="font-semibold text-white">
                  Lvl {getLevelInfo(pendingConflict.local?.xp || 0).level} ({pendingConflict.local?.xp || 0} XP)
                </div>
                <div className="font-semibold text-white">
                  Lvl {getLevelInfo(pendingConflict.cloud?.xp || 0).level} ({pendingConflict.cloud?.xp || 0} XP)
                </div>
              </div>

              <div className="grid grid-cols-3 text-xs px-4 py-2.5">
                <div className="font-medium text-slate-300">Tasks Count</div>
                <div className="text-white">{pendingConflict.local?.tasks?.length || 0} tasks</div>
                <div className="text-white">{pendingConflict.cloud?.tasks?.length || 0} tasks</div>
              </div>

              <div className="grid grid-cols-3 text-xs px-4 py-2.5">
                <div className="font-medium text-slate-300">Active Goals</div>
                <div className="text-white">{pendingConflict.local?.goals?.length || 0} goals</div>
                <div className="text-white">{pendingConflict.cloud?.goals?.length || 0} goals</div>
              </div>

              <div className="grid grid-cols-3 text-xs px-4 py-2.5">
                <div className="font-medium text-slate-300">Habits</div>
                <div className="text-white">{pendingConflict.local?.habits?.length || 0} habits</div>
                <div className="text-white">{pendingConflict.cloud?.habits?.length || 0} habits</div>
              </div>
            </div>

            {/* Selection Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Local Option */}
              <button
                onClick={handleKeepLocal}
                className="group text-left border border-amber-500/20 bg-slate-900/40 hover:bg-slate-900/80 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-lg hover:shadow-amber-500/5 active:scale-[0.98]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Keep Local State
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Overwrites the cloud database with your current local state. Select this if you have been editing on this device offline or during hiccups.
                  </p>
                </div>
                <div className="w-full text-center bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1">
                  Use Local Version
                </div>
              </button>

              {/* Cloud Option */}
              <button
                onClick={handleOverwriteWithCloud}
                className="group text-left border border-blue-500/20 bg-slate-900/40 hover:bg-slate-900/80 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Overwrite with Cloud
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Overwrites your local device state with the cloud database state. Select this if you edited on another device or want to discard local edits.
                  </p>
                </div>
                <div className="w-full text-center bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-slate-950 text-blue-400 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1">
                  Use Cloud Version
                </div>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 text-center leading-normal">
              Warning: Making a selection will synchronize both locations to prevent future prompts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
