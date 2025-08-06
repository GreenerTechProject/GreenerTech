import React, { useState } from "react";
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
import TechnicianSidebar from "../components/TechnicianSidebar";
import {
  Bookmark,
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  LogOut,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: "intervention" | "maintenance" | "production" | "quality";
  date: Date;
  author: string;
  serreId: string;
  serreName: string;
  status: "draft" | "completed" | "approved";
  summary: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    title: "Rapport d'intervention - Système irrigation",
    type: "intervention",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    author: "Jean Dupont",
    serreId: "1",
    serreName: "Serre Nord A",
    status: "completed",
    summary: "Réparation du système d'irrigation goutte à goutte, remplacement de 3 capteurs défaillants.",
  },
  {
    id: "2",
    title: "Maintenance préventive mensuelle",
    type: "maintenance",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    author: "Marie Martin",
    serreId: "2",
    serreName: "Serre Sud B",
    status: "approved",
    summary: "Vérification des systèmes de ventilation, nettoyage des filtres, contrôle des capteurs.",
  },
  {
    id: "3",
    title: "Rapport de production - Tomates",
    type: "production",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    author: "Pierre Bernard",
    serreId: "1",
    serreName: "Serre Nord A",
    status: "draft",
    summary: "Analyse de la production de tomates du mois dernier, rendement de 15kg/m².",
  },
  {
    id: "4",
    title: "Contrôle qualité des cultures",
    type: "quality",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    author: "Sophie Morel",
    serreId: "3",
    serreName: "Serre Est C",
    status: "completed",
    summary: "Inspection qualité des laitues, conformité aux standards, aucun problème détecté.",
  },
];

export default function ReportsPage() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getTypeColor = (type: string) => {
    switch (type) {
      case "intervention":
        return "bg-red-100 text-red-800 border-red-300";
      case "maintenance":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "production":
        return "bg-green-100 text-green-800 border-green-300";
      case "quality":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "intervention":
        return "Intervention";
      case "maintenance":
        return "Maintenance";
      case "production":
        return "Production";
      case "quality":
        return "Qualité";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "completed":
        return "Terminé";
      case "approved":
        return "Approuvé";
      default:
        return status;
    }
  };

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.serreName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar userRole="technicien" />
              <div className="flex items-center space-x-2">
                <Bookmark className="h-6 w-6 text-purple-500" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Rapports et Documentation
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockReports.length}
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
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {mockReports.filter((r) => r.status === "draft").length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockReports.filter((r) => r.status === "completed").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ce mois</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {mockReports.filter(r => 
                      r.date.getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Titre, serre, auteur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type-filter">Type de rapport</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="intervention">Intervention</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="quality">Qualité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">Statut</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Nouveau rapport
                </Button>
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
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.summary}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{report.serreName}</span>
                          <span>•</span>
                          <span>{report.author}</span>
                          <span>•</span>
                          <span>{report.date.toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-2">
                          <Badge
                            variant="outline"
                            className={getTypeColor(report.type)}
                          >
                            {getTypeLabel(report.type)}
                          </Badge>
                          
                          <Badge
                            variant="outline"
                            className={getStatusColor(report.status)}
                          >
                            {getStatusLabel(report.status)}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun rapport trouvé</p>
                  <p className="text-sm mt-1">
                    Modifiez vos critères de recherche ou créez un nouveau rapport
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
