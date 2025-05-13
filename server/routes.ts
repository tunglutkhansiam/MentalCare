import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertAppointmentSchema, insertMessageSchema, questionnaires, questionnaireResponses } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
  
  // Chat messages
  app.get("/api/messages/:expertId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expertId = parseInt(req.params.expertId);
    const messages = await storage.getMessagesByUserAndExpert(req.user.id, expertId);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
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
      const responseData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Save questionnaire response
      const [response] = await db.insert(questionnaireResponses)
        .values(responseData)
        .returning();
      
      res.status(201).json(response);
    } catch (err) {
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

  return httpServer;
}
