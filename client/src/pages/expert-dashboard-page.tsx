import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Appointment, User, Message } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance, format } from "date-fns";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, FileText, MessageCircle, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ExpertAppointmentCard from "../components/ui/expert-appointment-card";
import { useLocation } from "wouter";

type ExpertAppointment = Appointment & { user: User };
type ChatThread = Message & { user: User };

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
    isLoading: loadingAppointments,
    error: appointmentsError,
  } = useQuery<ExpertAppointment[], Error>({
    queryKey: ["/api/expert/appointments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const {
    data: chatThreads,
    isLoading: loadingChats,
    error: chatsError,
  } = useQuery<ChatThread[], Error>({
    queryKey: ["/api/expert/chats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const isLoading = loadingAppointments || loadingChats;

  if (isLoading) {
    return <ExpertDashboardSkeleton />;
  }

  if (appointmentsError) {
    toast({
      variant: "destructive",
      title: "Error loading appointments",
      description: appointmentsError.message,
    });
  }

  if (chatsError) {
    toast({
      variant: "destructive",
      title: "Error loading chat threads",
      description: chatsError.message,
    });
  }

  const upcomingAppointments = appointments?.filter(appointment => 
    appointment.status === "upcoming"
  ) || [];
  
  const pastAppointments = appointments?.filter(appointment => 
    appointment.status === "completed" || appointment.status === "cancelled"
  ) || [];

  function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  const handleChatClick = (userId: number) => {
    if (expert) {
      setLocation(`/chat/${userId}/${expert.id}`);
    }
  };

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
                <Badge variant="outline" className="text-sm">
                  {chatThreads?.length || 0} Messages
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
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
            <TabsContent value="messages" className="mt-4 space-y-4">
              {!chatThreads || chatThreads.length === 0 ? (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No message threads</p>
                </div>
              ) : (
                chatThreads.map((thread) => (
                  <Card key={thread.userId} className="overflow-hidden">
                    <CardContent className="p-0">
                      <button 
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                        onClick={() => handleChatClick(thread.userId)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback>
                              {getInitials(thread.user.firstName, thread.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-medium truncate">
                                {thread.user.firstName} {thread.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {thread.timestamp ? format(new Date(thread.timestamp), 'MMM d, h:mm a') : ''}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {thread.content}
                            </p>
                          </div>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
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
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10 w-full" />
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