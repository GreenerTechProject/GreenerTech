import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TechnicianSidebar from "./TechnicianSidebar";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
  userRole?: "technicien" | "technicien_sup" | "directeur";
  actions?: React.ReactNode;
  showProfile?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  userRole = "technicien",
  actions,
  showProfile = true
  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* Sidebar Button */}
            <TechnicianSidebar userRole={userRole} />
            
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {/* Badge */}
              {badge && (
                <Badge 
                  variant={badge.variant || "outline"} 
                  className={badge.className || "bg-blue-50 border-blue-200 text-blue-700"}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 transition-colors duration-200 px-3 py-2 rounded-md"
                >
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name || "Utilisateur"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="sm:hidden w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || "Utilisateur"}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
