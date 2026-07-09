export interface Task {
  id: number;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  due: string;
}

export interface Goal {
  id: number;
  name: string;
  pct: number;
  deadline: string;
  color: string;
  code: string;
}

export interface Habit {
  id: number;
  name: string;
  streak: number;
  days: boolean[]; // 7 elements representing Mon-Sun
}

export interface CalendarEvent {
  title: string;
  time: string;
  duration: string;
}

export interface MoodEntry {
  label: string;
  note: string;
  timestamp: string;
}

export interface XPLog {
  xp: number;
  desc: string;
  time: string;
}

export interface Quest {
  id: string;
  text: string;
  xp: number;
  done: boolean;
  type: "task" | "mood" | "meditate" | "goal";
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  snippet?: string;
  body?: string;
  labels?: string[];
}
