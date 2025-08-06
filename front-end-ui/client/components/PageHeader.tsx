import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
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
}

export default function PageHeader({ 
  title, 
  subtitle, 
  badge, 
  userRole = "technicien",
  actions 
}: PageHeaderProps) {
  const { user, logout } = useAuth();

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
            
            {/* User Info */}
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name || user?.email}
            </span>
            
            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
