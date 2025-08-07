import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  ChevronDown,
  Edit,
  Sprout,
  TreePine,
  Settings,
  Scissors,
  Leaf,
  Zap,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { interventionService, type InterventionDisplay } from "../services/interventionService";
import { typeTacheService, type TypeTache } from "../services/typeTacheService";
import { serreBackendService, type SerreBackend } from "../services/serreBackendService";
import InterventionForm from "../components/InterventionForm";

// Mapping of type names to icons and colors
const getTypeIcon = (typeName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Préparation du Sol': <Sprout className="h-4 w-4 text-white" />,
    'Plantation': <TreePine className="h-4 w-4 text-white" />,
    'Palissage': <Settings className="h-4 w-4 text-white" />,
    'Ébourgeonnage': <Scissors className="h-4 w-4 text-white" />,
    'Effeuillage': <Leaf className="h-4 w-4 text-white" />,
    'Éclaircissage': <Zap className="h-4 w-4 text-white" />,
  };
  return icons[typeName] || <Settings className="h-4 w-4 text-white" />;
};

const getTypeColor = (typeName: string) => {
  const colors: Record<string, string> = {
    'Préparation du Sol': 'bg-greener-400',
    'Plantation': 'bg-blue-600',
    'Palissage': 'bg-yellow-500',
    'Ébourgeonnage': 'bg-purple-600',
    'Effeuillage': 'bg-green-600',
    'Éclaircissage': 'bg-orange-600',
  };
  return colors[typeName] || 'bg-gray-600';
};

const getStatusColor = (status: string, isValid: boolean) => {
  if (status === 'terminé') {
    return 'bg-green-500 text-white';
  }
  if (status === 'encours') {
    return 'bg-red-500 text-white';
  }
  return 'bg-gray-300 text-gray-600';
};

const getActionButtonColor = (status: string, isValid: boolean) => {
  if (status === 'terminé' && isValid) {
    return 'bg-green-500 text-white';
  }
  if (status === 'encours') {
    return 'bg-gray-300 text-gray-600';
  }
  return 'bg-gray-300 text-gray-600';
};

