import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TechnicianSidebar from "./TechnicianSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Map, ChevronDown, User, LogOut, Menu } from "lucide-react";

type UserRole = "technicien" | "technicien_sup";

interface TechHeaderProps {
  role: UserRole;
}

const getRoleLabel = (role: UserRole): string =>
  role === "technicien_sup" ? "Technicien Supérieur" : "Technicien";

export default function TechHeader({ role }: TechHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-full px-3 sm:px-4 lg:px-6">
        {/* Mobile-first responsive grid */}
        <div className="grid grid-cols-3 items-center py-2 sm:py-3">
          {/* Left: Hamburger / Navigation */}
          <div className="justify-self-start">
            <TechnicianSidebar userRole={role} />
          </div>

          {/* Center: Logo + Map icon (responsive sizing) */}
          <div className="justify-self-center flex items-center gap-2 sm:gap-3">
            <div 
              className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-colors duration-200 active:scale-95"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup/home" : "/technician")}
              title="Accueil - Tableau de bord"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div 
              className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician")}
              title="Carte - Vue d'ensemble"
            >
              <Map className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700" />
            </div>
          </div>

          {/* Right: Role + User dropdown (responsive) */}
          <div className="justify-self-end flex items-center gap-2 sm:gap-3">
            {/* Role badge - hidden on very small screens */}
            <Badge variant="outline" className="hidden xs:inline bg-gray-50 border-gray-200 text-gray-700 text-xs">
              {getRoleLabel(role)}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2 sm:px-3 h-8 sm:h-9 lg:h-10">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* User info - hidden on small screens */}
                    <div className="hidden sm:block text-left">
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


