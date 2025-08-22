import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, CheckCircle, Clock, Search, Image, ZoomIn, ChevronLeft, ChevronRight, Trash2, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import TechHeader from "@/components/TechHeader";
import { AlertService } from "@/services/alertService";
import { Alert } from "@/types/alert";
import { serreService } from "../services/serreService";
import { useToast } from "@/hooks/use-toast";

interface Serre {
  id: string;
  nom: string;
  domaine?: {
    nom: string;
  };
}

export default function TechnicienSupAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serreFilter, setSerreFilter] = useState("all");
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const { toast } = useToast();

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
    if (allAlerts.length > 0) {
      applyFilters();
    }
  }, [searchTerm, levelFilter, statusFilter, serreFilter, allAlerts]);

  useEffect(() => {
    if (allAlerts.length > 0) {
      applyFilters();
    }
  }, [currentPage]);

  const loadAssignedSerres = async () => {
    try {
      const response = await serreService.getSerresByUser();
      setAssignedSerres(response);
    } catch (error) {
      console.error("Error loading assigned serres:", error);
      setAssignedSerres([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les serres assignées",
        variant: "destructive",
      });
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // Get all alerts for assigned serres from the backend
      const alertsData = await AlertService.getAlertsByAssignedSerresForTechSup();
      setAllAlerts(alertsData);
      setTotalAlerts(alertsData.length);
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAllAlerts([]);
      setTotalAlerts(0);
      toast({
        title: "Erreur",
        description: "Impossible de charger les alertes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredAlerts = [...allAlerts];

    // Apply serre filter
    if (serreFilter !== "all") {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.id_serre?.toString() === serreFilter || 
        alert.serre_nom === assignedSerres.find(s => s.id === serreFilter)?.nom
      );
    }

    // Apply search filter
    if (searchTerm) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.maladie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.id_bilan?.toString().includes(searchTerm) ||
        alert.bilan_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.serre_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.domaine_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply level filter
    if (levelFilter !== "all") {
      filteredAlerts = filteredAlerts.filter(alert => {
        const level = getAlertLevel(alert.status_alert);
        return level === levelFilter;
      });
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === statusFilter);
    }
    
    // Update total count
    setTotalAlerts(filteredAlerts.length);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * alertsPerPage;
    const endIndex = startIndex + alertsPerPage;
    const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
    
    setAlerts(paginatedAlerts);
    
    // Reset to first page if current page is out of bounds
    if (currentPage > Math.ceil(filteredAlerts.length / alertsPerPage) && filteredAlerts.length > 0) {
      setCurrentPage(1);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AlertService.getAlertStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleRefresh = () => {
    loadAlerts();
    loadStats();
    setCurrentPage(1);
    setSearchTerm("");
    setLevelFilter("all");
    setStatusFilter("all");
    setSerreFilter("all");
  };

  const handleUpdateAlert = async (alertId: number, status: "résolue" | "non résolue") => {
    try {
      await AlertService.updateAlert(alertId, { status });
      toast({
        title: "Succès",
        description: "Statut de l'alerte mis à jour avec succès",
      });
      loadAlerts();
      loadStats();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    try {
      await AlertService.deleteAlert(alertId);
      toast({
        title: "Succès",
        description: "Alerte supprimée avec succès",
      });
      setShowDeleteConfirm(null);
      loadAlerts();
      loadStats();
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'alerte",
        variant: "destructive",
      });
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
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Alertes
            </h1>
            <p className="text-gray-600 text-lg">
              Sur vos serres supervisées ({assignedSerres.length})
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
          
          {/* Search and Filters */}
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
              value={serreFilter}
              onChange={(e) => setSerreFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B4CC5F]"
            >
              <option value="all">Toutes les serres</option>
              {assignedSerres.map((serre) => (
                <option key={serre.id} value={serre.id}>
                  {serre.nom} {serre.domaine ? `- ${serre.domaine.nom}` : ''}
                </option>
              ))}
            </select>
            
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

        {/* Stats Cards */}
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

      {/* Alerts Table */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Alertes ({totalAlerts})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune alerte trouvée</p>
              <p className="text-gray-400">Essayez de modifier vos filtres ou actualisez la page</p>
            </div>
          ) : (
            <>
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
                            <div className="flex items-center gap-2">
                              {alert.status !== "résolue" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateAlert(alert.id, "résolue")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Marquer comme résolu
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(alert.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
            </>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette alerte ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteAlert(showDeleteConfirm)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
