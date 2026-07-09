import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, Send, Bot } from "lucide-react";
import { ChatMessage } from "../types";

interface CrisisScreenProps {
  setScreen: (screen: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
}

export default function CrisisScreen({
  setScreen,
  chatMessages,
  setChatMessages,
  addXP,
  userProfile,
}: CrisisScreenProps) {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track messages specifically sent in Crisis tab
  const [crisisMessageCount, setCrisisMessageCount] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const textToSend = userInput.trim();
    const userMsg: ChatMessage = { role: "user", text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);
    
    // Update count and award XP if it reaches 5
    const newCount = crisisMessageCount + 1;
    setCrisisMessageCount(newCount);
    if (newCount % 5 === 0) {
      addXP(20, "Engaging with SIA in Crisis Manager");
    }

    // Format previous conversation history into standard Gemini format
    const history = chatMessages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
    // Append current message
    history.push({ role: "user", parts: [{ text: textToSend }] });

    const systemPrompt = `You are SIA, a highly empathetic, calming, and supportive AI mental health crisis companion talking to a ${userProfile?.role || "user"} named ${userProfile?.name || "Arjun"}.
You must be incredibly warm, gentle, and grounding. Help the user through stress, anxiety, or emotional distress. Guide them with breathing exercises or just be a compassionate listener. 
Keep responses highly supportive, grounding, and concise (2-4 sentences). Never diagnose or act as a substitute for professional medical help.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history.slice(-10),
          systemInstruction: systemPrompt,
          model: "gemini-3.5-flash",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with proxy");
      }

      const data = await response.json();
      let replyText = "I'm having a little trouble connecting right now, but I am still here for you. Take a deep breath.";

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
      }

      setChatMessages((prev) => [...prev, { role: "ai", text: replyText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Network connection is offline, but remember you are safe. Take a deep breath and try writing again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Your Crises Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Instant access to SIA — your AI mental health crisis companion.
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Intro Box */}
      <div className="bg-red-950/20 border border-red-500/15 rounded-xl p-4 mb-4">
        <p className="text-xs text-slate-300 leading-relaxed italic">
          "I'm here with you. Whatever you're feeling right now, you don't have to face it alone. I can guide you through deep breathing, help you organize your thoughts, or simply be a warm, listening ear."
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col overflow-hidden min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-950 scroll-smooth"
        >
          {chatMessages.map((msg, i) => {
            const isAI = msg.role === "ai";
            return (
              <div
                key={i}
                className={`flex flex-col max-w-[80%] ${
                  isAI ? "self-start items-start" : "self-end items-end ml-auto"
                }`}
              >
                {isAI && (
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    <Bot className="w-3.5 h-3.5" />
                    <span>SIA Companion</span>
                  </div>
                )}
                <div
                  className={`text-xs p-3 leading-relaxed whitespace-pre-wrap ${
                    isAI
                      ? "bg-red-500/10 border border-red-500/20 text-red-100 rounded-tr-xl rounded-br-xl rounded-bl-xl"
                      : "bg-slate-900/80 border border-white/5 text-slate-200 rounded-tl-xl rounded-tr-xl rounded-bl-xl"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex flex-col self-start items-start max-w-[80%]">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
                <Bot className="w-3.5 h-3.5" />
                <span>SIA is typing...</span>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 text-red-200 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce delay-300" />
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-white/5 pt-3 mt-3 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-900/60 border border-white/5 text-xs text-white placeholder-slate-500 rounded-xl px-4 py-2.5 outline-none focus:border-red-500/50 transition-colors"
            placeholder="Tell SIA how you're feeling..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:opacity-50"
            disabled={!userInput.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
