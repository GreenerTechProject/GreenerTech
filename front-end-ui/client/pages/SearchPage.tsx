import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicianSidebar from "../components/TechnicianSidebar";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  FileText,
  AlertTriangle,
  Settings,
  Bookmark,
  LogOut,
  Clock,
  TrendingUp,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "report" | "alert" | "intervention" | "user" | "serre" | "document";
  title: string;
  description: string;
  date: Date;
  author?: string;
  location?: string;
  status?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  relevanceScore: number;
}

const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    type: "report",
    title: "Rapport d'intervention - Système irrigation Serre Nord A",
    description: "Réparation du système d'irrigation goutte à goutte, remplacement de 3 capteurs défaillants. Intervention réalisée suite à l'alerte automatique du système de monitoring.",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    author: "Jean Dupont",
    location: "Serre Nord A",
    status: "completed",
    tags: ["irrigation", "capteurs", "maintenance"],
    relevanceScore: 95,
  },
  {
    id: "2",
    type: "alert",
    title: "Alerte température élevée",
    description: "Température dépassant le seuil critique de 32°C détectée dans la zone de culture des tomates. Intervention immédiate requise.",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: "Serre Sud B - Zone Tomates",
    status: "active",
    priority: "high",
    tags: ["température", "critique", "tomates"],
    relevanceScore: 88,
  },
  {
    id: "3",
    type: "intervention",
    title: "Maintenance préventive des systèmes de ventilation",
    description: "Contrôle et nettoyage des systèmes de ventilation, remplacement des filtres, vérification des moteurs.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    author: "Marie Martin",
    location: "Toutes les serres",
    status: "scheduled",
    tags: ["ventilation", "préventif", "maintenance"],
    relevanceScore: 82,
  },
  {
    id: "4",
    type: "serre",
    title: "Serre Expérimentale C",
    description: "Serre dédiée aux tests de nouvelles variétés de légumes. Équipée de capteurs IoT avancés et système de contrôle automatisé.",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    location: "Zone Expérimentale",
    status: "active",
    tags: ["expérimental", "IoT", "automatisation"],
    relevanceScore: 76,
  },
  {
    id: "5",
    type: "user",
    title: "Pierre Bernard - Technicien Supérieur",
    description: "Technicien spécialisé dans les systèmes d'irrigation et de fertilisation. 8 ans d'expérience dans la gestion des serres.",
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    location: "Équipe Technique",
    status: "active",
    tags: ["irrigation", "fertilisation", "expert"],
    relevanceScore: 70,
  },
  {
    id: "6",
    type: "document",
    title: "Manuel d'utilisation - Système de monitoring IoT",
    description: "Documentation complète pour l'installation, la configuration et la maintenance du système de monitoring IoT des serres.",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    author: "Équipe Technique",
    tags: ["documentation", "IoT", "manuel"],
    relevanceScore: 65,
  },
];

