import { ReactNode } from "react";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

interface MobileLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export default function MobileLayout({ children, showNavigation = true }: MobileLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex-1 overflow-y-auto pb-16 touch-scroll">
        {children}
      </div>
      {showNavigation && <BottomNavigation />}
    </div>
  );
}
