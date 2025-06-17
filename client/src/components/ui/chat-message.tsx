import { format } from "date-fns";
import { useState } from "react";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
  onDelete?: () => void;
}

export default function ChatMessage({ message, isUser, onDelete }: ChatMessageProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Format timestamp
  const formattedTime = format(
    message.timestamp ? new Date(message.timestamp) : new Date(),
    "h:mm a"
  );

  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/messages/${message.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully.",
      });
      // Invalidate queries to refresh the chat
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expert-messages"] });
      if (onDelete) onDelete();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Unable to delete message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMessageMutation.mutate();
    setShowOptions(false);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      <div 
        className={cn(
          "p-3 rounded-lg max-w-[80%] shadow-sm relative",
          isUser
            ? "bg-primary text-white chat-bubble-user"
            : "bg-white text-foreground chat-bubble-expert"
        )}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        <p className={isUser ? "text-white" : "text-gray-800"}>
          {message.content}
        </p>
        <span 
          className={cn(
            "text-xs mt-1 block",
            isUser ? "text-blue-100" : "text-muted-foreground"
          )}
        >
          {formattedTime}
        </span>
        
        {/* Delete button - only show for user's own messages */}
        {showOptions && (
          <div className={cn(
            "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "left-1" : "right-1"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 hover:bg-gray-200",
                    isUser && "hover:bg-blue-600"
                  )}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isUser ? "start" : "end"}>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={deleteMessageMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
