import React, { useState } from "react";
import { useTechnicianSidebar } from "../contexts/TechnicianSidebarContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Map,
  AlertTriangle,
  Bell,
  Bookmark,
  LogOut,
  Menu,
  X,
  Bot,
  Target,
  Shield,
  Users,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

interface TechnicianSidebarProps {
  userRole: "technicien" | "technicien_sup" | "technicien_superieur";
  onInterventionClick?: () => void;
}

export default function TechnicianSidebar({
  userRole,
  onInterventionClick,
}: TechnicianSidebarProps) {
  // Share open state with layout
  const { isOpen, setIsOpen } = useTechnicianSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is a superior technician (either role name)
  const isSuperiorTechnician = userRole === "technicien_sup" || userRole === "technicien_superieur";

  const basePath = isSuperiorTechnician ? "/technicien-sup" : "/technician";

  const sidebarItems: SidebarItem[] = (() => {
    const items: SidebarItem[] = [
      {
        id: "accueil",
        label: "Accueil",
        icon: <Home className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup" : "/technician/dashboard",
      },
      {
        id: "carte",
        label: "Carte",
        icon: <Map className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/map" : "/technician",
      },
      // Only show missions for regular technicians, not for tech-sup
      ...(isSuperiorTechnician ? [] : [{
        id: "missions",
        label: "Missions",
        icon: <Target className="h-5 w-5" />,
        path: "/technician/missions",
      }]),
      {
        id: "alertes",
        label: "Alertes",
        icon: <AlertTriangle className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/alerts" : "/technician/alerts",
      },
      {
        id: "interventions",
        label: "Interventions",
        icon: <Bell className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/interventions" : "/technician/interventions",
      },
      {
        id: "rapports",
        label: "Rapports",
        icon: <Bookmark className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/reports" : "/technician/reports",
      },
      // Show Authorizations only for superior technicians
      ...(isSuperiorTechnician ? [
        {
          id: "team",
          label: "Mon Équipe",
          icon: <Users className="h-5 w-5" />,
          path: "/technicien-sup/team",
        },
        {
          id: "authorizations",
          label: "Autorisations",
          icon: <Shield className="h-5 w-5" />,
          path: "/technicien-sup/authorizations",
        }
      ] : []),
    ];
    // Show Surveillance only for regular technicians, not for tech-sup
    if (!isSuperiorTechnician) {
      items.splice(2, 0,  {
        id: "robot-control",
        label: "Contrôle Robot",
        icon: <Bot className="h-5 w-5" />,
        path: "/technician/technician/robot-control",
    });
    }
    return items;
  })();

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Director style) */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out overflow-hidden",
          "lg:translate-x-0 lg:sticky lg:top-0 lg:z-10 lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Mobile width
          "w-80",
          // Desktop widths toggle: collapsed (icon-only) vs expanded
          isOpen
            ? "lg:w-64 lg:min-w-64 lg:max-w-64 xl:w-64 xl:min-w-64 xl:max-w-64 2xl:w-80 2xl:min-w-80 2xl:max-w-80"
            : "lg:w-20 lg:min-w-20 lg:max-w-20 xl:w-20 xl:min-w-20 xl:max-w-20 2xl:w-20 2xl:min-w-20 2xl:max-w-20",
          "flex flex-col h-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* Hamburger menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
              title={isOpen ? "Réduire la barre latérale" : "Agrandir la barre latérale"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className={cn("block", isOpen ? "lg:block" : "lg:hidden") }>
              <h1 className="font-semibold text-gray-900">{isSuperiorTechnician ? "Technicien Supérieur" : "Technicien"}</h1>
              <p className="text-sm text-gray-500">Navigation</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {sidebarItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  "hover:bg-gray-50 hover:shadow-sm",
                  // When collapsed on desktop, center icons; when expanded, show full spacing
                  isOpen
                    ? "lg:justify-start lg:px-4 lg:py-3 lg:space-x-3"
                    : "lg:justify-center lg:px-2 lg:py-3 lg:space-x-0",
                  item.id === (isSuperiorTechnician ? "alertes" : "carte")
                    ? "bg-greener-50 text-greener-700 border border-greener-200 shadow-sm"
                    : "text-gray-700 hover:text-gray-900"
                )}
                title={item.label}
              >
                <div className="h-5 w-5 flex-shrink-0 text-gray-500">
                  {item.icon}
                </div>
                <div className={cn("flex-1 min-w-0", isOpen ? "lg:block" : "lg:hidden") }>
                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                </div>
              </button>

              {/* Tooltip for collapsed */}
              <div className={cn(
                "absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap lg:left-full lg:ml-2 lg:top-1/2 lg:transform lg:-translate-y-1/2 opacity-0 group-hover:opacity-100 hidden",
                isOpen ? "lg:hidden" : "lg:block"
              )}>
                {item.label}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="relative group">
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className={cn(
                "w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200",
                isOpen ? "justify-start space-x-3" : "justify-center"
              )}
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              <div className={cn("flex-1 min-w-0", isOpen ? "lg:block" : "lg:hidden") }>
                <div className="text-sm font-medium text-gray-900">Se déconnecter</div>
                <div className="text-xs text-gray-500">Terminer la session</div>
              </div>
            </button>

            {/* Tooltip when collapsed on desktop */}
            <div className={cn(
              "absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap lg:left-full lg:ml-2 lg:top-1/2 lg:transform lg:-translate-y-1/2 opacity-0 group-hover:opacity-100 hidden",
              isOpen ? "lg:hidden" : "lg:block"
            )}>
              Se déconnecter
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
