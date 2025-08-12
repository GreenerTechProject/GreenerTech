import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/useSidebar";
import DirectorSidebar from "../components/DirectorSidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Bell,
  Home,
  Map,
  ChevronDown,
  User,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  const handleProfile = () => {
    navigate("/directeur/profile");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleMapConfig = () => {
    navigate("/directeur/map-config");
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

   useEffect(() => {
    if (!user?.setup_completed) {
      window.location.href = "/setup";
    }
  }, [user?.setup_completed]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 transition-all duration-300">
        {/* Header - Updated to match TechHeader style */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-full px-3 sm:px-4 lg:px-6">
            {/* Mobile-first responsive grid */}
            <div className="grid grid-cols-3 items-center py-2 sm:py-3">
              {/* Left: Hamburger / Navigation */}
              <div className="justify-self-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Center: Logo + Map icon (responsive sizing) */}
              <div className="justify-self-center flex items-center gap-2 sm:gap-3">
                <div 
                  className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-colors duration-200 active:scale-95"
                  onClick={() => navigate("/directeur")}
                  title="Accueil - Tableau de bord"
                >
                  <Home className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div 
                  className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95"
                  onClick={handleMapConfig}
                  title="Configuration de la carte"
                >
                  <Map className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700" />
                </div>
              </div>

              {/* Right: Role + User dropdown (responsive) */}
              <div className="justify-self-end flex items-center gap-2 sm:gap-3">
                {/* Role badge - hidden on very small screens */}
                <Badge variant="outline" className="hidden xs:inline bg-gray-50 border-gray-200 text-gray-700 text-xs">
                  Directeur
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-2 sm:px-3 h-8 sm:h-9 lg:h-10">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Avatar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                          <AvatarFallback className="bg-green-100 text-green-700 text-xs sm:text-sm">
                            {(user?.name || user?.email || "U")
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
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

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Directeur</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble de votre entreprise agricole</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date().toLocaleDateString('fr-FR')}
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Map className="h-4 w-4 mr-2" />
                Configuration Carte
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Technicians Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Techniciens</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.technicians.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.technicians.active} actifs, {stats.technicians.pending} en attente
                </p>
                <Progress value={(stats.technicians.active / stats.technicians.total) * 100} className="mt-2" />
              </CardContent>
            </Card>

            {/* Interventions Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.interventions.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.interventions.inProgress} en cours, {stats.interventions.completed} terminées
                </p>
                <Progress value={(stats.interventions.completed / stats.interventions.total) * 100} className="mt-2" />
              </CardContent>
            </Card>

            {/* Alerts Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.alerts.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.alerts.critical} critiques, {stats.alerts.warning} avertissements
                </p>
                <div className="mt-2 flex gap-1">
                  <div className="h-2 flex-1 bg-red-500 rounded"></div>
                  <div className="h-2 flex-1 bg-yellow-500 rounded"></div>
                  <div className="h-2 flex-1 bg-blue-500 rounded"></div>
                </div>
              </CardContent>
            </Card>

            {/* Locations Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Localisations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.locations.domains}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.locations.greenhouses} serres, {stats.locations.activeRobots} robots actifs
                </p>
                <Progress value={(stats.locations.activeRobots / Math.max(stats.locations.greenhouses, 1)) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleMapConfig}>
                  <Map className="h-4 w-4 mr-2" />
                  Configuration Carte
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gérer Techniciens
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Voir Alertes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Rapports
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      activity.priority === 'critical' ? "bg-red-500" :
                      activity.priority === 'high' ? "bg-yellow-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Efficacité Opérationnelle</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Taux de Réussite</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <Progress value={94} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Satisfaction Client</span>
                    <span className="font-medium">91%</span>
                  </div>
                  <Progress value={91} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
