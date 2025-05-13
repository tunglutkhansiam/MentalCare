import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { useLocation } from "wouter";
import { Questionnaire } from "@shared/schema";

interface QuestionnaireCardProps {
  questionnaire: Pick<Questionnaire, "id" | "title" | "description">;
}

export default function QuestionnaireCard({ questionnaire }: QuestionnaireCardProps) {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(`/questionnaire/${questionnaire.id}`);
  };
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow" 
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium text-lg">{questionnaire.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{questionnaire.description}</p>
        <div className="mt-3 text-sm text-right">
          <span className="text-primary font-medium">Take assessment</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuestionnaireCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 animate-pulse">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
          <div className="h-5 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5 mt-2"></div>
        <div className="mt-3 flex justify-end">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </CardContent>
    </Card>
  );
}