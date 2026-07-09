import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  Inbox, 
  CheckCircle2, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Trash, 
  Loader2, 
  Clock, 
  AlertCircle,
  Copy,
  ChevronRight,
  SendHorizontal
} from "lucide-react";
import { GmailMessage } from "../types";
import { auth, gmailAuthProvider } from "../lib/firebase.ts";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface GmailScreenProps {
  gmailAccessToken: string | null;
  setGmailAccessToken: (token: string | null) => void;
  addXP: (amount: number, description: string) => void;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean; siaWebSearchEnabled?: boolean } | null;
  onAddTask: (text: string, priority: "high" | "medium" | "low") => void;
}

export default function GmailScreen({
  gmailAccessToken,
  setGmailAccessToken,
  addXP,
  userProfile,
  onAddTask,
}: GmailScreenProps) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // AI interactive state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImprovising, setAiImprovising] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleAIImproviseEmail = async () => {
    if (!composeBody.trim()) return;
    setAiImprovising(true);

    const prompt = `You are SIA, an expert AI assistant. Please professionally improvise and improve the following email draft written by the user.
Keep it concise, polite, and effective. If there is a subject, ensure the body matches the context.
Do NOT include any greetings or sign-offs unless they are already present, just improve the core content directly.

Original Draft:
${composeBody}
`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: "You are SIA, a helpful AI Workspace assistant. Output only the improved email body without any preamble or extra text.",
          model: "gemini-3.5-flash"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let improvedText = "";
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          improvedText = data.candidates[0].content.parts[0].text;
        } else if (data.text) {
          improvedText = data.text;
        }
        if (improvedText) {
          setComposeBody(improvedText.trim());
          addXP(20, "Improvised email draft using AI");
        }
      }
    } catch (err) {
      console.error("AI Improvise Error:", err);
    } finally {
      setAiImprovising(false);
    }
  };
  const [aiReplyDraft, setAiReplyDraft] = useState<string | null>(null);
  const [aiTasks, setAiTasks] = useState<string[]>([]);

  // Connect Google account pop-up
  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, gmailAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGmailAccessToken(credential.accessToken);
        addXP(100, "Connected Gmail Inbox to CredoNet SIA");
      } else {
        throw new Error("Unable to obtain Google Access Token. Please try again.");
      }
    } catch (err: any) {
      console.error("Gmail Connection Error:", err);
      setError(err.message || "Failed to link Google account.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to decode base64url encoded parts of email bodies
  const decodeBase64 = (str: string) => {
    try {
      // Replace non-ascii chars, change base64url to base64
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      try {
        return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
      } catch (err) {
        return str; // Fallback
      }
    }
  };

  // Parse headers helper
  const getHeader = (headers: any[], name: string) => {
    const found = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
    return found ? found.value : "";
  };

  // Parse body text from payload
  const getBody = (payload: any): string => {
    if (!payload) return "";
    if (payload.body && payload.body.data) {
      return decodeBase64(payload.body.data);
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          return decodeBase64(part.body.data);
        }
        if (part.mimeType === "text/html" && part.body && part.body.data) {
          // If HTML, we can parse it simple or strip basic HTML tags for display
          const rawHtml = decodeBase64(part.body.data);
          return rawHtml.replace(/<[^>]*>/g, " "); // Basic strip
        }
        if (part.parts) {
          const nested = getBody(part);
          if (nested) return nested;
        }
      }
    }
    return "";
  };

  // Fetch recent messages
  const fetchInbox = async () => {
    if (!gmailAccessToken) return;
    setLoading(true);
    setError(null);
    setSelectedMessage(null);
    setAiSummary(null);
    setAiReplyDraft(null);
    setAiTasks([]);

    try {
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=category:primary",
        {
          headers: {
            Authorization: `Bearer ${gmailAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Access token expired or revoked
          setGmailAccessToken(null);
          throw new Error("Session expired. Please re-connect your Gmail account.");
        }
        throw new Error(`Gmail API returned status ${response.status}`);
      }

      const listData = await response.json();
      if (!listData.messages || listData.messages.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch detail for each message in parallel
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
              threadId: detailData.threadId,
              subject: getHeader(headers, "subject") || "(No Subject)",
              from: getHeader(headers, "from") || "Unknown Sender",
              to: getHeader(headers, "to"),
              date: getHeader(headers, "date"),
              snippet: detailData.snippet || "",
              body: getBody(detailData.payload) || detailData.snippet || "",
              labels: detailData.labelIds || [],
            };
          }
          return null;
        } catch (err) {
          console.error("Failed to fetch details for message", msg.id, err);
          return null;
        }
      });

      const resolvedDetails = await Promise.all(detailsPromises);
      const validMessages = resolvedDetails.filter((m) => m !== null) as GmailMessage[];
      setMessages(validMessages);
    } catch (err: any) {
      console.error("Fetch Inbox Error:", err);
      setError(err.message || "Failed to fetch inbox messages.");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or when token changes
  useEffect(() => {
    if (gmailAccessToken) {
      fetchInbox();
    }
  }, [gmailAccessToken]);

  // Send a new email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailAccessToken || !to || !subject || !composeBody) return;
    
    setSending(true);
    setError(null);

    try {
      const rawMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        `MIME-Version: 1.0`,
        ``,
        composeBody
      ].join("\r\n");

      // base64url encode the MIME payload
      const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const sendResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gmailAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: encodedMessage,
          }),
        }
      );

      if (!sendResponse.ok) {
        throw new Error("Failed to send message via Gmail service.");
      }

      setIsComposing(false);
      setTo("");
      setSubject("");
      setComposeBody("");
      addXP(50, `Sent email to ${to} via CredoNet SIA`);
      setIsComposing(false);
      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 3000);
      fetchInbox();
    } catch (err: any) {
      console.error("Send Email Error:", err);
      setError(err.message || "Failed to deliver email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // SIA AI Actions for selected email
  const handleAISummarize = async () => {
    if (!selectedMessage) return;
    setAiLoading(true);
    setAiSummary(null);
    setAiReplyDraft(null);
    setAiTasks([]);

    const content = `Subject: ${selectedMessage.subject}\nFrom: ${selectedMessage.from}\nBody: ${selectedMessage.body}`;

    const prompt = `You are SIA, a highly competent, witty, and deeply supportive AI Workspace Companion on CredoNet.
Your friend wants you to analyze and summarize this email.
Provide:
1. A concise, easy-to-read summary (2-4 sentences max) written in natural, cheerful Hinglish (casually mixing English and Hindi) with a friendly, witty tone.
2. Clearly identify what the email is about and any urgency.
Do NOT use emojis. Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${prompt}\n\nEmail Content:\n${content}` }] }],
          systemInstruction: "You are SIA, a helpful AI Workspace assistant. Keep it concise, natural Hinglish and friendly.",
          model: "gemini-3.5-flash",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          setAiSummary(data.candidates[0].content.parts[0].text);
          addXP(15, "AI Summarized external email correspondence");
        }
      }
    } catch (err) {
      console.error("AI Summarize error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIDraftReply = async () => {
    if (!selectedMessage) return;
    setAiLoading(true);
    setAiReplyDraft(null);

    const content = `Subject: ${selectedMessage.subject}\nFrom: ${selectedMessage.from}\nBody: ${selectedMessage.body}`;

    const prompt = `You are SIA, the AI companion on CredoNet.
Draft a professional yet warm, witty, and perfectly calibrated email response to the sender on behalf of ${userProfile?.name || "Arjun"} (${userProfile?.role || "student"}).
You should write the reply in standard, clear English, but add a closing line of cheerful Hinglish friend encouragement. Keep it concise (under 120 words).
Do NOT include subjects or headers, just start with 'Dear [Sender],' and write the draft. Do NOT use emojis.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${prompt}\n\nEmail to reply to:\n${content}` }] }],
          systemInstruction: "You are SIA, drafting an email response. Ensure high professional quality with a warm closing.",
          model: "gemini-3.5-flash",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          setAiReplyDraft(data.candidates[0].content.parts[0].text);
          addXP(20, "Generated AI email response draft");
        }
      }
    } catch (err) {
      console.error("AI Reply error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExtractTasks = async () => {
    if (!selectedMessage) return;
    setAiLoading(true);
    setAiTasks([]);

    const content = `Subject: ${selectedMessage.subject}\nBody: ${selectedMessage.body}`;

    const prompt = `You are SIA, the productivity coordinator.
Scan this email text and identify any actionable tasks, homework, deadlines, or items that need attention.
Output ONLY a raw, line-by-line list of tasks, with no headers, bullet points, or numbering. Just the direct text of each task. Keep each task under 60 characters.
If no tasks are found, output 'No specific tasks found.'`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${prompt}\n\nEmail text:\n${content}` }] }],
          systemInstruction: "You are SIA. Output tasks one per line. No bullets.",
          model: "gemini-3.5-flash",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          const tasksList = rawText
            .split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && !line.toLowerCase().includes("no specific tasks"));
          setAiTasks(tasksList);
          addXP(25, "Extracted study checklist items via AI Workspace Scan");
        }
      }
    } catch (err) {
      console.error("AI Tasks error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // UI rendering when not authenticated with Google Gmail
  if (!gmailAccessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 font-sans">
        <div className="w-full max-w-lg bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center mx-auto text-sky-400 border border-sky-500/10 shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Gmail Productivity Integration</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              SIA can safely synchronize with your Google Workspace Inbox to summarize urgent class letters, list assignments, and draft instant smart replies!
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/20 border border-rose-500/15 text-rose-400 p-4 rounded-xl text-[11px] flex flex-col gap-2 max-w-sm mx-auto text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-rose-500/10 pt-2 mt-1 leading-relaxed">
                💡 <strong>Why did this happen?</strong> Browsers block third-party cookies and popup synchronization inside cross-origin <strong>iframes</strong> (like this preview). 
                <br /><br />
                <strong>To solve this:</strong> Simply click the <strong>"Open in New Tab"</strong> button in the top-right corner of your AI Studio browser window and try signing in there!
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-center items-center">
            <button
              onClick={handleConnectGmail}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Unlock SIA's Key to Inbox
            </button>
          </div>

          <p className="text-[10px] text-slate-500">
            Secure connection via official Google OAuth API scopes. With permission, SIA can read, search, and send emails inside your secure web workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-sans">
      {/* Upper bar */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Gmail Workspace
            <span className="text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-semibold">Active</span>
          </h2>
          <div className="text-xs text-slate-500">
            Synchronized with Google Workspace Security API · Handled by SIA AI
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposing(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>

          <button
            onClick={fetchInbox}
            disabled={loading}
            className="p-1.5 bg-slate-900 border border-white/5 hover:border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-all disabled:opacity-50"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-950/20 border border-rose-500/10 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Inbox list vs Detail / Compose */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left Column: List of Emails */}
        <div className={`lg:col-span-5 bg-slate-950/30 border border-white/5 rounded-xl flex flex-col min-h-0 ${selectedMessage || isComposing ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-sky-400" />
              Primary Inbox ({messages.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-1 scrollbar-thin scrollbar-thumb-slate-950">
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <p className="text-xs text-slate-500">Retrieving secure primary inbox...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
                <Mail className="w-8 h-8 opacity-40 text-slate-400" />
                <p className="text-xs">Your Inbox is empty!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setIsComposing(false);
                      setAiSummary(null);
                      setAiReplyDraft(null);
                      setAiTasks([]);
                    }}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-sky-500/10 border-l-2 border-sky-400"
                        : "hover:bg-slate-900/40 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                        {msg.from.split("<")[0].trim()}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.date ? new Date(msg.date).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-sky-200 truncate mb-1">
                      {msg.subject}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {msg.snippet}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Display Details / Compose Frame */}
        <div className={`relative lg:col-span-7 bg-slate-950/40 border border-white/5 rounded-xl flex flex-col min-h-0 ${!selectedMessage && !isComposing ? "hidden lg:flex items-center justify-center text-slate-500 text-center p-6" : "flex"}`}>
          
          {emailSentSuccess && (
            <div className="absolute top-4 right-4 z-50 animate-fadeIn bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Email Transmitted via SIA!</span>
            </div>
          )}

          {/* Default idle message */}
          {!selectedMessage && !isComposing && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">No Email Selected</p>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1">
                  Click on any incoming email to read, create task items, or generate witty smart replies using SIA.
                </p>
              </div>
            </div>
          )}

          {/* Composition window */}
          {isComposing && (
            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col min-h-0 p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="lg:hidden p-1 bg-slate-900 border border-white/5 rounded text-slate-400"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <SendHorizontal className="w-3.5 h-3.5 text-sky-400" />
                    New Email Composition
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">To (Recipient Email)</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. teacher@school.edu.in"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg text-xs text-white px-3 py-2 outline-none focus:border-blue-500/50"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics Assignment Submission Details"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg text-xs text-white px-3 py-2 outline-none focus:border-blue-500/50"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email Body</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write your email body here..."
                    className="w-full flex-1 bg-slate-900 border border-white/5 rounded-lg text-xs text-white p-3 outline-none focus:border-blue-500/50 resize-none"
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 hidden sm:inline-block">Verified by CredoNet secure mail server</span>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleAIImproviseEmail}
                    disabled={aiImprovising || sending || !composeBody.trim()}
                    className="px-4 py-2.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/15 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aiImprovising ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Improvise with AI</span>
                  </button>

                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmit Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Email View and SIA Intelligent Agent Integration */}
          {selectedMessage && !isComposing && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Message Header */}
              <div className="p-4 border-b border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="lg:hidden p-1 bg-slate-900 border border-white/5 rounded text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono text-[9px]">
                      Sender
                    </span>
                    <span className="text-xs text-slate-300 font-bold truncate">
                      {selectedMessage.from}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {selectedMessage.subject}
                  </h3>

                  <div className="text-[10px] text-slate-500">
                    Received: {selectedMessage.date ? new Date(selectedMessage.date).toLocaleString() : ""}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 hidden lg:block"
                >
                  Close Email
                </button>
              </div>

              {/* Message content & SIA Side panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-950">
                
                {/* Email Body */}
                <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto pr-1">
                    {selectedMessage.body || selectedMessage.snippet}
                  </div>
                </div>

                {/* SIA AI Panel Integration */}
                <div className="bg-gradient-to-r from-sky-950/20 to-blue-950/10 border border-sky-500/10 rounded-xl p-4 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white">SIA Workspace Co-pilot</span>
                    </div>
                    {aiLoading && (
                      <span className="text-[10px] text-sky-400 flex items-center gap-1 font-semibold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAISummarize}
                      disabled={aiLoading}
                      className="px-3 py-1.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/15 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Summarize Conversation
                    </button>

                    <button
                      onClick={handleAIDraftReply}
                      disabled={aiLoading}
                      className="px-3 py-1.5 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-500/15 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Draft Smart Reply
                    </button>

                    <button
                      onClick={handleAIExtractTasks}
                      disabled={aiLoading}
                      className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/15 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Extract Study Tasks
                    </button>
                  </div>

                  {/* AI Results Output area */}
                  {aiSummary && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3 space-y-1">
                      <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">
                        SIA Summary
                      </span>
                      <p className="text-[11px] text-sky-200 leading-relaxed whitespace-pre-wrap">
                        {aiSummary}
                      </p>
                    </div>
                  )}

                  {aiReplyDraft && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                          SIA Recommended Draft
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiReplyDraft);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Draft</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[140px] overflow-y-auto">
                        {aiReplyDraft}
                      </p>
                      
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                            setSubject(`Re: ${selectedMessage.subject}`);
                            setComposeBody(aiReplyDraft);
                            setIsComposing(true);
                          }}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-all"
                        >
                          <span>Apply to compose panel</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {aiTasks.length > 0 && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3 space-y-2">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">
                        Extracted Action Items
                      </span>
                      <div className="space-y-1.5">
                        {aiTasks.map((t, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 bg-slate-950/30 p-2 rounded border border-white/5">
                            <span className="text-[11px] text-slate-300 truncate flex-1">{t}</span>
                            <button
                              onClick={() => {
                                onAddTask(t, "medium");
                                setAiTasks(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="px-2 py-0.5 bg-purple-900/40 hover:bg-purple-900 text-purple-300 text-[9px] font-bold rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              Add to Tasks
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
