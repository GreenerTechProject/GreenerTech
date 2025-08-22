import React, { useState, useEffect, useCallback } from "react";
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
  User,
  Clock,
  XCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { serreService } from "../services/serreService";
import { InterventionService, Intervention } from "../services/interventionService";
import { userService, User as UserInterface } from "../services/userService";
import { useToast } from "@/hooks/use-toast";

const sortOptions = [
  { value: "date_debut", label: "Date de début", icon: Calendar },
  { value: "date_fin", label: "Date de fin", icon: RefreshCw },
  { value: "type_nom", label: "Type d'intervention", icon: Tag },
  { value: "status", label: "Statut", icon: BarChart3 },
  { value: "serre_nom", label: "Nom de la serre", icon: Building2 },
  { value: "domaine_nom", label: "Nom du domaine", icon: Globe },
  { value: "technician_name", label: "Technicien", icon: User },
  { value: "description", label: "Description", icon: FileTextIcon },
  { value: "total_charges", label: "Charges", icon: Euro },
];

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts", icon: BarChart3 },
  { value: "encours", label: "En cours", icon: RefreshCw },
  { value: "terminé", label: "Terminé", icon: Calendar },
  { value: "en_attente", label: "En attente", icon: Clock },
  { value: "rejetee", label: "Rejetée", icon: XCircle },
];

interface Serre {
  id: string;
  nom: string;
  domaine?: {
    nom: string;
  };
}

