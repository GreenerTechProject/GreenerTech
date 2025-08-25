import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Tag,
  BarChart3,
  Building2,
  Globe,
  FileText as FileTextIcon,
  Wrench,
  Hammer,
  Eye,
  Crop,
  Droplets,
  Sparkles,
  Euro,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import InterventionForm from "../components/InterventionForm";
import { InterventionService, Intervention as InterventionData } from "../services/interventionService";

interface Intervention {
  id: number;
  description: string;
  status: 'encours' | 'terminé';
  id_user: number;
  id_serre: number;
  id_type_tache: number;
  total_charges: number;
  date_debut: string;
  date_fin: string;
  valid: boolean;
  serre_nom?: string;
  domaine_nom?: string;
  type_nom?: string;
  created_at?: string;
  updated_at?: string;
}

const sortOptions = [
  { value: "date_debut", label: "Date de début", icon: Calendar },
  { value: "date_fin", label: "Date de fin", icon: RefreshCw },
  { value: "type_nom", label: "Type d'intervention", icon: Tag },
  { value: "status", label: "Statut", icon: BarChart3 },
  { value: "serre_nom", label: "Nom de la serre", icon: Building2 },
  { value: "domaine_nom", label: "Nom du domaine", icon: Globe },
  { value: "description", label: "Description", icon: FileTextIcon },
  { value: "total_charges", label: "Charges", icon: Euro },
];

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts", icon: BarChart3 },
  { value: "encours", label: "En cours", icon: RefreshCw },
  { value: "terminé", label: "Terminé", icon: Calendar },
];

