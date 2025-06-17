import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layouts/mobile-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Questionnaire, QuestionnaireResponse } from "@shared/schema";

export default function QuestionnairePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get questionnaire ID from URL
  const path = window.location.pathname;
  const id = parseInt(path.split("/").pop() || "0");
  
  // State for tracking current question and answers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Fetch questionnaire
  const { data: questionnaire, isLoading } = useQuery<Questionnaire>({
    queryKey: [`/api/questionnaires/${id}`, user?.id],
    enabled: !!id && !!user?.id,
  });
  
  // Submit questionnaire response
  const submitMutation = useMutation({
    mutationFn: async (responseData: {
      questionnaireId: number;
      responses: { questionId: number; answerId: number; value: number }[];
      score: number;
    }) => {
      const res = await apiRequest("POST", "/api/questionnaire-responses", responseData);
      return await res.json();
    },
    onSuccess: () => {
      setCompleted(true);
      toast({
        title: "Assessment completed",
        description: "Your responses have been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/questionnaire-responses"] });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return <QuestionnairePageSkeleton />;
  }
  
  if (!questionnaire) {
    return (
      <MobileLayout>
        <div className="p-4">
          <h1 className="text-2xl font-semibold mb-4">Questionnaire Not Found</h1>
          <p className="text-muted-foreground mb-4">The questionnaire you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/")}>Go Back Home</Button>
        </div>
      </MobileLayout>
    );
  }
  
  const questions = questionnaire.questions as Array<{
    id: number;
    text: string;
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    options?: Array<{
      id: number;
      text: string;
      value: number;
    }>;
  }>;
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleCheckboxChange = (optionId: number, checked: boolean) => {
    const currentAnswers = answers[currentQuestion.id] || [];
    let newAnswers;
    
    if (checked) {
      newAnswers = [...currentAnswers, optionId];
    } else {
      newAnswers = currentAnswers.filter((id: number) => id !== optionId);
    }
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: newAnswers,
    });
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate total score
      const totalScore = Object.keys(answers).reduce((total, questionId) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        if (!question || !question.options) return total;
        
        const selectedOption = question.options.find(opt => opt.id === answers[parseInt(questionId)]);
        return total + (selectedOption?.value || 0);
      }, 0);
      
      setScore(totalScore);
      
      // Prepare response data
      const responseData = {
        questionnaireId: questionnaire.id,
        responses: Object.keys(answers).map(questionId => {
          const qId = parseInt(questionId);
          const aId = answers[qId];
          const question = questions.find(q => q.id === qId);
          const option = question?.options.find(o => o.id === aId);
          
          return {
            questionId: qId,
            answerId: aId,
            value: option?.value || 0,
          };
        }),
        score: totalScore,
      };
      
      // Submit response
      submitMutation.mutate(responseData);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  if (completed) {
    return (
      <MobileLayout>
        <div className="p-4">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Assessment Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Thank you for completing the {questionnaire.title}.</p>
              <p className="text-muted-foreground mb-6">
                Your responses have been recorded and may be useful for your consultation with mental health professionals.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </CardFooter>
          </Card>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-2">{questionnaire.title}</h1>
        <p className="text-muted-foreground mb-4 text-sm">{questionnaire.description}</p>
        
        <div className="mb-4">
          <Progress value={progress} />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Text Input */}
            {currentQuestion.type === 'text' && (
              <Input
                type="text"
                placeholder="Enter your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full"
              />
            )}

            {/* Number Input */}
            {currentQuestion.type === 'number' && (
              <Input
                type="number"
                placeholder="Enter your age..."
                min={currentQuestion.min}
                max={currentQuestion.max}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(parseInt(e.target.value) || '')}
                className="w-full"
              />
            )}

            {/* Checkbox (Multiple Selection) */}
            {currentQuestion.type === 'checkbox' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`checkbox-${option.id}`}
                      checked={(answers[currentQuestion.id] || []).includes(option.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                    />
                    <Label htmlFor={`checkbox-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Radio Group (Single Selection) */}
            {(currentQuestion.type === 'radio' || !currentQuestion.type) && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString()}
                onValueChange={(value) => {
                  const option = currentQuestion.options!.find(o => o.id === parseInt(value));
                  if (option) {
                    handleAnswer(option.id);
                  }
                }}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-3 last:mb-0">
                    <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id] || submitMutation.isPending}
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : (
                'Complete'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
}

function QuestionnairePageSkeleton() {
  return (
    <MobileLayout>
      <div className="p-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-full mb-6" />
        
        <div className="mb-4">
          <Skeleton className="h-2 w-full mb-1" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-2 mb-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
}