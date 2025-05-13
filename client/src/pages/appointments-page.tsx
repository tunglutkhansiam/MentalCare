import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Appointment, Expert } from "@shared/schema";
import AppointmentCard from "@/components/ui/appointment-card";

type AppointmentWithExpert = Appointment & { expert: Expert };

export default function AppointmentsPage() {
  const [, navigate] = useLocation();

  // Fetch upcoming appointments
  const { data: upcomingAppointments, isLoading: loadingUpcoming } = useQuery<AppointmentWithExpert[]>({
    queryKey: ["/api/appointments/upcoming/all"],
  });

  // Fetch past appointments
  const { data: pastAppointments, isLoading: loadingPast } = useQuery<AppointmentWithExpert[]>({
    queryKey: ["/api/appointments/past"],
  });

  return (
    <MobileLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-semibold text-foreground mb-6">My Appointments</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
          
          <div className="space-y-4">
            {loadingUpcoming ? (
              Array(2).fill(0).map((_, i) => <AppointmentCardSkeleton key={i} />)
            ) : upcomingAppointments?.length ? (
              upcomingAppointments.map(appointment => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  showActions
                />
              ))
            ) : (
              <div className="text-center py-4 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <button 
                  className="mt-2 text-primary font-medium"
                  onClick={() => navigate("/")}
                >
                  Book an appointment
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Past Appointments</h2>
          
          <div className="space-y-4">
            {loadingPast ? (
              Array(2).fill(0).map((_, i) => <AppointmentCardSkeleton key={i} />)
            ) : pastAppointments?.length ? (
              pastAppointments.map(appointment => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  isPast
                />
              ))
            ) : (
              <div className="text-center py-4 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No past appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <Skeleton className="w-12 h-12 rounded-full mr-3" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-1 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