export default function TechnicienSupInterventions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedSerres, setAssignedSerres] = useState<Serre[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [interventionsPerPage] = useState(7);
  const [sortBy, setSortBy] = useState<string>("date_debut");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [technicians, setTechnicians] = useState<UserInterface[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [isTechnicianFilterOpen, setIsTechnicianFilterOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Load interventions after initial data is loaded (technicians and serres)
  useEffect(() => {
    if (technicians.length > 0 && assignedSerres.length > 0 && !loading) {
      loadInterventions();
    }
  }, [technicians, assignedSerres, loading]);

  // Reset filtered results when interventions change (e.g., after refresh)
  useEffect(() => {
    if (interventions.length > 0) {
      setFilteredInterventions(interventions);
      setCurrentPage(1);
    }
  }, [interventions]);

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

      // Check if click is outside technician filter menu
      if (isTechnicianFilterOpen && !target.closest('[data-technician-filter]')) {
        setIsTechnicianFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen, isStatusFilterOpen, isTechnicianFilterOpen]);

  const loadData = async () => {
    if (loading) return; // Prevent duplicate calls

    try {
      setLoading(true);
      // Load technicians and serres in parallel for better performance
      await Promise.all([
        loadTechnicians(),
        loadAssignedSerres()
      ]);
      // loadInterventions will be called by useEffect when both are available
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedSerres = async () => {
    try {
      if (user?.id) {
        const serres = await serreService.getSerresByCurrentUser();
        setAssignedSerres(serres);
      }
    } catch (error) {
      // Error loading assigned serres
    }
  };

  const loadTechnicians = async () => {
    try {
      if (user?.id) {
        // First try to get technicians directly supervised by the current user
        let supervisedTechnicians = await userService.getTechniciansBySupervisor(Number(user.id));
        
        if (supervisedTechnicians.length > 0) {
          // We found technicians with explicit supervisor relationship
          setTechnicians(supervisedTechnicians);
        } else {
          // Fallback: get all technicians in company and filter by supervisor relationship
          if (user?.id_entreprise) {
            const allTechs = await userService.getTechniciansByCompany(user.id_entreprise);
            
            // Filter to only show technicians that the current supervisor is supervising
            // We'll check multiple possible supervisor field names
            const filteredTechnicians = allTechs.filter(tech => {
              // Check various possible supervisor field names
              const techAny = tech as any;
              const supervisorId = techAny.supervisor_id || techAny.id_superviseur || techAny.id_assigned;
              
              if (supervisorId) {
                // If technician has a supervisor field, check if it matches current user
                return Number(supervisorId) === Number(user.id);
              } else {
                // Fallback: check if technician has interventions in supervisor's assigned serres
                return interventions.some(intervention => 
                  Number(intervention.id_user) === Number(tech.id) &&
                  assignedSerres.some(serre => 
                    intervention.serre_nom === serre.nom
                  )
                );
              }
            });
            
            setTechnicians(filteredTechnicians);
          }
        }
      }
    } catch (error) {
      setTechnicians([]);
    }
  };

  const loadInterventions = async () => {
    if (loading) return; // Prevent duplicate calls

    try {
      setLoading(true);
      // Use the dedicated service for assigned serres - more efficient!
      const interventions = await InterventionService.getInterventionsByAssignedSerres();

      // Create a map of technicians for faster lookup
      const technicianMap = new Map(technicians.map(tech => [Number(tech.id), tech]));

      // Add technician names to interventions
      const interventionsWithTechnicianNames = interventions.map((intervention) => {
        // Ensure both IDs are numbers for proper comparison
        const interventionUserId = Number(intervention.id_user);
        let technician = technicianMap.get(interventionUserId);

        // Determine technician name
        let technicianName = technician?.name;
        if (!technicianName) {
          if (user?.id && interventionUserId === Number(user.id)) {
            technicianName = "Vous-même";
          } else {
            technicianName = `Technicien #${interventionUserId}`;
          }
        }

        return {
          ...intervention,
          technician_name: technicianName
        };
      });

      setInterventions(interventionsWithTechnicianNames);
      setFilteredInterventions(interventionsWithTechnicianNames);

      if (sortBy) {
        applySorting(sortBy, sortOrder);
      }
    } catch (error) {
      setInterventions([]);
      setFilteredInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    applyFilters(value, statusFilter, technicianFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    applyFilters(searchTerm, status, technicianFilter);
  };

  const handleTechnicianFilter = (technicianId: string) => {
    setTechnicianFilter(technicianId);
    setCurrentPage(1);
    applyFilters(searchTerm, statusFilter, technicianId);
  };

  const applyFilters = useCallback((search: string, status: string, technicianId: string) => {
    // Start with a fresh copy of all interventions
    let filtered = [...interventions];

    // Apply status filter first (most restrictive)
    if (status !== "all") {
      filtered = filtered.filter(intervention => {
        return intervention.status === status;
      });
    }

    // Apply technician filter (second most restrictive)
    if (technicianId !== "all") {
      const selectedTechnician = technicians.find(tech => String(tech.id) === technicianId);

      if (selectedTechnician) {
        filtered = filtered.filter(intervention => {
          return String(intervention.id_user) === String(selectedTechnician.id);
        });
      }
    }

    // Apply search filter last (least restrictive but most expensive)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(intervention => {
        const typeMatch = (intervention.type_nom || '').toLowerCase().includes(searchLower);
        const serreMatch = (intervention.serre_nom || '').toLowerCase().includes(searchLower);
        const domaineMatch = (intervention.domaine_nom || '').toLowerCase().includes(searchLower);
        const descriptionMatch = (intervention.description || '').toLowerCase().includes(searchLower);
        const technicianMatch = (intervention.technician_name || '').toLowerCase().includes(searchLower);

        return typeMatch || serreMatch || domaineMatch || descriptionMatch || technicianMatch;
      });
    }
    
    setFilteredInterventions(filtered);
    setCurrentPage(1);
    
    // Re-apply current sorting after filtering
    if (sortBy && filtered.length > 0) {
      applySorting(sortBy, sortOrder);
    }
  }, [interventions, technicians, sortBy, sortOrder]);

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
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    applySorting(sortBy, newOrder);
  };

  const getInterventionTypeIcon = (intervention: Intervention) => {
    // Try to get the type name from multiple possible fields
    const typeName = intervention.type_nom || intervention.type_tache || '';
    
    // Handle null/undefined/empty type names
    if (!typeName || typeName.trim() === '') {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-gray-500">
          <FileTextIcon className="h-4 w-4" />
        </div>
      );
    }

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

  const getInterventionTypeName = (intervention: Intervention) => {
    // Try to get the type name from multiple possible fields
    const typeName = intervention.type_nom || intervention.type_tache || '';
    
    if (!typeName || typeName.trim() === '') {
      // If no type name, try to get it from the id_type_tache
      if (intervention.id_type_tache) {
        return `Type ${intervention.id_type_tache}`;
      }
      return 'Type non défini';
    }
    return typeName;
  };

  const getStatusBadge = (status: string) => {
    if (status === "terminé") {
      return <Badge className="bg-green-500 text-white text-xs">Terminé</Badge>;
    } else if (status === "encours") {
      return <Badge className="bg-blue-500 text-white text-xs">En cours</Badge>;
    } else if (status === "en_attente") {
      return <Badge className="bg-yellow-500 text-white text-xs">En attente</Badge>;
    } else if (status === "rejetee") {
      return <Badge className="bg-red-500 text-white text-xs">Rejetée</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">{status}</Badge>;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section - Replaced with Stats Dashboard */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Interventions */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Interventions</p>
                  <p className="text-2xl font-bold text-gray-900">{interventions.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#B4CC5F]/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#B4CC5F]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* En Cours */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Cours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {interventions.filter(i => i.status === 'encours').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terminées */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {interventions.filter(i => i.status === 'terminé').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* En Attente */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {interventions.filter(i => i.status === 'en_attente').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejetées */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejetées</p>
                  <p className="text-2xl font-bold text-red-600">
                    {interventions.filter(i => i.status === 'rejetee').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Actions Bar - Responsive */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search Section - Full width on mobile, left side on desktop */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par type, serre, domaine, description ou technicien..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-11 text-sm border-gray-300 focus:border-[#B4CC5F] focus:ring-[#B4CC5F]"
            />
          </div>
        </div>

        {/* Filters Section - Stack on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
          {/* Status Filter */}
          <div className="relative" data-status-filter>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-11 px-4 min-w-[140px]"
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {(() => {
                  const currentOption = statusFilterOptions.find(option => option.value === statusFilter);
                  return currentOption?.label || "Statut";
                })()}
              </span>
              <span className="sm:hidden">Statut</span>
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isStatusFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
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
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1 text-left">{option.label}</span>
                        {statusFilter === option.value && (
                          <span className="text-[#B4CC5F]">
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

          {/* Technician Filter */}
          <div className="relative" data-technician-filter>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-11 px-4 min-w-[160px]"
              onClick={() => setIsTechnicianFilterOpen(!isTechnicianFilterOpen)}
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {(() => {
                  if (technicianFilter === "all") return "Techniciens";
                  const technician = technicians.find(tech => String(tech.id) === technicianFilter);
                  return technician?.name || "Technicien";
                })()}
              </span>
              <span className="sm:hidden">Techniciens</span>
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isTechnicianFilterOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isTechnicianFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-3 py-1 mb-2">Filtrer par technicien</div>
                  <button
                    onClick={() => handleTechnicianFilter("all")}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${
                      technicianFilter === "all" ? 'bg-[#B4CC5F]/10 text-[#B4CC5F]' : 'text-gray-700'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span className="flex-1 text-left">Tous les techniciens</span>
                    {technicianFilter === "all" && (
                      <span className="text-[#B4CC5F]">
                        <div className="w-2 h-2 rounded-full bg-[#B4CC5F]"></div>
                      </span>
                    )}
                  </button>
                  {technicians.map((technician) => (
                    <button
                      key={technician.id}
                      onClick={() => handleTechnicianFilter(technician.id.toString())}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${
                        technicianFilter === String(technician.id) ? 'bg-[#B4CC5F]/10 text-[#B4CC5F]' : 'text-gray-700'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="flex-1 text-left">{technician.name || `Technicien ${technician.id}`}</span>
                      {technicianFilter === String(technician.id) && (
                        <span className="text-[#B4CC5F]">
                          <div className="w-2 h-2 rounded-full bg-[#B4CC5F]"></div>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative" data-sort-menu>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-11 px-4 min-w-[120px]"
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">
                {(() => {
                  const currentOption = sortOptions.find(option => option.value === sortBy);
                  return currentOption?.label || "Trier";
                })()}
              </span>
              <span className="sm:hidden">Trier</span>
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isSortMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
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
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1 text-left">{option.label}</span>
                        {sortBy === option.value && (
                          <span className="text-white">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button - Mobile friendly */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-10 px-4"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setTechnicianFilter("all");
            setCurrentPage(1);
            loadData();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Actualiser</span>
          <span className="sm:hidden">Rafraîchir</span>
        </Button>
      </div>

      {/* Filter Summary */}
      {(searchTerm || statusFilter !== "all" || technicianFilter !== "all") && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-700">Filtres actifs:</span>
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  Recherche: "{searchTerm}"
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  Statut: {statusFilterOptions.find(opt => opt.value === statusFilter)?.label}
                </Badge>
              )}
              {technicianFilter !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  Technicien: {technicians.find(tech => String(tech.id) === technicianFilter)?.name}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTechnicianFilter("all");
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer tous les filtres
            </Button>
          </div>
        </div>
      )}

      {/* Interventions Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Interventions ({filteredInterventions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4 p-4">
            {currentInterventions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filteredInterventions.length === 0 ? "Aucune intervention trouvée" : "Aucune intervention sur cette page"}
                </h3>
                <p className="text-gray-500">
                  {filteredInterventions.length === 0 
                    ? "Aucune intervention ne correspond aux filtres appliqués. Essayez de modifier vos critères de recherche."
                    : "Modifiez les filtres ou naviguez vers une autre page pour voir plus d'interventions."
                  }
                </p>
              </div>
            ) : (
              currentInterventions.map((intervention) => (
                <div key={intervention.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getInterventionTypeIcon(intervention)}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{getInterventionTypeName(intervention)}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(intervention.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-[#B4CC5F]" />
                      <span className="text-sm font-medium text-[#B4CC5F]">
                        {intervention.technician_name}
                      </span>
                    </div>
                    
                    {intervention.description && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span> {intervention.description}
                      </div>
                    )}
                    
                    <div className="text-sm font-medium">
                      <span className="text-gray-600">Charges:</span>{' '}
                      {intervention.total_charges > 0 ? (
                        <span className="text-[#B4CC5F]">
                          {intervention.total_charges.toFixed(2)} MAD
                        </span>
                      ) : (
                        <span className="text-gray-500">0.00 MAD</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            {currentInterventions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filteredInterventions.length === 0 ? "Aucune intervention trouvée" : "Aucune intervention sur cette page"}
                </h3>
                <p className="text-gray-500">
                  {filteredInterventions.length === 0 
                    ? "Aucune intervention ne correspond aux filtres appliqués. Essayez de modifier vos critères de recherche."
                    : "Modifiez les filtres ou naviguez vers une autre page pour voir plus d'interventions."
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type d'intervention</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date de début</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Serre / Domaine</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Technicien</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentInterventions.map((intervention) => (
                    <tr key={intervention.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {getInterventionTypeIcon(intervention)}
                          <span className="text-sm font-medium text-gray-900">{getInterventionTypeName(intervention)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-[#B4CC5F]" />
                          <div>
                            <span className="text-xs text-gray-500 block">Technicien:</span>
                            <span className="text-sm font-bold text-[#B4CC5F]">
                              {intervention.technician_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {getStatusBadge(intervention.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {intervention.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredInterventions.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Précédent</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-9 w-9 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 px-3"
            >
              <span className="hidden sm:inline mr-1">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center">
          <div className="text-gray-500">
            {interventions.length === 0 ? (
              <p>Aucune intervention disponible</p>
            ) : (
              <p>Aucune intervention ne correspond aux filtres appliqués</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
