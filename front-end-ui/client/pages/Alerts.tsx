import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, AlertTriangle, CheckCircle, Clock, Search, Image, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {AlertService} from "@/services/alertService";
import { Alert } from "@/types/alert";

export default function AlertsPage() {
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

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [searchTerm, levelFilter, statusFilter, currentPage]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alerts = await AlertService.getAlertsByAssignedSerres();
      
      let filteredAlerts = alerts;
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
      console.error("Error loading stats:", error);
    }
  };

  const handleUpdateAlert = async (alertId: number, status: "résolue" | "non résolue") => {
    try {
      await AlertService.updateAlert(alertId, { status });
      loadAlerts();
      loadStats();
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  const getAlertLevel = (statusAlert: number): "Low" | "Medium" | "High" => {
    if (statusAlert === 2) return "High";
    if (statusAlert === 1) return "Medium";
    return "Low";
  };

  const getAlertLevelLabel = (statusAlert: number): string => {
    if (statusAlert === 2) return "Très dangereux";
    if (statusAlert === 1) return "Moyen";
    return "Faible";
  };

  const getAlertLevelColor = (level: "High" | "Medium" | "Low"): string => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 border-red-300";
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(totalAlerts / alertsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greener-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header removed: provided by TechnicianLayout */}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">Alertes Non Résolues</p>
                    <p className="text-3xl font-bold text-red-800">{stats.unresolvedAlerts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Alertes Résolues</p>
                    <p className="text-3xl font-bold text-green-800">{stats.resolvedAlerts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Alertes</p>
                    <p className="text-3xl font-bold text-blue-800">{stats.totalAlerts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
        {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
                placeholder="Rechercher par anomalie, bilan ou serre ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-base border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm hover:border-gray-300 transition-all duration-200 w-full"
            />
          </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Level Filter */}
              <div className="relative flex-1">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-3 text-base border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm hover:border-gray-300 transition-all duration-200 bg-white w-full"
                >
                  <option value="all">Tous les niveaux</option>
                  <option value="High">Très dangereux</option>
                  <option value="Medium">Moyen</option>
                  <option value="Low">Faible</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 text-base border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm hover:border-gray-300 transition-all duration-200 bg-white w-full"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="non résolue">Non Résolu</option>
                  <option value="résolue">Résolu</option>
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {(levelFilter !== "all" || statusFilter !== "all" || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setLevelFilter("all");
                  setStatusFilter("all");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200 rounded-xl w-full"
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        </div>

        {/* Responsive Alerts Display */}
        <div className="mb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-red-500" />
              <span className="text-xl font-semibold text-gray-900">Alertes ({totalAlerts})</span>
            </div>
        </div>

          {/* Active Filters Display */}
          {(levelFilter !== "all" || statusFilter !== "all" || searchTerm) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {levelFilter !== "all" && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
                  Niveau: {levelFilter === "High" ? "Très dangereux" : levelFilter === "Medium" ? "Moyen" : "Faible"}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  Statut: {statusFilter === "résolue" ? "Résolu" : "Non Résolu"}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  Recherche: "{searchTerm}"
                </Badge>
              )}
            </div>
          )}
          
          {/* Responsive Alerts Display */}
          {alerts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte trouvée</h3>
                <p className="text-gray-500">Aucune alerte ne correspond à vos critères de recherche.</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Anomalie</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Niveau</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Statut</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Localisation</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                      {alerts.map((alert, index) => {
                      const level = getAlertLevel(alert.status_alert);
                      return (
                        <tr 
                          key={alert.id} 
                          className={cn(
                              "border-b hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200",
                              index % 2 === 1 && "bg-gray-50/50"
                            )}
                          >
                            {/* Anomalie */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {alert.lien_image ? (
                                  <div className="relative group">
                                    <img
                                      src={alert.lien_image}
                                      alt={`Image de l'alerte ${alert.maladie}`}
                                      className="w-8 h-8 object-cover rounded-lg border-2 border-gray-200 hover:border-red-300 transition-all duration-200 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setSelectedImage(alert.lien_image!);
                                        setShowImageModal(true);
                                      }}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder.svg';
                                        target.alt = 'Image non disponible';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                                      <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <AlertTriangle className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <div>
                            <div className="font-medium text-gray-900">{alert.maladie}</div>
                                  <div className="text-sm text-gray-500">ID: {alert.id}</div>
                                </div>
                              </div>
                          </td>
                            
                            {/* Niveau */}
                            <td className="py-4 px-6">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-medium px-2 py-1",
                                  getAlertLevelColor(level)
                                )}
                              >
                              {getAlertLevelLabel(alert.status_alert)}
                            </Badge>
                          </td>
                            
                            {/* Statut */}
                            <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {alert.status === "résolue" ? (
                                  <div className="p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  </div>
                              ) : (
                                  <div className="p-1 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                  </div>
                              )}
                              <span className={cn(
                                  "text-xs font-medium",
                                  alert.status === "résolue" ? "text-green-700" : "text-red-700"
                              )}>
                                {alert.status === "résolue" ? "Résolu" : "Non Résolu"}
                              </span>
                            </div>
                          </td>
                            
                            {/* Localisation */}
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-700 bg-blue-100 px-2 py-1 rounded text-xs">
                                  {alert.bilan_nom || `Bilan ${alert.id_bilan}`}
                                </div>
                                <div className="text-sm text-gray-700 bg-green-100 px-2 py-1 rounded text-xs">
                                  {alert.serre_nom || "Serre inconnue"}
                                </div>
                              </div>
                            </td>
                            
                            {/* Date */}
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-600">
                                <Clock className="w-4 h-4 inline mr-1" />
                            {formatDate(alert.date)}
                              </div>
                            </td>
                            
                            {/* Actions */}
                            <td className="py-4 px-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateAlert(alert.id, alert.status === "résolue" ? "non résolue" : "résolue")}
                                className={cn(
                                  "text-xs px-3 py-1",
                                  alert.status === "résolue" 
                                    ? "border-orange-300 text-orange-700 hover:bg-orange-50" 
                                    : "border-green-300 text-green-700 hover:bg-green-50"
                                )}
                              >
                                {alert.status === "résolue" ? "Marquer non résolu" : "Marquer résolu"}
                              </Button>
                          </td>
                        </tr>
                      );
                      })}
                </tbody>
              </table>
                </div>
            </div>

              {/* Mobile Cards View - Hidden on desktop */}
              <div className="lg:hidden space-y-4">
                {alerts.map((alert, index) => {
                  const level = getAlertLevel(alert.status_alert);
                  return (
                    <Card key={alert.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                      <div className="p-4 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {alert.lien_image ? (
                              <div className="relative group">
                                <img
                                  src={alert.lien_image}
                                  alt={`Image de l'alerte ${alert.maladie}`}
                                  className="w-10 h-10 object-cover rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all duration-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedImage(alert.lien_image!);
                                    setShowImageModal(true);
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                    target.alt = 'Image non disponible';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl flex items-center justify-center pointer-events-none">
                                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{alert.maladie}</h3>
                              <p className="text-sm text-gray-600">ID: {alert.id}</p>
                            </div>
              </div>
              
              <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs font-medium px-2 py-1",
                                getAlertLevelColor(level)
                              )}
                            >
                              {getAlertLevelLabel(alert.status_alert)}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {alert.status === "résolue" ? (
                                <div className="p-1 bg-green-100 rounded-full">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-1 bg-red-100 rounded-full">
                                  <AlertTriangle className="h-3 w-3 text-red-600" />
                                </div>
                              )}
                              <span className={cn(
                                "text-xs font-medium",
                                alert.status === "résolue" ? "text-green-700" : "text-red-700"
                              )}>
                                {alert.status === "résolue" ? "Résolu" : "Non Résolu"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Location Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          <div className="text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            <span className="font-medium text-blue-800">Bilan:</span>
                            <p className="text-blue-700 truncate">{alert.bilan_nom || `Bilan ${alert.id_bilan}`}</p>
                          </div>
                          <div className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <span className="font-medium text-green-800">Serre:</span>
                            <p className="text-green-700 truncate">{alert.serre_nom || "Serre inconnue"}</p>
                          </div>
                        </div>
                       
                       {/* Footer */}
                       <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                         <div className="text-sm text-gray-600">
                           <Clock className="w-4 h-4 inline mr-1" />
                            {formatDate(alert.date)}
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleUpdateAlert(alert.id, alert.status === "résolue" ? "non résolue" : "résolue")}
                             className={cn(
                               "text-xs px-3 py-1",
                               alert.status === "résolue" 
                                 ? "border-orange-300 text-orange-700 hover:bg-orange-50" 
                                 : "border-green-300 text-green-700 hover:bg-green-50"
                             )}
                           >
                             {alert.status === "résolue" ? "Marquer non résolu" : "Marquer résolu"}
                           </Button>
                         </div>
                       </div>
                     </div>
                   </Card>
                 );
               })}
             </div>
           </>
         )}
        </div>

        {/* Mobile-Friendly Pagination */}
        <div className="mt-8">
          {/* Page Info */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages} • {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
              className="px-3 py-2 text-sm border-2 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Précédent</span>
                </Button>
                
            {/* Page Numbers - Show fewer on mobile */}
            <div className="flex items-center gap-1">
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200",
                        pageNum === currentPage
                        ? "bg-red-600 text-white hover:bg-red-700 shadow-lg"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              
              {/* Show ellipsis if there are more pages */}
              {totalPages > 3 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              
              {/* Show last page if not already shown */}
              {totalPages > 3 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200",
                    currentPage === totalPages
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50"
                  )}
                >
                  {totalPages}
                </Button>
              )}
            </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border-2 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                >
              <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
                </div>
              </div>

      {/* Image Preview Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999] p-4"
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <div 
            className="relative flex items-center justify-center w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Aperçu de l'image"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
                target.alt = 'Image non disponible';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
