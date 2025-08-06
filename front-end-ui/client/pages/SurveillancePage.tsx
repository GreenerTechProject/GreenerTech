import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TechnicianSidebar from "../components/TechnicianSidebar";
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Activity,
  LogOut,
} from "lucide-react";

interface CameraFeed {
  id: string;
  name: string;
  serreId: string;
  serreName: string;
  status: "online" | "offline" | "maintenance";
  lastUpdate: Date;
  resolution: string;
}

const mockCameraFeeds: CameraFeed[] = [
  {
    id: "cam1",
    name: "Caméra Nord-Est",
    serreId: "1",
    serreName: "Serre Nord A",
    status: "online",
    lastUpdate: new Date(),
    resolution: "1080p",
  },
  {
    id: "cam2",
    name: "Caméra Centre",
    serreId: "1",
    serreName: "Serre Nord A",
    status: "online",
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    resolution: "720p",
  },
  {
    id: "cam3",
    name: "Caméra Sud-Ouest",
    serreId: "2",
    serreName: "Serre Sud B",
    status: "offline",
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
    resolution: "1080p",
  },
  {
    id: "cam4",
    name: "Caméra Entrée",
    serreId: "3",
    serreName: "Serre Est C",
    status: "maintenance",
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolution: "720p",
  },
];

export default function SurveillancePage() {
  const { user, logout } = useAuth();
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(mockCameraFeeds[0]);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "En ligne";
      case "offline":
        return "Hors ligne";
      case "maintenance":
        return "Maintenance";
      default:
        return status;
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
                <Camera className="h-6 w-6 text-blue-500" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Surveillance Vidéo
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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Camera List */}
        <div className="w-full lg:w-80 bg-white shadow-lg max-h-[40vh] lg:max-h-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Caméras disponibles
            </h2>
            <div className="space-y-3">
              {mockCameraFeeds.map((camera) => (
                <Card
                  key={camera.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                    selectedCamera?.id === camera.id
                      ? "ring-2 ring-blue-500 border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-blue-500/50"
                  }`}
                  onClick={() => setSelectedCamera(camera)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {camera.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {camera.serreName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(camera.status)}`}
                      >
                        {getStatusLabel(camera.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{camera.resolution}</span>
                      <span>
                        {camera.status === "online"
                          ? "En direct"
                          : `${Math.floor((Date.now() - camera.lastUpdate.getTime()) / (1000 * 60))}min`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Video Feed */}
        <div className="flex-1 relative">
          {selectedCamera ? (
            <>
              {/* Video Container */}
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                {selectedCamera.status === "online" ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        Flux vidéo en direct
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        {selectedCamera.name} - {selectedCamera.serreName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                      Caméra {getStatusLabel(selectedCamera.status).toLowerCase()}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {selectedCamera.name} - {selectedCamera.serreName}
                    </p>
                  </div>
                )}
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedCamera.status === "online" ? "bg-green-400" : "bg-red-400"
                      }`} />
                      <span className="text-white font-medium">
                        {selectedCamera.name}
                      </span>
                      <Badge variant="outline" className="text-white border-white/30">
                        {selectedCamera.resolution}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        disabled={selectedCamera.status !== "online"}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        disabled={selectedCamera.status !== "online"}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Overlay */}
              <div className="absolute top-4 right-4">
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">
                        Statut système
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Caméras actives:</span>
                        <span className="font-medium">
                          {mockCameraFeeds.filter(c => c.status === "online").length}/
                          {mockCameraFeeds.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière mise à jour:</span>
                        <span className="font-medium">
                          {selectedCamera.lastUpdate.toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Sélectionnez une caméra
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
