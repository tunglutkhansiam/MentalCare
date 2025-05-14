import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { Expert, User, Message, InsertMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ChatMessage from "@/components/ui/chat-message";

export default function ChatPage() {
  const { userId, expertId } = useParams();
  const [, navigate] = useLocation();
  const { user, isExpert } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Redirect experts away from the chat page
  useEffect(() => {
    if (isExpert) {
      navigate("/expert-dashboard");
      toast({
        title: "Chat access restricted",
        description: "Chat functionality is not available for experts.",
      });
    }
  }, [isExpert, navigate, toast]);
  
  // Use refs to track message state to avoid duplication issues
  const messagesRef = useRef<Message[]>([]);
  const seenMessageIds = useRef<Set<number>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch expert details if user is not an expert
  const { data: chatExpert, isLoading: loadingExpert } = useQuery<Expert>({
    queryKey: [`/api/experts/${expertId}`],
    enabled: !isExpert && !!expertId,
  });

  // We don't need to fetch user details for experts anymore since they're redirected away
  const { data: chatUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/user/${userId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: false, // Disabled since experts are redirected away
  });
  
  // Load initial messages from server
  useEffect(() => {
    // Exit early if user is expert (they'll be redirected) or if required IDs aren't available
    if (!user?.id || !expertId || isExpert) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        // Only fetch messages for regular users (not experts)
        const apiEndpoint = `/api/messages/${expertId}`;
          
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        
        const data = await response.json();
        
        // Filter out duplicates
        const uniqueMessages: Message[] = [];
        const uniqueIds = new Set<number>();
        
        data.forEach((msg: Message) => {
          if (!uniqueIds.has(msg.id) && !seenMessageIds.current.has(msg.id)) {
            uniqueIds.add(msg.id);
            seenMessageIds.current.add(msg.id);
            uniqueMessages.push(msg);
          }
        });
        
        // Sort by ID to ensure correct order
        uniqueMessages.sort((a, b) => a.id - b.id);
        
        messagesRef.current = uniqueMessages;
        setMessages(uniqueMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [user?.id, expertId, userId, isExpert]);
  
  // Send message function
  const sendMessage = async () => {
    if (!messageText.trim() || !expertId || !user?.id) return;
    
    try {
      // Clear input immediately for better UX
      const content = messageText;
      setMessageText("");
      
      // Prepare message data
      const chatUserId = isExpert && userId ? parseInt(userId) : user.id;
      const messageData: InsertMessage = {
        userId: chatUserId,
        expertId: parseInt(expertId),
        content,
        sender: isExpert ? "expert" : "user",
      };
      
      // Send to server
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const savedMessage = await response.json();
      
      // Update local state only if message is not already present
      if (!seenMessageIds.current.has(savedMessage.id)) {
        seenMessageIds.current.add(savedMessage.id);
        messagesRef.current = [...messagesRef.current, savedMessage];
        setMessages([...messagesRef.current]);
        
        // Notify other clients via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "message",
            ...savedMessage
          }));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };
  
  // Setup WebSocket connection
  useEffect(() => {
    // Don't setup WebSocket for experts (they'll be redirected) or if required IDs aren't available
    if (!user?.id || !expertId || isExpert) return;
    
    // Close any existing connection
    if (socket) {
      socket.close();
    }
    
    // Create WebSocket connection - only for regular users (not experts)
    const chatUserId = user.id.toString();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${chatUserId}&expertId=${expertId}`;
    
    console.log("Connecting to WebSocket:", wsUrl);
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === "message") {
          console.log("Processing message:", data.id, "Current seen ids:", Array.from(seenMessageIds.current));
          
          // Only process if we haven't seen this message before
          if (!seenMessageIds.current.has(data.id)) {
            console.log("Adding new message to chat");
            seenMessageIds.current.add(data.id);
            messagesRef.current = [...messagesRef.current, data];
            setMessages([...messagesRef.current]);
          } else {
            console.log("Ignoring duplicate message");
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
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
    if (!messageText.trim()) return;
    sendMessage();
  };
  
  // Function to clean up duplicate messages
  const cleanupChat = async () => {
    if (!user?.id || !expertId) return;
    
    try {
      // Determine correct userId for the API call
      const chatUserId = isExpert && userId ? userId : user.id.toString();
      
      // Call the cleanup endpoint
      const response = await fetch(`/api/cleanup-chat/${chatUserId}/${expertId}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Chat Fixed",
          description: data.message,
          variant: "default",
        });
        
        // Reload the page to refresh the messages
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fix chat",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cleaning up chat:", error);
      toast({
        title: "Error",
        description: "Failed to fix chat. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Loading state
  if ((isExpert && loadingUser) || (!isExpert && loadingExpert)) {
    return <ChatPageSkeleton />;
  }
  
  const chatPartner = isExpert ? chatUser : chatExpert;
  
  if (!chatPartner) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center bg-muted/20">
        <h3 className="text-xl font-semibold mb-2">{isExpert ? "User" : "Expert"} not found</h3>
        <p className="text-muted-foreground mb-6">
          The {isExpert ? "user" : "expert"} profile could not be loaded or doesn't exist.
        </p>
        <Button 
          onClick={() => isExpert ? navigate("/expert-dashboard") : navigate("/")} 
          className="mt-4"
        >
          Back to {isExpert ? "Dashboard" : "Home"}
        </Button>
      </div>
    );
  }
  
  const renderHeaderContent = () => {
    if (isExpert && chatUser) {
      return (
        <>
          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-primary font-bold">
            {chatUser.firstName?.[0]}{chatUser.lastName?.[0] || chatUser.username?.[0]}
          </div>
          <div>
            <h1 className="font-semibold">
              {chatUser.firstName} {chatUser.lastName || chatUser.username}
            </h1>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleBackClick} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {renderHeaderContent()}
          </div>
          <button 
            onClick={() => cleanupChat()} 
            className="text-xs bg-blue-600 hover:bg-blue-700 rounded px-2 py-1"
            title="Remove duplicate messages"
          >
            Fix Chat
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <ChatMessageSkeleton key={i} isUser={i % 2 !== 0} />
          ))
        ) : messages.length > 0 ? (
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
              Start a conversation with {isExpert 
                ? `${chatUser?.firstName || ''} ${chatUser?.lastName || chatUser?.username || ''}` 
                : chatExpert?.name}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-white border-t">
        <div className="flex">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
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
            disabled={!messageText.trim()}
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