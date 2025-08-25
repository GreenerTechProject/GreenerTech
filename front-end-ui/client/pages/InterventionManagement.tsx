import React, { useState, useEffect } from "react";
import TechHeader from "../components/TechHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
  RefreshCw,
  Sprout,
  Zap,
  Ribbon,
  Leaf,
  Target,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import InterventionForm from "../components/InterventionForm";

interface Intervention {
  id: number;
  type: string;
  id_serre: number;
  serre_nom: string;
  domaine_nom: string;
  bilan_trimestre: string;
  statut: string;
  actions: string;
  date_creation: string;
  date_modification: string;
  technicien: string; // Add technician field
  description: string;
  charges: number;
}

interface InterventionType {
  id: number;
  nom: string;
  couleur: string;
  icone: React.ComponentType<{ className?: string }>;
}

const interventionTypes: InterventionType[] = [
  { id: 1, nom: "Préparation du Sol", couleur: "bg-green-500", icone: Sprout },
  { id: 2, nom: "Plantation", couleur: "bg-blue-500", icone: Sprout },
  { id: 3, nom: "Palissage", couleur: "bg-orange-500", icone: Zap },
  { id: 4, nom: "Ébourgeonnage", couleur: "bg-purple-500", icone: Ribbon },
  { id: 5, nom: "Effeuillage", couleur: "bg-green-600", icone: Leaf },
  { id: 6, nom: "Éclaircissage", couleur: "bg-orange-600", icone: Target }
];

