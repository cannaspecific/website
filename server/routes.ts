import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInterestSchema } from "@shared/schema";
import { z } from "zod";

// 1. Import the SendGrid library
import sgMail from "@sendgrid/mail";

export async function registerRoutes(app: Express): Promise<Server> {
  // 2. Set the API key from your .env file
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("SendGrid API key loaded.");
  } else {
    console.warn(
      "SENDGRID_API_KEY is not set in your .env file. Emails will not be sent."
    );
  }

  app.post("/api/interests", async (req, res) => {
    try {
      const validatedData = insertInterestSchema.parse(req.body);

      // First, save the interest to the database
      const interest = await storage.createInterest(validatedData);

      // 3. If save is successful, try to send an email
      if (process.env.SENDGRID_API_KEY) {
        try {
          const msg = {
            to: validatedData.email, // The email address they submitted
            
            // --- IMPORTANT! ---
            // This 'from' email MUST be a "Verified Sender"
            // in your SendGrid account, otherwise SendGrid will reject it.
            from: "YOUR_VERIFIED_EMAIL@example.com", 
            
            subject: "Thank you for your interest in CannaSpecific!",
            
            html: `
              <h3>Hi ${validatedData.fullName || 'friend'},</h3>
              <p>Thank you for reaching out and showing interest in CannaSpecific.</p>
              <p>We've received your message and will be in touch soon.</p>
              <p>Together, we're building a better future for cannabis.</p>
              <br/>
              <p>Best,</p>
              <p>The CannaSpecific Team</p>
            `,
            // Fallback for email clients that don't support HTML
            text: `Hi ${validatedData.fullName || 'friend'},\n\nThank you for reaching out and showing interest in CannaSpecific. We've received your message and will be in touch soon. Together, we're building a better future for cannabis.\n\nBest,\nThe CannaSpecific Team`,
          };

          await sgMail.send(msg);
          console.log(`Email successfully sent to ${validatedData.email}`);

        } catch (emailError) {
          // Log the email error, but don't fail the API request
          // The user's interest was still saved successfully.
          console.error("Error sending email:", emailError);
        }
      }

      // Respond to the client
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