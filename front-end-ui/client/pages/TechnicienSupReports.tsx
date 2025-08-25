import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import ReportService, { ApiReport } from "../services/reportService";
import { serreService } from "../services/serreService";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/use-mobile";

export default function TechnicienSupReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSerre, setFilterSerre] = useState<string>("all");
  const [availableSerres, setAvailableSerres] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchAvailableSerres();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportService.getReportsByAssignedSerres();
      setReports(data);
    } catch (err) {
      setError("Erreur lors du chargement des rapports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSerres = async () => {
    try {
      const serres = await serreService.getSerresByUser();
      setAvailableSerres(serres);
    } catch (error) {
      setAvailableSerres([]);
    }
  };

  const handleGenerateReport = () => {
    navigate("/technicien-sup/reports/create");
  };

  const handleDownloadReport = async (rapport: ApiReport) => {
    if (rapport.lien_pdf) {
      try {
        await ReportService.downloadReport(rapport.lien_pdf, `rapport_${rapport.id}.pdf`);
      } catch (error) {
        // Error downloading report
      }
    }
  };

  const getStatusBadge = (date: string | null) => {
    if (!date) return { label: "En cours", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    
    const reportDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return { label: "Récent", color: "bg-[#B4CC5F]/20 text-[#9BB84F] border-[#B4CC5F]/30" };
    } else if (diffDays <= 30) {
      return { label: "Mois dernier", color: "bg-blue-100 text-blue-800 border-blue-300" };
    } else {
      return { label: "Ancien", color: "bg-muted text-muted-foreground border-border" };
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      (report.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (report.serre?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (report.domaine?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesSerre = filterSerre === "all" || report.serre_id?.toString() === filterSerre;
    
    return matchesSearch && matchesSerre;
  });

  const assignedSerres = availableSerres.map(serre => ({ id: serre.id, nom: serre.nom }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Erreur de chargement</h3>
            <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto">{error}</p>
            <Button onClick={fetchReports} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Statistics Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Rapports</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B4CC5F]">
                    {reports.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Tous les rapports</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Serres Assignées</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                    {availableSerres.length}
                  </p>
                  {availableSerres.length === 0 ? (
                    <p className="text-xs text-red-500 mt-1 hidden sm:block">
                      Aucune serre assignée
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Serres disponibles</p>
                  )}
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Ce Mois</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B4CC5F]">
                    {reports.filter(r => {
                      if (!r.date) return false;
                      const reportDate = new Date(r.date);
                      const now = new Date();
                      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Rapports du mois</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Avec PDF</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                    {reports.filter(r => r.lien_pdf).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Rapports téléchargeables</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                  <Download className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search - Mobile Responsive */}
        <Card className="mb-6 sm:mb-8 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-[#B4CC5F] flex items-center justify-center">
                <Filter className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search" className="text-sm font-medium text-foreground">Rechercher</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Description, serre, domaine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border focus:border-[#B4CC5F] focus:ring-[#B4CC5F] transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serre-filter" className="text-sm font-medium text-foreground">Filtrer par Serre</Label>
                <Select value={filterSerre} onValueChange={setFilterSerre}>
                  <SelectTrigger className="mt-1 border-border focus:border-[#B4CC5F] focus:ring-[#B4CC5F] transition-colors duration-200">
                    <SelectValue placeholder="Toutes les serres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les serres</SelectItem>
                    {assignedSerres.map((serre) => (
                      <SelectItem key={serre.id} value={serre.id?.toString() || ""}>
                        {serre.nom || `Serre ${serre.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={availableSerres.length === 0}
                  className="w-full bg-[#B4CC5F] hover:bg-[#9BB84F] text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Générer un rapport</span>
                  <span className="sm:hidden">Générer</span>
                </Button>
                {availableSerres.length === 0 && (
                  <p className="text-xs text-red-500 mt-1 text-center font-medium">
                    Aucune serre assignée
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List - Mobile Responsive */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-[#B4CC5F] flex items-center justify-center">
                <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
              <span>Rapports ({filteredReports.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableSerres.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucune serre assignée</h3>
                <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto px-4">
                  Vous n'avez pas encore de serres assignées. Contactez votre directeur pour obtenir des autorisations.
                </p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#B4CC5F]/20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-[#B4CC5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun rapport trouvé</h3>
                <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto px-4">
                  {reports.length === 0 
                    ? availableSerres && availableSerres.length > 0
                      ? "Vous n'avez pas encore de rapports pour vos serres assignées"
                      : "Vous n'avez pas de serres assignées pour le moment"
                    : "Aucun rapport ne correspond à vos critères de recherche"
                  }
                </p>
                {availableSerres && availableSerres.length > 0 && (
                  <Button 
                    onClick={handleGenerateReport}
                    className="bg-[#B4CC5F] hover:bg-[#9BB84F] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Créer votre premier rapport</span>
                    <span className="sm:hidden">Créer rapport</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredReports.map((report) => {
                  const statusBadge = getStatusBadge(report.date);
                  return (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 p-4 sm:p-6 border rounded-lg hover:bg-muted hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border"
                    >
                      <div className="flex-shrink-0 flex justify-center sm:justify-start">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 text-center sm:text-left">
                              {report.description || `Rapport ${report.id}`}
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Serre:</span>
                                <span className="text-xs sm:text-sm text-foreground truncate">{report.serre || `Serre ${report.serre_id}`}</span>
                              </div>
                              
                              {report.domaine && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Domaine:</span>
                                  <span className="text-xs sm:text-sm text-foreground truncate">{report.domaine}</span>
                                </div>
                              )}
                              
                              {report.entreprise && (
                                <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Entreprise:</span>
                                  <span className="text-xs sm:text-sm text-foreground truncate">{report.entreprise}</span>
                                </div>
                              )}
                            </div>
                            
                            {report.bilans && report.bilans.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Billons: </span>
                                <span className="text-xs sm:text-sm text-foreground">{report.bilans.join(", ")}</span>
                              </div>
                            )}
                            
                            {report.date && (
                              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Créé le {new Date(report.date).toLocaleDateString("fr-FR")}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center sm:items-end space-y-3">
                            <Badge
                              variant="outline"
                              className={`${statusBadge.color} text-xs sm:text-sm`}
                            >
                              {statusBadge.label}
                            </Badge>
                            
                            {report.lien_pdf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReport(report)}
                                className="h-8 border-[#B4CC5F] text-[#B4CC5F] hover:bg-[#B4CC5F] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 w-full sm:w-auto"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Télécharger</span>
                                <span className="sm:hidden">PDF</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
