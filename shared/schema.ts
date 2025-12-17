import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Player Profile - stores game progress
export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  coins: integer("coins").notNull().default(500),
  highScore: integer("high_score").notNull().default(0),
  speedUpgrade: integer("speed_upgrade").notNull().default(1),
  startSizeUpgrade: integer("start_size_upgrade").notNull().default(1),
  magnetUpgrade: integer("magnet_upgrade").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfiles).omit({
  id: true,
  updatedAt: true,
});

export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type PlayerProfile = typeof playerProfiles.$inferSelect;

// Leaderboard - top scores
export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
});

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;

// Level Progress - stores user's level completion status
export const levelProgress = pgTable("level_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  levelNumber: integer("level_number").notNull(),
  bestScore: integer("best_score").notNull().default(0),
  isCompleted: integer("is_completed").notNull().default(0),
});

export const insertLevelProgressSchema = createInsertSchema(levelProgress).omit({
  id: true,
});

export type InsertLevelProgress = z.infer<typeof insertLevelProgressSchema>;
export type LevelProgress = typeof levelProgress.$inferSelect;
