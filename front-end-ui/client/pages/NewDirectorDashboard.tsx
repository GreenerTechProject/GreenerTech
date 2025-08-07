import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/useSidebar";
import DirectorSidebar from "../components/DirectorSidebar";
import { 
  Menu, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  FileText,
  UserCheck,
  MapPin,
  Activity,
  Calendar,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  technicians: {
    total: number;
    active: number;
    pending: number;
    senior: number;
  };
  interventions: {
    total: number;
    inProgress: number;
    completed: number;
    scheduled: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  affiliations: {
    pending: number;
    approved: number;
    rejected: number;
  };
  reports: {
    generated: number;
    pending: number;
    overdue: number;
  };
  locations: {
    domains: number;
    greenhouses: number;
    activeRobots: number;
  };
}

export default function NewDirectorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    technicians: { total: 24, active: 22, pending: 3, senior: 8 },
    interventions: { total: 156, inProgress: 12, completed: 142, scheduled: 8 },
    alerts: { critical: 3, warning: 8, info: 12, total: 23 },
    affiliations: { pending: 5, approved: 18, rejected: 2 },
    reports: { generated: 45, pending: 3, overdue: 1 },
    locations: { domains: 6, greenhouses: 34, activeRobots: 8 }
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'intervention',
      title: 'Nouvelle intervention assignée',
      description: 'Maintenance préventive - Serre A-12',
      time: 'Il y a 15 min',
      priority: 'high'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Alerte température critique',
      description: 'Domaine Nord - Serre B-05',
      time: 'Il y a 32 min',
      priority: 'critical'
    },
    {
      id: 3,
      type: 'affiliation',
      title: 'Demande d\'affiliation validée',
      description: 'TechAgri Solutions - Technicien Senior',
      time: 'Il y a 1h',
      priority: 'normal'
    },
    {
      id: 4,
      type: 'report',
      title: 'Rapport hebdomadaire généré',
      description: 'Performance équipes - Semaine 47',
      time: 'Il y a 2h',
      priority: 'normal'
    }
  ]);

  // Check if user has the correct role
  useEffect(() => {
    if (user && user.role !== "directeur") {
      window.location.href = "/dashboard";
      return;
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'intervention': return <ClipboardList className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'affiliation': return <UserCheck className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user?.setup_completed) {
    return <div>Configuration en cours...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isOpen && "lg:ml-0"
      )}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Tableau de Bord Directeur
                  </h1>
                  <p className="text-sm text-gray-600">
                    Vue d'ensemble de la plateforme
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email}
                    </div>
                    <div className="text-xs text-gray-500">Directeur</div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                  >
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Technicians Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Techniciens</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-greener-600">{stats.technicians.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.technicians.active} actifs, {stats.technicians.pending} en attente
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.technicians.senior} Seniors
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Interventions Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.interventions.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.interventions.inProgress} en cours
                </p>
                <Progress 
                  value={(stats.interventions.completed / stats.interventions.total) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Alerts Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.alerts.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.alerts.critical} critiques, {stats.alerts.warning} avertissements
                </p>
                <div className="mt-2 flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>

            {/* Locations Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sites</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.locations.domains}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.locations.greenhouses} serres, {stats.locations.activeRobots} robots
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Tous actifs
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Actions en Attente</CardTitle>
                <CardDescription>
                  Éléments nécessitant votre attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Demandes d'affiliation</div>
                      <div className="text-sm text-red-700">{stats.affiliations.pending} à valider</div>
                    </div>
                  </div>
                  <Badge variant="destructive">{stats.affiliations.pending}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-900">Alertes critiques</div>
                      <div className="text-sm text-orange-700">{stats.alerts.critical} nécessitent une action</div>
                    </div>
                  </div>
                  <Badge variant="destructive">{stats.alerts.critical}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-900">Rapports en retard</div>
                      <div className="text-sm text-yellow-700">{stats.reports.overdue} à finaliser</div>
                    </div>
                  </div>
                  <Badge variant="outline">{stats.reports.overdue}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Activité Récente</CardTitle>
                <CardDescription>
                  Dernières actions sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-white",
                        getPriorityColor(activity.priority)
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Vue d'Ensemble des Performances</CardTitle>
              <CardDescription>
                Indicateurs clés de performance de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-greener-600 mb-2">
                    94%
                  </div>
                  <div className="text-sm text-gray-600">Taux de résolution</div>
                  <div className="text-xs text-gray-500">Interventions réussies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    2.3h
                  </div>
                  <div className="text-sm text-gray-600">Temps de réponse moyen</div>
                  <div className="text-xs text-gray-500">Alertes critiques</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    87%
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction équipes</div>
                  <div className="text-xs text-gray-500">Enquête mensuelle</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
