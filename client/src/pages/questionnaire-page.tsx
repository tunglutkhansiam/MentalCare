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
      responses: Record<number, any>;
    }) => {
      console.log("Starting API request with data:", responseData);
      try {
        const res = await apiRequest("POST", "/api/questionnaire-responses", responseData);
        console.log("API response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const result = await res.json();
        console.log("API response data:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Questionnaire submitted successfully:", data);
      setCompleted(true);
      // Show thank you popup
      toast({
        title: "Thank you for completing the questionnaire!",
        description: "Your information has been saved and will be available to your mental health professional during appointments.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/questionnaire-responses"] });
    },
    onError: (error) => {
      console.error("Questionnaire submission error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "An unexpected error occurred",
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
  
  console.log("Current question index:", currentQuestionIndex);
  console.log("Total questions:", questions.length);
  console.log("Current question:", currentQuestion?.text);
  console.log("Is last question:", currentQuestionIndex === questions.length - 1);
  
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
    console.log("Handle next clicked. Current question index:", currentQuestionIndex);
    console.log("Total questions:", questions.length);
    console.log("Is last question?", currentQuestionIndex >= questions.length - 1);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log("Attempting to submit questionnaire...");
      
      // Prepare response data - save answers as key-value pairs
      const responseData = {
        questionnaireId: questionnaire.id,
        responses: answers, // Save all answers directly
      };
      
      console.log("Submitting questionnaire response:", responseData);
      console.log("Current answers:", answers);
      console.log("Mutation function:", submitMutation.mutate);
      
      // Submit response
      try {
        submitMutation.mutate(responseData);
        console.log("Mutation triggered successfully");
      } catch (error) {
        console.error("Error triggering mutation:", error);
      }
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
          <Card className="text-center bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-8 w-8 text-green-500" />
                Thank You!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 text-green-800">
                Your questionnaire has been completed successfully
              </h2>
              <p className="mb-4 text-gray-700">
                Thank you for taking the time to complete the {questionnaire.title}.
              </p>
              <p className="text-muted-foreground mb-6">
                Your detailed information has been saved securely and will be available to your mental health professional during your appointments. This helps them provide personalized care tailored to your specific needs and preferences.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>What happens next?</strong><br />
                  Your responses are now part of your profile and can be reviewed by experts during consultations to better understand your background, preferences, and therapeutic goals.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/")} className="bg-green-600 hover:bg-green-700">
                Return Home
              </Button>
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
            <div className="space-x-2">
              <Button
                onClick={() => {
                  console.log("Button clicked!");
                  handleNext();
                }}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  'Submitting...'
                ) : currentQuestionIndex < questions.length - 1 ? (
                  <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : (
                  'Complete'
                )}
              </Button>
              {/* Debug submit button - always visible */}
              <Button
                variant="secondary"
                onClick={() => {
                  console.log("Direct submit clicked!");
                  const responseData = {
                    questionnaireId: questionnaire.id,
                    responses: answers,
                  };
                  console.log("Direct submit data:", responseData);
                  submitMutation.mutate(responseData);
                }}
                disabled={submitMutation.isPending}
              >
                Submit Now
              </Button>
            </div>
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