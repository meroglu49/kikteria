import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

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
}, (table) => [
  index("leaderboard_score_idx").on(table.score),
]);

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
}, (table) => [
  uniqueIndex("level_progress_user_level_idx").on(table.userId, table.levelNumber),
]);

export const insertLevelProgressSchema = createInsertSchema(levelProgress).omit({
  id: true,
});

export type InsertLevelProgress = z.infer<typeof insertLevelProgressSchema>;
export type LevelProgress = typeof levelProgress.$inferSelect;

// User Analytics/Metadata - tracks user behavior (synced from client, then deleted locally)
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // 'level_play', 'level_success', 'level_fail', 'session_start', 'session_end'
  levelNumber: integer("level_number"),
  score: integer("score"),
  playDuration: integer("play_duration"), // in seconds
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format
  eventTime: timestamp("event_time").notNull(),
  sessionId: text("session_id"),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).omit({
  id: true,
  createdAt: true,
});

export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type UserAnalytics = typeof userAnalytics.$inferSelect;

// Error Logs - for debugging (synced from client, then deleted locally)
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  severity: text("severity").notNull(), // 'error', 'warn', 'info'
  category: text("category").notNull(), // 'runtime', 'api', 'sync', 'game', 'asset'
  message: text("message").notNull(),
  stack: text("stack"),
  component: text("component"), // Component or subsystem that threw
  currentScreen: text("current_screen"), // Active route/screen
  gameState: text("game_state"), // JSON of relevant game state (sanitized)
  apiInfo: text("api_info"), // JSON of API request info (method, endpoint, status)
  sessionId: text("session_id"),
  deviceInfo: text("device_info"),
  networkStatus: text("network_status"), // 'online' or 'offline'
  lastUserAction: text("last_user_action"),
  eventTime: timestamp("event_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

// App Update Policy - controls version checking and update requirements
export const appUpdatePolicy = pgTable("app_update_policy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latestVersion: text("latest_version").notNull(), // e.g. "1.2.0"
  minSupportedVersion: text("min_supported_version").notNull(), // e.g. "1.0.0"
  downloadUrl: text("download_url").notNull(), // URL to download update
  releaseNotes: text("release_notes"), // What's new in latest version
  isActive: integer("is_active").notNull().default(1), // Only one active policy
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppUpdatePolicySchema = createInsertSchema(appUpdatePolicy).omit({
  id: true,
  updatedAt: true,
});

export type InsertAppUpdatePolicy = z.infer<typeof insertAppUpdatePolicySchema>;
export type AppUpdatePolicy = typeof appUpdatePolicy.$inferSelect;

// Daily Lab Orders - rotating daily puzzles with special rewards
export const dailyLabOrders = pgTable("daily_lab_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderDate: text("order_date").notNull(), // YYYY-MM-DD format
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  targetScore: integer("target_score").notNull(),
  coinReward: integer("coin_reward").notNull(),
  bonusReward: text("bonus_reward"), // JSON of bonus item/cosmetic
  modifiers: text("modifiers"), // JSON of gameplay modifiers
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDailyLabOrderSchema = createInsertSchema(dailyLabOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyLabOrder = z.infer<typeof insertDailyLabOrderSchema>;
export type DailyLabOrder = typeof dailyLabOrders.$inferSelect;

// Daily Order Completions - tracks which users completed which daily orders
export const dailyOrderCompletions = pgTable("daily_order_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderDate: text("order_date").notNull(),
  scoreAchieved: integer("score_achieved").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("daily_completions_user_date_idx").on(table.userId, table.orderDate),
]);

export const insertDailyOrderCompletionSchema = createInsertSchema(dailyOrderCompletions).omit({
  id: true,
  completedAt: true,
});

export type InsertDailyOrderCompletion = z.infer<typeof insertDailyOrderCompletionSchema>;
export type DailyOrderCompletion = typeof dailyOrderCompletions.$inferSelect;

// Weekly Community Goals - cooperative progress meter
export const weeklyGoals = pgTable("weekly_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD (Monday)
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  goalType: text("goal_type").notNull(), // 'total_placements', 'total_score', 'levels_completed', etc.
  rewardType: text("reward_type").notNull(), // 'cosmetic', 'coins', 'badge'
  rewardData: text("reward_data"), // JSON of reward details
  isCompleted: integer("is_completed").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeeklyGoalSchema = createInsertSchema(weeklyGoals).omit({
  id: true,
  createdAt: true,
});

export type InsertWeeklyGoal = z.infer<typeof insertWeeklyGoalSchema>;
export type WeeklyGoal = typeof weeklyGoals.$inferSelect;

// Weekly Goal Contributions - tracks individual contributions
export const weeklyGoalContributions = pgTable("weekly_goal_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekStart: text("week_start").notNull(),
  contribution: integer("contribution").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("weekly_contributions_user_week_idx").on(table.userId, table.weekStart),
]);

export const insertWeeklyGoalContributionSchema = createInsertSchema(weeklyGoalContributions).omit({
  id: true,
  lastUpdated: true,
});

export type InsertWeeklyGoalContribution = z.infer<typeof insertWeeklyGoalContributionSchema>;
export type WeeklyGoalContribution = typeof weeklyGoalContributions.$inferSelect;

// Achievements - tiered badges with rewards
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'mastery', 'collection', 'social', 'challenge'
  tier: integer("tier").notNull(), // 1 = bronze, 2 = silver, 3 = gold
  requirement: integer("requirement").notNull(), // target value to unlock
  coinReward: integer("coin_reward").notNull(),
  badgeIcon: text("badge_icon").notNull(), // emoji or icon identifier
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  createdAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User Achievement Progress - tracks progress toward achievements
export const userAchievementProgress = pgTable("user_achievement_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  currentProgress: integer("current_progress").notNull().default(0),
  isUnlocked: integer("is_unlocked").notNull().default(0),
  isClaimed: integer("is_claimed").notNull().default(0),
  unlockedAt: timestamp("unlocked_at"),
  claimedAt: timestamp("claimed_at"),
}, (table) => [
  uniqueIndex("user_achievement_progress_user_achievement_idx").on(table.userId, table.achievementId),
]);

export const insertUserAchievementProgressSchema = createInsertSchema(userAchievementProgress).omit({
  id: true,
});

export type InsertUserAchievementProgress = z.infer<typeof insertUserAchievementProgressSchema>;
export type UserAchievementProgress = typeof userAchievementProgress.$inferSelect;
