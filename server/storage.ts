import { type User, type InsertUser, type Interest, type InsertInterest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createInterest(interest: InsertInterest): Promise<Interest>;
  getInterests(): Promise<Interest[]>;
  getInterest(id: string): Promise<Interest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private interests: Map<string, Interest>;

  constructor() {
    this.users = new Map();
    this.interests = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createInterest(insertInterest: InsertInterest): Promise<Interest> {
    const id = randomUUID();
    const interest: Interest = {
      ...insertInterest,
      id,
      createdAt: new Date(),
    };
    this.interests.set(id, interest);
    return interest;
  }

  async getInterests(): Promise<Interest[]> {
    return Array.from(this.interests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getInterest(id: string): Promise<Interest | undefined> {
    return this.interests.get(id);
  }
}

export const storage = new MemStorage();
