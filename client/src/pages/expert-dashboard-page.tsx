import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Appointment, User } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, MessageCircle, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpertAppointmentCard } from "@/components/ui/expert-appointment-card";
import { useLocation } from "wouter";

type ExpertAppointment = Appointment & { user: User };

export default function ExpertDashboardPage() {
  const { user, expert, isExpert } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Effect to redirect if not an expert
  useEffect(() => {
    if (!isExpert) {
      setLocation("/");
    }
  }, [isExpert, setLocation]);

  const {
    data: appointments,
    isLoading,
    error,
  } = useQuery<ExpertAppointment[], Error>({
    queryKey: ["/api/expert/appointments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return <ExpertDashboardSkeleton />;
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Error loading appointments",
      description: error.message,
    });
  }

  const upcomingAppointments = appointments?.filter(appointment => 
    appointment.status === "upcoming"
  ) || [];
  
  const pastAppointments = appointments?.filter(appointment => 
    appointment.status === "completed" || appointment.status === "cancelled"
  ) || [];

  return (
    <MobileLayout>
      <div className="container pt-6 pb-20">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Expert Dashboard</h1>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{expert?.name}</CardTitle>
              <CardDescription>{expert?.specialty}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {upcomingAppointments.length} Upcoming
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {pastAppointments.length} Past
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4 space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <ExpertAppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="past" className="mt-4 space-y-4">
              {pastAppointments.length === 0 ? (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No past appointments</p>
                </div>
              ) : (
                pastAppointments.map((appointment) => (
                  <ExpertAppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    isPast={true}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}

function ExpertDashboardSkeleton() {
  return (
    <MobileLayout>
      <div className="container pt-6 pb-20">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3 pt-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}