import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TechnicianSidebar from "./TechnicianSidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Map, ChevronDown, User, LogOut, Sun, Moon, Bell, AlertTriangle } from "lucide-react";

type UserRole = "technicien" | "technicien_sup";

interface TechHeaderProps {
  role: UserRole;
}

export default function TechHeader({ role }: TechHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleProfile = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/profile");
    } else {
      navigate("/technicien/profile");
    }
  };

  const handleAlerts = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/alerts");
    } else {
      navigate("/technician/alerts");
    }
  };

  const handleNotifications = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/notifications");
    } else {
      navigate("/technician/notifications");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-full px-3 sm:px-4 lg:px-6">
        {/* Mobile-first responsive grid */}
        <div className="flex items-center justify-between py-2 sm:py-3">
          {/* Left: Hamburger / Navigation */}
          <div className="flex-shrink-0">
            <TechnicianSidebar userRole={role} />
          </div>

          {/* Center: Home and Map icons (centered) */}
          <div className="flex-1 flex items-center justify-center gap-3 px-2">
            <div 
              className="h-9 w-9 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-colors duration-200 active:scale-95 flex-shrink-0"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup/home" : "/technician/dashboard")}
              title="Accueil"
            >
              <Home className="h-5 w-5 text-white" />
            </div>
            <div 
              className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 flex-shrink-0"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/map")}
              title="Carte"
            >
              <Map className="h-5 w-5 text-blue-700" />
            </div>
          </div>

          {/* Right: Alerts, Notifications and User dropdown */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Alert Triangle Icon - for alerts/alerts */}
            <div className="relative group">
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm cursor-pointer hover:bg-orange-200 transition-colors duration-200 active:scale-95 border border-orange-200 flex-shrink-0"
                onClick={handleAlerts}
                title="Alertes"
              >
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                {/* Alert Badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-xs">5</span>
                </div>
              </div>
              
              {/* Tooltip below the Alert icon */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="text-center">
                  <div className="font-medium mb-1">Alertes</div>
                  <div className="space-y-1 text-gray-300">
                    <div>🔴 3 alertes élevées</div>
                    <div>🟡 2 alertes moyennes</div>
                  </div>
                </div>
                {/* Arrow pointing up to the Alert icon */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Notification Bell Icon - for intervention requests */}
            <div className="relative group">
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm cursor-pointer hover:bg-blue-200 transition-colors duration-200 active:scale-95 border border-blue-200 flex-shrink-0"
                onClick={handleNotifications}
                title="Demandes d'intervention"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                {/* Notification Badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-xs">2</span>
                </div>
              </div>
              
              {/* Tooltip below the Bell icon */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="text-center">
                  <div className="font-medium mb-1">Demandes d'intervention</div>
                  <div className="space-y-1 text-gray-300">
                    <div>✅ 1 intervention acceptée</div>
                    <div>⏳ 1 demande en attente</div>
                  </div>
                </div>
                {/* Arrow pointing up to the Bell icon */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2 sm:px-3 h-8 sm:h-9">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-gray-900 leading-none">
                        {user?.name || "Utilisateur"}
                      </div>
                      <div className="text-xs text-gray-500 leading-none truncate max-w-[12rem]">
                        {user?.email}
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium text-gray-900">{user?.name || "Utilisateur"}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" /> Mode clair
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" /> Mode sombre
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}


