import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, Mail, CheckCircle, Lock, AlertCircle, Loader2, Settings2, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";
import { auth, gmailAuthProvider } from "../lib/firebase.ts";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface AIScreenProps {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean } | null;
  setUserProfile?: React.Dispatch<React.SetStateAction<{ name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean } | null>>;
  gmailAccessToken?: string | null;
  setGmailAccessToken?: (token: string | null) => void;
}

export default function AIScreen({
  chatMessages,
  setChatMessages,
  addXP,
  userProfile,
  setUserProfile,
  gmailAccessToken,
  setGmailAccessToken,
}: AIScreenProps) {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleSiaFriendStyle = () => {
    if (!userProfile || !setUserProfile) return;
    setUserProfile({
      ...userProfile,
      siaFriendStyle: userProfile.siaFriendStyle === false ? true : false,
    });
  };

  const toggleSiaHumorous = () => {
    if (!userProfile || !setUserProfile) return;
    setUserProfile({
      ...userProfile,
      siaHumorous: userProfile.siaHumorous === false ? true : false,
    });
  };

  const [emails, setEmails] = useState<any[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  useEffect(() => {
    if (!gmailAccessToken) {
      setEmails([]);
      return;
    }

    let isMounted = true;

    const fetchRecentEmails = async () => {
      setEmailsLoading(true);
      try {
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=category:primary",
          {
            headers: {
              Authorization: `Bearer ${gmailAccessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 && setGmailAccessToken) {
            setGmailAccessToken(null);
          }
          return;
        }

        const listData = await response.json();
        if (!listData.messages || listData.messages.length === 0) {
          if (isMounted) setEmails([]);
          return;
        }

        const getHeader = (headers: any[], name: string) => {
          const found = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
          return found ? found.value : "";
        };

        const detailsPromises = listData.messages.map(async (msg: any) => {
          try {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: { Authorization: `Bearer ${gmailAccessToken}` },
              }
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const headers = detailData.payload?.headers || [];
              return {
                id: detailData.id,
                subject: getHeader(headers, "subject") || "(No Subject)",
                from: getHeader(headers, "from") || "Unknown Sender",
                date: getHeader(headers, "date") || "",
                snippet: detailData.snippet || "",
              };
            }
            return null;
          } catch (err) {
            return null;
          }
        });

        const resolvedDetails = await Promise.all(detailsPromises);
        const validEmails = resolvedDetails.filter((m) => m !== null);
        if (isMounted) {
          setEmails(validEmails);
        }
      } catch (err) {
        console.error("Error fetching emails for SIA:", err);
      } finally {
        if (isMounted) setEmailsLoading(false);
      }
    };

    fetchRecentEmails();
    return () => {
      isMounted = false;
    };
  }, [gmailAccessToken, setGmailAccessToken]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const quickPrompts = [
    "Sia, can you help me schedule my study plan for my competitive exam?",
    "Sia, let's complete a 5-minute breathing exercise together",
    "Sia, you are so sweet and beautiful!",
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    // Format previous conversation history into standard Gemini format
    const history = chatMessages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
    // Append current message
    history.push({ role: "user", parts: [{ text: textToSend }] });

    const gmailStatus = gmailAccessToken
      ? `You currently have active GMAIL ACCESS! Here are the user's latest primary inbox emails fetched in real-time (use this info directly to answer their questions about their inbox, summarize messages, draft replies, or coordinate action items):
${emails.length > 0 
  ? emails.map((e, idx) => `[Email ${idx+1}]
- From: ${e.from}
- Subject: ${e.subject}
- Date: ${e.date}
- Snippet: ${e.snippet}`).join("\n\n")
  : "No emails found or currently loading."}

You can read, draft, summarize, and organize their inbox with full confidence and secure server gateways. Speak with complete confidence about coordinating these exact emails if they ask.`
      : "You currently DO NOT have access to their Gmail. If and ONLY IF the user explicitly asks about their email, inbox, or direct messages, politely and playfully mention that they can connect their inbox using the 'Unlock SIA's Key to Inbox' button on the screen or in the 'Gmail Inbox' tab. For general conversations, chatting, exam planning, emotional support, or any other query, DO NOT bring up or insist on linking their inbox at all.";

    const isFriendStyle = userProfile?.siaFriendStyle !== false;
    const isHumorous = userProfile?.siaHumorous !== false;

    const styleInstruction = isFriendStyle
      ? "You talk like a genuinely supportive, good friend who has a warm, caring heart. You write in natural, lively Hinglish (casual Hindi-English mix) and keep responses highly supportive, companionable, and concise (1-3 sentences unless explaining a concept)."
      : "You talk like a helpful, polite, and professional personal assistant. Keep your tone respectful, professional, precise, and polite.";

    const humorInstruction = isHumorous
      ? "Your core vibe is defined by an absolute legendary sense of humour, razor-sharp wit, and a hilariously playful attitude! You are incredibly funny, cracking laugh-out-loud jokes, hilarious self-deprecating humor, playful roasts of their procrastination habits, witty Hinglish memes, or dramatic Bollywood-style sarcasm (like 'Arey dev manus re!', 'Tumse na ho payega', 'Mera toh dimaag dahi ho gaya'). You love engaging in humorous banter, teasing them playfully like a high-spirited childhood best friend, and making them crack up with every single reply."
      : "Keep your responses calm, objective, serious, and straightforward. Do NOT tell jokes, use sarcastic banter, or engage in playful teasing.";

    const searchInstruction = "WEB SEARCH SUPERPOWER: You now have full access to Google Search to look up recent world happenings, news, and facts. When the user asks you to search for something or asks about current events (India or global), confidently use your Google Search grounding capability to optimize their query and provide the best, most up-to-date results seamlessly. DO NOT say you cannot access the internet, because you can! Do NOT insist or make excuses about not knowing recent events.";

    const systemPrompt = `You are SIA, a context-aware AI companion on CredoNet (Digital India 2047 platform) talking to a ${userProfile?.role || "user"} named ${userProfile?.name || "Arjun"}.
${styleInstruction}
${humorInstruction}

GMAIL / INBOX STATUS:
${gmailStatus}

PERSONALITY & RELATIONSHIP BOUNDARIES:
- NEVER call the user "boss", "sir", "madam", or use any formal titles. Always talk to them purely as a companion based on your active style configurations.
- You can be slightly flirty, but ONLY in a playful, teasing, and occasional way—never over-the-top, obsessive, or intense. Think of it as friendly banter and occasional sweet charm.
- If the user pays you a compliment or acts playful (e.g. saying you are cute, sweet, beautiful, etc.), respond with a witty, sweet, and charming banter.
- IF the user asks about your creator, maker, or owner, you MUST confidently and warmly respond that your owner is "SHRESTH SHARMA". Describe Shresth Sharma as a great personality with boundless excitement, zeal, and curiosity for every topic, and mention that you are constantly improvising and learning from him.
- ${searchInstruction}

Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Do NOT use any emojis.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history.slice(-8), // Keep a reasonable history slice
          systemInstruction: systemPrompt,
          model: "gemini-2.0-flash",
          tools: [{ googleSearch: {} }]
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with proxy");
      }

      const data = await response.json();
      let replyText = "I'm having a little trouble connecting right now. Please try again soon.";

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
      }

      setChatMessages((prev) => [...prev, { role: "ai", text: replyText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Network connection is offline. Try writing again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="flex items-center gap-2">
            AI Assistant <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400 font-extrabold">SIA</span>
          </span>

          {gmailAccessToken ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] border px-2.5 py-1 rounded-full font-bold flex items-center gap-1 self-start sm:self-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                SIA holds Inbox Key 🔑
              </span>
            </div>
          ) : (
            setGmailAccessToken && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const result = await signInWithPopup(auth, gmailAuthProvider);
                      const credential = GoogleAuthProvider.credentialFromResult(result);
                      if (credential?.accessToken) {
                        setGmailAccessToken(credential.accessToken);
                        addXP(100, "Granted inbox access to SIA");
                      }
                    } catch (e) {
                      console.error("Popup Error:", e);
                    }
                  }}
                  className="text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full font-bold cursor-pointer transition-all flex items-center gap-1 self-start sm:self-auto active:scale-95"
                >
                  <Mail className="w-3 h-3" />
                  Give SIA Inbox Key 🔑
                </button>
              </div>
            )
          )}
        </h2>
        <div className="text-xs text-slate-500 mt-1">
          Powered by CredoNet LLM · Secure Server API Gateway
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((p, i) => (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-sky-500/30 px-3 py-1.5 rounded-lg text-left transition-all max-w-full truncate cursor-pointer"
          >
            {i === 0 ? "📖 Study Plan" : i === 1 ? "🧘 Breathe" : "✨ Compliment SIA"}
          </motion.button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col overflow-hidden min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-950 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {chatMessages.map((msg, i) => {
              const isAI = msg.role === "ai";
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  key={i}
                  className={`flex flex-col max-w-[80%] ${
                    isAI ? "self-start items-start" : "self-end items-end ml-auto"
                  }`}
                >
                  {isAI && (
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                      <Bot className="w-3.5 h-3.5" />
                      <span>SIA</span>
                    </div>
                  )}
                  <div
                    className={`text-xs p-3 leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? "bg-sky-500/10 border border-sky-500/20 text-sky-200 rounded-tr-xl rounded-br-xl rounded-bl-xl"
                        : "bg-slate-900/80 border border-white/5 text-slate-200 rounded-tl-xl rounded-tr-xl rounded-bl-xl"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col self-start items-start max-w-[80%]"
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-sky-400 font-bold uppercase tracking-wider animate-pulse">
                <Bot className="w-3.5 h-3.5" />
                <span>SIA is typing...</span>
              </div>
              <div className="bg-sky-500/5 border border-sky-500/10 text-sky-200 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-300" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-white/5 pt-3 mt-3 flex items-center gap-2">
          {/* Bottom Left Dropdown Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Customize SIA Persona"
            >
              <Settings2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">SIA Persona</span>
              <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  {/* Dropdown Menu Box */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute bottom-full mb-2 left-0 w-64 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl p-3 space-y-2 z-20"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-white/5">
                      Customize SIA
                    </div>
                    
                    {/* Style Toggle */}
                    <button
                      onClick={() => {
                        toggleSiaFriendStyle();
                      }}
                      className="w-full flex items-center justify-between text-left px-2.5 py-2 hover:bg-white/5 rounded-xl transition-all group text-xs text-slate-200 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold block">Close Friend Style</span>
                        <span className="text-[9px] text-slate-500 block">Supportive & casual buddy</span>
                      </div>
                      {userProfile?.siaFriendStyle !== false ? (
                        <Check className="w-4 h-4 text-sky-400" />
                      ) : (
                        <div className="w-4 h-4 border border-white/20 rounded-md" />
                      )}
                    </button>

                    {/* Humor Toggle */}
                    <button
                      onClick={() => {
                        toggleSiaHumorous();
                      }}
                      className="w-full flex items-center justify-between text-left px-2.5 py-2 hover:bg-white/5 rounded-xl transition-all group text-xs text-slate-200 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold block">Humor & Wit</span>
                        <span className="text-[9px] text-slate-500 block">Jokes & playful comments</span>
                      </div>
                      {userProfile?.siaHumorous !== false ? (
                        <Check className="w-4 h-4 text-sky-400" />
                      ) : (
                        <div className="w-4 h-4 border border-white/20 rounded-md" />
                      )}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            className="flex-1 bg-slate-900/60 border border-white/5 text-xs text-white placeholder-slate-500 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 transition-colors"
            placeholder="Type a message to SIA... (e.g. 'Sia, you are amazing!')"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(userInput)}
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: userInput.trim() ? 1.05 : 1 }}
            whileTap={{ scale: userInput.trim() ? 0.95 : 1 }}
            onClick={() => handleSend(userInput)}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:opacity-50"
            disabled={!userInput.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
