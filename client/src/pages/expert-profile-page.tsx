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
    navigate("/experts");
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
        <button onClick={handleBackClick} className="mb-4 flex items-center text-sm touch-target tap-highlight-none">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Experts
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
      
      <div className="mobile-padding mobile-spacing">
        <Card className="mb-6">
          <CardContent className="mobile-card">
            <h2 className="font-semibold mb-2 mobile-text">About</h2>
            <p className="text-muted-foreground mobile-text">
              {expert.about || "Dr. " + expert.name + " is a dedicated mental health professional committed to providing compassionate care and evidence-based treatment to help patients achieve their wellness goals."}
            </p>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="mobile-card">
            <h2 className="font-semibold mb-2 mobile-text">Experience</h2>
            <div className="text-muted-foreground mobile-text space-y-2">
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                <span>10+ years of experience</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🏥</span>
                <span>Licensed mental health professional</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👥</span>
                <span>Specialized in {expert.specialty}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="mobile-card">
            <h2 className="font-semibold mb-2 mobile-text">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {specializations && specializations.length > 0 ? (
                specializations.map(spec => (
                  <Badge key={spec.id} variant="secondary" className="bg-blue-100 text-primary hover:bg-blue-200">
                    {spec.name}
                  </Badge>
                ))
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-primary">{expert.specialty}</Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Therapy</Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">Counseling</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="mobile-card">
            <h2 className="font-semibold mb-2 mobile-text">Education & Qualifications</h2>
            <div className="text-muted-foreground mobile-text space-y-3">
              <div className="flex">
                <span className="mr-2">🎓</span>
                <div>
                  <div className="font-medium">PhD in Clinical Psychology</div>
                  <div className="text-sm">Accredited University</div>
                </div>
              </div>
              <div className="flex">
                <span className="mr-2">📜</span>
                <div>
                  <div className="font-medium">Licensed Clinical Psychologist</div>
                  <div className="text-sm">State Board Certified</div>
                </div>
              </div>
              <div className="flex">
                <span className="mr-2">🏆</span>
                <div>
                  <div className="font-medium">Board Certified in {expert.specialty}</div>
                  <div className="text-sm">Professional Association Member</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="mobile-card">
            <h2 className="font-semibold mb-2 mobile-text">Consultation Details</h2>
            <div className="text-muted-foreground mobile-text space-y-2">
              <div className="flex justify-between">
                <span>Session Duration:</span>
                <span className="font-medium">45-60 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Languages:</span>
                <span className="font-medium">English, Hindi, Paite</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center space-y-3">
          <Button onClick={handleBookAppointment} size="sm" className="tap-highlight-none px-6 py-2 h-9 text-sm">
            Book Appointment
          </Button>
          <Button onClick={handleMessage} variant="outline" size="sm" className="border-primary text-primary tap-highlight-none px-6 py-2 h-9 text-sm">
            Send Message
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
