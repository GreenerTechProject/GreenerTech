import React, { useState, useEffect } from "react";
import TechHeader from "../components/TechHeader";
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
  Euro
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



// We'll use the type names from the backend data instead of hardcoded types

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
      if (isSortMenuOpen) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen]);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      // Fetch real data from backend using intervention service
      const interventions = await InterventionService.getInterventionsByAssignedSerres();
      console.log("Loaded interventions:", interventions);
      console.log("First intervention sample:", interventions[0]);
      if (interventions.length > 0) {
        console.log("Available fields:", Object.keys(interventions[0]));
      }
      setInterventions(interventions);
      setFilteredInterventions(interventions);
      
      // Apply initial sorting
      if (sortBy) {
        applySorting(sortBy, sortOrder);
      }
    } catch (error) {
      console.error("Error loading interventions:", error);
      // Set empty array on error to prevent crashes
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
    let filtered = interventions;

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(intervention => intervention.status === status);
    }

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(intervention =>
        (intervention.type_nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (intervention.serre_nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (intervention.domaine_nom || '').toLowerCase().includes(search.toLowerCase()) ||
        intervention.description.toLowerCase().includes(search.toLowerCase())
      );
    }

      setFilteredInterventions(filtered);
    
    // Re-apply current sorting after filtering
    if (sortBy) {
      applySorting(sortBy, sortOrder);
    }
  };

  const handleSort = (sortField: string) => {
    let newSortOrder: "asc" | "desc";
    
    console.log(`handleSort called: sortField=${sortField}, current sortBy=${sortBy}, current sortOrder=${sortOrder}`);
    
    // If clicking the same field, toggle order; if new field, set to desc
    if (sortField === sortBy) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newSortOrder);
    } else {
      newSortOrder = "desc";
      setSortBy(sortField);
      setSortOrder(newSortOrder);
    }
    
    console.log(`New sort values: sortField=${sortField}, newSortOrder=${newSortOrder}`);
    
    setIsSortMenuOpen(false);
    
    // Apply sorting immediately with the new values
    applySorting(sortField, newSortOrder);
  };

  const applySorting = (sortField: string, order: "asc" | "desc") => {
    console.log(`Applying sorting: field=${sortField}, order=${order}, items=${filteredInterventions.length}`);
    
    if (filteredInterventions.length === 0) {
      console.log("No items to sort");
      return;
    }
    
    // Debug: show sample values for the sort field
    const sampleValues = filteredInterventions.slice(0, 3).map(item => ({
      id: item.id,
      [sortField]: item[sortField as keyof Intervention]
    }));
    console.log(`Sample values for field '${sortField}':`, sampleValues);
    
    const sorted = [...filteredInterventions].sort((a, b) => {
      let aValue: any = a[sortField as keyof Intervention];
      let bValue: any = b[sortField as keyof Intervention];
      
      console.log(`Comparing: a[${sortField}]=${aValue}, b[${sortField}]=${bValue}`);
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";
      
      // Handle date sorting
      if (sortField.includes('date')) {
        aValue = new Date(aValue || new Date()).getTime();
        bValue = new Date(bValue || new Date()).getTime();
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
    
    console.log(`Sorting completed. First few items:`, sorted.slice(0, 3));
    setFilteredInterventions(sorted);
    setCurrentPage(1);
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
    // Here you would typically send the data to your backend
    // For now, we'll just close the form
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention draft saved:", data);
    // Here you would typically save the draft to your backend
    // For now, we'll just close the form
    setIsInterventionFormOpen(false);
  };

  const openInterventionForm = () => {
    setIsInterventionFormOpen(true);
  };

  const closeInterventionForm = () => {
    setIsInterventionFormOpen(false);
  };

  const getInterventionTypeIcon = (typeName: string) => {
    // Professional icon mapping for common intervention types
    const iconMap: { [key: string]: { icon: any; color: string } } = {
      "Préparation du Sol": { icon: Crop, color: "bg-green-500" },
      "Plantation": { icon: Sparkles, color: "bg-blue-500" },
      "Palissage": { icon: Sparkles, color: "bg-orange-500" },
      "Ébourgeonnage": { icon: Sparkles, color: "bg-purple-500" },
      "Effeuillage": { icon: Crop, color: "bg-green-600" },
      "Éclaircissage": { icon: Eye, color: "bg-orange-600" },
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
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">Terminé</Badge>;
    } else if (status === "encours") {
      return <Badge className="bg-red-500 text-white text-xs">En cours</Badge>;
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
      <TechHeader role="technicien" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
         <div className="mb-6 sm:mb-8">
           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Gestion des Interventions
          </h1>
           <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Suivi et gestion des interventions entre superviseurs et techniciens
          </p>
           
           {/* Charges Summary */}
           <div className="mt-4 flex flex-wrap gap-4">
                            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                 <div className="flex items-center gap-2">
                   <Euro className="h-5 w-5 text-[#B4CC5F]" />
                   <div>
                     <p className="text-xs text-gray-500 font-medium">Total des Charges</p>
                     <p className="text-lg font-bold text-[#B4CC5F]">
                       {interventions.reduce((sum, intervention) => sum + intervention.total_charges, 0).toFixed(2)} MAD
                     </p>
                   </div>
                 </div>
               </div>
             
             <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
               <div className="flex items-center gap-2">
                 <BarChart3 className="h-5 w-5 text-blue-600" />
                 <div>
                   <p className="text-xs text-gray-500 font-medium">Interventions</p>
                   <p className="text-lg font-bold text-blue-600">{interventions.length}</p>
                 </div>
               </div>
             </div>
             
             <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
               <div className="flex items-center gap-2">
                 <Calendar className="h-5 w-5 text-orange-600" />
                 <div>
                   <p className="text-xs text-gray-500 font-medium">En Cours</p>
                   <p className="text-lg font-bold text-orange-600">
                     {interventions.filter(i => i.status === 'encours').length}
                   </p>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une Intervention..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                 className="pl-10 bg-white border-gray-200 focus:border-[#B4CC5F] focus:ring-[#B4CC5F] text-sm sm:text-base"
              />
            </div>
          </div>
          
                     <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
             {/* Status Filter */}
             <div className="relative">
               <Button 
                 variant="outline" 
                 className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                 onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
               >
                 {(() => {
                   const currentOption = statusFilterOptions.find(option => option.value === statusFilter);
                   const IconComponent = currentOption?.icon;
                   return (
                     <>
                       {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                       {currentOption?.label}
                     </>
                   );
                 })()}
                 <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
               </Button>
               
               {/* Status Filter Dropdown Menu */}
               {isStatusFilterOpen && (
                 <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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

             {/* Sort Button */}
             <div className="relative">
               <Button 
                 variant="outline" 
                 className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                 onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
               >
                 {(() => {
                   const currentOption = sortOptions.find(option => option.value === sortBy);
                   const IconComponent = currentOption?.icon;
                   return (
                     <>
                       {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                       {currentOption?.label}
                     </>
                   );
                 })()}
                 <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
               
               {/* Sort Dropdown Menu */}
               {isSortMenuOpen && (
                 <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                         <span className="text-[#B4CC5F]">
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
               className="bg-card border-border text-foreground hover:bg-muted text-sm sm:text-base"
               onClick={loadInterventions}
             >
               <RefreshCw className="h-4 w-4" />
             </Button>

             <Button 
               className="bg-[#B4CC5F] hover:bg-[#9BB84F] text-white text-sm sm:text-base"
               onClick={openInterventionForm}
             >
              <FileText className="mr-2 h-4 w-4" />
               <span className="hidden sm:inline">Demande une intervention</span>
               <span className="sm:hidden">Nouvelle intervention</span>
            </Button>
          </div>
        </div>

        {/* Interventions Table */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-4 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Interventions ({filteredInterventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards View */}
            <div className="block sm:hidden">
              {/* Sort Status Indicator for Mobile */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Trié par: <span className="font-medium text-[#B4CC5F]">
                      {sortOptions.find(option => option.value === sortBy)?.label}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#B4CC5F]">
                      {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sortOrder === "asc" ? "Croissant" : "Décroissant"}
                    </span>
                  </div>
                </div>
              </div>
              
                             {currentInterventions.map((intervention) => (
                 <div key={intervention.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                   <div className="space-y-3">
                     <div className="flex items-center space-x-3">
                       {getInterventionTypeIcon(intervention.type_nom || '')}
                       <span className="text-sm font-medium text-gray-900">{intervention.type_nom || 'Type non défini'}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <MapPin className="h-4 w-4 text-gray-400" />
                       <span className="text-xs text-gray-700">
                         {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                       </span>
                     </div>
                     <div className="text-xs text-gray-600">
                       {intervention.description}
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {getStatusBadge(intervention.status)}
                       {intervention.valid && (
                         <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">Validé</Badge>
                       )}
                     </div>
                     <div className="text-xs text-gray-500">
                       Début: {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
                       {intervention.date_fin && ` | Fin: ${new Date(intervention.date_fin).toLocaleDateString('fr-FR')}`}
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="text-xs text-gray-500">
                         Charges: {intervention.total_charges > 0 ? (
                           <span className="font-medium text-[#B4CC5F]">
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group"
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
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-3">
                           {getInterventionTypeIcon(intervention.type_nom || '')}
                           <span className="text-xs sm:text-sm font-medium text-gray-900">{intervention.type_nom || 'Type non défini'}</span>
                        </div>
                      </td>
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
                         <div className="text-xs sm:text-sm text-gray-700">
                           {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
                         </div>
                       </td>
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                           <span className="text-xs sm:text-sm text-gray-700">
                             {intervention.serre_nom || 'Serre inconnue'} / {intervention.domaine_nom || 'Domaine inconnu'}
                          </span>
                        </div>
                      </td>
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex space-x-2">
                           {getStatusBadge(intervention.status)}
                           {intervention.valid && (
                             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">Validé</Badge>
                          )}
                        </div>
                      </td>
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
                         <div className="text-xs sm:text-sm text-gray-700 max-w-xs truncate">
                           {intervention.description}
                         </div>
                       </td>
                       <td className="px-3 sm:px-6 py-3 sm:py-4">
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mt-6">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Précédent</span>
              <span className="sm:hidden">Préc.</span>
            </Button>
            
            {/* Show limited page numbers on mobile */}
            <div className="hidden sm:flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={cn(
                  page === currentPage
                       ? "bg-[#B4CC5F] text-white hover:bg-[#9BB84F]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                {page}
              </Button>
            ))}
            </div>
            
            {/* Mobile page indicator */}
            <div className="sm:hidden flex items-center space-x-2">
              <span className="text-xs text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Suivant</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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
