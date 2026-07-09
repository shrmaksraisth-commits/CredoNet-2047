import { db } from './src/db/index.ts';
import { users, tasks as tasksTable, goals as goalsTable, habits as habitsTable, calendarEvents as calendarTable, moodJournal as moodTable, xpLogs as xpTable, chatMessages as chatTable } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const userId = 84;
    console.log("Testing insert");
    await db.delete(tasksTable).where(eq(tasksTable.userId, userId));
    await db.insert(tasksTable).values([{
      userId,
      text: "Test",
      done: false,
      priority: "high",
      due: "Today",
    }]);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