export default function InterventionManagement() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [interventionsPerPage] = useState(7);
  
  // Add filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});

  // Intervention form state
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState<boolean>(false);

  useEffect(() => {
    loadInterventions();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [interventions, searchTerm, statusFilter, technicianFilter, startDateFilter]);

  const loadInterventions = async () => {
    try {
      // Mock data with technician information
      const mockInterventions: Intervention[] = [
        {
          id: 1,
          type: "Maintenance préventive",
          id_serre: 1,
          serre_nom: "Serre B1",
          domaine_nom: "Domaine Sud",
          bilan_trimestre: "Billon Q1",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-20",
          date_modification: "2024-01-25",
          technicien: "Charlie Tech",
          description: "BILLON A2",
          charges: 2000.00
        },
        {
          id: 2,
          type: "Plantation",
          id_serre: 2,
          serre_nom: "Serre A2",
          domaine_nom: "Domaine Nord",
          bilan_trimestre: "Billon Q2",
          statut: "Terminé",
          actions: "Programmé",
          date_creation: "2024-01-22",
          date_modification: "2024-01-25",
          technicien: "Diana Tech",
          description: "Maintenance système",
          charges: 1500.00
        },
        {
          id: 3,
          type: "Palissage",
          id_serre: 3,
          serre_nom: "Serre C3",
          domaine_nom: "Domaine Est",
          bilan_trimestre: "Billon Q3",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-24",
          date_modification: "2024-01-26",
          technicien: "Diana Tech",
          description: "Installation support",
          charges: 1800.00
        },
        {
          id: 4,
          type: "Ébourgeonnage",
          id_serre: 4,
          serre_nom: "Serre D4",
          domaine_nom: "Domaine Ouest",
          bilan_trimestre: "Billon Q3",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-22",
          date_modification: "2024-01-26",
          technicien: "Charlie Tech",
          description: "Entretien plantes",
          charges: 1200.00
        },
        {
          id: 5,
          type: "Effeuillage",
          id_serre: 5,
          serre_nom: "Serre E5",
          domaine_nom: "Domaine Central",
          bilan_trimestre: "Billon Q2",
          statut: "Terminé",
          actions: "Programmé",
          date_creation: "2024-01-25",
          date_modification: "2024-01-28",
          technicien: "Diana Tech",
          description: "Nettoyage feuilles",
          charges: 900.00
        },
        {
          id: 6,
          type: "Éclaircissage",
          id_serre: 6,
          serre_nom: "Serre F6",
          domaine_nom: "Domaine Nord",
          bilan_trimestre: "Billon Q4",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-28",
          date_modification: "2024-01-30",
          technicien: "Charlie Tech",
          description: "Éclaircissage plantation",
          charges: 1100.00
        }
      ];

      setInterventions(mockInterventions);
      setFilteredInterventions(mockInterventions);
    } catch (error) {
      console.error("Error loading interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interventions];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(intervention =>
        intervention.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.serre_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.domaine_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.technicien.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(intervention => intervention.statut === statusFilter);
    }

    // Apply technician filter
    if (technicianFilter !== "all") {
      filtered = filtered.filter(intervention => intervention.technicien === technicianFilter);
    }

    // Apply start date filter
    if (startDateFilter) {
      filtered = filtered.filter(intervention => 
        intervention.date_creation === startDateFilter
      );
    }

    setFilteredInterventions(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateActiveFilters('status', value);
  };

  const handleTechnicianFilterChange = (value: string) => {
    setTechnicianFilter(value);
    updateActiveFilters('technician', value);
  };

  const handleStartDateFilterChange = (value: string) => {
    setStartDateFilter(value);
    updateActiveFilters('startDate', value);
  };

  const updateActiveFilters = (key: string, value: string) => {
    if (value === "all" || value === "") {
      const newFilters = { ...activeFilters };
      delete newFilters[key];
      setActiveFilters(newFilters);
    } else {
      setActiveFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTechnicianFilter("all");
    setStartDateFilter("");
    setActiveFilters({});
  };

  const removeFilter = (key: string) => {
    if (key === 'status') {
      setStatusFilter("all");
    } else if (key === 'technician') {
      setTechnicianFilter("all");
    } else if (key === 'startDate') {
      setStartDateFilter("");
    }
    
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
  };

  const refreshData = () => {
    loadInterventions();
  };

  // Intervention form handlers
  const handleSubmitIntervention = (data: any) => {
    console.log("Intervention submitted:", data);
    // Refresh the interventions list after successful submission
    loadInterventions();
    setIsInterventionFormOpen(false);
  };

  const handleSaveDraft = () => {
    console.log("Save draft functionality - not implemented yet");
    // TODO: Implement draft saving functionality
    setIsInterventionFormOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get unique technicians for filter dropdown
  const getUniqueTechnicians = () => {
    const technicians = [...new Set(interventions.map(int => int.technicien))];
    return technicians.sort();
  };

  // Get unique statuses for filter dropdown
  const getUniqueStatuses = () => {
    const statuses = [...new Set(interventions.map(int => int.statut))];
    return statuses.sort();
  };

  // Calculate pagination
  const indexOfLastIntervention = currentPage * interventionsPerPage;
  const indexOfFirstIntervention = indexOfLastIntervention - interventionsPerPage;
  const currentInterventions = filteredInterventions.slice(indexOfFirstIntervention, indexOfLastIntervention);
  const totalPages = Math.ceil(filteredInterventions.length / interventionsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Map user role to TechHeader role
  const getTechHeaderRole = (userRole?: string) => {
    switch (userRole) {
      case "technicien":
        return "technicien" as const;
      case "technicien_superieur":
        return "technicien_sup" as const;
      default:
        return "technicien" as const;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role={getTechHeaderRole(user?.role)} />
      
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interventions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {interventions.filter(i => i.statut === "En cours").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {interventions.filter(i => i.statut === "Terminé").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {interventions.filter(i => i.statut === "Rejetée").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par type, serre, domaine, description ou technicien..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Tous les statuts</option>
                    {getUniqueStatuses().map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                </div>

                {/* Technician Filter */}
                <div className="relative">
                  <select
                    value={technicianFilter}
                    onChange={(e) => handleTechnicianFilterChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Tous les techniciens</option>
                    {getUniqueTechnicians().map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Start Date Filter */}
                <div className="relative">
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => handleStartDateFilterChange(e.target.value)}
                    className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Refresh Button */}
                <Button
                  onClick={refreshData}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Filtres actifs:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeFilters).map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {key === 'status' && 'Statut: '}
                      {key === 'technician' && 'Technicien: '}
                      {key === 'startDate' && 'Date de début: '}
                      {value}
                      <button
                        onClick={() => removeFilter(key)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    onClick={clearAllFilters}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Effacer tous les filtres
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interventions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Interventions ({filteredInterventions.length})
              </CardTitle>
              <Button
                onClick={() => setIsInterventionFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle intervention
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Type d'intervention</th>
                    <th className="text-left py-3 px-4 font-medium">Date de début</th>
                    <th className="text-left py-3 px-4 font-medium">Serre / Domaine</th>
                    <th className="text-left py-3 px-4 font-medium">Technicien</th>
                    <th className="text-left py-3 px-4 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 font-medium">Description</th>
                    <th className="text-left py-3 px-4 font-medium">Charges</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInterventions.map((intervention) => (
                    <tr key={intervention.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {(() => {
                              const IconComponent = interventionTypes.find(t => t.nom === intervention.type)?.icone;
                              return IconComponent ? <IconComponent className="h-5 w-5" /> : <Wrench className="h-5 w-5" />;
                            })()}
                          </span>
                          {intervention.type}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(intervention.date_creation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {intervention.serre_nom} / {intervention.domaine_nom}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {intervention.technicien.split(' ').map(n => n[0]).join('')}
                          </div>
                          {intervention.technicien}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={intervention.statut === "Terminé" ? "default" : "secondary"}
                          className={cn(
                            intervention.statut === "Terminé" && "bg-green-100 text-green-800",
                            intervention.statut === "En cours" && "bg-blue-100 text-blue-800",
                            intervention.statut === "Rejetée" && "bg-red-100 text-red-800"
                          )}
                        >
                          {intervention.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{intervention.description}</td>
                      <td className="py-3 px-4 font-medium">
                        {intervention.charges.toFixed(2)} MAD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Affichage de {indexOfFirstIntervention + 1} à {Math.min(indexOfLastIntervention, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length > 1 ? 's' : ''}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intervention Form Dialog */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleSubmitIntervention}
      />
    </div>
  );
}
