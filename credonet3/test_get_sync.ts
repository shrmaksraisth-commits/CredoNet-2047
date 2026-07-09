import { db } from './src/db/index.ts';
import { eq } from 'drizzle-orm';
import { users, tasks as tasksTable, goals as goalsTable, habits as habitsTable, calendarEvents as calendarTable, moodJournal as moodTable, xpLogs as xpTable, chatMessages as chatTable } from './src/db/schema.ts';

async function run() {
  try {
    const userList = await db.select().from(users).limit(1);
    if (userList.length === 0) { console.log("no users"); return; }
    const userId = userList[0].id;

    console.log("Fetching for userId:", userId);
    const userTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const userGoals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    const userHabits = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
    const userCalendar = await db.select().from(calendarTable).where(eq(calendarTable.userId, userId));
    const userMood = await db.select().from(moodTable).where(eq(moodTable.userId, userId));
    const userXP = await db.select().from(xpTable).where(eq(xpTable.userId, userId));
    const userChat = await db.select().from(chatTable).where(eq(chatTable.userId, userId));
    
    console.log("Success! No schema mismatch.");
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
