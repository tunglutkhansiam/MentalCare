import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { InsertMessage } from "@shared/schema";

interface WebSocketConnection extends WebSocket {
  userId?: number;
  expertId?: number;
}

export function setupWebSocket(httpServer: HttpServer) {
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Track active connections
  const connections: WebSocketConnection[] = [];

  wss.on('connection', (ws: WebSocketConnection, req) => {
    // Parse URL params to get userId and expertId
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const expertId = url.searchParams.get('expertId');

    // Validate required parameters
    if (!userId || !expertId) {
      console.warn('WebSocket connection attempt without required parameters');
      ws.close(1008, 'Missing userId or expertId parameters');
      return;
    }

    // Store connection metadata
    ws.userId = parseInt(userId);
    ws.expertId = parseInt(expertId);
    connections.push(ws);

    console.log(`WebSocket connection established: User ${userId} connected to Expert ${expertId}`);

    // Handle incoming messages
    ws.on('message', async (rawMessage) => {
      try {
        // Parse the message
        const message = JSON.parse(rawMessage.toString());
        console.log(`Message received: ${JSON.stringify(message)}`);

        if (message.type === 'message') {
          // Validate the message structure
          if (!message.content || !message.sender) {
            console.warn('WebSocket message missing required fields');
            return;
          }

          // Create a message in the database
          const messageData: InsertMessage = {
            userId: ws.userId!,
            expertId: ws.expertId!,
            content: message.content,
            sender: message.sender
          };
          
          const savedMessage = await storage.createMessage(messageData);
          
          // Broadcast the message to all connections for this chat
          connections.forEach((client) => {
            if (client !== ws && 
                client.readyState === WebSocket.OPEN && 
                client.userId === ws.userId && 
                client.expertId === ws.expertId) {
              client.send(JSON.stringify({
                type: 'message',
                ...savedMessage
              }));
            }
          });
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed: User ${userId} disconnected from Expert ${expertId}`);
      
      // Remove from connections array
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'system',
      content: 'Connected to chat server',
      timestamp: new Date()
    }));
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  return wss;
}
