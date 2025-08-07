import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  LayoutDashboard,
  Users,
  UserCheck,
  Wrench,
  AlertTriangle,
  FileText,
  ChevronRight,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectorSidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "Tableau de bord",
    href: "/directeur",
    icon: LayoutDashboard,
    description: "Vue d'ensemble et statistiques"
  },
  {
    title: "Gestion des techniciens",
    href: "/directeur/techniciens",
    icon: Users,
    description: "CRUD des comptes techniciens"
  },
  {
    title: "Demandes d'affiliation",
    href: "/directeur/affiliations",
    icon: UserCheck,
    badge: "3",
    description: "Validation des nouveaux comptes"
  },
  {
    title: "Gestion des interventions",
    href: "/directeur/interventions",
    icon: Wrench,
    description: "Créer et assigner des interventions"
  },
  {
    title: "Gestion des alertes",
    href: "/directeur/alertes",
    icon: AlertTriangle,
    badge: "5",
    description: "HeatMap et surveillance"
  },
  {
    title: "Gestion des rapports",
    href: "/directeur/rapports",
    icon: FileText,
    description: "Création et consultation des rapports"
  }
];

export default function DirectorSidebar({ className }: DirectorSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Home className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Directeur</h2>
            <p className="text-sm text-gray-500">Tableau de gestion</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== "/directeur" && location.pathname.startsWith(item.href));
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-4 text-left",
                isActive 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <div className="flex items-center w-full">
                <item.icon className={cn(
                  "h-5 w-5 mr-3 flex-shrink-0",
                  isActive ? "text-green-600" : "text-gray-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{item.title}</span>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="bg-red-100 text-red-700 text-xs px-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-green-600" : "text-gray-400"
                      )} />
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>Système de gestion agricole</p>
          <p className="mt-1">v2.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden flex items-center space-x-2"
          >
            <Menu className="h-4 w-4" />
            <span>Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-80 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