export default function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [interventionsPerPage] = useState(7);
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date_debut");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadInterventions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside sort menu
      if (isSortMenuOpen && !target.closest('[data-sort-menu]')) {
        setIsSortMenuOpen(false);
      }
      
      // Check if click is outside status filter menu
      if (isStatusFilterOpen && !target.closest('[data-status-filter]')) {
        setIsStatusFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen, isStatusFilterOpen]);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      const interventions = await InterventionService.getInterventionsByAssignedSerres();
      console.log("Loaded interventions:", interventions);
      setInterventions(interventions);
      setFilteredInterventions(interventions);
      
      if (sortBy) {
        applySorting(sortBy, sortOrder);
      }
    } catch (error) {
      console.error("Error loading interventions:", error);
      setInterventions([]);
      setFilteredInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    applyFilters(value, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (search: string, status: string) => {
    let filtered = [...interventions]; // Create a copy to avoid mutating original

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(intervention => intervention.status === status);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(intervention =>
        (intervention.type_nom || '').toLowerCase().includes(searchLower) ||
        (intervention.serre_nom || '').toLowerCase().includes(searchLower) ||
        (intervention.domaine_nom || '').toLowerCase().includes(searchLower) ||
        (intervention.description || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredInterventions(filtered);
    
    // Re-apply current sorting after filtering
    if (sortBy && filtered.length > 0) {
      applySorting(sortBy, sortOrder);
    } else {
      setCurrentPage(1); // Reset to first page when no results
    }
  };

  const handleSort = (sortField: string) => {
    let newSortOrder: "asc" | "desc";
    
    if (sortField === sortBy) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newSortOrder);
    } else {
      newSortOrder = "desc";
      setSortBy(sortField);
      setSortOrder(newSortOrder);
    }
    
    setIsSortMenuOpen(false);
    applySorting(sortField, newSortOrder);
  };

  const applySorting = (sortField: string, order: "asc" | "desc") => {
    if (filteredInterventions.length === 0) return;
    
    const sorted = [...filteredInterventions].sort((a, b) => {
      let aValue: any = a[sortField as keyof Intervention];
      let bValue: any = b[sortField as keyof Intervention];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";
      
      // Handle date sorting
      if (sortField.includes('date')) {
        const aDate = new Date(aValue || new Date());
        const bDate = new Date(bValue || new Date());
        aValue = aDate.getTime();
        bValue = bDate.getTime();
      }
      
      // Handle numeric sorting
      if (sortField === 'total_charges') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Apply sorting logic
      if (order === "asc") {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
    });
    
    setFilteredInterventions(sorted);
    setCurrentPage(1); // Reset to first page after sorting
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    applySorting(sortBy, newOrder);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    setIsInterventionFormOpen(false);
  };

  const openInterventionForm = () => {
    setIsInterventionFormOpen(true);
  };

  const closeInterventionForm = () => {
    setIsInterventionFormOpen(false);
  };

  const getInterventionTypeIcon = (typeName: string) => {
    const iconMap: { [key: string]: { icon: any; color: string } } = {
      "Préparation du Sol": { icon: Crop, color: "bg-green-500" },
      "Plantation": { icon: Sparkles, color: "bg-blue-500" },
      "Palissage": { icon: Sparkles, color: "bg-green-500" },
      "Ébourgeonnage": { icon: Sparkles, color: "bg-purple-500" },
      "Effeuillage": { icon: Crop, color: "bg-green-600" },
      "Éclaircissage": { icon: Eye, color: "bg-green-600" },
      "Maintenance": { icon: Wrench, color: "bg-blue-600" },
      "Réparation": { icon: Hammer, color: "bg-red-500" },
      "Inspection": { icon: Eye, color: "bg-indigo-500" },
      "Récolte": { icon: Crop, color: "bg-yellow-500" },
      "Irrigation": { icon: Droplets, color: "bg-cyan-500" },
      "Nettoyage": { icon: Sparkles, color: "bg-gray-500" }
    };
    
    const iconData = iconMap[typeName] || { icon: FileTextIcon, color: "bg-gray-500" };
    const IconComponent = iconData.icon;
    
    return (
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", iconData.color)}>
        <IconComponent className="h-4 w-4" />
      </div>
    );
  };

  const getStatusBadge = (status: 'encours' | 'terminé') => {
    if (status === "terminé") {
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">Terminé</Badge>;
    } else if (status === "encours") {
      return <Badge className="bg-[#B4CC5F] text-white text-xs">En cours</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">{status}</Badge>;
  };

  const totalPages = Math.ceil(filteredInterventions.length / interventionsPerPage);
  const startIndex = (currentPage - 1) * interventionsPerPage;
  const endIndex = startIndex + interventionsPerPage;
  const currentInterventions = filteredInterventions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats Section - Highlighted First */}
          <div className="mb-8">
            {/* Charges Summary - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              <div className="bg-white rounded-lg px-3 sm:px-4 py-3 sm:py-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-[#B4CC5F]/10 rounded-full flex-shrink-0">
                    <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-[#B4CC5F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Total des Charges</p>
                    <p className="text-lg sm:text-xl font-bold text-[#B4CC5F] truncate">
                      {interventions.reduce((sum, intervention) => sum + intervention.total_charges, 0).toFixed(2)} MAD
                    </p>
                  </div>
                </div>
              </div>
            
              <div className="bg-white rounded-lg px-3 sm:px-4 py-3 sm:py-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Interventions</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600 truncate">{interventions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg px-3 sm:px-4 py-3 sm:py-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">En Cours</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600 truncate">
                      {interventions.filter(i => i.status === 'encours').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg px-3 sm:px-4 py-3 sm:py-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Terminées</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600 truncate">
                      {interventions.filter(i => i.status === 'terminé').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar - Mobile First */}
            <div className="mb-4 sm:mb-6">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une intervention..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-10 sm:h-11 bg-white border-gray-200 focus:border-[#B4CC5F] focus:ring-[#B4CC5F] text-sm w-full"
                />
              </div>
            </div>
          </div>

          {/* Search and Actions Bar - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
              {/* Status Filter */}
              <div className="relative w-full sm:w-auto" data-status-filter>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-10 px-3 min-h-[40px]"
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                >
                  <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {(() => {
                      const currentOption = statusFilterOptions.find(option => option.value === statusFilter);
                      return currentOption?.label || "Filtrer";
                    })()}
                  </span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform flex-shrink-0 ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isStatusFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-3 py-1 mb-2">Filtrer par statut</div>
                      {statusFilterOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleStatusFilter(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${
                              statusFilter === option.value ? 'bg-[#B4CC5F]/10 text-[#B4CC5F]' : 'text-gray-700'
                            }`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{option.label}</span>
                            {statusFilter === option.value && (
                              <span className="text-[#B4CC5F] flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#B4CC5F]"></div>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Button */}
              <div className="relative w-full sm:w-auto" data-sort-menu>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-10 px-3 min-h-[40px]"
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2 flex-shrink-0" /> : <SortDesc className="h-4 w-4 mr-2 flex-shrink-0" />}
                  <span className="truncate">
                    {(() => {
                      const currentOption = sortOptions.find(option => option.value === sortBy);
                      return currentOption?.label || "Trier";
                    })()}
                  </span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform flex-shrink-0 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isSortMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-3 py-1 mb-2">Trier par</div>
                      {sortOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSort(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${
                              sortBy === option.value ? 'bg-[#B4CC5F] text-white' : 'text-gray-700'
                            }`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{option.label}</span>
                            {sortBy === option.value && (
                              <span className="text-white flex-shrink-0">
                                {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={toggleSortOrder}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <span>Inverser l'ordre</span>
                          <span className="text-[#B4CC5F] flex-shrink-0">
                            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-10 px-3 min-h-[40px]"
                onClick={loadInterventions}
              >
                <RefreshCw className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline ml-2">Actualiser</span>
                <span className="sm:hidden ml-2">Actualiser</span>
              </Button>
            </div>

            {/* New Intervention Button */}
            <Button
              className="w-full sm:w-auto bg-[#B4CC5F] hover:bg-[#9BB84F] text-white text-sm h-10 px-4 min-h-[40px] whitespace-nowrap"
              onClick={openInterventionForm}
            >
              <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nouvelle intervention</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </div>

        {/* Interventions Table */}
        <Card className="bg-white shadow-sm border-0 mb-6">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Interventions ({filteredInterventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards View */}
            <div className="block sm:hidden">
              {/* Sort Status Indicator for Mobile */}
              <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="truncate">
                    Trié par: <span className="font-medium text-[#B4CC5F]">
                      {sortOptions.find(option => option.value === sortBy)?.label}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="text-[#B4CC5F]">
                      {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sortOrder === "asc" ? "Croissant" : "Décroissant"}
                    </span>
                  </div>
                </div>
              </div>

              {currentInterventions.map((intervention) => (
                <div key={intervention.id} className="border-b border-gray-200 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Header with icon and type */}
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0">
                        {getInterventionTypeIcon(intervention.type_nom || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {intervention.type_nom || 'Type non défini'}
                        </h3>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                        {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                      </span>
                    </div>

                    {/* Description */}
                    {intervention.description && (
                      <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {intervention.description}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {getStatusBadge(intervention.status)}
                      {intervention.valid && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">
                          Validé
                        </Badge>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="font-medium">Début:</span>
                        <span>{new Date(intervention.date_debut).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {intervention.date_fin && (
                        <div className="flex flex-wrap gap-2">
                          <span className="font-medium">Fin:</span>
                          <span>{new Date(intervention.date_fin).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Charges */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Charges: </span>
                        {intervention.total_charges > 0 ? (
                          <span className="font-semibold text-[#B4CC5F]">
                            {intervention.total_charges.toFixed(2)} MAD
                          </span>
                        ) : (
                          <span className="text-gray-400">0.00 MAD</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("type_nom")}
                      title="Cliquez pour trier par type d'intervention"
                    >
                      <div className="flex items-center gap-2">
                        Type d'intervention
                        {sortBy === "type_nom" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("date_debut")}
                      title="Cliquez pour trier par date de début"
                    >
                      <div className="flex items-center gap-2">
                        Date de début
                        {sortBy === "date_debut" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("serre_nom")}
                      title="Cliquez pour trier par nom de serre"
                    >
                      <div className="flex items-center gap-2">
                        Serre / Domaine
                        {sortBy === "serre_nom" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("status")}
                      title="Cliquez pour trier par statut"
                    >
                      <div className="flex items-center gap-2">
                        Statut
                        {sortBy === "status" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("description")}
                      title="Cliquez pour trier par description"
                    >
                      <div className="flex items-center gap-2">
                        Description
                        {sortBy === "description" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort("total_charges")}
                      title="Cliquez pour trier par charges"
                    >
                      <div className="flex items-center gap-2">
                        Charges
                        {sortBy === "total_charges" && (
                          <span className="text-[#B4CC5F] text-xs">
                            {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentInterventions.map((intervention) => (
                    <tr key={intervention.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-3">
                           {getInterventionTypeIcon(intervention.type_nom || '')}
                           <span className="text-xs sm:text-sm font-medium text-gray-900">{intervention.type_nom || 'Type non défini'}</span>
                        </div>
                      </td>
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                         <div className="text-xs sm:text-sm text-gray-700">
                           {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
                         </div>
                       </td>
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                           <span className="text-xs sm:text-sm text-gray-700">
                             {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                          </span>
                        </div>
                      </td>
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex space-x-2">
                           {getStatusBadge(intervention.status)}
                           {intervention.valid && (
                             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">Validé</Badge>
                          )}
                        </div>
                      </td>
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                         <div className="text-xs sm:text-sm text-gray-700 max-w-xs truncate">
                           {intervention.description}
                         </div>
                       </td>
                       <td className="px-4 sm:px-6 py-3 sm:py-4">
                         <div className="text-xs sm:text-sm font-medium text-gray-900">
                           {intervention.total_charges > 0 ? (
                             <span className="text-[#B4CC5F]">
                               {intervention.total_charges.toFixed(2)} MAD
                             </span>
                           ) : (
                             <span className="text-gray-500">0.00 MAD</span>
                           )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left w-full sm:w-auto">
            <span className="sm:hidden">Affichage </span>
            <span className="hidden sm:inline">Affichage de </span>
            {startIndex + 1} à {Math.min(endIndex, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>

          <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-9 min-w-[80px] sm:min-w-[90px]",
                currentPage === 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Précédent</span>
              <span className="sm:hidden">Préc.</span>
            </Button>

            {/* Desktop: Show page numbers */}
            <div className="hidden sm:flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]",
                    page === currentPage
                         ? "bg-[#B4CC5F] text-white hover:bg-[#9BB84F]"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>

            {/* Mobile: Enhanced page indicator with touch-friendly navigation */}
            <div className="sm:hidden flex items-center space-x-2 px-2">
              <div className="flex items-center space-x-1">
                {/* Quick navigation for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 text-xs hover:bg-gray-100 disabled:opacity-50"
                >
                  1
                </Button>
                {totalPages > 1 && currentPage > 3 && <span className="text-gray-400">...</span>}
                {currentPage > 1 && currentPage < totalPages && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0 text-xs bg-[#B4CC5F] text-white hover:bg-[#9BB84F]"
                  >
                    {currentPage}
                  </Button>
                )}
                {totalPages > 1 && currentPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                {totalPages > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 text-xs hover:bg-gray-100 disabled:opacity-50"
                  >
                    {totalPages}
                  </Button>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-9 min-w-[80px] sm:min-w-[90px]",
                currentPage === totalPages && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="hidden sm:inline">Suivant</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
            </Button>
          </div>
        </div>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={closeInterventionForm}
        onSubmit={handleInterventionSubmit}
      />
    </div>
  );
}
