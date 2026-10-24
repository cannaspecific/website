import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
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

/**
 * Legacy interest form (pre-revamp). Rows already in production stay here.
 * Do not drop this table: drizzle-kit push follows the schema, and the
 * public list endpoint that used to read it has been removed.
 */
export const interests = pgTable("interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  interestType: text("interest_type").notNull(),
  message: text("message").notNull(),
  subscribeToUpdates: boolean("subscribe_to_updates").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  message: z.string().min(10, "Please provide more details (at least 10 characters)"),
  interestType: z.enum([
    "contribute",
    "partnership",
    "research",
    "donation",
    "general",
  ], {
    required_error: "Please select your area of interest",
  }),
});

export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Interest = typeof interests.$inferSelect;

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: text("kind").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role"),
  company: text("company"),
  state: text("state"),
  message: text("message"),
  subscribeToUpdates: boolean("subscribe_to_updates").notNull().default(false),
  ageConfirmed: boolean("age_confirmed").notNull().default(false),
  emailStatus: text("email_status").notNull().default("pending"),
  emailError: text("email_error"),
  notifyStatus: text("notify_status").notNull().default("pending"),
  notifyError: text("notify_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Submission = typeof submissions.$inferSelect;

export type AdminSubmission = {
  id: string;
  source: "submission" | "legacy_interest";
  kind: string;
  fullName: string;
  email: string;
  role: string | null;
  company: string | null;
  state: string | null;
  phone: string | null;
  message: string | null;
  subscribeToUpdates: boolean;
  emailStatus: string | null;
  emailError: string | null;
  notifyStatus: string | null;
  notifyError: string | null;
  createdAt: string;
};
