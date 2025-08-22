import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  AlertTriangle, 
  FileText,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DirectorSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
    href: '/directeur',
    description: 'Vue d\'ensemble et statistiques'
  },
  {
    id: 'assignments',
    label: 'Gestion des Assignments',
    icon: UserCheck,
    href: '/directeur/assignments',
    description: 'Assigner techniciens aux superviseurs et aux serres'
  },
  {
    id: 'technicians',
    label: 'Gestion des Techniciens',
    icon: Users,
    href: '/director/technicians',
    description: 'Créer, modifier, supprimer les comptes techniciens'
  },
  {
    id: 'affiliations',
    label: 'Demandes d\'Affiliation',
    icon: UserCheck,
    href: '/director/affiliations',
    description: 'Valider les comptes techniciens'
  },
  {
    id: 'interventions',
    label: 'Gestion des Interventions',
    icon: ClipboardList,
    href: '/director/interventions',
    description: 'Créer, assigner, modifier les interventions'
  },
  {
    id: 'alerts',
    label: 'Gestion des Alertes',
    icon: AlertTriangle,
    href: '/director/alerts',
    description: 'HeatMap et monitoring des alertes'
  },
  {
    id: 'reports',
    label: 'Gestion des Rapports',
    icon: FileText,
    href: '/director/reports',
    description: 'Créer, organiser, éditer les rapports'
  }
];

export default function DirectorSidebar({ isOpen, setIsOpen }: DirectorSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigation = (href: string) => {
    navigate(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-[100dvh] bg-white border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out overflow-hidden",
        "lg:translate-x-0 lg:sticky lg:top-0 lg:z-10 lg:h-[100dvh]",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Mobile width
        "w-80",
        // Desktop widths toggle: collapsed (icon-only) vs expanded
        isOpen
          ? "lg:w-64 lg:min-w-64 lg:max-w-64 xl:w-64 xl:min-w-64 xl:max-w-64 2xl:w-80 2xl:min-w-80 2xl:max-w-80"
          : "lg:w-20 lg:min-w-20 lg:max-w-20 xl:w-20 xl:min-w-20 xl:max-w-20 2xl:w-20 2xl:min-w-20 2xl:max-w-20",
        "flex flex-col"
      )}>
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
              <h1 className="font-semibold text-gray-900">Directeur</h1>
              <p className="text-sm text-gray-500">Gestion complète</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-gray-50 hover:shadow-sm",
                    // When collapsed on desktop, center icons; when expanded, show full spacing
                    isOpen
                      ? "lg:justify-start lg:px-4 lg:py-3 lg:space-x-3"
                      : "lg:justify-center lg:px-2 lg:py-3 lg:space-x-0",
                    active 
                      ? "bg-greener-50 text-greener-700 border border-greener-200 shadow-sm" 
                      : "text-gray-700 hover:text-gray-900"
                  )}
                  title={item.label}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-greener-600" : "text-gray-500"
                  )} />
                  <div className={cn("flex-1 min-w-0", isOpen ? "lg:block" : "lg:hidden") }>
                    <div className={cn(
                      "font-medium text-sm",
                      active ? "text-greener-700" : "text-gray-900"
                    )}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                  {active && isOpen && (
                    <ChevronRight className="h-4 w-4 text-greener-600 hidden lg:block" />
                  )}
                </button>

                {/* Enhanced hover tooltip for collapsed sidebar */}
                {hoveredItem === item.id && (
                  <div className={cn(
                    "absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap",
                    "lg:left-full lg:ml-2 lg:top-1/2 lg:transform lg:-translate-y-1/2",
                    isOpen ? "lg:hidden" : "lg:block"
                  )}>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                    {/* Arrow pointing to the icon */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => handleNavigation('/directeur/parameters')}
            className={cn(
              "w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors",
              isActive('/directeur/parameters') ? "bg-greener-50 border border-greener-200" : ""
            )}
          >
            <Settings className="h-5 w-5 text-gray-500" />
            <div className={cn("flex-1 min-w-0", isOpen ? "lg:block" : "lg:hidden") }>
              <div className="text-sm font-medium text-gray-900">Paramètres</div>
              <div className="text-xs text-gray-500">Configuration système</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
