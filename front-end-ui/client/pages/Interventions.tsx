import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Circle
} from "lucide-react";
import InterventionForm from "../components/InterventionForm";
import TechnicianSidebar from "../components/TechnicianSidebar";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";

// Mock data and types
interface Intervention {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedTo: string;
  serre: string;
  location: string;
  scheduledDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  equipment: string[];
  notes?: string;
}

const mockInterventions: Intervention[] = [
  {
    id: "1",
    title: "Maintenance système irrigation",
    description: "Vérification et maintenance du système d'irrigation de la serre A",
    type: "maintenance",
    priority: "medium",
    status: "pending",
    assignedTo: "Jean Dupont",
    serre: "Serre A",
    location: "Zone Nord",
    scheduledDate: "2024-08-10",
    estimatedDuration: 120,
    equipment: ["Outils de plomberie", "Détecteur de pression"],
    notes: "Vérifier les joints et les filtres"
  },
  {
    id: "2",
    title: "Contrôle phytosanitaire",
    description: "Inspection des plants pour détecter d'éventuelles maladies",
    type: "inspection",
    priority: "high",
    status: "in_progress",
    assignedTo: "Marie Martin",
    serre: "Serre B",
    location: "Zone Sud",
    scheduledDate: "2024-08-08",
    estimatedDuration: 90,
    actualDuration: 45,
    equipment: ["Loupe", "Kit de test"],
  },
  {
    id: "3",
    title: "Réparation ventilation",
    description: "Réparation du système de ventilation défaillant",
    type: "reparation",
    priority: "urgent",
    status: "completed",
    assignedTo: "Pierre Durand",
    serre: "Serre C",
    location: "Zone Est",
    scheduledDate: "2024-08-05",
    estimatedDuration: 180,
    actualDuration: 165,
    equipment: ["Tournevis", "Multimètre", "Pièces de rechange"],
    notes: "Ventilateur remplacé avec succès"
  }
];

const interventionTypes = [
  { value: "all", label: "Tous les types" },
  { value: "maintenance", label: "Maintenance préventive" },
  { value: "reparation", label: "Réparation" },
  { value: "inspection", label: "Inspection" },
  { value: "recolte", label: "Récolte" },
  { value: "plantation", label: "Plantation" },
  { value: "irrigation", label: "Système d'irrigation" },
  { value: "temperature", label: "Contrôle température" },
  { value: "nettoyage", label: "Nettoyage" },
];

const priorityLevels = [
  { value: "all", label: "Toutes les priorités" },
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
];

export default function Interventions() {
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>(mockInterventions);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serreFilter, setSerreFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  
  const { user } = useAuth();

  // Derived data
  const uniqueSerres = Array.from(new Set(interventions.map(i => i.serre)));
  const uniqueAssignees = Array.from(new Set(interventions.map(i => i.assignedTo)));

  // Filter logic
  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.serre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || intervention.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || intervention.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || intervention.status === statusFilter;
    const matchesSerre = serreFilter === "all" || intervention.serre === serreFilter;
    const matchesAssignee = assignedToFilter === "all" || intervention.assignedTo === assignedToFilter;
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesSerre && matchesAssignee;
  });

  // Utility functions
  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setSerreFilter("all");
    setAssignedToFilter("all");
  };

  const getTypeLabel = (type: string) => {
    const found = interventionTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getPriorityLabel = (priority: string) => {
    const found = priorityLevels.find(p => p.value === priority);
    return found ? found.label : priority;
  };

  const getStatusLabel = (status: string) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.label : status;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      maintenance: "border-blue-200 text-blue-700 bg-blue-50",
      reparation: "border-red-200 text-red-700 bg-red-50",
      inspection: "border-yellow-200 text-yellow-700 bg-yellow-50",
      recolte: "border-green-200 text-green-700 bg-green-50",
      plantation: "border-emerald-200 text-emerald-700 bg-emerald-50",
    };
    return colors[type] || "border-gray-200 text-gray-700 bg-gray-50";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "border-gray-200 text-gray-700 bg-gray-50",
      medium: "border-yellow-200 text-yellow-700 bg-yellow-50",
      high: "border-orange-200 text-orange-700 bg-orange-50",
      urgent: "border-red-200 text-red-700 bg-red-50",
    };
    return colors[priority] || "border-gray-200 text-gray-700 bg-gray-50";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "border-yellow-200 text-yellow-700 bg-yellow-50",
      in_progress: "border-blue-200 text-blue-700 bg-blue-50",
      completed: "border-green-200 text-green-700 bg-green-50",
      cancelled: "border-red-200 text-red-700 bg-red-50",
    };
    return colors[status] || "border-gray-200 text-gray-700 bg-gray-50";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Circle className="h-3 w-3" />,
      in_progress: <Play className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <AlertTriangle className="h-3 w-3" />,
    };
    return icons[status] || <Circle className="h-3 w-3" />;
  };

  const handleInterventionSubmit = (data: any) => {
    const newIntervention: Intervention = {
      id: (interventions.length + 1).toString(),
      title: `${getTypeLabel(data.interventionType)} - ${data.serreId}`,
      description: data.description || "Aucune description fournie",
      type: data.interventionType,
      priority: data.priority === "basse" ? "low" : data.priority === "moyenne" ? "medium" : data.priority === "haute" ? "high" : "urgent",
      status: "pending",
      assignedTo: data.functionary,
      serre: `Serre ${data.serreId}`,
      location: "Zone assignée",
      scheduledDate: data.interventionDate,
      estimatedDuration: 120,
      equipment: [],
    };
    
    setInterventions(prev => [newIntervention, ...prev]);
    console.log("Intervention submitted:", data);
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention saved as draft:", data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar
                userRole={(user?.role === "technicien_sup" ? "technicien_sup" : "technicien") as "technicien" | "technicien_sup"}
                onInterventionClick={() => setIsInterventionFormOpen(true)}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
                <p className="text-sm text-gray-600">Gérez vos interventions</p>
              </div>
            </div>
            
            {/* Add Intervention Button */}
            <Button
              size="sm"
              className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
              onClick={() => {
                console.log("Header button clicked");
                setIsInterventionFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle intervention
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                <Button 
                  size="sm" 
                  className="bg-[#B4CC5F] hover:bg-[#A3C247]"
                  onClick={() => setIsInterventionFormOpen(true)}
                >
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

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />
    </div>
  );
}
