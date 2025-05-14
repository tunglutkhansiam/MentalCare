import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Appointment, User, Message, Expert, Specialization } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance, format } from "date-fns";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, FileText, MessageCircle, User as UserIcon, Briefcase, GraduationCap, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ExpertAppointmentCard from "../components/ui/expert-appointment-card";
import { useLocation } from "wouter";

type ExpertAppointment = Appointment & { user: User };
type ChatThread = Message & { user: User };
type DetailedExpert = Expert & { specializations: Specialization[] };

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
    data: detailedExpert,
    isLoading: loadingExpertDetails,
    error: expertDetailsError,
  } = useQuery<DetailedExpert, Error>({
    queryKey: ["/api/expert-profile/detailed"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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

  // Show errors using an effect to avoid re-render issues
  useEffect(() => {
    if (expertDetailsError) {
      toast({
        variant: "destructive",
        title: "Error loading expert details",
        description: expertDetailsError.message,
      });
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
        title: "Error loading messages",
        description: chatsError.message,
      });
    }
  }, [expertDetailsError, appointmentsError, chatsError, toast]);

  const isLoading = loadingAppointments || loadingExpertDetails || loadingChats;

  if (isLoading) {
    return <ExpertDashboardSkeleton />;
  }



  const upcomingAppointments = appointments?.filter(appointment => 
    appointment.status === "upcoming"
  ) || [];
  
  const pastAppointments = appointments?.filter(appointment => 
    appointment.status === "completed" || appointment.status === "cancelled"
  ) || [];

  function getInitials(firstName?: string, lastName?: string) {
    if (!firstName && !lastName) return "?";
    return `${firstName ? firstName.charAt(0) : ""}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
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
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">{detailedExpert?.name}</CardTitle>
              <CardDescription className="text-md font-medium text-primary">{detailedExpert?.specialty}</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  {upcomingAppointments.length} Upcoming
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {pastAppointments.length} Past
                </Badge>

                {detailedExpert?.rating && (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {detailedExpert.rating}/5 ({detailedExpert.reviewCount} reviews)
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1 text-muted-foreground mb-1">
                    <GraduationCap className="h-4 w-4" /> Education
                  </h3>
                  <p className="text-sm">{detailedExpert?.education}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1 text-muted-foreground mb-1">
                    <Briefcase className="h-4 w-4" /> Experience
                  </h3>
                  <p className="text-sm">{detailedExpert?.experience}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" /> About
                  </h3>
                  <p className="text-sm">{detailedExpert?.about}</p>
                </div>
                
                {detailedExpert?.specializations && detailedExpert.specializations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailedExpert.specializations.map((spec) => (
                        <Badge key={spec.id} variant="secondary" className="text-xs">
                          {spec.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
          
          {/* Expert profile card skeleton */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
                
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
                
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                </div>
                
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs skeleton */}
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Content skeleton */}
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