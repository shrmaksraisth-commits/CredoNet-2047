import { db } from './src/db/index.ts';
import { eq } from 'drizzle-orm';
import { users, tasks as tasksTable, habits as habitsTable } from './src/db/schema.ts';

async function run() {
  try {
    const userId = 84;
    const habits = [{name: 'Test', streak: 1, days: [true, false, false, false, false, false, false]}];
    
    await db.delete(habitsTable).where(eq(habitsTable.userId, userId));
    await db.insert(habitsTable).values(
      habits.map((h: any) => ({
        userId,
        name: h.name,
        streak: h.streak || 0,
        days: JSON.stringify(h.days || [false, false, false, false, false, false, false]),
      }))
    );
    console.log("POST sync success");
  } catch (err) {
    console.error("POST sync error:", err);
  }
}
run();
