import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Sparkles, Trash2, Clock } from "lucide-react";
import { CalendarEvent } from "../types";
import SiaConsultationWidget from "./SiaConsultationWidget";

interface CalendarScreenProps {
  calendarEvents: Record<string, CalendarEvent[]>;
  setCalendarEvents: React.Dispatch<React.SetStateAction<Record<string, CalendarEvent[]>>>;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function CalendarScreen({
  calendarEvents,
  setCalendarEvents,
  addXP,
  userProfile,
}: CalendarScreenProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Modals state
  const [showManualForm, setShowManualForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);

  // Manual event state
  const [manualTitle, setManualTitle] = useState("");
  const [manualTime, setManualTime] = useState("14:00");
  const [manualDuration, setManualDuration] = useState("1h");

  // AI event state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(selectedYear, selectedMonth, 0).getDate();

  const formattedSelectedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
    selectedDay
  ).padStart(2, "0")}`;

  const currentEvents = calendarEvents[formattedSelectedDate] || [];

  const handleAddManualEvent = () => {
    if (!manualTitle.trim()) return;

    // Convert 24h to 12h formatting
    let [hoursStr, minutesStr] = manualTime.split(":");
    let hours = parseInt(hoursStr);
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${String(hours).padStart(2, "0")}:${minutesStr} ${ampm}`;

    const newEvent: CalendarEvent = {
      title: manualTitle,
      time: formattedTime,
      duration: manualDuration,
    };

    setCalendarEvents((prev) => ({
      ...prev,
      [formattedSelectedDate]: [...(prev[formattedSelectedDate] || []), newEvent],
    }));

    addXP(40, `Scheduled manual event: "${manualTitle}"`);
    setManualTitle("");
    setManualTime("14:00");
    setManualDuration("1h");
    setShowManualForm(false);
  };

  const handleAIEventParse = async () => {
    if (!aiPrompt.trim() || aiParsing) return;
    setAiParsing(true);

    const systemPrompt = `You are a scheduling parser assistant on CredoNet. 
Analyze the user's event text and extract:
1. "title": descriptive title of the event
2. "date": target date in YYYY-MM-DD format (Today's date context: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
3. "time": start time formatted strictly as 'HH:MM AM' or 'HH:MM PM'
4. "duration": estimated duration (e.g., '1h', '30m', '2h')

Output strictly valid JSON with no markdown wrapping, no extra keys, and no text outside. Example output:
{"title": "Math Seminar", "date": "${today.toLocaleDateString('en-CA')}", "time": "04:30 PM", "duration": "2h"}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
          systemInstruction: systemPrompt,
          model: "gemini-3.5-flash",
        }),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      let resultText = data.candidates[0].content.parts[0].text.trim();
      resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(resultText);

      if (parsed.title && parsed.date && parsed.time) {
        setCalendarEvents((prev) => ({
          ...prev,
          [parsed.date]: [
            ...(prev[parsed.date] || []),
            {
              title: parsed.title,
              time: parsed.time,
              duration: parsed.duration || "1h",
            },
          ],
        }));

        addXP(100, `Scheduled AI parsed event: "${parsed.title}"`);
        
        // Relocate view to the parsed date
        const [pYear, pMonth, pDay] = parsed.date.split("-");
        setSelectedYear(parseInt(pYear));
        setSelectedMonth(parseInt(pMonth) - 1);
        setSelectedDay(parseInt(pDay));

        setAiPrompt("");
        setShowAIForm(false);
      } else {
        throw new Error("Invalid format parsed from AI");
      }
    } catch (error) {
      console.error("AI parse failure:", error);
    } finally {
      setAiParsing(false);
    }
  };

  const handleDeleteEvent = (titleToDelete: string) => {
    setCalendarEvents((prev) => {
      const updated = { ...prev };
      if (updated[formattedSelectedDate]) {
        updated[formattedSelectedDate] = updated[formattedSelectedDate].filter(
          (e) => e.title !== titleToDelete
        );
      }
      return updated;
    });
    addXP(10, `Removed event: "${titleToDelete}"`);
  };

  // Build calendar matrix
  const daysInMatrix: { day: number; isCurrentMonth: boolean }[] = [];
  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysInMatrix.push({ day: prevMonthTotalDays - i, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= totalDays; d++) {
    daysInMatrix.push({ day: d, isCurrentMonth: true });
  }
  // Next month padding
  const totalSlots = daysInMatrix.length;
  const remainingPadding = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots;
  for (let i = 1; i <= remainingPadding; i++) {
    daysInMatrix.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">Calendar</h2>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic scheduling engine — add tasks, goals, and sessions to dates.
        </p>
      </div>

      {/* SIA Consultation Card */}
      <SiaConsultationWidget
        contextType="calendar"
        contextData={Object.entries(calendarEvents).map(([date, evs]) => ({ date, events: evs.map((e) => e.title) }))}
        userProfile={userProfile}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Day Grid */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">
              {months[selectedMonth]} {selectedYear}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 text-[10px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => (
              <div key={idx} className="py-1">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMatrix.map((item, idx) => {
              const isToday =
                selectedYear === today.getFullYear() &&
                selectedMonth === today.getMonth() &&
                item.day === today.getDate() &&
                item.isCurrentMonth;
              const isSelected = item.day === selectedDay && item.isCurrentMonth;
              const cellDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
                item.day
              ).padStart(2, "0")}`;
              const hasEvents =
                item.isCurrentMonth && calendarEvents[cellDate] && calendarEvents[cellDate].length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => item.isCurrentMonth && setSelectedDay(item.day)}
                  disabled={!item.isCurrentMonth}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-xs transition-all relative ${
                    !item.isCurrentMonth
                      ? "opacity-20 border-transparent text-slate-600"
                      : isSelected
                      ? "bg-blue-600 border-blue-500 text-white font-bold cursor-pointer"
                      : isToday
                      ? "border-blue-400 text-blue-400 font-bold hover:bg-white/5 cursor-pointer"
                      : "border-transparent text-slate-300 hover:bg-white/5 cursor-pointer"
                  }`}
                >
                  <span>{item.day}</span>
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-teal-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Events Details Side */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Events — {months[selectedMonth].substring(0, 3)} {selectedDay}, {selectedYear}
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-950">
              {currentEvents.length > 0 ? (
                currentEvents.map((e, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-white/5 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{e.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {e.time} · {e.duration}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(e.title)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No events scheduled.</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowAIForm(!showAIForm)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Schedule with SIA AI</span>
            </button>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event Manually</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Modal Dialog Popup */}
      {showManualForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide border-b border-white/5 pb-2">
              Add Manual Event
            </h3>
            <div className="space-y-3 text-left">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Event Date</label>
                <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-400 px-3 py-2 outline-none" value={formattedSelectedDate} readOnly />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Event Title</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-blue-500/50"
                  placeholder="e.g., Physics Practice Test"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Time (24h)</label>
                  <input
                    type="time"
                    className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Duration</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddManualEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer"
                >
                  Save Event
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal Dialog Popup */}
      {showAIForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide border-b border-white/5 pb-2">
              Create Event with SIA AI
            </h3>
            <div className="space-y-3 text-left">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Describe your scheduling request naturally. For example:<br />
                <span className="text-sky-400 italic">"IIT Math seminar on July 10th at 4:30 PM for 2 hours"</span>
              </p>
              <textarea
                className="w-full bg-slate-950 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-600 p-3 h-20 outline-none focus:border-blue-500/50 resize-none"
                placeholder="Type event details here..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiParsing}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAIEventParse}
                  disabled={aiParsing || !aiPrompt.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {aiParsing ? "Parsing..." : "Parse with SIA AI"}
                </button>
                <button
                  onClick={() => setShowAIForm(false)}
                  disabled={aiParsing}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
