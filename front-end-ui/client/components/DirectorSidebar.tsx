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
  Settings,
  BarChart3,
  MapPin,
  Bot
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
    href: '/director-dashboard',
    description: 'Vue d\'ensemble et statistiques'
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
  },
  {
    id: 'analytics',
    label: 'Analyses & Statistiques',
    icon: BarChart3,
    href: '/director/analytics',
    description: 'Rapports analytiques et KPIs'
  },
  {
    id: 'locations',
    label: 'Gestion des Sites',
    icon: MapPin,
    href: '/director/locations',
    description: 'Domaines, serres et géolocalisation'
  },
  {
    id: 'robot-control',
    label: 'Contrôle Robot',
    icon: Bot,
    href: '/robot-control',
    description: 'Surveillance et contrôle du robot en temps réel'
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
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-10",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-greener rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Directeur</h1>
              <p className="text-sm text-gray-500">Gestion complète</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-gray-50 hover:shadow-sm",
                    active 
                      ? "bg-greener-50 text-greener-700 border border-greener-200 shadow-sm" 
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-greener-600" : "text-gray-500"
                  )} />
                  <div className="flex-1 min-w-0">
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
                  {active && (
                    <ChevronRight className="h-4 w-4 text-greener-600" />
                  )}
                </button>

                {/* Hover tooltip for better UX */}
                {hoveredItem === item.id && !active && (
                  <div className="absolute left-full ml-2 top-0 z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                    {item.description}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Settings className="h-5 w-5 text-gray-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">Paramètres</div>
              <div className="text-xs text-gray-500">Configuration système</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
