import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { InsertAppointment, Expert } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Indian holidays for 2025-2026 (major national holidays)
const indianHolidays = [
  // 2025 holidays
  "2025-01-26", // Republic Day
  "2025-03-13", // Holi
  "2025-03-14", // Dhuleti (Holi second day)
  "2025-04-13", // Ram Navami
  "2025-04-18", // Good Friday
  "2025-05-12", // Buddha Purnima
  "2025-08-15", // Independence Day
  "2025-08-16", // Janmashtami
  "2025-09-07", // Ganesh Chaturthi
  "2025-10-02", // Gandhi Jayanti
  "2025-10-20", // Dussehra
  "2025-11-01", // Diwali
  "2025-11-02", // Govardhan Puja
  "2025-11-03", // Bhai Dooj
  "2025-12-25", // Christmas
  // 2026 holidays
  "2026-01-26", // Republic Day
  "2026-03-03", // Holi
  "2026-04-02", // Ram Navami
  "2026-04-03", // Good Friday
  "2026-05-01", // Buddha Purnima
  "2026-08-15", // Independence Day
  "2026-08-05", // Janmashtami
  "2026-08-27", // Ganesh Chaturthi
  "2026-10-02", // Gandhi Jayanti
  "2026-10-08", // Dussehra
  "2026-10-19", // Diwali
  "2026-12-25", // Christmas
];

// Function to check if a date is a Sunday
const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

// Function to check if a date is an Indian holiday
const isIndianHoliday = (date: Date): boolean => {
  const dateString = format(date, 'yyyy-MM-dd');
  return indianHolidays.includes(dateString);
};



// Helper to generate time slots from 9AM to 5PM
function getTimeSlots(): { time: string; value: string }[] {
  return [
    { time: "9:00 AM", value: "09:00" },
    { time: "10:00 AM", value: "10:00" },
    { time: "11:00 AM", value: "11:00" },
    { time: "12:00 PM", value: "12:00" },
    { time: "1:00 PM", value: "13:00" },
    { time: "2:00 PM", value: "14:00" },
    { time: "3:00 PM", value: "15:00" },
    { time: "4:00 PM", value: "16:00" },
    { time: "5:00 PM", value: "17:00" },
  ];
}

export default function AppointmentBookingPage() {
  const { expertId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  
  const timeSlots = getTimeSlots();

  const { data: expert, isLoading } = useQuery<Expert>({
    queryKey: [`/api/experts/${expertId}`],
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: InsertAppointment) => {
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment confirmed",
        description: "Your appointment has been scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      navigate("/appointments");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBackClick = () => {
    navigate(`/expert/${expertId}`);
  };

  const handleConfirmAppointment = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select a date and time for your appointment",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id || !expertId) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    const appointmentData: InsertAppointment = {
      userId: user.id,
      expertId: parseInt(expertId),
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      reason: reason,
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  if (isLoading) {
    return <AppointmentBookingSkeleton />;
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

  // Format date for display in the summary
  const formattedDate = selectedDate ? 
    format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date';
  
  // Format time for display in the summary
  const formattedTime = selectedTime ? 
    timeSlots.find(slot => slot.value === selectedTime)?.time : 'Select a time';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary py-6 px-4 text-white">
        <button onClick={handleBackClick} className="mb-4 flex items-center text-sm">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-semibold">Book Appointment</h1>
        <p className="text-blue-100">{expert.name}, {expert.specialty}</p>
      </div>
      
      <div className="px-4 py-6">
        {/* Date Selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Select Date</h2>
          <div className="border rounded-lg p-4 bg-white">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              modifiers={{
                sunday: isSunday,
                holiday: isIndianHoliday,
              }}
              modifiersStyles={{
                sunday: { 
                  color: '#dc2626', 
                  fontWeight: 'bold',
                  backgroundColor: '#fef2f2'
                },
                holiday: { 
                  color: '#dc2626', 
                  fontWeight: 'bold',
                  backgroundColor: '#fef2f2'
                },
              }}
              className="w-full"
            />
          </div>
          {/* Calendar Legend */}
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-2">Calendar Legend:</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-red-600">Sundays & Holidays</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-blue-600">Available Days</span>
              </div>
            </div>
          </div>
          
          {selectedDate && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Selected: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                {(isSunday(selectedDate) || isIndianHoliday(selectedDate)) && (
                  <span className="ml-2 text-red-600 font-medium">(Holiday/Sunday)</span>
                )}
              </p>
            </div>
          )}
        </div>
        
        {/* Time Selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Select Time</h2>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((slot, index) => (
              <div 
                key={index}
                className={cn(
                  "border rounded-lg p-3 text-center cursor-pointer",
                  selectedTime === slot.value 
                    ? "bg-primary border-primary" 
                    : "bg-card border-border"
                )}
                onClick={() => setSelectedTime(slot.value)}
              >
                <span className={cn(
                  "text-sm",
                  selectedTime === slot.value ? "text-white" : ""
                )}>{slot.time}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Appointment Details */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Appointment Details</h2>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Reason for consultation
              </label>
              <Textarea 
                id="reason" 
                rows={3} 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or concerns..."
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Appointment Summary */}
        <Card className="bg-blue-50 mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Appointment Summary</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">{formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Doctor:</span>
                <span className="font-medium">{expert.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Specialty:</span>
                <span className="font-medium">{expert.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">Free Consultation</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          className="w-full"
          onClick={handleConfirmAppointment}
          disabled={!selectedDate || !selectedTime || bookAppointmentMutation.isPending}
        >
          {bookAppointmentMutation.isPending ? "Confirming..." : "Confirm Appointment"}
        </Button>
      </div>
    </div>
  );
}

function AppointmentBookingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary py-6 px-4 text-white">
        <Skeleton className="h-4 w-16 mb-4 bg-blue-400" />
        <Skeleton className="h-6 w-48 mb-2 bg-blue-400" />
        <Skeleton className="h-4 w-32 bg-blue-400" />
      </div>
      
      <div className="px-4 py-6">
        {/* Date Selection */}
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex space-x-3 overflow-x-auto pb-2 mb-6">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="flex-none w-16 h-20 rounded-lg" />
          ))}
        </div>
        
        {/* Time Selection */}
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array(9).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
        
        {/* Appointment Details */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-44 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
        
        {/* Appointment Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