export default function SearchPage() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    author: "",
    location: "",
    tags: "",
    description: "",
  });

  const performSearch = async () => {
    if (!searchQuery.trim() && !advancedSearch) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let results = mockSearchResults.filter(result => {
      const queryMatch = searchQuery.toLowerCase();
      const titleMatch = result.title.toLowerCase().includes(queryMatch);
      const descMatch = result.description.toLowerCase().includes(queryMatch);
      const tagMatch = result.tags?.some(tag => tag.toLowerCase().includes(queryMatch));
      const authorMatch = result.author?.toLowerCase().includes(queryMatch);
      
      let basicMatch = titleMatch || descMatch || tagMatch || authorMatch;
      
      if (advancedSearch) {
        const advAuthorMatch = !advancedFilters.author || 
          result.author?.toLowerCase().includes(advancedFilters.author.toLowerCase());
        const advLocationMatch = !advancedFilters.location || 
          result.location?.toLowerCase().includes(advancedFilters.location.toLowerCase());
        const advTagMatch = !advancedFilters.tags || 
          result.tags?.some(tag => tag.toLowerCase().includes(advancedFilters.tags.toLowerCase()));
        const advDescMatch = !advancedFilters.description || 
          result.description.toLowerCase().includes(advancedFilters.description.toLowerCase());
        
        basicMatch = basicMatch && advAuthorMatch && advLocationMatch && advTagMatch && advDescMatch;
      }
      
      // Apply filters
      if (activeTab !== "all" && result.type !== activeTab) return false;
      if (statusFilter !== "all" && result.status !== statusFilter) return false;
      
      if (dateFilter !== "all") {
        const now = new Date();
        const resultDate = result.date;
        const daysDiff = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (dateFilter) {
          case "today":
            if (daysDiff > 1) return false;
            break;
          case "week":
            if (daysDiff > 7) return false;
            break;
          case "month":
            if (daysDiff > 30) return false;
            break;
        }
      }
      
      return basicMatch;
    });
    
    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return b.relevanceScore - a.relevanceScore;
        case "date":
          return b.date.getTime() - a.date.getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    setSearchResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab, sortBy, dateFilter, statusFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "report":
        return <FileText className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "intervention":
        return <Settings className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "serre":
        return <MapPin className="h-4 w-4" />;
      case "document":
        return <Bookmark className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "report":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "alert":
        return "bg-red-100 text-red-800 border-red-300";
      case "intervention":
        return "bg-green-100 text-green-800 border-green-300";
      case "user":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "serre":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "document":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar userRole="technicien" />
              <div className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-blue-500" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Recherche Avancée
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
        {/* Search Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Recherche</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdvancedSearch(!advancedSearch)}
                className="flex items-center space-x-1"
              >
                <Filter className="h-4 w-4" />
                <span>Recherche avancée</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher dans rapports, alertes, interventions, utilisateurs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                />
              </div>

              {/* Advanced Search Filters */}
              {advancedSearch && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Filtres avancés</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author-filter">Auteur</Label>
                      <Input
                        id="author-filter"
                        placeholder="Nom de l'auteur..."
                        value={advancedFilters.author}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, author: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location-filter">Localisation</Label>
                      <Input
                        id="location-filter"
                        placeholder="Serre, zone..."
                        value={advancedFilters.location}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags-filter">Tags</Label>
                      <Input
                        id="tags-filter"
                        placeholder="irrigation, maintenance..."
                        value={advancedFilters.tags}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, tags: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description-filter">Dans la description</Label>
                      <Input
                        id="description-filter"
                        placeholder="Mots-clés dans la description..."
                        value={advancedFilters.description}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={performSearch} disabled={isLoading}>
                      {isLoading ? "Recherche..." : "Rechercher"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Tabs */}
        {searchResults.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Content Type Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-7 lg:w-auto">
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="report">Rapports</TabsTrigger>
                    <TabsTrigger value="alert">Alertes</TabsTrigger>
                    <TabsTrigger value="intervention">Interventions</TabsTrigger>
                    <TabsTrigger value="user">Utilisateurs</TabsTrigger>
                    <TabsTrigger value="serre">Serres</TabsTrigger>
                    <TabsTrigger value="document">Documents</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Sort and Filter Controls */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="sort-by" className="text-sm">Trier par:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Pertinence</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="title">Titre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="date-filter" className="text-sm">Période:</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status-filter" className="text-sm">Statut:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="scheduled">Planifié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Recherche en cours...</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && searchQuery && searchResults.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-gray-600 text-lg font-medium">Aucun résultat trouvé</p>
              <p className="text-gray-500 text-sm mt-1">
                Essayez d'autres mots-clés ou utilisez la recherche avancée
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résultats de recherche ({searchResults.length})</span>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Recherche effectuée en 0.8s</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-lg bg-gray-100">
                        {getTypeIcon(result.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                              {result.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={getTypeColor(result.type)}
                            >
                              {result.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {result.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {result.author && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{result.author}</span>
                              </div>
                            )}
                            {result.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{result.location}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{result.date.toLocaleDateString("fr-FR")}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{result.relevanceScore}% pertinent</span>
                            </div>
                          </div>
                          
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs px-2 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <div className="flex space-x-2">
                            {result.status && (
                              <Badge
                                variant="outline"
                                className={getStatusColor(result.status)}
                              >
                                {result.status}
                              </Badge>
                            )}
                            {result.priority && (
                              <Badge
                                variant="outline"
                                className={getPriorityColor(result.priority)}
                              >
                                {result.priority}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!searchQuery && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Recherchez dans toute la plateforme
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Trouvez rapidement des rapports, alertes, interventions, utilisateurs, 
                serres et documents grâce à notre moteur de recherche avancé.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-full">Rapports</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Alertes</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Interventions</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Utilisateurs</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Serres</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Documents</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
