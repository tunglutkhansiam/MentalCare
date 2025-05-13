import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ExpertProfilePage from "@/pages/expert-profile-page";
import ExpertDashboardPage from "@/pages/expert-dashboard-page";
import AppointmentBookingPage from "@/pages/appointment-booking-page";
import AppointmentsPage from "@/pages/appointments-page";
import ChatPage from "@/pages/chat-page";
import ProfilePage from "@/pages/profile-page";
import ExpertsListPage from "@/pages/experts-list-page";
import QuestionnairePage from "@/pages/questionnaire-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/expert/:expertId" component={ExpertProfilePage} />
      <ProtectedRoute path="/expert-dashboard" component={ExpertDashboardPage} />
      <ProtectedRoute path="/experts" component={ExpertsListPage} />
      <ProtectedRoute path="/book-appointment/:expertId" component={AppointmentBookingPage} />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
      <ProtectedRoute path="/chat/:userId/:expertId" component={ChatPage} />
      <ProtectedRoute path="/chat/:expertId" component={ChatPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/questionnaire/:id" component={QuestionnairePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
