import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertService } from "@/services/alertService";
import { Alert, AlertStats } from "@/types/alert";
import { useAuth } from "@/contexts/AuthContext";
import { serreService } from "../services/serreService";

interface Serre {
  id: string;
  nom: string;
  domaine?: {
    nom: string;
  };
}

export default function TechnicienSupAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [assignedSerres, setAssignedSerres] = useState<Serre[]>([]);
  const alertsPerPage = 7;

  useEffect(() => {
    loadAssignedSerres();
  }, []);

  useEffect(() => {
    if (assignedSerres.length > 0) {
      loadAlerts();
      loadStats();
    }
  }, [assignedSerres, currentPage, searchTerm]);

  const loadAssignedSerres = async () => {
    try {
      // Get serres assigned to the current technicien sup
      const response = await serreService.getSerresByUser();
      setAssignedSerres(response);
    } catch (error) {
      console.error("Error loading assigned serres:", error);
      setAssignedSerres([]);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const response = await AlertService.getAllAlerts(1, 1000, filters);
      
      // Filter alerts to only include those from assigned serres
      const filteredAlerts = response.alerts.filter((alert: any) => {
        // Check if alert belongs to assigned serres
        return true; // For now, show all alerts
      });

      // Count alerts by severity
      const lowCount = filteredAlerts.filter((a: any) => a.status_alert === 0).length;
      const mediumCount = filteredAlerts.filter((a: any) => a.status_alert === 1).length;
      const highCount = filteredAlerts.filter((a: any) => a.status_alert === 2).length;
      
      setAlerts(filteredAlerts);
      setTotalAlerts(filteredAlerts.length);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * alertsPerPage;
      const endIndex = startIndex + alertsPerPage;
      setFilteredAlerts(filteredAlerts.slice(startIndex, endIndex));
    } catch (error) {
      console.error("Error loading alerts:", error);
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getAlertLevelBadge = (statusAlert: number) => {
    switch (statusAlert) {
      case 1:
        return <Badge className="bg-green-100 text-green-800 border-green-300">Faible</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Moyen</Badge>;
      case 3:
        return <Badge className="bg-red-100 text-red-800 border-red-300">Élevé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getAlertLevelText = (statusAlert: number) => {
    switch (statusAlert) {
      case 1:
        return "Faible";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Inconnu";
    }
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des Alertes
        </h1>
        <p className="text-gray-600 text-lg">
          Sur votre serres supervisées ({assignedSerres.length})
        </p>
        
        {/* Search Bar */}
        <div className="mt-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="mb-6">
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
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
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
                      {/* This would need to be populated with actual serre and domaine info */}
                      Serre Assignée
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(alert.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * alertsPerPage + 1} à {Math.min(currentPage * alertsPerPage, totalAlerts)} sur {totalAlerts} alerte{totalAlerts !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Alertes Non Résolues</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.unresolvedAlerts || 0}
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
                  {stats?.resolvedAlerts || 0}
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
                  {stats?.averageResolutionTime || 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alertes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalAlerts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
