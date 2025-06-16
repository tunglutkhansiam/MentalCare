import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Expert } from "@shared/schema";
import MobileLayout from "@/components/layouts/mobile-layout";
import ExpertCard from "@/components/ui/expert-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ExpertsListPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all experts
  const { data: experts, isLoading } = useQuery<Expert[]>({
    queryKey: ["/api/experts"],
  });

  const handleBackClick = () => {
    navigate("/");
  };

  const filteredExperts = experts?.filter(expert => 
    expert.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    expert.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout>
      <div className="mobile-padding mobile-spacing">
        <button onClick={handleBackClick} className="mb-4 flex items-center text-sm touch-target tap-highlight-none">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
        </button>
        
        <h1 className="text-2xl font-bold mb-2">Mental Health Experts</h1>
        <p className="text-muted-foreground mb-4 mobile-text">Connect with certified mental health professionals for free consultation</p>
        
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name or specialty..."
            className="mobile-input w-full tap-highlight-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <ExpertCardSkeleton key={i} />)
          ) : filteredExperts && filteredExperts.length > 0 ? (
            filteredExperts.map(expert => (
              <ExpertCard key={expert.id} expert={expert} />
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center py-8">
                <p className="text-muted-foreground">No experts found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

function ExpertCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex">
          <Skeleton className="w-16 h-16 rounded-full mr-3 flex-shrink-0" />
          <div className="flex-1">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-6 w-24 mt-1 mb-1" />
              <Skeleton className="h-4 w-28" />
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