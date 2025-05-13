import { useLocation } from "wouter";
import { Expert } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ExpertCardProps {
  expert: Expert;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  const [, navigate] = useLocation();

  const handleBookAppointment = (e: React.MouseEvent) => {
    navigate(`/book-appointment/${expert.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    navigate(`/chat/${expert.id}`);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex">
          <div className="w-16 h-16 bg-gray-200 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
            <span className="font-medium text-gray-600">
              {expert.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <div>
              <h3 className="font-medium">{expert.name}</h3>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {expert.specialty}
                </span>
              </div>
              <div className="flex items-center mt-1.5">
                <div className="flex">
                  {Array(5).fill(0).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">⭐</span>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {expert.rating}.0 ({expert.reviewCount} reviews)
                </span>
              </div>
            </div>
            <div className="flex mt-3 space-x-2">
              <Button 
                className="flex-1 text-sm py-2 h-auto" 
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={handleMessage}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
