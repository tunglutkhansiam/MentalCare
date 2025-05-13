import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { Expert, User, Message, InsertMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ChatMessage from "@/components/ui/chat-message";

export default function ChatPage() {
  const { userId, expertId } = useParams();
  const [, navigate] = useLocation();
  const { user, expert: loggedInExpert, isExpert } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fetch expert details if user is not an expert
  const { data: chatExpert, isLoading: loadingExpert } = useQuery<Expert>({
    queryKey: [`/api/experts/${expertId}`],
    enabled: !isExpert, // Only fetch if current user is not an expert
  });

  // Fetch user details if logged in user is an expert
  const { data: chatUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/user/${userId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isExpert && !!userId, // Only fetch if current user is an expert
  });

  // Fetch previous messages
  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: [isExpert ? `/api/expert-messages/${userId}` : `/api/messages/${expertId}`],
    enabled: !!user?.id && (isExpert ? !!userId : !!expertId),
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: (savedMessage) => {
      setMessage("");
      
      // Add the message directly to our cache instead of invalidating the query
      // This avoids duplicate fetches and UI updates
      const queryKey = isExpert ? `/api/expert-messages/${userId}` : `/api/messages/${expertId}`;
      queryClient.setQueryData([queryKey], (oldData: Message[] = []) => {
        // Only add if not already present (check by id)
        if (!oldData.some(msg => msg.id === savedMessage.id)) {
          return [...oldData, savedMessage];
        }
        return oldData;
      });
      
      // Also send via WebSocket for real-time delivery to the other party
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "message",
          ...savedMessage
        }));
      }
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

    // Determine which userId to use in the WebSocket URL
    const chatUserId = isExpert ? userId : user.id.toString();
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${chatUserId}&expertId=${expertId}`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === "message") {
          // Only update if we're receiving a message from someone else
          // (not a message we just sent ourselves)
          if (data.sender === (isExpert ? "user" : "expert")) {
            console.log("Adding incoming message to message list");
            
            // Add directly to cache instead of triggering a re-fetch
            const queryKey = isExpert ? `/api/expert-messages/${userId}` : `/api/messages/${expertId}`;
            queryClient.setQueryData([queryKey], (oldData: Message[] = []) => {
              // Only add if not already in the list (check by id)
              if (!oldData.some(msg => msg.id === data.id)) {
                return [...oldData, data as Message];
              }
              return oldData;
            });
          }
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
  }, [user?.id, expertId, userId, isExpert]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBackClick = () => {
    if (isExpert) {
      navigate("/expert-dashboard");
    } else {
      navigate("/appointments");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !expertId) return;
    
    // If the user is not logged in, do nothing
    if (!user?.id) return;

    // If expert is sending a message to user, we need the userId parameter
    // If user is sending to expert, we use the user.id from auth context
    const chatUserId = isExpert && userId ? parseInt(userId) : user.id;

    const messageData: InsertMessage = {
      userId: chatUserId,
      expertId: parseInt(expertId),
      content: message,
      sender: isExpert ? "expert" : "user",
    };

    // Send only via API mutation - the WebSocket notification will come from the server
    sendMessageMutation.mutate(messageData);
  };

  if ((isExpert && loadingUser) || (!isExpert && loadingExpert)) {
    return <ChatPageSkeleton />;
  }

  const chatPartner = isExpert ? chatUser : chatExpert;
  
  if (!chatPartner) {
    return (
      <div className="p-4 text-center">
        <p>{isExpert ? "User" : "Expert"} not found</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  const renderHeaderContent = () => {
    if (isExpert && chatUser) {
      return (
        <>
          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-primary font-bold">
            {chatUser.firstName?.[0]}{chatUser.lastName?.[0]}
          </div>
          <div>
            <h1 className="font-semibold">{chatUser.firstName} {chatUser.lastName}</h1>
            <p className="text-xs text-blue-100">Patient • Online</p>
          </div>
        </>
      );
    } else if (!isExpert && chatExpert) {
      return (
        <>
          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-primary font-bold">
            {chatExpert.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h1 className="font-semibold">{chatExpert.name}</h1>
            <p className="text-xs text-blue-100">{chatExpert.specialty} • Online</p>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-primary py-4 px-4 text-white">
        <div className="flex items-center">
          <button onClick={handleBackClick} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {renderHeaderContent()}
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
              isUser={msg.sender === (isExpert ? "expert" : "user")} 
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Start a conversation with {isExpert ? `${chatUser?.firstName} ${chatUser?.lastName}` : chatExpert?.name}
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
