import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/layouts/mobile-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Expert, Category } from "@shared/schema";
import ExpertCard from "@/components/ui/expert-card";
import CategoryCard from "@/components/ui/category-card";
import AppointmentCard from "@/components/ui/appointment-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user, isExpert } = useAuth();
  
  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch top experts
  const { data: experts, isLoading: loadingExperts } = useQuery<Expert[]>({
    queryKey: ["/api/experts"],
  });
  
  // Fetch upcoming appointments
  const { data: upcomingAppointment, isLoading: loadingAppointment } = useQuery<(Appointment & { expert: Expert }) | undefined>({
    queryKey: ["/api/appointments/upcoming"],
  });

  const handleFindExpert = () => {
    // Navigate to experts list or just show experts section
    if (experts?.length) {
      document.getElementById("experts-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleViewAppointments = () => {
    navigate("/appointments");
  };
  
  const handleViewExpertDashboard = () => {
    navigate("/expert-dashboard");
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Hi, {user?.firstName || "User"}!
            </h1>
            <p className="text-muted-foreground text-sm">How are you feeling today?</p>
          </div>
          <div 
            className="h-10 w-10 bg-muted rounded-full flex items-center justify-center"
            onClick={() => navigate("/profile")}
          >
            <span className="text-muted-foreground font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className={`grid ${isExpert ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-6`}>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={handleFindExpert}
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
          
          {isExpert && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={handleViewExpertDashboard}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
                <span className="font-medium">Expert Dashboard</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Appointment */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Upcoming Appointment</h2>
          
          {loadingAppointment ? (
            <AppointmentCardSkeleton />
          ) : upcomingAppointment ? (
            <AppointmentCard appointment={upcomingAppointment} />
          ) : (
            <Card>
              <CardContent className="p-4 text-center py-8">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <button 
                  className="mt-2 text-primary font-medium"
                  onClick={handleFindExpert}
                >
                  Book an appointment
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Health Expert Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Find Health Experts</h2>
          
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {loadingCategories ? (
              Array(4).fill(0).map((_, i) => <CategoryCardSkeleton key={i} />)
            ) : (
              categories?.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))
            )}
          </div>
        </div>

        {/* Top Health Experts */}
        <div id="experts-section">
          <h2 className="text-lg font-semibold mb-3">Top Health Experts</h2>
          
          <div className="space-y-4">
            {loadingExperts ? (
              Array(2).fill(0).map((_, i) => <ExpertCardSkeleton key={i} />)
            ) : (
              experts?.map(expert => (
                <ExpertCard key={expert.id} expert={expert} />
              ))
            )}
          </div>
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

function ExpertCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex">
          <Skeleton className="w-16 h-16 rounded-full mr-3 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex mt-3 space-x-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="flex-none">
      <Skeleton className="w-24 h-20 rounded-lg" />
    </div>
  );
}
