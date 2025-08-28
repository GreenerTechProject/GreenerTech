import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Building,
  Filter,
  Download,
  Trash2,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DirectorLayout from '@/components/DirectorLayout';
import ReportService, { ApiReport } from '../services/reportService';
import { serreService } from '../services/serreService';
import { domainService } from '../services/domainService';
import { useToast } from '../hooks/use-toast';

const DirectorReportManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ApiReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerre, setFilterSerre] = useState<string>("all");
  const [filterDomaine, setFilterDomaine] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [availableSerres, setAvailableSerres] = useState<any[]>([]);
  const [availableDomaines, setAvailableDomaines] = useState<any[]>([]);

  // Report creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    description: '',
    selectedSerre: '',
    dateDebut: '',
    dateFin: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchEnterpriseData();
  }, []);

  const fetchEnterpriseData = async () => {
    try {
      // Fetch all serres and domaines from the enterprise
      const [serresData, domainesData] = await Promise.all([
        serreService.getAllSerres(),
        domainService.getMyCompanyDomains()
      ]);
      
      setAvailableSerres(serresData);
      setAvailableDomaines(domainesData);
    } catch (error) {
      console.error("Error fetching enterprise data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'entreprise",
        variant: "destructive",
      });
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await ReportService.getReportsByDirectorEnterprise();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
      setFilteredReports([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = reports.filter((report) => {
      const matchesSearch = 
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.serre_nom && report.serre_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.domaine_nom && report.domaine_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.user_nom && report.user_nom.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSerre = filterSerre === "all" || report.serre_id?.toString() === filterSerre;
      const matchesDomaine = filterDomaine === "all" || report.domaine_nom === filterDomaine;
      
      return matchesSearch && matchesSerre && matchesDomaine;
    });
    setFilteredReports(filtered);
  }, [searchTerm, filterSerre, filterDomaine, reports]);

  const handleDownloadReport = async (rapport: ApiReport) => {
    if (rapport.lien_pdf) {
      try {
        await ReportService.downloadReport(rapport.lien_pdf, `rapport_${rapport.id}.pdf`);
        toast({
          title: "Téléchargement réussi",
          description: "Le rapport a été téléchargé",
        });
      } catch (error) {
        console.error("Error downloading report:", error);
        toast({
          title: "Erreur",
          description: "Impossible de télécharger le rapport",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewReport = (report: ApiReport) => {
    // For now, just show an alert with report details
    // You can implement a modal or navigate to a detailed view later
    const details = `
      Rapport: ${report.description}
      Serre: ${report.serre_nom || `Serre ${report.serre_id}`}
      Domaine: ${report.domaine_nom || 'N/A'}
      Créé par: ${report.user_nom || 'N/A'}
      Date: ${report.date ? new Date(report.date).toLocaleDateString("fr-FR") : 'N/A'}
      PDF: ${report.lien_pdf ? 'Disponible' : 'Non disponible'}
    `;

    alert(details.trim());
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.")) {
      return;
    }

    try {
      await ReportService.deleteReport(reportId);
      setReports(reports.filter(r => r.id !== reportId));
      setFilteredReports(filteredReports.filter(r => r.id !== reportId));
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rapport",
        variant: "destructive",
      });
    }
  };

  // Report creation handlers
  const handleCreateReport = () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    // Set default date range (last 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setCreateFormData({
      description: '',
      selectedSerre: '',
      dateDebut: oneWeekAgo.toISOString().slice(0, 16),
      dateFin: now.toISOString().slice(0, 16),
    });
  };

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.selectedSerre || !createFormData.description.trim()) {
      setCreateError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const reportData = {
        description: createFormData.description.trim(),
        id_serre: parseInt(createFormData.selectedSerre),
        date_debut: createFormData.dateDebut ? new Date(createFormData.dateDebut).toISOString() : undefined,
        date_fin: createFormData.dateFin ? new Date(createFormData.dateFin).toISOString() : undefined,
        ids_bilans: [], // Backend will populate based on serre and date range
      };

      const response = await ReportService.createReport(reportData);

      toast({
        title: "Rapport créé",
        description: "Le rapport a été généré avec succès",
      });

      // Refresh reports list
      fetchReports();

      // Close modal
      setIsCreateModalOpen(false);

    } catch (error: any) {
      setCreateError(error.response?.data?.message || "Erreur lors de la création du rapport");
    } finally {
      setCreateLoading(false);
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

  const stats = {
    totalReports: reports.length,
    coveredSerres: availableSerres.length,
    domains: availableDomaines.length,
    withPDF: reports.filter(r => r.lien_pdf).length,
    last30Days: reports.filter(r => {
      if (!r.date) return false;
      const reportDate = new Date(r.date);
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDate >= thirtyDaysAgo;
    }).length
  };

  if (loading) {
    return (
      <DirectorLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
          </div>
        </div>
      </DirectorLayout>
    );
  }

  return (
    <DirectorLayout>
      <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Gestion des Rapports
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Gérez et consultez tous les rapports de votre entreprise
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Rapports</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B4CC5F]">
                        {stats.totalReports}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Tous les rapports</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Serres Couvertes</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                        {stats.coveredSerres}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Serres avec rapports</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <Building className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Domaines</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                        {stats.domains}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Domaines couverts</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Avec PDF</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                        {stats.withPDF}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Rapports téléchargeables</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 col-span-2 lg:col-span-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">30 Derniers Jours</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
                        {stats.last30Days}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Rapports récents</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="search" className="text-xs sm:text-sm font-medium text-foreground">Rechercher</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        type="text"
                        placeholder="Description, serre, domaine, utilisateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm border-border focus:border-[#B4CC5F] focus:ring-[#B4CC5F] transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="serre-filter" className="text-xs sm:text-sm font-medium text-foreground">Filtrer par Serre</Label>
                    <Select value={filterSerre} onValueChange={setFilterSerre}>
                      <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm border-border focus:border-[#B4CC5F] focus:ring-[#B4CC5F] transition-colors duration-200">
                        <SelectValue placeholder="Toutes les serres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les serres</SelectItem>
                        {availableSerres.map((serre) => (
                          <SelectItem key={serre.id} value={serre.id?.toString() || ""}>
                            {serre.nom || `Serre ${serre.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="domaine-filter" className="text-xs sm:text-sm font-medium text-foreground">Filtrer par Domaine</Label>
                    <Select value={filterDomaine} onValueChange={setFilterDomaine}>
                      <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm border-border focus:border-[#B4CC5F] focus:ring-[#B4CC5F] transition-colors duration-200">
                        <SelectValue placeholder="Tous les domaines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les domaines</SelectItem>
                        {availableDomaines.map((domaine) => (
                          <SelectItem key={domaine.id} value={domaine.nom}>
                            {domaine.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                    <Button
                      onClick={handleCreateReport}
                      className="w-full bg-[#B4CC5F] hover:bg-[#9BB84F] text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Nouveau Rapport
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
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
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#B4CC5F]/20 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-[#B4CC5F]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun rapport trouvé</h3>
                    <p className="text-xs sm:text-sm mb-4 text-muted-foreground max-w-md mx-auto">
                      {reports.length === 0 
                        ? "Aucun rapport n'a été créé dans votre entreprise"
                        : "Aucun rapport ne correspond à vos critères de recherche"
                      }
                    </p>
                    <Button 
                      className="bg-[#B4CC5F] hover:bg-[#9BB84F] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Créer le premier rapport
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredReports.map((report) => {
                      const statusBadge = getStatusBadge(report.date);
                      return (
                        <div
                          key={report.id}
                          className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 lg:p-6 border rounded-lg hover:bg-muted hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                              <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                                  {report.description}
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Serre:</span>
                                    <span className="text-xs sm:text-sm text-foreground">{report.serre_nom || `Serre ${report.serre_id}`}</span>
                                  </div>
                                  
                                  {report.domaine_nom && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Domaine:</span>
                                      <span className="text-xs sm:text-sm text-foreground">{report.domaine_nom}</span>
                                    </div>
                                  )}
                                  
                                  {report.user_nom && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Créé par:</span>
                                      <span className="text-xs sm:text-sm text-foreground">{report.user_nom}</span>
                                    </div>
                                  )}
                                  
                                  {report.entreprise_nom && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Entreprise:</span>
                                      <span className="text-xs sm:text-sm text-foreground">{report.entreprise_nom}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {report.date && (
                                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Créé le {new Date(report.date).toLocaleDateString("fr-FR")}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-start sm:items-end space-y-3">
                                <Badge
                                  variant="outline"
                                  className={`${statusBadge.color} text-xs`}
                                >
                                  {statusBadge.label}
                                </Badge>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewReport(report)}
                                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                    title="Voir le rapport"
                                  >
                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </Button>
                                  
                                  {report.lien_pdf && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadReport(report)}
                                      className="h-8 w-8 sm:h-10 sm:w-10 p-0 border-[#B4CC5F] text-[#B4CC5F] hover:bg-[#B4CC5F] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                      title="Télécharger le rapport"
                                    >
                                      <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                    title="Supprimer le rapport"
                                  >
                                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </Button>
                                </div>
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

      {/* Report Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-[#B4CC5F]" />
              <span>Créer un nouveau rapport</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateReportSubmit} className="space-y-6">
            {/* Error Alert */}
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description du rapport *
              </Label>
              <Textarea
                id="description"
                placeholder="Entrez une description détaillée du rapport..."
                value={createFormData.description}
                onChange={(e) => setCreateFormData({
                  ...createFormData,
                  description: e.target.value
                })}
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            {/* Serre Selection */}
            <div className="space-y-2">
              <Label htmlFor="serre" className="text-sm font-medium">
                Serre *
              </Label>
              <Select
                value={createFormData.selectedSerre}
                onValueChange={(value) => setCreateFormData({
                  ...createFormData,
                  selectedSerre: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une serre" />
                </SelectTrigger>
                <SelectContent>
                  {availableSerres.map((serre) => (
                    <SelectItem key={serre.id} value={serre.id?.toString() || ""}>
                      {serre.nom || `Serre ${serre.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateDebut" className="text-sm font-medium">
                  Date de début
                </Label>
                <Input
                  id="dateDebut"
                  type="datetime-local"
                  value={createFormData.dateDebut}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    dateDebut: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin" className="text-sm font-medium">
                  Date de fin
                </Label>
                <Input
                  id="dateFin"
                  type="datetime-local"
                  value={createFormData.dateFin}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    dateFin: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-[#B4CC5F] hover:bg-[#9BB84F] text-white"
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le rapport
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default DirectorReportManagement;
