// New content for Cannaspecific-web-site/server/storage.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { type User, type InsertUser, type Interest, type InsertInterest } from "@shared/schema";

// This is the interface from your original file
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createInterest(interest: InsertInterest): Promise<Interest>;
  getInterests(): Promise<Interest[]>;
  getInterest(id: string): Promise<Interest | undefined>;
}

// 1. Get the DATABASE_URL from environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// 2. Create the database connection (Neon requires SSL)
const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const db = drizzle(client, { schema });

// 3. Create a new DbStorage class that uses Drizzle
export class DbStorage implements IStorage {

  // --- Interest Methods ---
  async createInterest(insertInterest: InsertInterest): Promise<Interest> {
    const newInterests = await db
      .insert(schema.interests)
      .values(insertInterest)
      .returning();
    return newInterests[0];
  }

  async getInterests(): Promise<Interest[]> {
    return await db.query.interests.findMany({
      orderBy: (interests, { desc }) => [desc(interests.createdAt)],
    });
  }

  async getInterest(id: string): Promise<Interest | undefined> {
     return await db.query.interests.findFirst({
       where: (interests, { eq }) => eq(interests.id, id),
     });
  }

  // --- User Methods (Not yet implemented, but here to fulfill the interface) ---
  async getUser(id: string): Promise<User | undefined> {
    console.warn("getUser not implemented in DbStorage");
    return undefined; 
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.warn("getUserByUsername not implemented in DbStorage");
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.warn("createUser not implemented in DbStorage");
    throw new Error("Not implemented");
  }
}

// 4. Export an instance of the new DbStorage
export const storage = new DbStorage();