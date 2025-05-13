import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Expert, Specialization } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ExpertProfilePage() {
  const { expertId } = useParams();
  const [, navigate] = useLocation();

  const { data: expert, isLoading } = useQuery<Expert>({
    queryKey: [`/api/experts/${expertId}`],
  });

  const { data: specializations } = useQuery<Specialization[]>({
    queryKey: [`/api/experts/${expertId}/specializations`],
    enabled: !!expertId,
  });

  const handleBackClick = () => {
    navigate("/");
  };

  const handleBookAppointment = () => {
    navigate(`/book-appointment/${expertId}`);
  };

  const handleMessage = () => {
    navigate(`/chat/${expertId}`);
  };

  if (isLoading) {
    return <ExpertProfileSkeleton />;
  }

  if (!expert) {
    return (
      <div className="p-4 text-center">
        <p>Expert not found</p>
        <Button onClick={handleBackClick} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary py-6 px-4 text-white">
        <button onClick={handleBackClick} className="mb-4 flex items-center text-sm">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </button>
        
        <div className="flex items-center">
          <div className="w-20 h-20 bg-white rounded-full mr-4 flex items-center justify-center text-primary font-bold text-xl">
            {expert.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{expert.name}</h1>
            <p className="text-blue-100">{expert.specialty}</p>
            <div className="flex items-center mt-1">
              <div className="flex">
                {Array(5).fill(0).map((_, i) => (
                  <span key={i} className="text-yellow-300 text-xs">⭐</span>
                ))}
              </div>
              <span className="text-xs text-blue-100 ml-1">
                {expert.rating}.0 ({expert.reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-muted-foreground text-sm">
              {expert.about}
            </p>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {specializations?.map(spec => (
                <Badge key={spec.id} variant="secondary" className="bg-blue-100 text-primary hover:bg-blue-200">
                  {spec.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Education & Experience</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              {expert.education.split('\n').map((item, idx) => (
                <li key={idx} className="flex">
                  <span className="mr-2">🎓</span>
                  <span>{item}</span>
                </li>
              ))}
              {expert.experience.split('\n').map((item, idx) => (
                <li key={idx} className="flex">
                  <span className="mr-2">⏱️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <div className="space-y-3">
          <Button onClick={handleBookAppointment} className="w-full">
            Book Appointment
          </Button>
          <Button onClick={handleMessage} variant="outline" className="w-full border-primary text-primary">
            Message
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExpertProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary py-6 px-4 text-white">
        <div className="mb-4 h-5 w-16">
          <Skeleton className="h-full w-full bg-blue-400" />
        </div>
        
        <div className="flex items-center">
          <Skeleton className="w-20 h-20 rounded-full mr-4 bg-blue-400" />
          <div>
            <Skeleton className="h-6 w-40 mb-2 bg-blue-400" />
            <Skeleton className="h-4 w-24 mb-2 bg-blue-400" />
            <Skeleton className="h-4 w-32 bg-blue-400" />
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <div className="flex flex-wrap gap-2">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-48 mb-2" />
            <ul className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <li key={i} className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
