import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Droplets, 
  Cloud, 
  Sun, 
  AlertTriangle, 
  Video, 
  TrendingUp,
  MapPin,
  Clock,
  FileText,
  Wrench,
  BarChart3
} from "lucide-react";

import { serreService } from "../services/serreService";
import { AlertService } from "@/services/alertService";
import { useNavigate } from "react-router-dom";

interface SerreStatus {
  id: string;
  nom: string;
  temperature: number;
  humidity: number;
  co2: number;
  light: number;
  totalAlertes: number;
  lastSurveillance: string;
  status: "normal" | "caution" | "alert";
  domaine: string;
}

export default function Accueil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serres, setSerres] = useState<SerreStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSerres: 0,
    totalAlertes: 0,
    serresEnAlerte: 0,
    serresNormales: 0,
    totalInterventions: 0,
    totalReports: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch serres assigned to the current user
      const serresData = await serreService.getSerresByCurrentUser();
      
      // Mock data for demonstration - in real app, this would come from sensors
      const mockSerres: SerreStatus[] = serresData.map((serre, index) => {
        const statuses: ("normal" | "caution" | "alert")[] = ["normal", "caution", "alert"];
        const status = statuses[index % 3];
        
        return {
          id: serre.id?.toString() || `serre-${index}`,
          nom: serre.nom || `Serre ${index + 1}`,
          temperature: 22 + Math.floor(Math.random() * 8),
          humidity: 65 + Math.floor(Math.random() * 20),
          co2: 380 + Math.floor(Math.random() * 50),
          light: 700 + Math.floor(Math.random() * 300),
          totalAlertes: status === "alert" ? 5 : status === "caution" ? 2 : 0,
          lastSurveillance: "il y a 1 heure",
          status,
          domaine: serre.domaine_nom || "Domaine Ait Melloul"
        };
      });

      setSerres(mockSerres);
      
      // Calculate stats
      const totalAlertes = mockSerres.reduce((sum, serre) => sum + serre.totalAlertes, 0);
      const serresEnAlerte = mockSerres.filter(s => s.status === "alert").length;
      const serresNormales = mockSerres.filter(s => s.status === "normal").length;
      
      setStats({
        totalSerres: mockSerres.length,
        totalAlertes,
        serresEnAlerte,
        serresNormales,
        totalInterventions: Math.floor(Math.random() * 15) + 5, // Mock data
        totalReports: Math.floor(Math.random() * 8) + 2 // Mock data
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-500";
      case "caution": return "bg-yellow-500";
      case "alert": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "normal": return "border-l-green-500";
      case "caution": return "border-l-yellow-500";
      case "alert": return "border-l-red-500";
      default: return "border-l-gray-500";
    }
  };

  const getButtonVariant = (status: string) => {
    switch (status) {
      case "alert": return "destructive";
      default: return "default";
    }
  };

  const handleNavigateToMap = () => {
    navigate("/technicien-sup/map");
  };

  const handleNavigateToAlerts = () => {
    navigate("/technicien-sup/alerts");
  };

  const handleNavigateToInterventions = () => {
    navigate("/technicien-sup/interventions");
  };

  const handleNavigateToReports = () => {
    navigate("/technicien-sup/reports");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span>Navigation:</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={handleNavigateToMap}
                >
                  Carte
                </Button>
                <span>→</span>
                <span className="text-gray-900 font-medium">Accueil</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
              <p className="text-lg text-gray-600 mt-2">Vue d'ensemble de vos activités</p>
            </div>
            <Button 
              onClick={fetchDashboardData}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Serres</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalSerres}</p>
                  <p className="text-xs text-blue-600">Gérées activement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-700">Total Alertes</p>
                  <p className="text-3xl font-bold text-red-900">{stats.totalAlertes}</p>
                  <p className="text-xs text-red-600">Nécessitent attention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Interventions</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalInterventions}</p>
                  <p className="text-xs text-green-600">Planifiées/En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-700">Rapports</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalReports}</p>
                  <p className="text-xs text-purple-600">Générés ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-700">Performance</p>
                  <p className="text-3xl font-bold text-orange-900">87%</p>
                  <p className="text-xs text-orange-600">Efficacité globale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleNavigateToMap}
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <MapPin className="h-6 w-6" />
              <span>Voir la Carte</span>
            </Button>
            
            <Button 
              onClick={handleNavigateToAlerts}
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>Gérer Alertes</span>
            </Button>
            
            <Button 
              onClick={handleNavigateToInterventions}
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Wrench className="h-6 w-6" />
              <span>Interventions</span>
            </Button>
            
            <Button 
              onClick={handleNavigateToReports}
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span>Rapports</span>
            </Button>
          </div>
        </div>

        {/* Serres Assignées - Display of Assigned Serres */}
        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serres.map((serre, index) => (
              <Card key={`detailed-${serre.id}`} className={`border-2 ${getStatusBorderColor(serre.status)}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{serre.nom}</CardTitle>
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(serre.status)}`}></div>
                  </div>
                  <p className="text-sm text-gray-500">{serre.domaine}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Environmental Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Température</span>
                      <span className="text-sm font-medium">{serre.temperature}°C</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Humidité</span>
                      <span className="text-sm font-medium">{serre.humidity}%</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">CO2</span>
                      <span className="text-sm font-medium">{serre.co2} ppm</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Lumière</span>
                      <span className="text-sm font-medium">{serre.light} lux</span>
                    </div>
                  </div>

                  {/* Status and Alerts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Total Alertes</span>
                      </div>
                      <Badge variant={serre.totalAlertes > 0 ? "destructive" : "secondary"}>
                        {serre.totalAlertes}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {serre.status === "alert" ? "Dernière vérification" : "Dernière Surveillance"}
                      </span>
                      <span className="text-sm text-gray-500">{serre.lastSurveillance}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant={serre.status === "alert" ? "destructive" : "default"}
                    className="w-full mt-4"
                    onClick={handleNavigateToMap}
                  >
                    Voir les détails →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
