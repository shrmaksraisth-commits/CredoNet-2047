import React, { useState } from "react";
import { 
  Check, 
  ShieldAlert, 
  Activity, 
  Database, 
  Wifi, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Key,
  RefreshCw,
  Clock,
  XCircle
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface SettingsScreenProps {
  currentUser?: FirebaseUser | null;
  userProfile: { name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean } | null;
  setUserProfile: React.Dispatch<React.SetStateAction<{ name: string; role: string; theme?: "light" | "dark"; siaFriendStyle?: boolean; siaHumorous?: boolean } | null>>;
}

export default function SettingsScreen({ currentUser, userProfile, setUserProfile }: SettingsScreenProps) {
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [storageEnabled, setStorageEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "sia">("general");

  const friendStyle = userProfile?.siaFriendStyle !== false;
  const humorous = userProfile?.siaHumorous !== false;

  const toggleSiaFriendStyle = () => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      siaFriendStyle: !friendStyle,
    });
  };

  const toggleSiaHumorous = () => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      siaHumorous: !humorous,
    });
  };

  // Diagnostic states
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    serverReachable: boolean | null;
    dbConnected: boolean | null;
    authValid: boolean | null;
    dbMessage: string;
    serverMessage: string;
    authMessage: string;
    timestamp: string | null;
  } | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const newResults = {
      serverReachable: false,
      dbConnected: false,
      authValid: currentUser ? false : null,
      dbMessage: "No response from database.",
      serverMessage: "Could not contact backend server.",
      authMessage: currentUser ? "Checking authentication..." : "No Google account is currently signed in. Remote database sync requires authentication.",
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      // 1. Ping the public diagnostic route
      const pingStart = Date.now();
      const pingRes = await fetch("/api/sync/ping");
      const pingEnd = Date.now();
      const duration = pingEnd - pingStart;

      if (pingRes.ok) {
        const data = await pingRes.json();
        newResults.serverReachable = true;
        newResults.serverMessage = `Backend server responded in ${duration}ms. Status code: ${pingRes.status}.`;
        
        if (data.database === "connected") {
          newResults.dbConnected = true;
          newResults.dbMessage = "Successfully executed health query on Cloud SQL database. Pool is online and ready.";
        } else {
          newResults.dbConnected = false;
          newResults.dbMessage = `Cloud SQL database is offline or misconfigured: ${data.error || "Unknown error"}`;
        }
      } else {
        newResults.serverReachable = true; // Server replied but with non-2xx
        newResults.serverMessage = `Backend server replied with an error. Status code: ${pingRes.status}.`;
        newResults.dbConnected = false;
        newResults.dbMessage = "Could not verify database connection because the public ping endpoint returned an error status.";
      }
    } catch (e: any) {
      newResults.serverReachable = false;
      newResults.serverMessage = `Network error trying to fetch /api/sync/ping: ${e.message || String(e)}`;
      newResults.dbConnected = null;
      newResults.dbMessage = "Skipped (Server unreachable).";
    }

    // 2. If signed in, let's test GET /api/sync which is an authenticating query layer fetch
    if (currentUser && newResults.serverReachable) {
      try {
        const token = await currentUser.getIdToken();
        const syncStart = Date.now();
        const syncRes = await fetch("/api/sync", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const syncEnd = Date.now();

        if (syncRes.ok) {
          newResults.authValid = true;
          newResults.authMessage = `User ID token is verified. Sync fetch succeeded in ${syncEnd - syncStart}ms.`;
        } else {
          const errData = await syncRes.json().catch(() => ({}));
          newResults.authValid = false;
          newResults.authMessage = `Authorization failed (Status ${syncRes.status}): ${errData.error || "Invalid Token or database sync issue"}`;
        }
      } catch (e: any) {
        newResults.authValid = false;
        newResults.authMessage = `Error contacting /api/sync with token: ${e.message || String(e)}`;
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure AI memory, syncing, and customize SIA Persona.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-6 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "general"
              ? "text-blue-400 border-blue-500"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          General & Diagnostics
        </button>
        <button
          onClick={() => setActiveTab("sia")}
          className={`text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "sia"
              ? "text-blue-400 border-blue-500"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          SIA Persona Settings
        </button>
      </div>

      {activeTab === "general" && (
        <>
          {/* Preferences Panel */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 divide-y divide-white/5">
            {/* Memory Toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-200">SIA Assistant Memory</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Allows SIA to retain contextual task logs locally in your browser sandbox
                </div>
              </div>
              <button
                onClick={() => setMemoryEnabled(!memoryEnabled)}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${
                  memoryEnabled ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    memoryEnabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Sync Toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-200">Local Storage Persistence</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Direct sandboxed offline storage rather than remote database imports
                </div>
              </div>
              <button
                onClick={() => setStorageEnabled(!storageEnabled)}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${
                  storageEnabled ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    storageEnabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Diagnostics Panel */}
          <div className="bg-[#0B132B] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Database Sync & Server Diagnostics
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
                  Troubleshoot synchronization connectivity. This executes an end-to-end telemetry check 
                  to verify if the client can reach the backend server, and if the backend can communicate with the Cloud SQL database.
                </p>
              </div>
              
              <button
                onClick={runDiagnostics}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Run Diagnostics Ping
                  </>
                )}
              </button>
            </div>

            {results && (
              <div className="bg-slate-950/50 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden animate-fadeIn text-xs">
                {/* Timestamp */}
                <div className="flex items-center gap-1 px-4 py-2 bg-slate-950 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Diagnostic executed at: {results.timestamp}</span>
                </div>

                {/* Test 1: Server Reachability */}
                <div className="flex items-start gap-3.5 p-4">
                  <div className="mt-0.5 shrink-0">
                    {results.serverReachable === null ? (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">?</div>
                    ) : results.serverReachable ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      1. Server Reachability (ping `/api/sync/ping`)
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      {results.serverMessage}
                    </p>
                  </div>
                </div>

                {/* Test 2: Database Connectivity */}
                <div className="flex items-start gap-3.5 p-4">
                  <div className="mt-0.5 shrink-0">
                    {results.dbConnected === null ? (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">?</div>
                    ) : results.dbConnected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      2. Cloud SQL Database Connectivity
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {results.dbMessage}
                    </p>
                  </div>
                </div>

                {/* Test 3: User Authentication Sync Verification */}
                <div className="flex items-start gap-3.5 p-4">
                  <div className="mt-0.5 shrink-0">
                    {results.authValid === null ? (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    ) : results.authValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-400" />
                      3. Session Authentication & Sync Fetch
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {results.authMessage}
                    </p>
                    {results.authValid === false && (
                      <p className="text-[10px] text-amber-400 mt-1 leading-normal">
                        💡 If you are encountering <code>auth/unauthorized-domain</code>, make sure to add this host's domain to your Authorized Domains list in the Firebase Console Settings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "sia" && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 divide-y divide-white/5">
            {/* Conversation Style */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-200">Close Friend Conversation Style</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Sia talks like a close, warm, and supportive buddy using casual, companionable language
                </div>
              </div>
              <button
                onClick={toggleSiaFriendStyle}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${
                  friendStyle ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    friendStyle ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Humorous Personality */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-200">Humorous Personality</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Enable Sia's witty sense of humor, playful banter, and fun comments
                </div>
              </div>
              <button
                onClick={toggleSiaHumorous}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${
                  humorous ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    humorous ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
