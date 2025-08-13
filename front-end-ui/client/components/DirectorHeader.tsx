import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Map, ChevronDown, User, LogOut, Home, LayoutDashboard } from "lucide-react";

export default function DirectorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Get user display name with fallback
  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name;
    }
    return "Utilisateur";
  };

  // Get user email with fallback
  const getUserDisplayEmail = () => {
    if (user?.email) {
      return user.email.length > 25 ? user.email.substring(0, 25) + '...' : user.email;
    }
    return "";
  };

  const handleProfile = () => {
    navigate("/directeur/profile");
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="max-w-full px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Mobile-first responsive grid */}
        <div className="grid grid-cols-3 items-center py-2 sm:py-3 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]">
          {/* Left: Sidebar toggle button */}
          <div className="justify-self-start">
           
          </div>

          {/* Center: Navigation icons (responsive sizing) */}
          <div className="justify-self-start flex items-center gap-1 sm:gap-2 md:gap-3">
            <div 
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-all duration-200 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={() => navigate("/directeur")}
              title="Accueil - Tableau de bord"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate("/directeur")}
            >
              <Home className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div 
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-200 transition-all duration-200 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={() => navigate("/directeur/map-config")}
              title="Configuration de la carte"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate("/directeur/map-config")}
            >
              <Map className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-700" />
            </div>
          </div>

          {/* Right: Role + User dropdown (responsive) */}
          <div className="justify-self-end flex items-center gap-1 sm:gap-2 md:gap-3">
        

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="px-1 sm:px-2 md:px-3 h-7 sm:h-8 md:h-9 lg:h-10 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8">
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs sm:text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* User info - responsive visibility */}
                    <div className="hidden lg:block text-left">
                      <div className="text-sm font-medium text-gray-900 leading-none">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500 leading-none truncate max-w-[12rem]">
                        {getUserDisplayEmail()}
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                  <div className="text-xs text-gray-500">{getUserDisplayEmail()}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile
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
