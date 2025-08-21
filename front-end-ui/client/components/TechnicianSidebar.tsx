import React, { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
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
        path: isSuperiorTechnician ? "/technicien-sup/home" : "/technician/dashboard",
      },
      {
        id: "carte",
        label: "Carte",
        icon: <Map className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/map" : "/technician",
      },
      {
        id: "missions",
        label: "Missions",
        icon: <Target className="h-5 w-5" />,
        path: isSuperiorTechnician ? "/technicien-sup/missions" : "/technician/missions",
      },
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
	
    ];
    // Show Surveillance only for regular technicians, not for tech-sup
    if (!isSuperiorTechnician) {
      items.splice(2, 0,  {
        id: "robot-control",
        label: "Contrôle Robot",
        icon: <Bot className="h-5 w-5" />,
        path: "/technician/robot-control",
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
      {/* Menu Button - match Director sidebar toggle */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-10 rounded-lg transition-all duration-300",
          "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm",
          isOpen && "bg-gray-100",
          "lg:h-11 lg:w-11 xl:h-12 xl:w-12",
        )}
        size="sm"
        title="Ouvrir le menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

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
          "fixed left-0 top-0 z-50 h-[100dvh] bg-white border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out overflow-hidden",
          "lg:translate-x-0 lg:fixed lg:top-0 lg:z-40 lg:h-[100dvh]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-80 lg:w-20 lg:min-w-20 lg:max-w-20 xl:w-64 xl:min-w-64 xl:max-w-64 2xl:w-80 2xl:min-w-80 2xl:max-w-80",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-greener rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="lg:hidden xl:block">
              <h1 className="font-semibold text-gray-900">{isSuperiorTechnician ? "Technicien Supérieur" : "Technicien"}</h1>
              <p className="text-sm text-gray-500">Navigation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden"
            title="Toggle sidebar"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  "hover:bg-gray-50 hover:shadow-sm",
                  "lg:justify-center lg:px-2 lg:py-3 lg:space-x-0",
                  "xl:justify-start xl:px-4 xl:py-3 xl:space-x-3",
                  item.id === (isSuperiorTechnician ? "alertes" : "carte")
                    ? "bg-greener-50 text-greener-700 border border-greener-200 shadow-sm"
                    : "text-gray-700 hover:text-gray-900"
                )}
                title={item.label}
              >
                <div className="h-5 w-5 flex-shrink-0 text-gray-500">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 lg:hidden xl:block">
                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                </div>
              </button>

              {/* Tooltip for collapsed */}
              <div className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap lg:left-full lg:ml-2 lg:top-1/2 lg:transform lg:-translate-y-1/2 xl:hidden opacity-0 group-hover:opacity-100">
                {item.label}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 text-gray-500" />
            <div className="flex-1 min-w-0 lg:hidden xl:block">
              <div className="text-sm font-medium text-gray-900">Se déconnecter</div>
              <div className="text-xs text-gray-500">Terminer la session</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
