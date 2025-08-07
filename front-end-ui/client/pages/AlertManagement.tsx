import React, { useState, useEffect } from "react";
import DirectorSidebar from "../components/DirectorSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Bug,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MapPin,
  Calendar,
  Eye,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  title: string;
  description: string;
  type: "temperature" | "humidity" | "ventilation" | "electrical" | "pest" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved";
  location: {
    zone: string;
    greenhouse: string;
    coordinates: { x: number; y: number };
  };
  timestamp: string;
  value?: number;
  threshold?: number;
  unit?: string;
  assignedTechnician?: string;
}

interface HeatMapCell {
  x: number;
  y: number;
  zone: string;
  greenhouse: string;
  alertCount: number;
  severity: "low" | "medium" | "high" | "critical" | "none";
}

export default function AlertManagement() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>([]);
  const [activeTab, setActiveTab] = useState("heatmap");

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: "1",
        title: "Température critique - Serre A12",
        description: "La température a dépassé le seuil critique de 35°C",
        type: "temperature",
        severity: "critical",
        status: "active",
        location: {
          zone: "Zone Nord",
          greenhouse: "Serre A12",
          coordinates: { x: 2, y: 1 }
        },
        timestamp: "2024-01-24T14:30:00Z",
        value: 38.5,
        threshold: 35,
        unit: "°C"
      },
      {
        id: "2",
        title: "Humidité basse - Serre B08",
        description: "Niveau d'humidité en dessous du minimum requis",
        type: "humidity",
        severity: "high",
        status: "acknowledged",
        location: {
          zone: "Zone Est",
          greenhouse: "Serre B08",
          coordinates: { x: 4, y: 2 }
        },
        timestamp: "2024-01-24T13:15:00Z",
        value: 35,
        threshold: 45,
        unit: "%",
        assignedTechnician: "Marie Dubois"
      },
      {
        id: "3",
        title: "Ventilation défaillante - Serre C15",
        description: "Système de ventilation ne répond pas",
        type: "ventilation",
        severity: "high",
        status: "active",
        location: {
          zone: "Zone Ouest",
          greenhouse: "Serre C15",
          coordinates: { x: 1, y: 3 }
        },
        timestamp: "2024-01-24T12:45:00Z"
      },
      {
        id: "4",
        title: "Coupure électrique - Serre D03",
        description: "Alimentation électrique interrompue",
        type: "electrical",
        severity: "critical",
        status: "active",
        location: {
          zone: "Zone Sud",
          greenhouse: "Serre D03",
          coordinates: { x: 3, y: 4 }
        },
        timestamp: "2024-01-24T11:20:00Z"
      },
      {
        id: "5",
        title: "Détection parasites - Serre A05",
        description: "Présence de pucerons détectée",
        type: "pest",
        severity: "medium",
        status: "resolved",
        location: {
          zone: "Zone Nord",
          greenhouse: "Serre A05",
          coordinates: { x: 1, y: 1 }
        },
        timestamp: "2024-01-23T16:30:00Z",
        assignedTechnician: "Jean Martin"
      },
      {
        id: "6",
        title: "Température élevée - Serre B12",
        description: "Température proche du seuil d'alerte",
        type: "temperature",
        severity: "medium",
        status: "active",
        location: {
          zone: "Zone Est",
          greenhouse: "Serre B12",
          coordinates: { x: 5, y: 2 }
        },
        timestamp: "2024-01-24T10:15:00Z",
        value: 32,
        threshold: 35,
        unit: "°C"
      }
    ];

    setAlerts(mockAlerts);

    // Generate heatmap data
    const heatMap: HeatMapCell[] = [];
    const zones = ["Zone Nord", "Zone Est", "Zone Ouest", "Zone Sud"];
    
    for (let x = 1; x <= 6; x++) {
      for (let y = 1; y <= 5; y++) {
        const alertsInCell = mockAlerts.filter(
          alert => alert.location.coordinates.x === x && alert.location.coordinates.y === y && alert.status === "active"
        );
        
        const severity = alertsInCell.length > 0 
          ? alertsInCell.reduce((max, alert) => {
              const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
              return severityOrder[alert.severity] > severityOrder[max] ? alert.severity : max;
            }, "low" as any)
          : "none";

        heatMap.push({
          x,
          y,
          zone: zones[Math.floor((y - 1) / 2)] || "Zone Nord",
          greenhouse: `Serre ${String.fromCharCode(65 + Math.floor((x - 1) / 2))}${String(x).padStart(2, '0')}`,
          alertCount: alertsInCell.length,
          severity
        });
      }
    }
    
    setHeatMapData(heatMap);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.greenhouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || alert.type === selectedType;
    const matchesSeverity = selectedSeverity === "all" || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "all" || alert.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const getTabAlerts = (tab: string) => {
    switch (tab) {
      case "active":
        return alerts.filter(a => a.status === "active");
      case "acknowledged":
        return alerts.filter(a => a.status === "acknowledged");
      case "resolved":
        return alerts.filter(a => a.status === "resolved");
      default:
        return filteredAlerts;
    }
  };

  const handleStatusChange = (alertId: string, newStatus: "acknowledged" | "resolved") => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    );
    setAlerts(updatedAlerts);
    
    toast({
      title: "Statut mis à jour",
      description: `L'alerte a été marquée comme ${newStatus === "acknowledged" ? "reconnue" : "résolue"}.`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-700 border-red-200";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return Thermometer;
      case "humidity":
        return Droplets;
      case "ventilation":
        return Wind;
      case "electrical":
        return Zap;
      case "pest":
        return Bug;
      default:
        return AlertTriangle;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "temperature":
        return "Température";
      case "humidity":
        return "Humidité";
      case "ventilation":
        return "Ventilation";
      case "electrical":
        return "Électrique";
      case "pest":
        return "Parasites";
      default:
        return "Autre";
    }
  };

  const getSeverityDisplayName = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Critique";
      case "high":
        return "Élevée";
      case "medium":
        return "Moyenne";
      case "low":
        return "Basse";
      default:
        return severity;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "acknowledged":
        return "Reconnue";
      case "resolved":
        return "Résolue";
      default:
        return status;
    }
  };

  const getHeatMapCellColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-400";
      case "medium":
        return "bg-yellow-400";
      case "low":
        return "bg-blue-400";
      default:
        return "bg-gray-200";
    }
  };

  const activeCount = alerts.filter(a => a.status === "active").length;
  const acknowledgedCount = alerts.filter(a => a.status === "acknowledged").length;
  const resolvedCount = alerts.filter(a => a.status === "resolved").length;
  const criticalCount = alerts.filter(a => a.severity === "critical" && a.status === "active").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gestion des alertes
              </h1>
              <p className="text-gray-600 mt-1">
                Surveillez et gérez les alertes avec vue HeatMap
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalCount} critiques
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                <Activity className="h-3 w-3 mr-1" />
                {activeCount} actives
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alertes actives</p>
                    <p className="text-3xl font-bold text-red-600">{activeCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reconnues</p>
                    <p className="text-3xl font-bold text-yellow-600">{acknowledgedCount}</p>
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
                    <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critiques</p>
                    <p className="text-3xl font-bold text-red-700">{criticalCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="heatmap">HeatMap</TabsTrigger>
              <TabsTrigger value="all">Toutes ({alerts.length})</TabsTrigger>
              <TabsTrigger value="active">Actives ({activeCount})</TabsTrigger>
              <TabsTrigger value="acknowledged">Reconnues ({acknowledgedCount})</TabsTrigger>
              <TabsTrigger value="resolved">Résolues ({resolvedCount})</TabsTrigger>
            </TabsList>

            {/* HeatMap Tab */}
            <TabsContent value="heatmap" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>HeatMap des alertes par zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <span className="text-sm">Aucune alerte</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-400 rounded"></div>
                        <span className="text-sm">Basse</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                        <span className="text-sm">Moyenne</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-400 rounded"></div>
                        <span className="text-sm">Élevée</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">Critique</span>
                      </div>
                    </div>

                    {/* HeatMap Grid */}
                    <div className="flex justify-center">
                      <div className="grid grid-cols-6 gap-2 p-6 bg-white border rounded-lg">
                        {heatMapData.map((cell) => (
                          <div
                            key={`${cell.x}-${cell.y}`}
                            className={`
                              w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer
                              transition-all duration-200 hover:scale-105 hover:border-gray-500
                              flex flex-col items-center justify-center text-xs font-medium
                              ${getHeatMapCellColor(cell.severity)}
                              ${cell.severity === "none" ? "text-gray-600" : "text-white"}
                            `}
                            title={`${cell.greenhouse} - ${cell.zone}\n${cell.alertCount} alerte(s)`}
                          >
                            <div className="truncate w-full text-center px-1">
                              {cell.greenhouse.split(' ')[1]}
                            </div>
                            {cell.alertCount > 0 && (
                              <div className="text-xs font-bold">
                                {cell.alertCount}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Zone Labels */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Zone Nord</h4>
                        <p className="text-sm text-blue-700">Serres A01-A15</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">Zone Est</h4>
                        <p className="text-sm text-green-700">Serres B01-B20</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">Zone Ouest</h4>
                        <p className="text-sm text-purple-700">Serres C01-C18</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-900">Zone Sud</h4>
                        <p className="text-sm text-orange-700">Serres D01-D25</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alert Lists Tabs */}
            {["all", "active", "acknowledged", "resolved"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Rechercher alertes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          <SelectItem value="temperature">Température</SelectItem>
                          <SelectItem value="humidity">Humidité</SelectItem>
                          <SelectItem value="ventilation">Ventilation</SelectItem>
                          <SelectItem value="electrical">Électrique</SelectItem>
                          <SelectItem value="pest">Parasites</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Sévérité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes sévérités</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Basse</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous statuts</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="acknowledged">Reconnue</SelectItem>
                          <SelectItem value="resolved">Résolue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Alert Cards */}
                <div className="space-y-4">
                  {getTabAlerts(tab).map((alert) => {
                    const TypeIcon = getTypeIcon(alert.type);
                    
                    return (
                      <Card key={alert.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="p-3 bg-gray-100 rounded-lg">
                                <TypeIcon className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {alert.title}
                                  </h3>
                                  <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                    {getSeverityDisplayName(alert.severity)}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(alert.status)}>
                                    {getStatusDisplayName(alert.status)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {getTypeDisplayName(alert.type)}
                                  </Badge>
                                </div>
                                
                                <p className="text-gray-600 mb-3">{alert.description}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {alert.location.greenhouse}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(alert.timestamp).toLocaleString('fr-FR')}
                                  </div>
                                  {alert.value && alert.unit && (
                                    <div className="flex items-center">
                                      <TrendingUp className="h-4 w-4 mr-1" />
                                      {alert.value}{alert.unit}
                                      {alert.threshold && ` (seuil: ${alert.threshold}${alert.unit})`}
                                    </div>
                                  )}
                                  {alert.assignedTechnician && (
                                    <div className="flex items-center">
                                      <Eye className="h-4 w-4 mr-1" />
                                      {alert.assignedTechnician}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Détails
                              </Button>

                              {alert.status === "active" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(alert.id, "acknowledged")}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Reconnaître
                                </Button>
                              )}

                              {(alert.status === "active" || alert.status === "acknowledged") && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(alert.id, "resolved")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Résoudre
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {getTabAlerts(tab).length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucune alerte trouvée
                        </h3>
                        <p className="text-gray-600">
                          Aucune alerte ne correspond à vos critères.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Alert Details Modal */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'alerte</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'alerte
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  {React.createElement(getTypeIcon(selectedAlert.type), { 
                    className: "h-8 w-8 text-gray-600" 
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedAlert.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={getSeverityColor(selectedAlert.severity)}>
                      {getSeverityDisplayName(selectedAlert.severity)}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(selectedAlert.status)}>
                      {getStatusDisplayName(selectedAlert.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type d'alerte</label>
                  <p className="mt-1">{getTypeDisplayName(selectedAlert.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Horodatage</label>
                  <p className="mt-1">{new Date(selectedAlert.timestamp).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Localisation</label>
                  <p className="mt-1">{selectedAlert.location.greenhouse} - {selectedAlert.location.zone}</p>
                </div>
                {selectedAlert.assignedTechnician && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Technicien assigné</label>
                    <p className="mt-1">{selectedAlert.assignedTechnician}</p>
                  </div>
                )}
                {selectedAlert.value && selectedAlert.unit && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Valeur mesurée</label>
                    <p className="mt-1">{selectedAlert.value}{selectedAlert.unit}</p>
                  </div>
                )}
                {selectedAlert.threshold && selectedAlert.unit && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Seuil d'alerte</label>
                    <p className="mt-1">{selectedAlert.threshold}{selectedAlert.unit}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{selectedAlert.description}</p>
              </div>

              {(selectedAlert.status === "active" || selectedAlert.status === "acknowledged") && (
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedAlert.status === "active" && (
                    <Button
                      onClick={() => {
                        handleStatusChange(selectedAlert.id, "acknowledged");
                        setSelectedAlert(null);
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Reconnaître
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedAlert.id, "resolved");
                      setSelectedAlert(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Résoudre
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
