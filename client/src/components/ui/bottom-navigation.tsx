import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Calendar, MessageSquare, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(location);
  const { isExpert } = useAuth();

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(location === "/" ? "/" : location);
  }, [location]);

  // Define different navigation items based on user role
  const userNavItems: NavItem[] = [
    {
      path: "/",
      label: "Home",
      icon: <Home className="text-xl" />,
    },
    {
      path: "/appointments",
      label: "Appointments",
      icon: <Calendar className="text-xl" />,
    },
    {
      path: "/chat/1", // Default to first expert chat for simplicity
      label: "Messages",
      icon: <MessageSquare className="text-xl" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User className="text-xl" />,
    },
  ];

  const expertNavItems: NavItem[] = [
    {
      path: "/",
      label: "Home",
      icon: <Home className="text-xl" />,
    },
    {
      path: "/expert-dashboard",
      label: "Dashboard",
      icon: <Briefcase className="text-xl" />,
    },
    {
      path: "/chat/1", // Will be redirected in the chat page component
      label: "Messages",
      icon: <MessageSquare className="text-xl" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User className="text-xl" />,
    },
  ];
  
  // Use the appropriate navigation items based on user role
  const navItems = isExpert ? expertNavItems : userNavItems;

  const handleNavClick = (path: string) => {
    navigate(path);
    setActiveTab(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-10">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavClick(item.path)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            activeTab === item.path || 
            (item.path === "/chat/1" && activeTab.startsWith("/chat/"))
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
