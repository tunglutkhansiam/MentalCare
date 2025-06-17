import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { sendSMS, formatAppointmentConfirmationSMS, formatExpertNotificationSMS } from "./sms";
import { appointmentScheduler } from "./scheduler";
import { z } from "zod";
import { insertAppointmentSchema, insertMessageSchema, insertQuestionnaireResponseSchema, questionnaires, questionnaireResponses, messages } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server for Express and WebSockets
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    // Get user ID and expert ID from query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const expertId = url.searchParams.get('expertId');

    if (!userId || !expertId) {
      ws.close();
      return;
    }

    // Store connection info
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'message') {
          // Save the message to database
          const messageData = {
            userId: parseInt(userId),
            expertId: parseInt(expertId),
            content: data.content,
            sender: data.sender
          };
          
          await storage.createMessage(messageData);
          
          // Broadcast to all clients connected to this chat
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              const clientUrl = new URL((client as any)._req?.url || '', `http://${(client as any)._req?.headers.host}`);
              const clientUserId = clientUrl.searchParams.get('userId');
              const clientExpertId = clientUrl.searchParams.get('expertId');
              
              if (clientUserId === userId && clientExpertId === expertId) {
                client.send(JSON.stringify({ 
                  type: 'message',
                  ...messageData
                }));
              }
            }
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  });

  // API Routes
  // Health categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Health experts
  app.get("/api/experts", async (req, res) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const experts = await storage.getExperts(categoryId);
    res.json(experts);
  });

  app.get("/api/experts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const expert = await storage.getExpert(id);
    if (!expert) {
      return res.status(404).json({ message: "Expert not found" });
    }
    res.json(expert);
  });

  app.get("/api/experts/:id/specializations", async (req, res) => {
    const expertId = parseInt(req.params.id);
    const specializations = await storage.getSpecializationsByExpert(expertId);
    res.json(specializations);
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting all appointments for user ID: ${req.user.id}`);
    const appointments = await storage.getAppointmentsByUser(req.user.id);
    console.log(`Found ${appointments.length} appointments for user ${req.user.id}`);
    res.json(appointments);
  });

  app.get("/api/appointments/upcoming", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting next upcoming appointment for user ID: ${req.user.id}`);
    const appointment = await storage.getNextUpcomingAppointment(req.user.id);
    console.log(`Found upcoming appointment: ${appointment ? 'Yes' : 'None'} for user ${req.user.id}`);
    res.json(appointment);
  });

  app.get("/api/appointments/upcoming/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting all upcoming appointments for user ID: ${req.user.id}`);
    const appointments = await storage.getUpcomingAppointments(req.user.id);
    console.log(`Found ${appointments.length} upcoming appointments for user ${req.user.id}`);
    res.json(appointments);
  });

  app.get("/api/appointments/past", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting past appointments for user ID: ${req.user.id}`);
    const appointments = await storage.getPastAppointments(req.user.id);
    console.log(`Found ${appointments.length} past appointments for user ${req.user.id}`);
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Parse the incoming appointment data
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Ensure the userId matches the authenticated user
      if (appointmentData.userId !== req.user.id) {
        console.warn(`Attempted to create appointment with mismatched userId: ${appointmentData.userId} vs authenticated ${req.user.id}`);
        return res.status(403).json({ message: "Cannot create appointments for other users" });
      }
      
      // Extra security: force the userId to be the authenticated user's ID
      const secureAppointmentData = {
        ...appointmentData,
        userId: req.user.id // Ensure it's the correct user ID
      };
      
      console.log(`Creating appointment for authenticated user ${req.user.id} with expert ${secureAppointmentData.expertId}`);
      const appointment = await storage.createAppointment(secureAppointmentData);
      
      // Send SMS notifications to both user and expert
      try {
        const expert = await storage.getExpert(appointment.expertId);
        if (expert) {
          const { sendSMS, formatAppointmentConfirmationSMS, formatExpertNotificationSMS } = await import('./sms');
          
          // Send confirmation SMS to user if they have a phone number
          if (req.user.phoneNumber) {
            const userMessage = formatAppointmentConfirmationSMS(
              expert.name,
              appointment.date,
              appointment.time
            );
            
            const userSmsSent = await sendSMS({
              to: req.user.phoneNumber,
              message: userMessage
            });
            
            if (userSmsSent) {
              console.log(`SMS confirmation sent to user ${req.user.phoneNumber}`);
            } else {
              console.log(`User SMS notification failed for appointment ${appointment.id}`);
            }
          }
          
          // Send notification SMS to expert if they have a phone number
          if (expert.phoneNumber) {
            const expertMessage = formatExpertNotificationSMS(
              `${req.user.firstName} ${req.user.lastName}`,
              appointment.date,
              appointment.time
            );
            
            const expertSmsSent = await sendSMS({
              to: expert.phoneNumber,
              message: expertMessage
            });
            
            if (expertSmsSent) {
              console.log(`SMS notification sent to expert ${expert.phoneNumber}`);
            } else {
              console.log(`Expert SMS notification failed for appointment ${appointment.id}`);
            }
          }
        }
      } catch (smsError) {
        console.error("Error sending SMS notifications:", smsError);
        // Don't fail the appointment creation if SMS fails
      }
      
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      console.error("Error creating appointment:", err);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Expert profile for logged in user
  app.get("/api/expert-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      res.json(expert);
    } catch (err) {
      console.error("Error fetching expert profile:", err);
      res.status(500).json({ message: "Failed to fetch expert profile" });
    }
  });
  
  // Update expert profile
  app.put("/api/expert-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      
      const updatedExpert = await storage.updateExpert(expert.id, req.body);
      res.json(updatedExpert);
    } catch (err) {
      console.error("Error updating expert profile:", err);
      res.status(500).json({ message: "Failed to update expert profile" });
    }
  });

  // Get expert profile with specializations
  app.get("/api/expert-profile/detailed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      
      // Get specializations for the expert
      const specializations = await storage.getSpecializationsByExpert(expert.id);
      
      // Return combined data
      res.json({
        ...expert,
        specializations
      });
    } catch (err) {
      console.error("Error fetching detailed expert profile:", err);
      res.status(500).json({ message: "Failed to fetch detailed expert profile" });
    }
  });
  
  // Get user by ID - used by experts to view user information
  app.get("/api/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First verify the requester is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Only experts can view user profiles" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Expert appointments
  app.get("/api/expert/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First check if user is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      
      // Get appointments for this expert
      const appointments = await storage.getAppointmentsByExpert(expert.id);
      res.json(appointments);
    } catch (err) {
      console.error("Error fetching expert appointments:", err);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });
  
  // Get all message conversations for an expert
  app.get("/api/expert/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First check if user is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      
      // In a real application, this would be a more optimized query to get unique users
      // with their latest message for this expert
      const allMessages = await storage.getMessagesByExpert(expert.id);
      
      // Group messages by user and get the most recent ones
      const userMap = new Map();
      
      for (const message of allMessages) {
        const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
        const existingMessage = userMap.get(message.userId);
        const existingDate = existingMessage && existingMessage.timestamp ? 
          new Date(existingMessage.timestamp) : new Date(0);
        
        if (!userMap.has(message.userId) || messageDate > existingDate) {
          userMap.set(message.userId, message);
        }
      }
      
      // Convert map to array of latest messages
      const recentMessages = Array.from(userMap.values());
      
      // Sort by most recent timestamp
      recentMessages.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      res.json(recentMessages);
    } catch (err) {
      console.error("Error fetching expert messages:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  // Chat messages - for users to get messages with an expert
  app.get("/api/messages/:expertId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expertId = parseInt(req.params.expertId);
    const messages = await storage.getMessagesByUserAndExpert(req.user.id, expertId);
    res.json(messages);
  });
  
  // Chat messages - for experts to get messages with a specific user
  app.get("/api/expert-messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First check if the logged-in user is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Validate userId is a valid number
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getMessagesByUserAndExpert(userId, expert.id);
      res.json(messages);
    } catch (err) {
      console.error("Error fetching user-expert messages:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Cleanup route to remove duplicate messages for a specific conversation
  app.get("/api/cleanup-chat/:userId/:expertId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const expertId = parseInt(req.params.expertId);
      
      if (isNaN(userId) || isNaN(expertId)) {
        return res.status(400).json({ message: "Invalid user or expert ID" });
      }
      
      // Get conversation messages
      const chatMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.userId, userId),
            eq(messages.expertId, expertId)
          )
        );
      
      // Track seen messages by content to find duplicates
      const seenMessages = new Map();
      const duplicateIds: number[] = [];
      
      // Find duplicates
      chatMessages.forEach(msg => {
        // Create a unique key for each message based on content
        const key = `${msg.content}-${msg.sender}`;
        
        if (seenMessages.has(key)) {
          // If we've seen this message before, it's a duplicate
          duplicateIds.push(msg.id);
        } else {
          seenMessages.set(key, msg.id);
        }
      });
      
      // Delete duplicates if any found
      if (duplicateIds.length > 0) {
        await db.delete(messages).where(inArray(messages.id, duplicateIds));
        return res.json({ 
          success: true, 
          message: `Removed ${duplicateIds.length} duplicate messages from conversation`,
          removed: duplicateIds
        });
      }
      
      return res.json({ 
        success: true, 
        message: "No duplicate messages found in this conversation" 
      });
    } catch (error) {
      console.error("Error cleaning up messages:", error);
      res.status(500).json({ message: "Failed to clean up messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // First check if this exact message already exists to prevent duplicates
      const existingMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.content, messageData.content),
            eq(messages.userId, messageData.userId),
            eq(messages.expertId, messageData.expertId),
            eq(messages.sender, messageData.sender)
          )
        );
      
      // If this exact message already exists, return the existing one
      if (existingMessages.length > 0) {
        console.log("Preventing duplicate message:", existingMessages[0].id);
        return res.status(200).json(existingMessages[0]);
      }
      
      // Otherwise create new message
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Delete individual message
  app.delete("/api/messages/:messageId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageId = parseInt(req.params.messageId);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const success = await storage.deleteMessage(messageId, req.user.id);
      
      if (success) {
        res.json({ message: "Message deleted successfully" });
      } else {
        res.status(404).json({ message: "Message not found or unauthorized" });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Delete entire conversation between user and expert
  app.delete("/api/conversations/:expertId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const expertId = parseInt(req.params.expertId);
      
      if (isNaN(expertId)) {
        return res.status(400).json({ message: "Invalid expert ID" });
      }
      
      const deletedCount = await storage.deleteMessagesByConversation(req.user.id, expertId);
      
      res.json({ 
        message: `Deleted ${deletedCount} messages from conversation`,
        deletedCount 
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Questionnaire endpoints
  app.get("/api/questionnaires", async (req, res) => {
    try {
      // Get all questionnaires with their basic details (without full questions for the list view)
      const allQuestionnaires = await db.select({
        id: questionnaires.id,
        title: questionnaires.title,
        description: questionnaires.description
      }).from(questionnaires);
      
      res.json(allQuestionnaires);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      res.status(500).json({ message: "Failed to fetch questionnaires" });
    }
  });

  app.get("/api/questionnaires/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const questionnaireId = parseInt(req.params.id);
      
      // Get the full questionnaire with questions
      const [questionnaire] = await db.select().from(questionnaires)
        .where(eq(questionnaires.id, questionnaireId));
      
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }
      
      res.json(questionnaire);
    } catch (err) {
      console.error("Error fetching questionnaire:", err);
      res.status(500).json({ message: "Failed to fetch questionnaire" });
    }
  });

  app.post("/api/questionnaire-responses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Received questionnaire response:", req.body);
      
      const responseData = insertQuestionnaireResponseSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      console.log("Parsed response data:", responseData);
      
      // Check if user already has a response for this questionnaire
      const existingResponse = await storage.getQuestionnaireResponseByUser(
        req.user.id, 
        responseData.questionnaireId
      );
      
      let response;
      if (existingResponse) {
        console.log("Updating existing response:", existingResponse.id);
        // Update existing response
        response = await storage.updateQuestionnaireResponse(existingResponse.id, {
          responses: responseData.responses,
          completedAt: new Date()
        });
      } else {
        console.log("Creating new response");
        // Create new response
        response = await storage.createQuestionnaireResponse(responseData);
      }
      
      console.log("Response saved successfully:", response.id);
      res.status(201).json(response);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        return res.status(400).json({ message: err.errors });
      }
      console.error("Error saving questionnaire response:", err);
      res.status(500).json({ message: "Failed to save questionnaire response" });
    }
  });

  app.get("/api/user/questionnaire-responses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get all responses by the current user with questionnaire details
      const userResponses = await db.select({
        response: questionnaireResponses,
        questionnaire: {
          id: questionnaires.id,
          title: questionnaires.title
        }
      })
      .from(questionnaireResponses)
      .innerJoin(questionnaires, eq(questionnaires.id, questionnaireResponses.questionnaireId))
      .where(eq(questionnaireResponses.userId, req.user.id))
      .orderBy(desc(questionnaireResponses.completedAt));
      
      res.json(userResponses);
    } catch (err) {
      console.error("Error fetching user questionnaire responses:", err);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // Get user questionnaire responses for experts - to view patient intake information
  app.get("/api/expert/user/:userId/questionnaire-responses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First verify the requester is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Only experts can view user questionnaire responses" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      // Get all responses by the specified user with questionnaire details
      const userResponses = await db.select({
        response: questionnaireResponses,
        questionnaire: questionnaires
      })
      .from(questionnaireResponses)
      .innerJoin(questionnaires, eq(questionnaires.id, questionnaireResponses.questionnaireId))
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.completedAt));
      
      res.json(userResponses);
    } catch (err) {
      console.error("Error fetching user questionnaire responses for expert:", err);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // Get expert chat threads
  app.get("/api/expert/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // First check if user is an expert
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      
      // In a real application, this would be a more optimized query to get unique users
      // with their latest message for this expert
      const allMessages = await storage.getMessagesByExpert(expert.id);
      
      // Group messages by user and get the most recent ones
      const userMap = new Map();
      
      for (const message of allMessages) {
        const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
        const existingMessage = userMap.get(message.userId);
        const existingDate = existingMessage && existingMessage.timestamp ? 
          new Date(existingMessage.timestamp) : new Date(0);
        
        if (!userMap.has(message.userId) || messageDate > existingDate) {
          userMap.set(message.userId, message);
        }
      }
      
      const chatThreads = Array.from(userMap.values());
      res.json(chatThreads);
    } catch (err) {
      console.error("Error fetching expert chats:", err);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });

  // Test endpoint for appointment reminders
  app.post("/api/test-reminders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Manually triggering reminder check...");
      await appointmentScheduler.triggerReminderCheck();
      res.json({ message: "Reminder check triggered successfully" });
    } catch (err) {
      console.error("Error triggering reminder check:", err);
      res.status(500).json({ message: "Failed to trigger reminder check" });
    }
  });

  return httpServer;
}
