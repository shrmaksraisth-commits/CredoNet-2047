import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role'),
  xp: integer('xp').default(0).notNull(),
  siaFriendStyle: boolean('sia_friend_style').default(true).notNull(),
  siaHumorous: boolean('sia_humorous').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'tasks' table.
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
  done: boolean('done').default(false).notNull(),
  priority: text('priority').notNull(), // 'high' | 'medium' | 'low'
  due: text('due').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'goals' table.
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  pct: integer('pct').notNull(),
  deadline: text('deadline').notNull(),
  color: text('color').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'habits' table.
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  streak: integer('streak').default(0).notNull(),
  days: text('days').notNull(), // JSON string representing boolean[] (e.g., "[true,true,false,...]")
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'calendar_events' table.
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // e.g. "2026-07-01"
  title: text('title').notNull(),
  time: text('time').notNull(),
  duration: text('duration').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'mood_journal' table.
export const moodJournal = pgTable('mood_journal', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label').notNull(),
  note: text('note').notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'xp_logs' table.
export const xpLogs = pgTable('xp_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  xp: integer('xp').notNull(),
  desc: text('desc').notNull(),
  time: text('time').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'chat_messages' table.
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(), // 'user' | 'ai'
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  goals: many(goals),
  habits: many(habits),
  calendarEvents: many(calendarEvents),
  moodJournal: many(moodJournal),
  xpLogs: many(xpLogs),
  chatMessages: many(chatMessages),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, { fields: [habits.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
}));

export const moodJournalRelations = relations(moodJournal, ({ one }) => ({
  user: one(users, { fields: [moodJournal.userId], references: [users.id] }),
}));

export const xpLogsRelations = relations(xpLogs, ({ one }) => ({
  user: one(users, { fields: [xpLogs.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
