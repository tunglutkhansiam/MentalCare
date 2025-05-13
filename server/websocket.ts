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

          // Broadcast the message to all OTHER connections for this chat
          // We don't send back to the original sender to avoid duplication
          console.log(`Broadcasting message to connections with userId=${ws.userId} and expertId=${ws.expertId}`);
          
          let broadcastCount = 0;
          connections.forEach((client) => {
            // Make sure we're only sending to other clients (not back to sender)
            // and only to clients in the same chat conversation
            if (client !== ws && 
                client.readyState === WebSocket.OPEN && 
                ((client.userId === ws.userId && client.expertId === ws.expertId) ||
                 (client.userId === ws.expertId && client.expertId === ws.userId))) {
              
              broadcastCount++;
              client.send(JSON.stringify({
                type: 'message',
                id: message.id,
                userId: ws.userId!,
                expertId: ws.expertId!,
                content: message.content,
                sender: message.sender,
                timestamp: message.timestamp || new Date()
              }));
            }
          });
          
          console.log(`Message broadcast to ${broadcastCount} clients`);
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
