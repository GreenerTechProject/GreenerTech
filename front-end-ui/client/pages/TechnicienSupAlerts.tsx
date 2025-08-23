import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, CheckCircle, Clock, Search, Image, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import TechHeader from "@/components/TechHeader";
import { AlertService } from "@/services/alertService";
import { Alert } from "@/types/alert";
import { serreService } from "../services/serreService";

interface Serre {
  id: string;
  nom: string;
  domaine?: {
    nom: string;
  };
}

export default function TechnicienSupAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [alertsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    resolvedAlerts: 0,
    unresolvedAlerts: 0,
    averageResolutionTime: 0,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [assignedSerres, setAssignedSerres] = useState<Serre[]>([]);

  useEffect(() => {
    loadAssignedSerres();
  }, []);

  useEffect(() => {
    if (assignedSerres.length > 0) {
      loadAlerts();
      loadStats();
    }
  }, [assignedSerres]);

  useEffect(() => {
    if (assignedSerres.length > 0) {
      loadAlerts();
    }
  }, [searchTerm, levelFilter, statusFilter, currentPage, assignedSerres]);

  const loadAssignedSerres = async () => {
    try {
      const response = await serreService.getSerresByUser();
      setAssignedSerres(response);
    } catch (error) {
      setAssignedSerres([]);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const allAlerts = await AlertService.getAllAlerts(1, 1000);
      
      let filteredAlerts = allAlerts.alerts.filter(alert => {
        return assignedSerres.some(serre => 
          Number(serre.id) === alert.id_serre || 
          serre.nom === alert.serre_nom
        );
      });

      if (searchTerm) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.maladie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.id_bilan?.toString().includes(searchTerm) ||
          alert.bilan_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.serre_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.domaine_nom?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (levelFilter !== "all") {
        filteredAlerts = filteredAlerts.filter(alert => {
          const level = getAlertLevel(alert.status_alert);
          return level === levelFilter;
        });
      }
      
      if (statusFilter !== "all") {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === statusFilter);
      }
      
      const startIndex = (currentPage - 1) * alertsPerPage;
      const endIndex = startIndex + alertsPerPage;
      const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
      
      setAlerts(paginatedAlerts);
      setTotalAlerts(filteredAlerts.length);
    } catch (error) {
      setAlerts([]);
      setTotalAlerts(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AlertService.getAlertStats();
      setStats(statsData);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleUpdateAlert = async (alertId: number, status: "résolue" | "non résolue") => {
    try {
      await AlertService.updateAlert(alertId, { status });
      loadAlerts();
      loadStats();
    } catch (error) {
      // Handle error silently
    }
  };

  const getAlertLevel = (statusAlert: number): "Low" | "Medium" | "High" => {
    if (statusAlert === 2) return "High";
    if (statusAlert === 1) return "Medium";
    return "Low";
  };

  const getAlertLevelBadge = (statusAlert: number) => {
    const level = getAlertLevel(statusAlert);
    const colors = {
      Low: "bg-green-100 text-green-800 border-green-300",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      High: "bg-red-100 text-red-800 border-red-300"
    };
    
    return (
      <Badge className={colors[level]}>
        {level === "Low" ? "Faible" : level === "Medium" ? "Moyen" : "Élevé"}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === "résolue") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = (status: string) => {
    return status === "résolue" ? "Résolu" : "Non Résolu";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalAlerts / alertsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role="technicien_sup" />
      
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Alertes
          </h1>
          <p className="text-gray-600 text-lg">
            Sur vos serres supervisées ({assignedSerres.length})
          </p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une alerte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B4CC5F]"
            >
              <option value="all">Tous les niveaux</option>
              <option value="Low">Faible</option>
              <option value="Medium">Moyen</option>
              <option value="High">Élevé</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B4CC5F]"
            >
              <option value="all">Tous les statuts</option>
              <option value="résolue">Résolu</option>
              <option value="non résolue">Non Résolu</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertes Non Résolues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.unresolvedAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertes Résolues</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.resolvedAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps Moyen de Résolution</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.averageResolutionTime}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alertes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Alertes ({totalAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nom d'anomalie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Niveau</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Localisation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Horodatage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{alert.maladie}</div>
                      </td>
                      <td className="py-3 px-4">
                        {getAlertLevelBadge(alert.status_alert)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alert.status)}
                          <span className={cn(
                            "text-sm",
                            alert.status === "résolue" ? "text-green-600" : "text-red-600"
                          )}>
                            {getStatusText(alert.status)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {alert.serre_nom} - {alert.domaine_nom}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(alert.date)}
                      </td>
                      <td className="py-3 px-4">
                        {alert.status !== "résolue" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateAlert(alert.id, "résolue")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Marquer comme résolu
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Affichage de {(currentPage - 1) * alertsPerPage + 1} à {Math.min(currentPage * alertsPerPage, totalAlerts)} sur {totalAlerts} alerte{totalAlerts !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Alert"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white text-gray-900 hover:bg-gray-100"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
