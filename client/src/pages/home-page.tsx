import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Expert, Category, Appointment, Questionnaire, Message, User } from "@shared/schema";
import AppointmentCard from "@/components/ui/appointment-card";
import QuestionnaireCard, { QuestionnaireCardSkeleton } from "@/components/ui/questionnaire-card";
import { Briefcase, Calendar, ClipboardList, MessageCircle, User as UserIcon, Users, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getQueryFn } from "@/lib/queryClient";

type ExpertAppointment = Appointment & { user: User };
type ChatThread = Message & { user: User };

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user, expert, isExpert, logoutMutation } = useAuth();
  
  // Fetch user-related data
  const { data: questionnaires, isLoading: loadingQuestionnaires } = useQuery<Pick<Questionnaire, "id" | "title" | "description">[]>({
    queryKey: ["/api/questionnaires"],
    enabled: !isExpert, // Only fetch if not an expert
  });
  
  const { data: upcomingAppointments, isLoading: loadingAppointment } = useQuery<(Appointment & { expert: Expert })[]>({
    queryKey: ["/api/appointments/upcoming/all", user?.id],
    enabled: !!user?.id && !isExpert, // Only fetch for users who aren't experts
  });

  // Fetch expert-related data
  const {
    data: expertAppointments,
    isLoading: loadingExpertAppointments,
  } = useQuery<ExpertAppointment[], Error>({
    queryKey: ["/api/expert/appointments"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isExpert, // Only fetch if user is an expert
  });

  const {
    data: chatThreads,
    isLoading: loadingChats,
  } = useQuery<ChatThread[], Error>({
    queryKey: ["/api/expert/chats"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isExpert, // Only fetch if user is an expert
  });

  const handleViewAppointments = () => {
    navigate("/appointments");
  };
  
  const handleViewExpertDashboard = () => {
    navigate("/expert-dashboard");
  };

  function getInitials(firstName?: string, lastName?: string) {
    if (!firstName || !lastName) return "??";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  const handleChatClick = (userId: number) => {
    if (expert) {
      navigate(`/chat/${userId}/${expert.id}`);
    }
  };

  // Calculate stats for expert view
  const upcomingExpertAppointments = expertAppointments?.filter(appointment => 
    appointment.status === "upcoming"
  ) || [];
  
  const pastExpertAppointments = expertAppointments?.filter(appointment => 
    appointment.status === "completed" || appointment.status === "cancelled"
  ) || [];
  
  // Show different content for experts and users
  // Check if page is loading
  const isLoading = (isExpert && (loadingExpertAppointments || loadingChats)) || 
                   (!isExpert && (loadingQuestionnaires || loadingAppointment));

  // Show skeleton while loading
  if (isLoading) {
    return <HomePageSkeleton isExpert={isExpert} />;
  }

  return (
    <MobileLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <div className="mobile-padding mobile-spacing">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hi, {isExpert ? expert?.name : user?.firstName || "User"}!
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {isExpert ? `Welcome to your dashboard` : "How are you feeling today?"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logoutMutation.mutateAsync()}
                disabled={logoutMutation.isPending}
                className="mobile-button flex items-center gap-2 tap-highlight-none"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              <div 
                className="touch-target bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200 tap-highlight-none"
                onClick={() => navigate("/profile")}
              >
                <span className="text-white font-bold text-sm">
                  {isExpert ? getInitials(...(expert?.name.split(" ") || [])) : getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
            </div>
          </div>

        {isExpert ? (
          /* EXPERT VIEW */
          <>
            {/* Expert Profile */}
            <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-800">{expert?.name}</CardTitle>
                <CardDescription className="text-blue-600 font-medium">{expert?.specialty}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">
                    {upcomingExpertAppointments.length} Upcoming
                  </Badge>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
                    {pastExpertAppointments.length} Past
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-md">
                    {chatThreads?.length || 0} Messages
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-2">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                  onClick={handleViewExpertDashboard}
                >
                  View Expert Dashboard
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none" 
                onClick={handleViewExpertDashboard}
              >
                <CardContent className="mobile-card flex flex-col items-center justify-center text-center touch-target">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium mobile-text">Dashboard</span>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none" 
                onClick={handleViewAppointments}
              >
                <CardContent className="mobile-card flex flex-col items-center justify-center text-center touch-target">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium mobile-text">Appointments</span>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none" 
                onClick={() => navigate("/profile")}
              >
                <CardContent className="mobile-card flex flex-col items-center justify-center text-center touch-target">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <UserIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="font-medium mobile-text">Profile</span>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleViewExpertDashboard}
                >
                  View all
                </Button>
              </div>
              
              {upcomingExpertAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingExpertAppointments.slice(0, 2).map(appointment => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="mr-3">
                              <AvatarFallback>
                                {getInitials(appointment.user.firstName, appointment.user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{appointment.user.firstName} {appointment.user.lastName}</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.date} at {appointment.time}
                              </p>
                            </div>
                          </div>
                          <Badge>{appointment.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center py-8">
                    <p className="text-muted-foreground">No upcoming appointments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          /* USER VIEW */
          <>
            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate("/experts")}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-primary text-xl">👨‍⚕️</span>
                  </div>
                  <span className="font-medium">Find Expert</span>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={handleViewAppointments}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-secondary text-xl">📅</span>
                  </div>
                  <span className="font-medium">My Appointments</span>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/appointments")}
                >
                  View all
                </Button>
              </div>
              
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map(appointment => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center py-8">
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <button 
                      className="mt-2 text-primary font-medium"
                      onClick={() => navigate("/experts")}
                    >
                      Book an appointment
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Mental Health Questionnaires - Only shown to regular users */}
            {!isExpert && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Mental Health Assessments</h2>
                
                <div className="space-y-4">
                  {questionnaires?.length ? (
                    questionnaires.map(questionnaire => (
                      <QuestionnaireCard key={questionnaire.id} questionnaire={questionnaire} />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center py-8">
                        <p className="text-muted-foreground">No assessments available</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </MobileLayout>
  );
}

function AppointmentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
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
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpertProfileCardSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-2">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function QuickActionsSkeletonExpert() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Skeleton className="w-12 h-12 rounded-full mb-2" />
            <Skeleton className="h-5 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActionsSkeletonUser() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {[1, 2].map(i => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Skeleton className="w-12 h-12 rounded-full mb-2" />
            <Skeleton className="h-5 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MessageCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HomePageSkeleton({ isExpert }: { isExpert: boolean }) {
  return (
    <MobileLayout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {isExpert ? (
          <>
            <ExpertProfileCardSkeleton />
            <QuickActionsSkeletonExpert />
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-16" />
              </div>
              <AppointmentCardSkeleton />
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="space-y-3">
                <MessageCardSkeleton />
                <MessageCardSkeleton />
              </div>
            </div>
          </>
        ) : (
          <>
            <QuickActionsSkeletonUser />
            
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <AppointmentCardSkeleton />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6 mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
