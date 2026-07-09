import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function run() {
  try {
    const result = await db.insert(users)
      .values({
        uid: "test1234",
        email: "test@example.com",
        name: "Test",
        role: 'student',
        xp: 0,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: "test@example.com" },
      })
      .returning();
    console.log("Auth success", result[0]);
  } catch (err) {
    console.error("Auth error:", err);
  }
}
run();
