import { useLocation } from "wouter";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Appointment, Expert } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppointmentCardProps {
  appointment: Appointment & { expert?: Expert };
  isPast?: boolean;
  showActions?: boolean;
}

export default function AppointmentCard({ 
  appointment, 
  isPast = false,
  showActions = false
}: AppointmentCardProps) {
  const [, navigate] = useLocation();
  
  const expert = appointment.expert;
  const expertInitials = expert?.name.split(' ').map(n => n[0]).join('') || 'DR';

  // Format the appointment date and time
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  const formattedDate = format(appointmentDate, "MMM d, h:mm a");
  const isToday = new Date().toDateString() === appointmentDate.toDateString();
  const displayDate = isToday ? `Today, ${format(appointmentDate, "h:mm a")}` : formattedDate;

  const handleJoinCall = () => {
    // Navigate to chat with the expert
    navigate(`/chat/${appointment.expertId}`);
  };

  const handleReschedule = () => {
    // Navigate to reschedule page
    navigate(`/book-appointment/${appointment.expertId}`);
  };

  const handleViewNotes = () => {
    // Navigate to appointment details or notes
    navigate(`/appointments/${appointment.id}`);
  };

  const handleBookAgain = () => {
    // Navigate to book with the same expert
    navigate(`/book-appointment/${appointment.expertId}`);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
            isPast ? "bg-gray-100" : "bg-blue-100"
          }`}>
            <span className={`font-medium ${isPast ? "text-gray-500" : "text-primary"}`}>
              {expertInitials}
            </span>
          </div>
          <div>
            <h3 className="font-medium">Dr. {expert?.name || "Doctor"}</h3>
            <p className="text-sm text-muted-foreground">{expert?.specialty || "Specialist"}</p>
          </div>
        </div>
        <Badge variant={isPast ? "outline" : "secondary"} className={isPast ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-primary"}>
          {isPast ? "Completed" : "Upcoming"}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-gray-100 pt-3">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
          <span>{displayDate}</span>
        </div>
        {showActions && !isPast && (
          <div className="flex space-x-2">
            <Button 
              variant="link" 
              className="text-primary font-medium p-0 h-auto"
              onClick={handleJoinCall}
            >
              Join Call
            </Button>
            <Button 
              variant="link" 
              className="text-muted-foreground font-medium p-0 h-auto"
              onClick={handleReschedule}
            >
              Reschedule
            </Button>
          </div>
        )}
        {isPast && (
          <div className="flex space-x-2">
            <Button 
              variant="link" 
              className="text-primary font-medium p-0 h-auto"
              onClick={handleViewNotes}
            >
              View Notes
            </Button>
            <Button 
              variant="link" 
              className="text-muted-foreground font-medium p-0 h-auto"
              onClick={handleBookAgain}
            >
              Book Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
