import { Appointment, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, FileText, MessageCircle, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface ExpertAppointmentCardProps {
  appointment: Appointment & { user: User };
  isPast?: boolean;
}

export function ExpertAppointmentCard({ 
  appointment, 
  isPast = false 
}: ExpertAppointmentCardProps) {
  const [, setLocation] = useLocation();

  // Format appointment date and time
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  const dateFormatted = format(appointmentDate, "MMMM d, yyyy");
  const timeFormatted = format(appointmentDate, "h:mm a");

  function getStatusColor(status: string) {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function handleChatClick() {
    setLocation(`/chat/${appointment.user.id}`);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>{appointment.user.firstName} {appointment.user.lastName}</span>
              </div>
            </CardTitle>
            <CardDescription>{appointment.user.email}</CardDescription>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{dateFormatted}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{timeFormatted}</span>
          </div>
          {appointment.reason && (
            <div className="flex items-start space-x-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="flex-1">{appointment.reason}</span>
            </div>
          )}
        </div>
      </CardContent>
      {!isPast && (
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleChatClick}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat with Patient
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}