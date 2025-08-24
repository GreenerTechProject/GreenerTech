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
} from "lucide-react";
import ReportService, { ApiReport } from "../services/reportService";
import { serreService } from "../services/serreService";
import { useNavigate } from "react-router-dom";
import TechHeader from "../components/TechHeader";

export default function TechnicianReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
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
      const data = await ReportService.getReportsByAssignedSerres();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
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
      console.error("Error fetching available serres:", error);
      setAvailableSerres([]);
    }
  };

  const handleGenerateReport = () => {
    // Navigate to report creation page or open modal
    navigate("/technician/reports/create");
  };

  const handleDownloadReport = async (rapport: ApiReport) => {
    if (rapport.lien_pdf) {
      try {
        await ReportService.downloadReport(rapport.lien_pdf, `rapport_${rapport.id}.pdf`);
      } catch (error) {
        console.error("Error downloading report:", error);
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
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.serre_nom && report.serre_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.domaine_nom && report.domaine_nom.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSerre = filterSerre === "all" || report.serre_id?.toString() === filterSerre;
    
    return matchesSearch && matchesSerre;
  });

  const assignedSerres = availableSerres.map(serre => ({ id: serre.id, nom: serre.nom }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <TechHeader role="technicien" />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Rapports</p>
                  <p className="text-3xl font-bold text-[#B4CC5F]">
                    {reports.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Tous les rapports</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Serres Assignées</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {availableSerres.length}
                  </p>
                  {availableSerres.length === 0 ? (
                    <p className="text-xs text-red-500 mt-1">
                      Aucune serre assignée
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Serres disponibles</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Ce Mois</p>
                  <p className="text-3xl font-bold text-[#B4CC5F]">
                    {reports.filter(r => {
                      if (!r.date) return false;
                      const reportDate = new Date(r.date);
                      const now = new Date();
                      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Rapports du mois</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-[#B4CC5F] flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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

              <div className="flex items-end">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={availableSerres.length === 0}
                  className="w-full bg-[#B4CC5F] hover:bg-[#9BB84F] text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Générer un rapport
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

        {/* Reports List */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-[#B4CC5F] flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>Rapports ({filteredReports.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableSerres.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Aucune serre assignée</h3>
                <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto">
                  Vous n'avez pas encore de serres assignées. Contactez votre directeur pour obtenir des autorisations.
                </p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-[#B4CC5F]/20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-[#B4CC5F]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Aucun rapport trouvé</h3>
                <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto">
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
                    Créer votre premier rapport
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const statusBadge = getStatusBadge(report.date);
                  return (
                    <div
                      key={report.id}
                      className="flex items-start space-x-4 p-6 border rounded-lg hover:bg-muted hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <FileText className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              {report.description}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-muted-foreground">Serre:</span>
                                <span className="text-sm text-foreground">{report.serre_nom || `Serre ${report.serre_id}`}</span>
                              </div>
                              
                              {report.domaine_nom && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-muted-foreground">Domaine:</span>
                                  <span className="text-sm text-foreground">{report.domaine_nom}</span>
                                </div>
                              )}
                              
                              {report.user_nom && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-muted-foreground">Créé par:</span>
                                  <span className="text-sm text-foreground">{report.user_nom}</span>
                                </div>
                              )}
                            </div>
                            
                            {report.date && (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Créé le {new Date(report.date).toLocaleDateString("fr-FR")}</span>
                            </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end space-y-3">
                            <Badge
                              variant="outline"
                              className={statusBadge.color}
                            >
                              {statusBadge.label}
                            </Badge>
                            
                            {report.lien_pdf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReport(report)}
                                className="h-8 border-[#B4CC5F] text-[#B4CC5F] hover:bg-[#B4CC5F] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Télécharger
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
