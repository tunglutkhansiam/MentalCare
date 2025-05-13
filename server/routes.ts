import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertAppointmentSchema, insertMessageSchema } from "@shared/schema";

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
    const appointments = await storage.getAppointmentsByUser(req.user.id);
    res.json(appointments);
  });

  app.get("/api/appointments/upcoming", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointment = await storage.getNextUpcomingAppointment(req.user.id);
    res.json(appointment);
  });

  app.get("/api/appointments/upcoming/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointments = await storage.getUpcomingAppointments(req.user.id);
    res.json(appointments);
  });

  app.get("/api/appointments/past", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointments = await storage.getPastAppointments(req.user.id);
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
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

  return httpServer;
}
