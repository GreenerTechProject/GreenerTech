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
      return { label: "Récent", color: "bg-green-100 text-green-800 border-green-300" };
    } else if (diffDays <= 30) {
      return { label: "Mois dernier", color: "bg-blue-100 text-blue-800 border-blue-300" };
    } else {
      return { label: "Ancien", color: "bg-gray-100 text-gray-800 border-gray-300" };
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rapports - Technicien
          </h1>
          <p className="text-gray-600">
            Consultez et gérez les rapports de vos serres assignées
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rapports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Serres Assignées</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {availableSerres.length}
                  </p>
                  {availableSerres.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aucune serre assignée
                    </p>
                  )}
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ce Mois</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reports.filter(r => {
                      if (!r.date) return false;
                      const reportDate = new Date(r.date);
                      const now = new Date();
                      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actions</p>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={availableSerres.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Générer un rapport
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Description, serre, domaine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serre-filter">Filtrer par Serre</Label>
                <Select value={filterSerre} onValueChange={setFilterSerre}>
                  <SelectTrigger>
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Générer un rapport
                </Button>
                {availableSerres.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Aucune serre assignée
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Rapports ({filteredReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableSerres.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucune serre assignée</h3>
                <p className="text-sm mb-4">
                  Vous n'avez pas encore de serres assignées. Contactez votre directeur pour obtenir des autorisations.
                </p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucun rapport trouvé</h3>
                <p className="text-sm mb-4">
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
                    className="bg-green-600 hover:bg-green-700"
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
                      className="flex items-start space-x-4 p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {report.description}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">Serre:</span>
                                <span className="text-sm text-gray-900">{report.serre_nom || `Serre ${report.serre_id}`}</span>
                              </div>
                              
                              {report.domaine_nom && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-600">Domaine:</span>
                                  <span className="text-sm text-gray-900">{report.domaine_nom}</span>
                                </div>
                              )}
                              
                              {report.user_nom && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-600">Créé par:</span>
                                  <span className="text-sm text-gray-900">{report.user_nom}</span>
                                </div>
                              )}
                            </div>
                            
                            {report.date && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                                className="h-8"
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
