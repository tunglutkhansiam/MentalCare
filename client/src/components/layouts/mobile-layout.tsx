import { ReactNode } from "react";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { PatientSearchBar } from "@/components/ui/patient-search-bar";
import { useAuth } from "@/hooks/use-auth";

interface MobileLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export default function MobileLayout({ children, showNavigation = true }: MobileLayoutProps) {
  const { isExpert } = useAuth();
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* The PatientSearchBar component will internally check if isExpert is true and not render */}
      {!isExpert && <PatientSearchBar />}
      <div className="flex-1 overflow-y-auto pb-16">
        {children}
      </div>
      {showNavigation && <BottomNavigation />}
    </div>
  );
}
