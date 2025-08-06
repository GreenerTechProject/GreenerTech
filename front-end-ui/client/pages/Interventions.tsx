import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Pause,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { cn } from "@/lib/utils";

interface Intervention {
  id: string;
  title: string;
  description: string;
  type: "maintenance" | "repair" | "inspection" | "emergency" | "installation";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled" | "paused";
  assignedTo: string;
  assignedBy: string;
  serre: string;
  location: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  equipment: string[];
  notes?: string;
  createdAt: string;
}

const mockInterventions: Intervention[] = [
  {
    id: "int-001",
    title: "Remplacement système d'irrigation Zone A",
    description: "Remplacement des tuyaux d'irrigation défaillants dans la zone A de la serre Nord",
    type: "repair",
    priority: "high",
    status: "in_progress",
    assignedTo: "Jean Dupont",
    assignedBy: "Marie Martin",
    serre: "Serre Nord A",
    location: "Zone A - Secteur irrigation",
    scheduledDate: "2024-01-15",
    estimatedDuration: 120,
    actualDuration: 90,
    equipment: ["Tuyaux irrigation", "Raccords", "Outils plomberie"],
    notes: "Attention aux raccords existants",
    createdAt: "2024-01-10",
  },
  {
    id: "int-002",
    title: "Inspection mensuelle capteurs température",
    description: "Vérification et calibrage des capteurs de température de toutes les serres",
    type: "inspection",
    priority: "medium",
    status: "pending",
    assignedTo: "Pierre Lambert",
    assignedBy: "Marie Martin",
    serre: "Toutes les serres",
    location: "Systèmes de contrôle",
    scheduledDate: "2024-01-20",
    estimatedDuration: 180,
    equipment: ["Multimètre", "Calibreur", "Tablette"],
    createdAt: "2024-01-12",
  },
  {
    id: "int-003",
    title: "Installation nouveau système ventilation",
    description: "Installation d'un système de ventilation automatisé dans la serre Sud B",
    type: "installation",
    priority: "medium",
    status: "completed",
    assignedTo: "Jean Dupont",
    assignedBy: "Marie Martin",
    serre: "Serre Sud B",
    location: "Toiture - Ventilation",
    scheduledDate: "2024-01-05",
    completedDate: "2024-01-06",
    estimatedDuration: 240,
    actualDuration: 220,
    equipment: ["Ventilateurs", "Capteurs", "Câblage", "Contrôleur"],
    notes: "Installation réussie, tests validés",
    createdAt: "2024-01-02",
  },
  {
    id: "int-004",
    title: "Urgence - Panne chauffage Serre Est",
    description: "Réparation d'urgence du système de chauffage défaillant",
    type: "emergency",
    priority: "urgent",
    status: "completed",
    assignedTo: "Pierre Lambert",
    assignedBy: "Service Urgences",
    serre: "Serre Est C",
    location: "Chaufferie principale",
    scheduledDate: "2024-01-08",
    completedDate: "2024-01-08",
    estimatedDuration: 180,
    actualDuration: 240,
    equipment: ["Pièces chauffage", "Outils spécialisés"],
    notes: "Intervention urgente réussie",
    createdAt: "2024-01-08",
  },
  {
    id: "int-005",
    title: "Maintenance préventive pompes",
    description: "Maintenance préventive des pompes d'irrigation",
    type: "maintenance",
    priority: "low",
    status: "paused",
    assignedTo: "Jean Dupont",
    assignedBy: "Marie Martin",
    serre: "Serre Nord A",
    location: "Local technique",
    scheduledDate: "2024-01-18",
    estimatedDuration: 90,
    equipment: ["Huile", "Filtres", "Outils maintenance"],
    notes: "En attente de pièces de rechange",
    createdAt: "2024-01-14",
  },
];

const interventionTypes = [
  { value: "all", label: "Tous les types" },
  { value: "maintenance", label: "Maintenance" },
  { value: "repair", label: "Réparation" },
  { value: "inspection", label: "Inspection" },
  { value: "emergency", label: "Urgence" },
  { value: "installation", label: "Installation" },
];

const priorityLevels = [
  { value: "all", label: "Toutes les priorités" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Basse" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "paused", label: "En pause" },
  { value: "cancelled", label: "Annulé" },
];

export default function Interventions() {
  const [interventions] = useState<Intervention[]>(mockInterventions);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serreFilter, setSerreFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");

  // Get unique values for filters
  const uniqueSerres = Array.from(new Set(interventions.map(i => i.serre)));
  const uniqueAssignees = Array.from(new Set(interventions.map(i => i.assignedTo)));

  // Filtered interventions based on search and filters
  const filteredInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      const matchesSearch = searchTerm === "" || 
        intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.serre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || intervention.type === typeFilter;
      const matchesPriority = priorityFilter === "all" || intervention.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || intervention.status === statusFilter;
      const matchesSerre = serreFilter === "all" || intervention.serre === serreFilter;
      const matchesAssignee = assignedToFilter === "all" || intervention.assignedTo === assignedToFilter;

      return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesSerre && matchesAssignee;
    });
  }, [interventions, searchTerm, typeFilter, priorityFilter, statusFilter, serreFilter, assignedToFilter]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "maintenance":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "repair":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "inspection":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "emergency":
        return "bg-red-100 text-red-800 border-red-300";
      case "installation":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <RefreshCw className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "maintenance":
        return "Maintenance";
      case "repair":
        return "Réparation";
      case "inspection":
        return "Inspection";
      case "emergency":
        return "Urgence";
      case "installation":
        return "Installation";
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "high":
        return "Haute";
      case "medium":
        return "Moyenne";
      case "low":
        return "Basse";
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminé";
      case "paused":
        return "En pause";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setSerreFilter("all");
    setAssignedToFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Interventions"
        badge={{
          text: `${filteredInterventions.length} intervention${filteredInterventions.length !== 1 ? 's' : ''}`,
          className: "bg-blue-50 border-blue-200 text-blue-700"
        }}
        userRole="technicien"
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
