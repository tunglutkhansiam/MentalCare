import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Questionnaire } from "@shared/schema";

interface QuestionnaireCardProps {
  questionnaire: Pick<Questionnaire, "id" | "title" | "description"> & { completed?: boolean; completedAt?: string };
}

export default function QuestionnaireCard({ questionnaire }: QuestionnaireCardProps) {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    if (!questionnaire.completed) {
      navigate(`/questionnaire/${questionnaire.id}`);
    }
  };
  
  const isCompleted = questionnaire.completed;
  
  return (
    <Card 
      className={`transition-shadow ${isCompleted ? 'opacity-75' : 'cursor-pointer hover:shadow-md'}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              isCompleted ? 'bg-green-100' : 'bg-primary/10'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <ClipboardList className="h-5 w-5 text-primary" />
              )}
            </div>
            <h3 className="font-medium text-lg">{questionnaire.title}</h3>
          </div>
          {isCompleted && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Completed
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{questionnaire.description}</p>
        <div className="mt-3 text-sm text-right">
          {isCompleted ? (
            <span className="text-muted-foreground">
              {questionnaire.completedAt ? 
                `Completed on ${new Date(questionnaire.completedAt).toLocaleDateString()}` : 
                'Assessment completed'
              }
            </span>
          ) : (
            <span className="text-primary font-medium">Take assessment</span>
          )}
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