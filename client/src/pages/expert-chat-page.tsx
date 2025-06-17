import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import { Message, InsertMessage, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MobileLayout from "@/components/layouts/mobile-layout";
import ChatMessage from "@/components/ui/chat-message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ExpertChatPage() {
  const { userId } = useParams();
  const messageInput = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const { user, expert } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: messages,
    isLoading,
    error,
    refetch
  } = useQuery<Message[]>({
    queryKey: [`/api/expert-messages/${userId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userId && !!expert?.id,
  });

  const {
    data: patientData,
    isLoading: loadingPatient
  } = useQuery<User>({
    queryKey: [`/api/user/${userId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userId && !!expert?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      if (messageInput.current) {
        messageInput.current.focus();
      }
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!user?.id || !expert?.id || !userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&expertId=${expert.id}`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          // Force refetch messages when a new one arrives
          refetch();
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [user?.id, expert?.id, userId, refetch]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !expert?.id || !userId) return;

    const messageData: InsertMessage = {
      userId: parseInt(userId),
      expertId: expert.id,
      content: newMessage.trim(),
      sender: "expert",
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleBack = () => {
    navigate("/");
  };

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      if (!expert?.id) throw new Error("Expert ID is required");
      await apiRequest("DELETE", `/api/conversations/${expert.id}`);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Conversation deleted",
        description: `Successfully deleted ${data?.deletedCount || 0} messages`,
      });
      // Navigate back and invalidate queries
      handleBack();
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expert-messages"] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Unable to delete conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConversation = () => {
    deleteConversationMutation.mutate();
  };

  function getInitials(firstName?: string, lastName?: string) {
    if (!firstName && !lastName) return "?";
    return `${firstName ? firstName.charAt(0) : ""}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  }

  if (loadingPatient || isLoading) {
    return <ChatPageSkeleton />;
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col h-full">
          <div className="bg-primary text-white p-4 flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 text-white" onClick={handleBack}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-lg font-medium">Chat</h1>
          </div>
          <div className="flex-1 p-4">
            <div className="text-center text-red-500">
              {error instanceof Error ? error.message : "Error loading chat messages"}
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!patientData) {
    return (
      <MobileLayout>
        <div className="flex flex-col h-full">
          <div className="bg-primary text-white p-4 flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 text-white" onClick={handleBack}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-lg font-medium">Chat</h1>
          </div>
          <div className="flex-1 p-4">
            <div className="text-center text-red-500">
              Patient not found
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNavigation={false}>
      <div className="flex flex-col h-full">
        <div className="bg-primary text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 text-white" onClick={handleBack}>
              <ArrowLeft size={18} />
            </Button>
            <Avatar className="h-8 w-8 mr-2 border border-white/20">
              <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                {getInitials(patientData.firstName, patientData.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-medium">{patientData.firstName} {patientData.lastName}</h1>
              <p className="text-xs text-primary-foreground/70">{patientData.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-600 p-2"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={handleDeleteConversation}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                disabled={deleteConversationMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isUser={message.sender === "expert"}
                onDelete={() => refetch()}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="border-t p-4 flex items-center space-x-2"
        >
          <Input
            ref={messageInput}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}

function ChatPageSkeleton() {
  return (
    <MobileLayout>
      <div className="flex flex-col h-full">
        <div className="bg-primary text-white p-4 flex items-center">
          <Skeleton className="h-8 w-8 rounded-full mr-2 bg-white/20" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 bg-white/20 mb-1" />
            <Skeleton className="h-3 w-24 bg-white/20" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ChatMessageSkeleton isUser={false} />
          <ChatMessageSkeleton isUser={true} />
          <ChatMessageSkeleton isUser={false} />
          <ChatMessageSkeleton isUser={true} />
        </div>

        <div className="border-t p-4 flex items-center space-x-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </MobileLayout>
  );
}

function ChatMessageSkeleton({ isUser }: { isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Skeleton
        className={`h-16 max-w-[75%] rounded-lg ${
          isUser ? "rounded-tr-none" : "rounded-tl-none"
        }`}
        style={{ width: `${Math.floor(Math.random() * 40) + 35}%` }}
      />
    </div>
  );
}