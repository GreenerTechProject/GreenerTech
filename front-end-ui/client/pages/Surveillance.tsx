import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Settings,
  Download,
  Calendar,
  Filter,
  Bot,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import WebRTCViewer from "../components/WebRTCViewer";
import { cn } from "@/lib/utils";

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  isRecording: boolean;
  lastActivity: Date;
  streamUrl?: string;
}

interface Alert {
  id: string;
  cameraId: string;
  type: "motion" | "anomaly" | "intrusion" | "equipment";
  message: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  acknowledged: boolean;
}

const mockCameras: CameraFeed[] = [
  {
    id: "cam1",
    name: "Serre Nord A - Entrée",
    location: "Serre Nord A",
    status: "online",
    isRecording: true,
    lastActivity: new Date(),
    streamUrl: "/api/camera/stream/cam1"
  },
  {
    id: "cam2", 
    name: "Serre Nord A - Zone Culture",
    location: "Serre Nord A",
    status: "online",
    isRecording: true,
    lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: "cam3",
    name: "Serre Sud B - Système Irrigation",
    location: "Serre Sud B", 
    status: "offline",
    isRecording: false,
    lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: "cam4",
    name: "Extérieur - Périmètre Ouest",
    location: "Périmètre Extérieur",
    status: "maintenance",
    isRecording: false,
    lastActivity: new Date(Date.now() - 7200000), // 2 hours ago
  }
];

const mockAlerts: Alert[] = [
  {
    id: "alert1",
    cameraId: "cam2",
    type: "anomaly",
    message: "Mouvement inhabituel détecté dans la zone de culture",
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    severity: "medium",
    acknowledged: false
  },
  {
    id: "alert2", 
    cameraId: "cam3",
    type: "equipment",
    message: "Caméra hors ligne - Vérifier la connexion",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    severity: "high",
    acknowledged: false
  },
  {
    id: "alert3",
    cameraId: "cam1",
    type: "motion",
    message: "Mouvement détecté à l'entrée",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    severity: "low",
    acknowledged: true
  }
];

export default function Surveillance() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<CameraFeed[]>(mockCameras);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(cameras[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [alertFilter, setAlertFilter] = useState<string>("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-300";
      case "offline":
        return "bg-red-100 text-red-800 border-red-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const toggleRecording = (cameraId: string) => {
    setCameras(prev => prev.map(cam => 
      cam.id === cameraId 
        ? { ...cam, isRecording: !cam.isRecording }
        : cam
    ));
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  };

  const filteredCameras = cameras.filter(camera => 
    filterStatus === "all" || camera.status === filterStatus
  );

  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === "all") return true;
    if (alertFilter === "unacknowledged") return !alert.acknowledged;
    return alert.severity === alertFilter;
  });

  const onlineCameras = cameras.filter(cam => cam.status === "online").length;
  const recordingCameras = cameras.filter(cam => cam.isRecording).length;
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <TechnicianSidebar 
                userRole="technicien"
                onInterventionClick={() => {}}
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Surveillance
              </h1>
              <div className="flex space-x-2">
                <Badge
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700"
                >
                  {onlineCameras}/{cameras.length} En ligne
                </Badge>
                <Badge
                  variant="outline" 
                  className="bg-blue-50 border-blue-200 text-blue-700"
                >
                  {recordingCameras} Enregistrement
                </Badge>
                {unacknowledgedAlerts > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 border-red-200 text-red-700"
                  >
                    {unacknowledgedAlerts} Alertes
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Paramètres</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Camera List & Controls */}
        <div className="w-full lg:w-96 bg-white shadow-lg">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Camera Filters */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Cam��ras ({filteredCameras.length})</span>
                </h3>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les caméras</SelectItem>
                    <SelectItem value="online">En ligne</SelectItem>
                    <SelectItem value="offline">Hors ligne</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Camera List */}
              <div className="space-y-3">
                {filteredCameras.map((camera) => (
                  <Card
                    key={camera.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border",
                      selectedCamera?.id === camera.id
                        ? "ring-2 ring-blue-500 border-blue-500 shadow-md"
                        : "border-gray-200 hover:border-blue-300",
                    )}
                    onClick={() => setSelectedCamera(camera)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {camera.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {camera.location}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getStatusColor(camera.status))}
                          >
                            {camera.status === "online" 
                              ? "En ligne" 
                              : camera.status === "offline"
                                ? "Hors ligne"
                                : "Maintenance"
                            }
                          </Badge>
                          {camera.isRecording && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                              <span className="text-xs">REC</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {camera.lastActivity.toLocaleTimeString()}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRecording(camera.id);
                            }}
                            disabled={camera.status !== "online"}
                            className="h-6 w-6 p-0"
                          >
                            {camera.isRecording ? (
                              <Square className="h-3 w-3 text-red-600" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Alerts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Alertes récentes</span>
                  </h3>
                  <Select value={alertFilter} onValueChange={setAlertFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="unacknowledged">Non lues</SelectItem>
                      <SelectItem value="critical">Critiques</SelectItem>
                      <SelectItem value="high">Élevées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredAlerts.slice(0, 5).map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-orange-400">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getSeverityColor(alert.severity))}
                          >
                            {alert.severity === "low" ? "Faible" :
                             alert.severity === "medium" ? "Moyenne" :
                             alert.severity === "high" ? "Élevée" : "Critique"}
                          </Badge>
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{alert.timestamp.toLocaleTimeString()}</span>
                          <span className="capitalize">{alert.type}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Video Feed */}
        <div className="flex-1 bg-black relative">
          {selectedCamera ? (
            <div className="h-full flex flex-col">
              {/* Video Feed Header */}
              <div className="bg-white p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedCamera.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedCamera.location}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={cn(getStatusColor(selectedCamera.status))}
                    >
                      {selectedCamera.status === "online" 
                        ? "En ligne" 
                        : selectedCamera.status === "offline"
                          ? "Hors ligne"
                          : "Maintenance"
                      }
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Display Area */}
              <div className="flex-1 bg-gray-900 flex items-center justify-center">
                {selectedCamera.status === "online" ? (
                  <div className="text-center text-white">
                    <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Flux vidéo en direct</p>
                    <p className="text-sm opacity-75">
                      {selectedCamera.name}
                    </p>
                    {selectedCamera.isRecording && (
                      <div className="flex items-center justify-center space-x-2 mt-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400">ENREGISTREMENT</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Caméra indisponible</p>
                    <p className="text-sm opacity-75">
                      {selectedCamera.status === "offline" 
                        ? "Vérifiez la connexion réseau"
                        : "En cours de maintenance"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="bg-white p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      size="sm"
                      variant={selectedCamera.isRecording ? "destructive" : "default"}
                      onClick={() => toggleRecording(selectedCamera.id)}
                      disabled={selectedCamera.status !== "online"}
                    >
                      {selectedCamera.isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Arrêter
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedCamera.status !== "online"}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Dernière activité: {selectedCamera.lastActivity.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Camera className="h-24 w-24 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Aucune caméra sélectionnée</p>
                <p className="text-sm opacity-75">
                  Sélectionnez une caméra dans la liste pour voir le flux vidéo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
