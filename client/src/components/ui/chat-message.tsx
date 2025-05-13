import { format } from "date-fns";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
}

export default function ChatMessage({ message, isUser }: ChatMessageProps) {
  // Format timestamp
  const formattedTime = format(
    message.timestamp ? new Date(message.timestamp) : new Date(),
    "h:mm a"
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={cn(
          "p-3 rounded-lg max-w-[80%] shadow-sm",
          isUser
            ? "bg-primary text-white chat-bubble-user"
            : "bg-white text-foreground chat-bubble-expert"
        )}
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
      </div>
    </div>
  );
}
