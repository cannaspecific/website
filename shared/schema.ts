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
    "general"
  ], {
    required_error: "Please select your area of interest",
  }),
});

export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Interest = typeof interests.$inferSelect;
