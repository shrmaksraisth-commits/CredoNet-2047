import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { eq, sql } from "drizzle-orm";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import {
  users,
  tasks as tasksTable,
  goals as goalsTable,
  habits as habitsTable,
  calendarEvents as calendarTable,
  moodJournal as moodTable,
  xpLogs as xpTable,
  chatMessages as chatTable
} from "./src/db/schema.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API route for chat and calendar parsing proxy
app.post("/api/chat", async (req, res) => {
  try {
    const { contents, systemInstruction, model, tools } = req.body;
    
    // Prioritize the official permanent environment variable injected by AI Studio.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
    }
    
    // Map models to valid, non-deprecated models. Prohibited: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash, gemini-2.0-pro.
    let selectedModel = "gemini-3.5-flash"; // Prioritize gemini-3.5-flash for reliability, high quota, and speed
    if (model && typeof model === "string") {
      const lowerModel = model.toLowerCase();
      if (lowerModel.includes("lite")) {
        selectedModel = "gemini-3.1-flash-lite";
      } else if (lowerModel.includes("pro") || lowerModel.includes("3.1")) {
        // Since gemini-3.1-pro-preview has 0 free tier quota on this key, map it to gemini-3.5-flash first to guarantee success.
        selectedModel = "gemini-3.5-flash";
      } else if (lowerModel.includes("flash")) {
        selectedModel = "gemini-3.5-flash";
      } else {
        selectedModel = model;
      }
    }
    
    // Ensure base URL and endpoint paths are correctly configured
    const baseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
    const isGoogleEndpoint = baseUrl.includes("generativelanguage.googleapis.com");

    // Standard Gemini REST API expects systemInstruction to be in Content format: { parts: [{ text: "..." }] }
    let formattedSystemInstruction = undefined;
    if (systemInstruction) {
      if (typeof systemInstruction === "string") {
        formattedSystemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      } else {
        formattedSystemInstruction = systemInstruction;
      }
    }

    const payload: Record<string, any> = {
      contents,
    };
    if (formattedSystemInstruction) {
      payload.systemInstruction = formattedSystemInstruction;
    }
    if (tools) {
      payload.tools = tools;
    }

    // Determine the list of models to try in sequence to ensure high availability and robust performance
    const modelsToTry = [selectedModel];
    if (!modelsToTry.includes("gemini-3.5-flash")) {
      modelsToTry.push("gemini-3.5-flash");
    }
    if (!modelsToTry.includes("gemini-3.1-flash-lite")) {
      modelsToTry.push("gemini-3.1-flash-lite");
    }
    if (!modelsToTry.includes("gemini-2.5-flash")) {
      modelsToTry.push("gemini-2.5-flash");
    }
    if (!modelsToTry.includes("gemini-2.0-flash")) {
      modelsToTry.push("gemini-2.0-flash");
    }
    if (!modelsToTry.includes("gemini-1.5-flash")) {
      modelsToTry.push("gemini-1.5-flash");
    }

    let lastErrorText = "";
    let lastStatus = 500;
    let responseData = null;
    let successfulModel = "";

    for (const currentModel of modelsToTry) {
      try {
        const endpointPath = `/v1beta/models/${currentModel}:generateContent`;
        const fullUrl = isGoogleEndpoint ? `${baseUrl}${endpointPath}?key=${apiKey}` : `${baseUrl}${endpointPath}`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (isGoogleEndpoint) {
          headers["x-goog-api-key"] = apiKey;
        } else {
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["x-goog-api-key"] = apiKey;
        }

        console.log(`[AI Proxy] Attempting chat request using model: ${currentModel}`);
        const response = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          responseData = await response.json();
          successfulModel = currentModel;
          break; // Success! Break out of the loop
        } else {
          lastStatus = response.status;
          lastErrorText = await response.text();
          console.warn(`[AI Proxy] Model ${currentModel} failed with status ${lastStatus}. Error: ${lastErrorText}`);
        }
      } catch (err: any) {
        lastStatus = 500;
        lastErrorText = err.message || String(err);
        console.error(`[AI Proxy] Network/Internal error attempting ${currentModel}:`, err);
      }
    }

    if (responseData) {
      console.log(`[AI Proxy] Successfully completed request using model: ${successfulModel}`);
      res.json(responseData);
    } else {
      console.error("[AI Proxy] All model attempts failed.");
      res.status(lastStatus).json({
        error: `Upstream error or rate limit exceeded`,
        details: lastErrorText
      });
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// GET /api/sync/ping - Check server reachability and database connection
app.get("/api/sync/ping", async (req, res) => {
  try {
    // Check database connection by running a simple query
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "healthy",
      server: "reachable",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Database connection check failed in ping:", error);
    res.status(500).json({
      status: "degraded",
      server: "reachable",
      database: "disconnected",
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sync - Retrieve all workspace data for authenticated user
app.get("/api/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;

    // Query Layer try-catch protection
    let userTasks, userGoals, userHabits, userCalendar, userMood, userXP, userChat;
    try {
      userTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
      userGoals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
      userHabits = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
      userCalendar = await db.select().from(calendarTable).where(eq(calendarTable.userId, userId));
      userMood = await db.select().from(moodTable).where(eq(moodTable.userId, userId));
      userXP = await db.select().from(xpTable).where(eq(xpTable.userId, userId));
      userChat = await db.select().from(chatTable).where(eq(chatTable.userId, userId));
    } catch (dbError) {
      throw new Error("Failed to fetch database records.", { cause: dbError });
    }

    // Format calendar events into dynamic Record<string, CalendarEvent[]>
    const calendarEvents: Record<string, any[]> = {};
    for (const evt of userCalendar) {
      if (!calendarEvents[evt.date]) {
        calendarEvents[evt.date] = [];
      }
      calendarEvents[evt.date].push({
        title: evt.title,
        time: evt.time,
        duration: evt.duration,
      });
    }

    // Parse habits days array string
    const habitsList = userHabits.map(h => {
      let daysArr = [false, false, false, false, false, false, false];
      try {
        daysArr = JSON.parse(h.days);
      } catch (e) {
        console.warn("Failed to parse habit days array:", h.days, e);
      }
      return {
        id: h.id,
        name: h.name,
        streak: h.streak,
        days: daysArr,
      };
    });

    res.json({
      xp: req.dbUser!.xp,
      tasks: userTasks.map(t => ({
        id: t.id,
        text: t.text,
        done: t.done,
        priority: t.priority,
        due: t.due,
      })),
      calendarEvents,
      goals: userGoals.map(g => ({
        id: g.id,
        name: g.name,
        pct: g.pct,
        deadline: g.deadline,
        color: g.color,
        code: g.code,
      })),
      habits: habitsList,
      moodJournal: userMood.map(m => ({
        label: m.label,
        note: m.note,
        timestamp: m.timestamp,
      })),
      xpLogs: userXP.map(x => ({
        xp: x.xp,
        desc: x.desc,
        time: x.time,
      })),
      chatMessages: userChat.map(c => ({
        role: c.role,
        text: c.text,
      })),
      userProfile: {
        name: req.dbUser!.name || "",
        role: req.dbUser!.role || "student",
        siaFriendStyle: req.dbUser!.siaFriendStyle,
        siaHumorous: req.dbUser!.siaHumorous,
      },
    });
  } catch (err: any) {
    console.error("API Error during GET /api/sync:", err); require("fs").writeFileSync("sync_error_get.log", err.stack || err.message || String(err));
    res.status(500).json({ error: err.message || "Database synchronization failed." });
  }
});

// POST /api/sync - Batch sync all workspace data from frontend to PostgreSQL
app.post("/api/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;
    const { xp, tasks, calendarEvents, goals, habits, moodJournal, xpLogs, chatMessages, userProfile } = req.body;

    // Use a transaction or sequential updates with Query Layer try/catch protection
    try {
      // 1. Update overall User Profile (name, role, xp, siaFriendStyle, siaHumorous)
      if (userProfile || xp !== undefined) {
        const updatePayload: any = {
          xp: xp !== undefined ? xp : req.dbUser!.xp,
        };
        if (userProfile) {
          if (userProfile.name) updatePayload.name = userProfile.name;
          if (userProfile.role) updatePayload.role = userProfile.role;
          if (userProfile.siaFriendStyle !== undefined) updatePayload.siaFriendStyle = !!userProfile.siaFriendStyle;
          if (userProfile.siaHumorous !== undefined) updatePayload.siaHumorous = !!userProfile.siaHumorous;
        }

        await db.update(users)
          .set(updatePayload)
          .where(eq(users.id, userId));
      }

      // 2. Sync Tasks (Clear old & batch insert)
      await db.delete(tasksTable).where(eq(tasksTable.userId, userId));
      if (tasks && tasks.length > 0) {
        await db.insert(tasksTable).values(
          tasks.map((t: any) => ({
            userId,
            text: t.text,
            done: !!t.done,
            priority: t.priority || "medium",
            due: t.due || "Today",
          }))
        );
      }

      // 3. Sync Goals
      await db.delete(goalsTable).where(eq(goalsTable.userId, userId));
      if (goals && goals.length > 0) {
        await db.insert(goalsTable).values(
          goals.map((g: any) => ({
            userId,
            name: g.name,
            pct: g.pct || 0,
            deadline: g.deadline || "Ongoing",
            color: g.color || "#2563EB",
            code: g.code || "EDU",
          }))
        );
      }

      // 4. Sync Habits
      await db.delete(habitsTable).where(eq(habitsTable.userId, userId));
      if (habits && habits.length > 0) {
        await db.insert(habitsTable).values(
          habits.map((h: any) => ({
            userId,
            name: h.name,
            streak: h.streak || 0,
            days: JSON.stringify(h.days || [false, false, false, false, false, false, false]),
          }))
        );
      }

      // 5. Sync Calendar Events
      await db.delete(calendarTable).where(eq(calendarTable.userId, userId));
      if (calendarEvents) {
        const eventsToInsert: any[] = [];
        for (const [date, evts] of Object.entries(calendarEvents)) {
          if (Array.isArray(evts)) {
            for (const evt of evts) {
              eventsToInsert.push({
                userId,
                date,
                title: evt.title,
                time: evt.time || "12:00 PM",
                duration: evt.duration || "1h",
              });
            }
          }
        }
        if (eventsToInsert.length > 0) {
          await db.insert(calendarTable).values(eventsToInsert);
        }
      }

      // 6. Sync Mood entries
      await db.delete(moodTable).where(eq(moodTable.userId, userId));
      if (moodJournal && moodJournal.length > 0) {
        await db.insert(moodTable).values(
          moodJournal.map((m: any) => ({
            userId,
            label: m.label || "Neutral",
            note: m.note || "",
            timestamp: m.timestamp || "Just now",
          }))
        );
      }

      // 7. Sync XP Logs
      await db.delete(xpTable).where(eq(xpTable.userId, userId));
      if (xpLogs && xpLogs.length > 0) {
        await db.insert(xpTable).values(
          xpLogs.map((x: any) => ({
            userId,
            xp: x.xp,
            desc: x.desc || "Activity completed",
            time: x.time || "Just now",
          }))
        );
      }

      // 8. Sync Chat Messages
      await db.delete(chatTable).where(eq(chatTable.userId, userId));
      if (chatMessages && chatMessages.length > 0) {
        await db.insert(chatTable).values(
          chatMessages.map((c: any) => ({
            userId,
            role: c.role || "user",
            text: c.text || "",
          }))
        );
      }
    } catch (dbError) {
      throw new Error("Failed to sync workspace data in transaction.", { cause: dbError });
    }

    res.json({ status: "success", message: "Data synced successfully to Cloud SQL" });
  } catch (err: any) {
    console.error("API Error during POST /api/sync:", err); require("fs").writeFileSync("sync_error.log", err.stack || err.message || String(err));
    res.status(500).json({ error: err.message || "Database synchronization failed." });
  }
});

// API route for image generation and editing
app.post("/api/image", async (req, res) => {
  try {
    const { prompt, base64Image } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
    }
    const ai = new GoogleGenAI({ apiKey });

    let inputPayload: any;
    if (base64Image) {
      let rawBase64 = base64Image;
      let detectedMime = "image/png";
      const match = base64Image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        rawBase64 = match[2];
      }
      inputPayload = [
        {
          type: "image",
          data: rawBase64,
          mime_type: detectedMime,
        },
        {
          type: "text",
          text: prompt,
        },
      ];
    } else {
      inputPayload = prompt;
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-image",
      input: inputPayload,
      response_modalities: ["image", "text"],
      generation_config: {
        image_config: {
          aspect_ratio: "1:1",
          image_size: "1K"
        },
      },
    });

    let imageUrl = null;
    for (const step of interaction.steps) {
      if (step.type === 'model_output') {
        const imageContent = step.content?.find(c => c.type === 'image');
        if (imageContent && imageContent.data) {
          const base64EncodeString = imageContent.data;
          const mimeType = imageContent.mime_type || 'image/png';
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
        }
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(500).json({ error: "No image was generated." });
    }
  } catch (error: any) {
    console.error("[Image API Error]:", error);
    res.status(500).json({ error: error.message || "Failed to generate or edit image" });
  }
});

// Vite middleware setup for SPA
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: "/live" });
  wss.on("connection", async (clientWs) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[Live API Error]: GEMINI_API_KEY environment variable is missing.");
        clientWs.close();
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Sia, a helpful, witty assistant.",
        },
      });

      clientWs.on("message", (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      });

      clientWs.on("close", () => {
        session.close();
      });
    } catch (err) {
      console.error("[Live API Setup Error]:", err);
    }
  });
}

setupServer();
