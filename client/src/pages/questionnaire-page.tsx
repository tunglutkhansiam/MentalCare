import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layouts/mobile-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [answers, setAnswers] = useState<Record<number, string | number | number[]>>({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Fetch questionnaire
  const { data: questionnaire, isLoading, error } = useQuery<Questionnaire & { completed?: boolean; completedAt?: string }>({
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

  // Check if questionnaire is already completed
  if (questionnaire.completed) {
    return (
      <MobileLayout>
        <div className="max-w-2xl mx-auto p-4">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Questionnaire Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have already completed this questionnaire.
              </p>
              {questionnaire.completedAt && (
                <p className="text-sm text-muted-foreground">
                  Completed on: {new Date(questionnaire.completedAt).toLocaleDateString()}
                </p>
              )}
              <div className="mt-6">
                <Button onClick={() => navigate("/")} className="w-full">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }
  
  const questions = questionnaire.questions as Array<{
    id: number;
    text: string;
    type: string;
    required?: boolean;
    options?: Array<{
      id: number;
      text: string;
      value: number;
    }>;
    min?: number;
    max?: number;
  }>;
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate total score based on question types
      const totalScore = Object.keys(answers).reduce((total, questionId) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        if (!question) return total;
        
        if (question.type === 'radio' && question.options) {
          const answer = answers[parseInt(questionId)];
          const selectedOption = question.options.find(opt => opt.id === (typeof answer === 'number' ? answer : 0));
          return total + (selectedOption?.value || 0);
        } else if (question.type === 'checkbox' && question.options) {
          const answer = answers[parseInt(questionId)];
          const selectedIds = Array.isArray(answer) ? answer : [];
          const checkboxScore = selectedIds.reduce((sum, id) => {
            const option = question.options?.find(opt => opt.id === id);
            return sum + (option?.value || 0);
          }, 0);
          return total + checkboxScore;
        } else if (question.type === 'number') {
          const answer = answers[parseInt(questionId)];
          return total + (typeof answer === 'string' || typeof answer === 'number' ? parseInt(answer.toString()) || 0 : 0);
        }
        return total;
      }, 0);
      
      setScore(totalScore);
      
      // Prepare response data
      const responseData = {
        questionnaireId: questionnaire.id,
        responses: Object.keys(answers).map(questionId => {
          const qId = parseInt(questionId);
          const answer = answers[qId];
          const question = questions.find(q => q.id === qId);
          
          let value = 0;
          let answerId = 0;
          
          if (question?.type === 'radio' && question.options) {
            answerId = typeof answer === 'number' ? answer : 0;
            const option = question.options.find(o => o.id === answerId);
            value = option?.value || 0;
          } else if (question?.type === 'checkbox' && question.options) {
            const selectedIds = Array.isArray(answer) ? answer : [];
            answerId = selectedIds.length > 0 ? selectedIds[0] : 0; // Use first selected for compatibility
            value = selectedIds.reduce((sum, id) => {
              const option = question.options?.find(opt => opt.id === id);
              return sum + (option?.value || 0);
            }, 0);
          } else if (question?.type === 'number') {
            answerId = typeof answer === 'string' || typeof answer === 'number' ? parseInt(answer.toString()) || 0 : 0;
            value = answerId;
          } else if (question?.type === 'text') {
            answerId = 0; // Text responses don't have numeric IDs
            value = 0; // Text responses don't contribute to score
          }
          
          return {
            questionId: qId,
            answerId: answerId,
            value: value,
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
            {currentQuestion.type === 'text' && (
              <input
                type="text"
                value={(() => {
                  const answer = answers[currentQuestion.id];
                  return typeof answer === 'string' ? answer : '';
                })()}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your answer..."
              />
            )}
            
            {currentQuestion.type === 'number' && (
              <input
                type="number"
                min={currentQuestion.min}
                max={currentQuestion.max}
                value={(() => {
                  const answer = answers[currentQuestion.id];
                  return typeof answer === 'number' ? answer : '';
                })()}
                onChange={(e) => handleAnswer(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter a number..."
              />
            )}
            
            {currentQuestion.type === 'radio' && currentQuestion.options && (
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
            
            {currentQuestion.type === 'checkbox' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`checkbox-${option.id}`}
                      checked={(answers[currentQuestion.id] as number[] || []).includes(option.id)}
                      onChange={(e) => {
                        const currentAnswers = answers[currentQuestion.id] as number[] || [];
                        if (e.target.checked) {
                          handleAnswer([...currentAnswers, option.id]);
                        } else {
                          handleAnswer(currentAnswers.filter(id => id !== option.id));
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
                    />
                    <Label htmlFor={`checkbox-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
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
              disabled={
                (currentQuestion.required && !answers[currentQuestion.id]) ||
                (currentQuestion.type === 'checkbox' && currentQuestion.required && 
                 (!answers[currentQuestion.id] || !Array.isArray(answers[currentQuestion.id]) || (answers[currentQuestion.id] as number[]).length === 0)) ||
                submitMutation.isPending
              }
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