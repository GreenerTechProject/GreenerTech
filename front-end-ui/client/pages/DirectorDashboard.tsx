import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "@/hooks/useSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DirectorSidebar from "../components/DirectorSidebar";
import DirectorHeader from "@/components/DirectorHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  UserCheck,
  Activity,
  BarChart3,
  Calendar,
  Menu,
  Home,
  Map,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { technicianService, Technician } from "../services/technicianService";
import { InterventionService, Intervention } from "../services/interventionService";
import { AlertService } from "../services/alertService";
import { domainService, Domain } from "../services/domainService";
import { serreService } from "../services/serreService";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface DashboardStats {
  totalTechnicians: number;
  activeTechnicians: number;
  pendingTechnicians: number;
  totalInterventions: number;
  completedInterventions: number;
  pendingInterventions: number;
  totalAlerts: number;
  criticalAlerts: number;
  totalDomains: number;
  totalSerres: number;
}

export default function DirectorDashboard() {
  const { user, logout } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCharges, setMonthlyCharges] = useState<{ month: string; amount: number }[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTechnicians: 0,
    activeTechnicians: 0,
    pendingTechnicians: 0,
    totalInterventions: 0,
    completedInterventions: 0,
    pendingInterventions: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    totalDomains: 0,
    totalSerres: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [
        technicians,
        interventions,
        alerts,
        domains,
        serres
      ] = await Promise.all([
        technicianService.getTechniciansByCompany(user?.id_entreprise || 0),
        InterventionService.getAllInterventions(),
        AlertService.getAllAlerts(1, 100),
        domainService.getMyCompanyDomains(),
        serreService.getAllSerres()
      ]);

      // Calculate statistics
      const totalTechnicians = technicians.length;
      const activeTechnicians = technicians.filter(t => t.directeur_valide && t.email_valide).length;
      const pendingTechnicians = technicians.filter(t => !t.directeur_valide).length;

      const totalInterventions = interventions.length;
      const completedInterventions = interventions.filter(i => (i as any).status === 'terminé' || (i as any).statut === 'terminé').length;
      const pendingInterventions = interventions.filter(i => (i as any).status === 'encours' || (i as any).statut === 'encours').length;

      const totalAlerts = alerts.alerts?.length || 0;
      const criticalAlerts = alerts.alerts?.filter((a: any) => a.status_alert === 2).length || 0;

      const totalDomains = domains.length;
      const totalSerres = serres.length || 0;

      const newStats: StatCard[] = [
        {
          title: "Techniciens actifs",
          value: activeTechnicians,
          change: `${pendingTechnicians} en attente`,
          trend: pendingTechnicians > 0 ? "up" : "neutral",
          icon: Users,
          color: "blue",
          description: `${totalTechnicians} total`
        },
        {
          title: "Interventions en cours",
          value: pendingInterventions,
          change: `${completedInterventions} terminées`,
          trend: pendingInterventions > 0 ? "up" : "neutral",
          icon: Wrench,
          color: "green",
          description: `${totalInterventions} total`
        },
        {
          title: "Alertes actives",
          value: totalAlerts,
          change: `${criticalAlerts} critiques`,
          trend: criticalAlerts > 0 ? "up" : "down",
          icon: AlertTriangle,
          color: "red",
          description: "Nécessitent attention"
        },
        {
          title: "Infrastructure",
          value: totalDomains + totalSerres,
          change: `${totalDomains} domaines, ${totalSerres} serres`,
          trend: "up",
          icon: Building2,
          color: "purple",
          description: "Domaines et serres"
        }
      ];

      setStats(newStats);
      setDashboardStats({
        totalTechnicians,
        activeTechnicians,
        pendingTechnicians,
        totalInterventions,
        completedInterventions,
        pendingInterventions,
        totalAlerts,
        criticalAlerts,
        totalDomains,
        totalSerres
      });

      // Compute monthly charges from interventions
      try {
        const monthlyMap: Record<string, number> = {};
        (interventions as any[]).forEach((i: any) => {
          const when = i?.date_fin || i?.date_debut || i?.created_at;
          if (!when) return;
          const key = new Date(when).toISOString().slice(0, 7); // YYYY-MM
          const amount = Number(i?.total_charges) || 0;
          monthlyMap[key] = (monthlyMap[key] || 0) + amount;
        });
        const months = Object.keys(monthlyMap).sort();
        const monthlyData = months.map((m) => ({
          month: new Date(`${m}-01T00:00:00Z`).toLocaleString("fr-FR", { month: "short", year: "numeric" }),
          amount: monthlyMap[m],
        }));
        setMonthlyCharges(monthlyData);
      } catch (_) {
        setMonthlyCharges([]);
      }

      // Generate recent activities from real data
      const activities = [];
      
      if (pendingTechnicians > 0) {
        activities.push({
          id: 1,
          type: "affiliation",
          message: `${pendingTechnicians} demande(s) d'affiliation en attente`,
          time: "À traiter",
          status: "warning"
        });
      }

      if (criticalAlerts > 0) {
        activities.push({
          id: 2,
          type: "alert",
          message: `${criticalAlerts} alerte(s) critique(s) nécessitent attention`,
          time: "Urgent",
          status: "warning"
        });
      }

      if (pendingInterventions > 0) {
        activities.push({
          id: 3,
          type: "intervention",
          message: `${pendingInterventions} intervention(s) en cours`,
          time: "En cours",
          status: "info"
        });
      }

      if (completedInterventions > 0) {
        activities.push({
          id: 4,
          type: "report",
          message: `${completedInterventions} intervention(s) terminée(s) ce mois`,
          time: "Ce mois",
          status: "success"
        });
      }

      setRecentActivities(activities);

      // Generate pending tasks from real data
      const tasks = [];
      
      if (pendingTechnicians > 0) {
        tasks.push({
          id: 1,
          title: `Valider ${pendingTechnicians} demande(s) d'affiliation`,
          priority: "high",
          dueDate: "Aujourd'hui"
        });
      }

      if (criticalAlerts > 0) {
        tasks.push({
          id: 2,
          title: `Traiter ${criticalAlerts} alerte(s) critique(s)`,
          priority: "high",
          dueDate: "Immédiat"
        });
      }

      if (pendingInterventions > 0) {
        tasks.push({
          id: 3,
          title: `Suivre ${pendingInterventions} intervention(s) en cours`,
          priority: "medium",
          dueDate: "Cette semaine"
        });
      }

      setPendingTasks(tasks);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getStatColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      red: "text-red-600",
      purple: "text-purple-600"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? TrendingUp : TrendingDown;
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      intervention: Wrench,
      alert: AlertTriangle,
      affiliation: UserCheck,
      report: FileText
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700"
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const handleProfile = () => {
    navigate("/directeur/profile");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleMapConfig = () => {
    navigate("/directeur/map-config");
  };

  const handleAddTechnician = () => {
    navigate("/directeur/technician-management");
  };

  const handleCreateIntervention = () => {
    navigate("/directeur/intervention-management");
  };

  const handleGenerateReport = () => {
    navigate("/directeur/report-management");
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 transition-all duration-300">
        <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header with Refresh Button */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600">Vue d'ensemble de votre entreprise</p>
            </div>
            <div className="flex items-center space-x-4">
              {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <Button onClick={handleRefresh} variant="outline" className="flex items-center space-x-2" disabled={refreshing}>
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    <span>Actualiser</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              const TrendIcon = getTrendIcon(stat.trend);
              
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg", getStatColor(stat.color))}>
                          <IconComponent className={cn("h-5 w-5", getIconColor(stat.color))} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrendIcon className={cn(
                          "h-4 w-4",
                          stat.trend === "up" ? "text-green-600" : 
                          stat.trend === "down" ? "text-red-600" : "text-gray-600"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          stat.trend === "up" ? "text-green-600" : 
                          stat.trend === "down" ? "text-red-600" : "text-gray-600"
                        )}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    {stat.description && (
                      <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Charges Chart - placed first after stats */}
          <Card>
            <CardHeader>
              <CardTitle>Charges mensuelles des interventions (MAD)</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyCharges.length > 0 ? (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyCharges} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tickMargin={8} />
                      <YAxis tickMargin={8} tickFormatter={(v) => `MAD ${Number(v).toLocaleString("fr-MA")}`} />
                      <Tooltip formatter={(value: any) => [`MAD ${Number(value).toLocaleString("fr-MA")}`, "Charges"]} />
                      <Legend />
                      <Area type="monotone" dataKey="amount" name="Charges (MAD)" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorCharges)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucune donnée de charges disponible.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activités récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                          <div className={cn(
                            "p-2 rounded-full",
                            activity.status === "warning" ? "bg-yellow-100" :
                            activity.status === "success" ? "bg-green-100" : "bg-blue-100"
                          )}>
                            <ActivityIcon className={cn(
                              "h-4 w-4",
                              activity.status === "warning" ? "text-yellow-600" :
                              activity.status === "success" ? "text-green-600" : "text-blue-600"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Tâches en attente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority === "high" ? "Urgent" : 
                             task.priority === "medium" ? "Moyen" : "Bas"}
                          </Badge>
                          <span className="text-xs text-gray-500">{task.dueDate}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune tâche en attente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Real-time Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Interventions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Interventions récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.pendingInterventions > 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800">
                          {dashboardStats.pendingInterventions} intervention(s) en cours
                        </span>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                          En cours
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          Toutes les interventions sont terminées
                        </span>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          À jour
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {dashboardStats.completedInterventions > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                          {dashboardStats.completedInterventions} intervention(s) terminée(s)
                        </span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          Terminé
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Infrastructure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Map className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Domaines</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {dashboardStats.totalDomains}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Serres</span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {dashboardStats.totalSerres}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Techniciens</span>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                      {dashboardStats.totalTechnicians}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleAddTechnician}>
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Ajouter technicien</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleCreateIntervention}>
                  <Wrench className="h-6 w-6" />
                  <span className="text-sm">Créer intervention</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleMapConfig}>
                  <Map className="h-6 w-6" />
                  <span className="text-sm">Configuration carte</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleGenerateReport}>
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Générer rapport</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
