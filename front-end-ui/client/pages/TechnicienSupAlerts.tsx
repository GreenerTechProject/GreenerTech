import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, CheckCircle, Clock, Search, Image, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
      console.log("[DEBUG] Loading alerts for assigned serres...");
      
      // Use the specific endpoint for assigned serres instead of fetching all alerts
      const assignedAlerts = await AlertService.getAlertsByAssignedSerres();
      console.log("[DEBUG] Received alerts from backend:", assignedAlerts);
      
      let filteredAlerts = assignedAlerts;

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
      
      console.log("[DEBUG] Filtered alerts:", filteredAlerts);
      
      const startIndex = (currentPage - 1) * alertsPerPage;
      const endIndex = startIndex + alertsPerPage;
      const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
      
      setAlerts(paginatedAlerts);
      setTotalAlerts(filteredAlerts.length);
      console.log("[DEBUG] Final alerts state:", paginatedAlerts);
      console.log("[DEBUG] Total alerts count:", filteredAlerts.length);
    } catch (error) {
      console.error("Error loading alerts:", error);
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
      <div className="p-3 sm:p-4 md:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 hidden sm:block">
            Gestion des Alertes
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 hidden sm:block">
            Sur vos serres supervisées ({assignedSerres.length})
          </p>
        </div>

        {/* Statistics Cards - Show first on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 order-1 sm:order-none">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Alertes Non Résolues</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {stats.unresolvedAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Alertes Résolues</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {stats.resolvedAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Temps Moyen de Résolution</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {stats.averageResolutionTime}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Alertes</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {stats.totalAlerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filtering - Show second on mobile */}
        <div className="mb-6 order-2 sm:order-none">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une alerte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] text-sm w-full"
              >
                <option value="all">Tous les niveaux</option>
                <option value="Low">Faible</option>
                <option value="Medium">Moyen</option>
                <option value="High">Élevé</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] text-sm w-full"
              >
                <option value="all">Tous les statuts</option>
                <option value="résolue">Résolu</option>
                <option value="non résolue">Non Résolu</option>
              </select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bell className="h-5 w-5 text-red-500" />
              Alertes ({totalAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="overflow-x-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte trouvée</h3>
                  <p className="text-gray-500">
                    {assignedSerres.length === 0 
                      ? "Vous n'avez pas de serres assignées." 
                      : "Aucune alerte n'a été détectée dans vos serres assignées."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Image</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Nom d'anomalie</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Niveau</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Statut</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Localisation</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Horodatage</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((alert) => (
                          <tr key={alert.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {alert.lien_image ? (
                                <div className="relative group">
                                  <img
                                    src={alert.lien_image}
                                    alt={`Alerte ${alert.maladie}`}
                                    className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setSelectedImage(alert.lien_image);
                                      setShowImageModal(true);
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="font-medium text-gray-900 text-xs sm:text-sm">{alert.maladie}</div>
                              {alert.bilan_nom && (
                                <div className="text-xs text-gray-500 mt-1">Bilan: {alert.bilan_nom}</div>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {getAlertLevelBadge(alert.status_alert)}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(alert.status)}
                                <span className={cn(
                                  "text-xs sm:text-sm",
                                  alert.status === "résolue" ? "text-green-600" : "text-red-600"
                                )}>
                                  {getStatusText(alert.status)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="text-xs sm:text-sm">
                                <div className="font-medium text-gray-900">
                                  {alert.serre_nom || "Serre inconnue"}
                                </div>
                                {alert.domaine_nom && (
                                  <div className="text-gray-600">
                                    Domaine: {alert.domaine_nom}
                                  </div>
                                )}
                                {alert.x1 !== undefined && alert.y1 !== undefined && (
                                  <div className="text-gray-500 text-xs mt-1">
                                    Coordonnées: ({alert.x1.toFixed(2)}, {alert.y1.toFixed(2)})
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                              {formatDate(alert.date)}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {alert.status !== "résolue" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateAlert(alert.id, "résolue")}
                                  className="bg-green-600 hover:bg-green-700 text-xs"
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

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {alerts.map((alert) => (
                      <Card key={alert.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Image */}
                            <div className="flex-shrink-0">
                              {alert.lien_image ? (
                                <div className="relative group">
                                  <img
                                    src={alert.lien_image}
                                    alt={`Alerte ${alert.maladie}`}
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setSelectedImage(alert.lien_image);
                                      setShowImageModal(true);
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">{alert.maladie}</h4>
                                  {alert.bilan_nom && (
                                    <p className="text-xs text-gray-500 mt-1">Bilan: {alert.bilan_nom}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  {getAlertLevelBadge(alert.status_alert)}
                                  {getStatusIcon(alert.status)}
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Statut:</span>
                                  <span className={cn(
                                    alert.status === "résolue" ? "text-green-600" : "text-red-600"
                                  )}>
                                    {getStatusText(alert.status)}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-gray-500">Serre:</span>
                                  <span className="ml-2 font-medium">{alert.serre_nom || "Inconnue"}</span>
                                </div>

                                {alert.domaine_nom && (
                                  <div>
                                    <span className="text-gray-500">Domaine:</span>
                                    <span className="ml-2">{alert.domaine_nom}</span>
                                  </div>
                                )}

                                {alert.x1 !== undefined && alert.y1 !== undefined && (
                                  <div className="text-xs text-gray-500">
                                    Coordonnées: ({alert.x1.toFixed(2)}, {alert.y1.toFixed(2)})
                                  </div>
                                )}

                                <div className="text-xs text-gray-500">
                                  {formatDate(alert.date)}
                                </div>
                              </div>

                              {alert.status !== "résolue" && (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateAlert(alert.id, "résolue")}
                                    className="w-full bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    Marquer comme résolu
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Affichage de {(currentPage - 1) * alertsPerPage + 1} à {Math.min(currentPage * alertsPerPage, totalAlerts)} sur {totalAlerts} alerte{totalAlerts !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 sm:w-10 text-xs"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-xs"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Détails de l'Alerte</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Alert"
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informations de l'Alerte</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {alerts.find(a => a.lien_image === selectedImage) && (
                        <>
                          <div><span className="font-medium">Maladie:</span> {alerts.find(a => a.lien_image === selectedImage)?.maladie}</div>
                          <div><span className="font-medium">Niveau:</span> {getAlertLevelBadge(alerts.find(a => a.lien_image === selectedImage)?.status_alert || 0)}</div>
                          <div><span className="font-medium">Statut:</span> {getStatusText(alerts.find(a => a.lien_image === selectedImage)?.status || "non résolue")}</div>
                          <div><span className="font-medium">Date:</span> {formatDate(alerts.find(a => a.lien_image === selectedImage)?.date || "")}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Localisation</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {alerts.find(a => a.lien_image === selectedImage) && (
                        <>
                          <div><span className="font-medium">Serre:</span> {alerts.find(a => a.lien_image === selectedImage)?.serre_nom || "Inconnue"}</div>
                          <div><span className="font-medium">Domaine:</span> {alerts.find(a => a.lien_image === selectedImage)?.domaine_nom || "Inconnu"}</div>
                          <div><span className="font-medium">Bilan:</span> {alerts.find(a => a.lien_image === selectedImage)?.bilan_nom || "Inconnu"}</div>
                          {alerts.find(a => a.lien_image === selectedImage)?.x1 !== undefined && 
                           alerts.find(a => a.lien_image === selectedImage)?.y1 !== undefined && (
                            <div><span className="font-medium">Coordonnées:</span> ({alerts.find(a => a.lien_image === selectedImage)?.x1?.toFixed(2)}, {alerts.find(a => a.lien_image === selectedImage)?.y1?.toFixed(2)})</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button
                onClick={() => setShowImageModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
