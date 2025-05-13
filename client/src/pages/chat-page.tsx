import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { Expert, Message, InsertMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ChatMessage from "@/components/ui/chat-message";

export default function ChatPage() {
  const { expertId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fetch expert details
  const { data: expert, isLoading: loadingExpert } = useQuery<Expert>({
    queryKey: [`/api/experts/${expertId}`],
  });

  // Fetch previous messages
  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${expertId}`],
    enabled: !!expertId && !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${expertId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user?.id || !expertId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&expertId=${expertId}`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          // Invalidate the query to refresh messages
          queryClient.invalidateQueries({ queryKey: [`/api/messages/${expertId}`] });
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [user?.id, expertId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBackClick = () => {
    navigate("/appointments");
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user?.id || !expertId) return;

    const messageData: InsertMessage = {
      userId: user.id,
      expertId: parseInt(expertId),
      content: message,
      sender: "user",
    };

    sendMessageMutation.mutate(messageData);

    // Also try to send via WebSocket for real-time delivery
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        ...messageData
      }));
    }
  };

  if (loadingExpert) {
    return <ChatPageSkeleton />;
  }

  if (!expert) {
    return (
      <div className="p-4 text-center">
        <p>Expert not found</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-primary py-4 px-4 text-white">
        <div className="flex items-center">
          <button onClick={handleBackClick} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-primary font-bold">
            {expert.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="font-semibold">{expert.name}</h1>
            <p className="text-xs text-blue-100">{expert.specialty} • Online</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4">
        {loadingMessages ? (
          Array(4).fill(0).map((_, i) => (
            <ChatMessageSkeleton key={i} isUser={i % 2 !== 0} />
          ))
        ) : messages?.length ? (
          messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isUser={msg.sender === "user"} 
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Start a conversation with {expert.name}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-white border-t">
        <div className="flex">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-r-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            className="rounded-l-none"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-primary py-4 px-4 text-white">
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 mr-3 bg-blue-400" />
          <Skeleton className="w-10 h-10 rounded-full mr-3 bg-blue-400" />
          <div>
            <Skeleton className="h-5 w-32 mb-1 bg-blue-400" />
            <Skeleton className="h-3 w-24 bg-blue-400" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <ChatMessageSkeleton key={i} isUser={i % 2 !== 0} />
        ))}
      </div>
      
      <div className="p-3 bg-white border-t">
        <div className="flex">
          <Skeleton className="h-10 flex-1 rounded-r-none" />
          <Skeleton className="h-10 w-10 rounded-l-none" />
        </div>
      </div>
    </div>
  );
}

function ChatMessageSkeleton({ isUser }: { isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Skeleton 
        className={`rounded-lg max-w-[80%] h-24 ${
          isUser ? "chat-bubble-user" : "chat-bubble-expert"
        }`}
      />
    </div>
  );
}
