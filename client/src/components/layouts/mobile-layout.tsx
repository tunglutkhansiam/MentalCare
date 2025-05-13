import { ReactNode } from "react";
import BottomNavigation from "@/components/ui/bottom-navigation";

interface MobileLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export default function MobileLayout({ children, showNavigation = true }: MobileLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto pb-16">
        {children}
      </div>
      {showNavigation && <BottomNavigation />}
    </div>
  );
}
