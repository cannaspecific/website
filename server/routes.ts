import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInterestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/interests", async (req, res) => {
    try {
      const validatedData = insertInterestSchema.parse(req.body);
      const interest = await storage.createInterest(validatedData);
      
      res.status(201).json({
        success: true,
        data: interest,
        message: "Thank you for your interest! We'll be in touch soon."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: "Please check your form and try again."
        });
      } else {
        console.error("Error creating interest:", error);
        res.status(500).json({
          success: false,
          message: "Something went wrong. Please try again later."
        });
      }
    }
  });

  app.get("/api/interests", async (req, res) => {
    try {
      const interests = await storage.getInterests();
      res.json({
        success: true,
        data: interests
      });
    } catch (error) {
      console.error("Error fetching interests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch interests"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
