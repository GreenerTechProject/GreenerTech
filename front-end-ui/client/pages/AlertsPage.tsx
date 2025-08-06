import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TechnicianSidebar from "../components/TechnicianSidebar";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Thermometer,
  Droplets,
  LogOut,
} from "lucide-react";

interface Alert {
  id: string;
  type: "temperature" | "irrigation" | "maintenance" | "security";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  status: "active" | "acknowledged" | "resolved";
  serreId: string;
  serreName: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "temperature",
    title: "Température élevée détectée",
    description: "La température de la Serre Nord A a atteint 32°C",
    severity: "high",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: "active",
    serreId: "1",
    serreName: "Serre Nord A",
  },
  {
    id: "2",
    type: "irrigation",
    title: "Système d'irrigation défaillant",
    description: "Le système d'irrigation de la Serre Sud B ne répond plus",
    severity: "critical",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "acknowledged",
    serreId: "2",
    serreName: "Serre Sud B",
  },
  {
    id: "3",
    type: "maintenance",
    title: "Maintenance préventive requise",
    description: "La maintenance programmée de la Serre Est C est due",
    severity: "medium",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: "active",
    serreId: "3",
    serreName: "Serre Est C",
  },
];

export default function AlertsPage() {
  const { user, logout } = useAuth();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-5 w-5" />;
      case "irrigation":
        return <Droplets className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar userRole="technicien" />
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Alertes et Notifications
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actives</p>
                  <p className="text-2xl font-bold text-red-600">
                    {mockAlerts.filter((a) => a.status === "active").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {mockAlerts.filter((a) => a.status === "acknowledged").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Résolues</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockAlerts.filter((a) => a.status === "resolved").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockAlerts.length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.serreName} • {alert.timestamp.toLocaleString("fr-FR")}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant="outline"
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity === "critical" && "Critique"}
                          {alert.severity === "high" && "Élevée"}
                          {alert.severity === "medium" && "Moyenne"}
                          {alert.severity === "low" && "Faible"}
                        </Badge>
                        
                        <Badge
                          variant="outline"
                          className={getStatusColor(alert.status)}
                        >
                          {alert.status === "active" && "Active"}
                          {alert.status === "acknowledged" && "Prise en compte"}
                          {alert.status === "resolved" && "Résolue"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
