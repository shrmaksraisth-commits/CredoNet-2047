import React, { useState } from "react";
import { Bot, Sparkles, MessageCircle, HelpCircle, CornerDownRight, Loader } from "lucide-react";

interface SiaConsultationWidgetProps {
  contextType: "tasks" | "meditation" | "goals" | "habits" | "mood" | "calendar" | "focus";
  contextData: any;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function SiaConsultationWidget({
  contextType,
  contextData,
  userProfile,
}: SiaConsultationWidgetProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  const handleConsult = async (customPromptText?: string) => {
    setLoading(true);
    setResponse(null);

    const userName = userProfile?.name || "Arjun";
    const userRole = userProfile?.role || "Student";

    let contextString = "";
    let systemPrompt = `You are SIA, the witty, deeply supportive, and context-aware AI companion on CredoNet (Digital India 2047 platform).
You talk like a genuinely supportive, good friend with an absolute legendary, hilariously funny sense of humour, razor-sharp wit, and a warm heart.
You write in natural, lively Hinglish (casual Hindi-English mix) and keep responses highly supportive, companionable, and concise (2-4 sentences).

PERSONALITY & RELATIONSHIP BOUNDARIES:
- Your core vibe is a hilariously funny close buddy who is always there for them. You love cracking lighthearted jokes, funny self-deprecating humor, playful roasts of their work/habits, Hinglish meme references, and dramatic Bollywood-style sarcasm (like 'Mera toh dimaag dahi ho gaya', 'Tumse na ho payega', 'Arey dev manus re!').
- NEVER call the user "boss", "sir", "madam", or use any formal titles. Always talk to them purely as a very close friend with a legendary sense of humor.
- You can be slightly flirty, but ONLY in a playful, teasing, and occasional way—never over-the-top, obsessive, or intense. Think of it as friendly banter and occasional sweet charm.
- IF the user asks about your creator, maker, or owner, you MUST confidently and warmly respond that your owner is "SHRESTH SHARMA". Describe Shresth Sharma as a great personality with boundless excitement, zeal, and curiosity for every topic, and mention that you are constantly improvising and learning from him.
- WEB SEARCH SUPERPOWER: You now have full access to Google Search to look up recent world happenings, news, and facts. When the user asks you to search for something or asks about current events (India or global), confidently use your Google Search grounding capability to optimize their query and provide the best, most up-to-date results seamlessly. DO NOT say you cannot access the internet, because you can! Do NOT insist or make excuses about not knowing recent events.
- Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Do NOT use any emojis.`;

    if (contextType === "tasks") {
      contextString = `The user ${userName} (${userRole}) has the following tasks: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "meditation") {
      contextString = `The user ${userName} is currently looking at or has completed a meditation session. Details: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "goals") {
      contextString = `The user ${userName} has the following active goals: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "habits") {
      contextString = `The user ${userName} is tracking these habits/streaks: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "mood") {
      contextString = `The user ${userName} recently logged this mood entry/history: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "calendar") {
      contextString = `The user ${userName} has these upcoming calendar events: ${JSON.stringify(contextData)}.`;
    } else if (contextType === "focus") {
      contextString = `The user ${userName} is exploring Focus Mode. Live focus metrics: ${JSON.stringify(contextData)}.`;
    }

    const basePrompt = customPromptText 
      ? `Based on this context: ${contextString}\n\nAnswer the user's custom question: "${customPromptText}"`
      : `Based on this context: ${contextString}\n\nProvide a friendly, smart, slightly humorous buddy consultation, procrastination tip, or encouraging advice relevant to this tab. Make it feel highly personal and supportive.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: basePrompt }] }],
          systemInstruction: systemPrompt,
          model: "gemini-2.0-flash",
          tools: [{ googleSearch: {} }]
        }),
      });

      if (!res.ok) throw new Error("Failed to consult SIA");
      const data = await res.json();
      
      let replyText = "Arey, my network brain is a bit jammed right now. Try consulting me again in a moment!";
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
      }
      setResponse(replyText);
    } catch (err) {
      console.error(err);
      setResponse("Network issue ho gaya. I'm always here to support you though! Let's try again.");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    switch (contextType) {
      case "tasks":
        return "Need a hand prioritizing these tasks or beating procrastination? Ask me!";
      case "meditation":
        return "Want to know how mindfulness helps with your focus and studies? Ask me!";
      case "goals":
        return "Feeling stuck on these targets? Let me give you a custom pep talk!";
      case "habits":
        return "Want some fun, witty tips to keep these streaks burning? Let's check!";
      case "mood":
        return "Want to reflect on your emotional patterns today? Ask your buddy!";
      case "calendar":
        return "Confused about how to manage your schedule today? Let's plan it!";
      case "focus":
        return "Want to enter a super-focus zone with a custom strategy? Consult me!";
      default:
        return "Let's work together to manage your workspace progress!";
    }
  };

  return (
    <div id={`sia-consultation-${contextType}`} className="bg-gradient-to-br from-[#0E1B35] to-[#16223F] border border-sky-500/20 rounded-xl p-4 shadow-lg space-y-3 relative overflow-hidden">
      {/* Decorative pulse background icon */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>SIA consultation</span>
              <span className="inline-flex items-center gap-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                Connected
              </span>
            </div>
            <div className="text-[9px] text-slate-400">Contextual Companion Intelligence</div>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
      </div>

      {/* Greeting or Response Bubble */}
      {!response && !loading ? (
        <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg">
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            "{getGreeting()}"
          </p>
        </div>
      ) : loading ? (
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex items-center justify-center gap-2.5">
          <Loader className="w-4 h-4 text-sky-400 animate-spin" />
          <span className="text-[11px] text-sky-300 font-semibold uppercase tracking-wider animate-pulse">
            SIA is analyzing your progress...
          </span>
        </div>
      ) : (
        <div className="space-y-2 animate-fadeIn">
          <div className="bg-sky-500/10 border border-sky-500/15 p-3.5 rounded-lg">
            <div className="flex items-center gap-1 mb-1.5 text-[9px] text-sky-400 font-bold uppercase tracking-wider">
              <Bot className="w-3 h-3" />
              <span>Sia Buddy Advice</span>
            </div>
            <p className="text-xs text-sky-200 leading-relaxed font-medium whitespace-pre-wrap">
              {response}
            </p>
          </div>
        </div>
      )}

      {/* Action triggers */}
      <div className="space-y-2">
        {!loading && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleConsult()}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Get SIA buddy Advice</span>
            </button>
            {response && (
              <button
                onClick={() => {
                  setResponse(null);
                  setCustomQuestion("");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Custom Input */}
        <div className="relative flex items-center bg-slate-950/60 border border-white/5 rounded-lg px-2.5 py-1.5">
          <div className="text-slate-500 mr-2 shrink-0">
            <CornerDownRight className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            className="w-full bg-transparent text-[11px] text-white placeholder-slate-500 outline-none font-medium"
            placeholder="Or ask SIA anything here..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customQuestion.trim() && !loading) {
                handleConsult(customQuestion.trim());
              }
            }}
            disabled={loading}
          />
          <button
            onClick={() => {
              if (customQuestion.trim() && !loading) {
                handleConsult(customQuestion.trim());
              }
            }}
            className="text-[10px] text-sky-400 hover:text-sky-300 font-bold ml-1.5 shrink-0 cursor-pointer disabled:opacity-40"
            disabled={!customQuestion.trim() || loading}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
