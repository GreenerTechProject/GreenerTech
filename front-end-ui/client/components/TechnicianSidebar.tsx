import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Map,
  Camera,
  AlertTriangle,
  Bell,
  Bookmark,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

interface TechnicianSidebarProps {
  userRole: "technicien" | "technicien_sup";
  onInterventionClick?: () => void;
}

export default function TechnicianSidebar({
  userRole,
  onInterventionClick,
}: TechnicianSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const basePath =
    userRole === "technicien_sup"
      ? "/technicien-sup"
      : "/technician";

  const sidebarItems: SidebarItem[] = [
    {
      id: "accueil",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />,
      path: basePath,
    },
    {
      id: "carte",
      label: "Carte",
      icon: <Map className="h-5 w-5" />,
      onClick: () => {
        // Navigate to map view or scroll to map section
        const mapElement = document.querySelector(
          '[data-testid="map-section"]',
        );
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      id: "surveillance",
      label: "Surveillance",
      icon: <Camera className="h-5 w-5" />,
      path: "/surveillance",
    },
    {
      id: "alertes",
      label: "Alertes",
      icon: <AlertTriangle className="h-5 w-5" />,
      path: "/alerts",
    },
    {
      id: "interventions",
      label: "Interventions",
      icon: <Bell className="h-5 w-5" />,
      onClick: () => {
        setIsOpen(false); // Close sidebar first
        onInterventionClick?.();
      },

      path: "/interventions",
    },
    {
      id: "rapports",
      label: "Rapports",
      icon: <Bookmark className="h-5 w-5" />,
      onClick: () => {
        // TODO: Navigate to reports page when implemented
        console.log("Rapports clicked");
      },
    },
  ];

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
      {/* Menu Button - Now positioned for header integration */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-10 rounded-lg transition-all duration-300",
          "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200",
          isOpen && "bg-gray-100",
        )}
        size="sm"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-1/2 left-8 transform -translate-y-1/2 w-80 bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out",
          "rounded-2xl border border-gray-200/50 backdrop-blur-sm bg-white/95",
          isOpen
            ? "translate-x-0 opacity-100 scale-100"
            : "-translate-x-full opacity-0 scale-95",
          "max-h-[85vh] overflow-hidden",
        )}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <p className="text-sm text-gray-500 mt-1">
              {userRole === "technicien_sup"
                ? "Technicien Supérieur"
                : "Technicien"}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200",
                      "hover:bg-gray-50 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-greener-400/20",
                      "group transform hover:scale-[1.02]",
                      item.id === "interventions" && "bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "transition-colors duration-200",
                        item.id === "interventions"
                          ? "text-blue-600 group-hover:text-blue-700"
                          : "text-gray-500 group-hover:text-greener-500"
                      )}>
                        {item.icon}
                      </div>
                      <span className={cn(
                        "font-medium text-sm transition-colors duration-200",
                        item.id === "interventions"
                          ? "text-blue-700 group-hover:text-blue-800 font-semibold"
                          : "text-gray-700 group-hover:text-gray-900"
                      )}>
                        {item.label}
                        {item.id === "interventions" && (
                          <span className="inline-block ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full animate-pulse">
                            +
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200",
                "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/20",
                "group",
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-500 group-hover:text-red-500 transition-colors duration-200">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-gray-700 font-medium text-sm group-hover:text-red-600 transition-colors duration-200">
                  Se déconnecter
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Decorative gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-greener-100/20 via-transparent to-blue-100/20 pointer-events-none" />
      </div>
    </>
  );
}
