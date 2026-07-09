import { db } from './src/db/index.ts';
import { eq } from 'drizzle-orm';
import { users, tasks as tasksTable, goals as goalsTable, habits as habitsTable, calendarEvents as calendarTable, moodJournal as moodTable, xpLogs as xpTable, chatMessages as chatTable } from './src/db/schema.ts';

async function run() {
  try {
    const userId = 84;
    await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
    await db.select().from(calendarTable).where(eq(calendarTable.userId, userId));
    await db.select().from(moodTable).where(eq(moodTable.userId, userId));
    await db.select().from(xpTable).where(eq(xpTable.userId, userId));
    await db.select().from(chatTable).where(eq(chatTable.userId, userId));
    console.log("All queries succeeded.");
  } catch (err) {
    console.error("Query error:", err);
  }
}
run();
