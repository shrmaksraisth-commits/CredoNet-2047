import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://credonet_db_user:3sMpEvQLhg6KUKe5POt3hAY7DdbAZk64@dpg-d99hjlreo5us738hu4qg-a.oregon-postgres.render.com/credonet_db?sslmode=require",
  },
});