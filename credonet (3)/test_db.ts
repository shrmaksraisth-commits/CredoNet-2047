import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
async function run() {
  try {
    const res = await db.select().from(users).limit(1);
    console.log("Users:", res);
  } catch (e) {
    console.error(e);
  }
}
run();