export default function Interventions() {
  const [interventions, setInterventions] = useState<InterventionDisplay[]>([]);
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([]);
  const [serres, setSerres] = useState<SerreBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  const { user } = useAuth();

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [interventionsData, typeTachesData, serresData] = await Promise.all([
          interventionService.getAllInterventions(),
          typeTacheService.getAllTypeTaches(),
          serreBackendService.getAllSerres(),
        ]);
        
        setInterventions(interventionsData);
        setTypeTaches(typeTachesData);
        setSerres(serresData);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter interventions based on search
  const filteredInterventions = interventions.filter(intervention => {
    const typeTache = typeTaches.find(t => t.id === intervention.id_type_tache);
    const serre = serres.find(s => s.id === intervention.id_serre);
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      intervention.description.toLowerCase().includes(searchLower) ||
      typeTache?.nom.toLowerCase().includes(searchLower) ||
      serre?.nom.toLowerCase().includes(searchLower) ||
      serreBackendService.formatSerreDisplay(serre!).toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInterventions = filteredInterventions.slice(startIndex, endIndex);

  const handleInterventionSubmit = async (data: any) => {
    try {
      await interventionService.createIntervention({
        description: data.description,
        id_serre: parseInt(data.serreId),
        id_type_tache: parseInt(data.interventionType),
        total_charges: data.total_charges || 0,
        date_debut: data.interventionDate,
      });
      
      // Reload interventions
      const updatedInterventions = await interventionService.getAllInterventions();
      setInterventions(updatedInterventions);
      setIsInterventionFormOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création de l\'intervention:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'intervention');
    }
  };

  const handleValidateIntervention = async (id: number) => {
    try {
      await interventionService.validateIntervention(id);
      // Reload interventions
      const updatedInterventions = await interventionService.getAllInterventions();
      setInterventions(updatedInterventions);
    } catch (err) {
      console.error('Erreur lors de la validation de l\'intervention:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation de l\'intervention');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des interventions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            </div>
          </Button>
          
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/e838108a21bc561dc1bf539fbfff0473770f8f68?width=364" 
            alt="GreenerTech Logo" 
            className="h-12 w-auto"
          />
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded">
                <div className="w-6 h-4 bg-blue-600"></div>
              </div>
              <div className="p-2 bg-blue-600 rounded">
                <div className="w-6 h-4 bg-blue-600"></div>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Interventions</h1>
          <p className="text-gray-600 mt-2">Suivi et gestion des interventions entre superviseurs et techniciens</p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une Intervention..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              Trier par
            </Button>
          </div>
          
          <Button 
            className="bg-greener-400 hover:bg-greener-500 text-white flex items-center gap-2"
            onClick={() => setIsInterventionFormOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Demande une intervention
          </Button>
        </div>

        {/* Interventions Table */}
        <Card className="overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <div className="grid grid-cols-4 gap-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div>Type d'intervention</div>
              <div>ID Serre</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>
          </div>
          
          <CardContent className="p-0">
            {currentInterventions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Settings className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune intervention trouvée
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Aucune intervention ne correspond à votre recherche.' : 'Aucune intervention disponible.'}
                </p>
              </div>
            ) : (
              currentInterventions.map((intervention, index) => {
                const typeTache = typeTaches.find(t => t.id === intervention.id_type_tache);
                const serre = serres.find(s => s.id === intervention.id_serre);
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={intervention.id}
                    className={cn(
                      "grid grid-cols-4 gap-6 items-center px-6 py-4 border-b border-gray-100",
                      isEven ? "bg-gray-50" : "bg-white"
                    )}
                  >
                    {/* Type d'intervention */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        getTypeColor(typeTache?.nom || '')
                      )}>
                        {getTypeIcon(typeTache?.nom || '')}
                      </div>
                      <span className="font-medium text-gray-900">
                        {typeTache?.nom || 'Type inconnu'}
                      </span>
                    </div>

                    {/* ID Serre */}
                    <div className="text-gray-900">
                      {serre ? serreBackendService.formatSerreDisplay(serre) : 'Serre inconnue'}
                    </div>

                    {/* Statut */}
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-xs rounded-full px-3 py-1",
                        getStatusColor(intervention.status, intervention.valid)
                      )}>
                        {intervention.status === 'terminé' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div>
                      {intervention.status === 'terminé' && intervention.valid ? (
                        <Badge className="bg-green-500 text-white text-xs rounded-full px-3 py-1">
                          Programmé
                        </Badge>
                      ) : intervention.status === 'encours' ? (
                        <Badge className="bg-red-500 text-white text-xs rounded-full px-3 py-1">
                          En cours
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          {(user?.role === 'directeur' || user?.role === 'technicien_superieur') && !intervention.valid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidateIntervention(intervention.id)}
                              className="text-xs"
                            >
                              Valider
                            </Button>
                          )}
                          <Badge className="bg-gray-300 text-gray-600 text-xs rounded-full px-3 py-1">
                            Demande
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length > 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 text-white" : ""}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={(data) => console.log('Draft saved:', data)}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interventions List Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première intervention.
            </p>
            <div className="mt-6">
              <Button
                size="sm"
                className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
                onClick={() => {
                  console.log("Center button clicked");
                  setIsInterventionFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle intervention
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />

      

      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Search and Filters Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <span>Recherche et Filtres</span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
                <Button size="sm" className="bg-[#B4CC5F] hover:bg-[#A3C247]">
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle intervention
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par titre, description, serre ou technicien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Filter Grid - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="type-filter" className="text-sm font-medium">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interventionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-filter" className="text-sm font-medium">Priorité</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger id="priority-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter" className="text-sm font-medium">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serre-filter" className="text-sm font-medium">Serre</Label>
                  <Select value={serreFilter} onValueChange={setSerreFilter}>
                    <SelectTrigger id="serre-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les serres</SelectItem>
                      {uniqueSerres.map((serre) => (
                        <SelectItem key={serre} value={serre}>
                          {serre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignee-filter" className="text-sm font-medium">Technicien</Label>
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger id="assignee-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les techniciens</SelectItem>
                      {uniqueAssignees.map((assignee) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interventions List */}
        <div className="space-y-4">
          {filteredInterventions.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune intervention trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune intervention ne correspond à vos critères de recherche.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Effacer les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredInterventions.map((intervention) => (
              <Card key={intervention.id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {intervention.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTypeColor(intervention.type))}
                          >
                            {getTypeLabel(intervention.type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getPriorityColor(intervention.priority))}
                          >
                            {getPriorityLabel(intervention.priority)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {intervention.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs flex items-center space-x-1", getStatusColor(intervention.status))}
                        >
                          {getStatusIcon(intervention.status)}
                          <span>{getStatusLabel(intervention.status)}</span>
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Details Grid - Responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Assigné à:</span>
                          <p className="font-medium text-gray-900">{intervention.assignedTo}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Localisation:</span>
                          <p className="font-medium text-gray-900">{intervention.serre}</p>
                          <p className="text-gray-600 text-xs">{intervention.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Programmée:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(intervention.scheduledDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Durée:</span>
                          <p className="font-medium text-gray-900">
                            {intervention.actualDuration 
                              ? `${intervention.actualDuration}min (réel)`
                              : `${intervention.estimatedDuration}min (estimé)`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Equipment and Notes */}
                    {(intervention.equipment.length > 0 || intervention.notes) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          {intervention.equipment.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Équipement requis:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {intervention.equipment.map((item, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {intervention.notes && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Notes:</span>
                              <p className="text-sm text-gray-600 mt-1">{intervention.notes}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                      {intervention.status === "pending" && (
                        <Button size="sm" className="bg-[#B4CC5F] hover:bg-[#A3C247]">
                          Commencer
                        </Button>
                      )}
                      {intervention.status === "in_progress" && (
                        <>
                          <Button size="sm" variant="outline">
                            Mettre en pause
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Terminer
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-gray-600">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
