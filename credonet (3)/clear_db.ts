import { db } from './src/db/index.ts';
import { users, tasks, goals, habits, calendarEvents, moodJournal, xpLogs, chatMessages } from './src/db/schema.ts';
async function run() {
  try {
    await db.delete(tasks);
    await db.delete(goals);
    await db.delete(habits);
    await db.delete(calendarEvents);
    await db.delete(moodJournal);
    await db.delete(xpLogs);
    await db.delete(chatMessages);
    console.log("DB cleared.");
  } catch (e) {
    console.error(e);
  }
}
run();
