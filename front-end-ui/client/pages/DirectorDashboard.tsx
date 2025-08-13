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
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
  description?: string;
}

export default function DirectorDashboard() {
  const { user, logout } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Techniciens actifs",
      value: 24,
      change: "+2 ce mois",
      trend: "up",
      icon: Users,
      color: "blue",
      description: "Techniciens et superviseurs"
    },
    {
      title: "Interventions en cours",
      value: 18,
      change: "+5 aujourd'hui",
      trend: "up",
      icon: Wrench,
      color: "green",
      description: "Interventions assignées"
    },
    {
      title: "Alertes actives",
      value: 7,
      change: "-3 depuis hier",
      trend: "down",
      icon: AlertTriangle,
      color: "red",
      description: "Nécessitent attention"
    },
    {
      title: "Rapports générés",
      value: 156,
      change: "+12 cette semaine",
      trend: "up",
      icon: FileText,
      color: "purple",
      description: "Rapports d'intervention"
    }
  ]);

  const recentActivities = [
    {
      id: 1,
      type: "intervention",
      message: "Nouvelle intervention assignée à Marie Dubois",
      time: "Il y a 2 heures",
      status: "info"
    },
    {
      id: 2,
      type: "alert",
      message: "Alerte température critique - Serre B23",
      time: "Il y a 3 heures",
      status: "warning"
    },
    {
      id: 3,
      type: "affiliation",
      message: "Demande d'affiliation approuvée - Jean Martin",
      time: "Il y a 5 heures",
      status: "success"
    },
    {
      id: 4,
      type: "report",
      message: "Rapport d'intervention complété",
      time: "Il y a 1 jour",
      status: "info"
    }
  ];

  const pendingTasks = [
    {
      id: 1,
      title: "Valider 3 demandes d'affiliation",
      priority: "high",
      dueDate: "Aujourd'hui"
    },
    {
      id: 2,
      title: "Réviser les alertes de température",
      priority: "medium",
      dueDate: "Demain"
    },
    {
      id: 3,
      title: "Approuver les rapports hebdomadaires",
      priority: "low",
      dueDate: "Cette semaine"
    }
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
        <DirectorHeader />

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
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
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Ajouter technicien</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <Wrench className="h-6 w-6" />
                  <span className="text-sm">Créer intervention</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleMapConfig}>
                  <Map className="h-6 w-6" />
                  <span className="text-sm">Configuration carte</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
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
