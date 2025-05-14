import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Message, User } from "@shared/schema";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

type MessageWithUser = Message & { user: User };

export default function ExpertMessagesTab() {
  const [, navigate] = useLocation();

  const {
    data: messages,
    isLoading,
    error
  } = useQuery<MessageWithUser[]>({
    queryKey: ['/api/expert/messages'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  function handleChatClick(userId: number) {
    navigate(`/expert-chat/${userId}`);
  }

  function getInitials(firstName?: string, lastName?: string) {
    if (!firstName && !lastName) return "?";
    return `${firstName ? firstName.charAt(0) : ""}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <MessageCardSkeleton />
        <MessageCardSkeleton />
        <MessageCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Error loading messages: {error.message}</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card
          key={message.userId}
          className="overflow-hidden cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => handleChatClick(message.userId)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(message.user.firstName, message.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="font-medium truncate">
                    {message.user.firstName} {message.user.lastName}
                  </h4>
                  {message.timestamp && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistance(new Date(message.timestamp), new Date(), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs font-normal px-1 py-0 h-4">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {message.sender === 'expert' ? 'You: ' : ''}{message.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MessageCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2 mb-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}