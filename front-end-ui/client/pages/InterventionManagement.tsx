import React, { useState, useEffect } from "react";
import DirectorSidebar from "../components/DirectorSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Technician {
  id: string;
  name: string;
  role: "technicien" | "technicien_sup";
  avatar?: string;
  status: "available" | "busy" | "unavailable";
  currentInterventions: number;
}

interface Intervention {
  id: string;
  title: string;
  description: string;
  type: "maintenance" | "installation" | "repair" | "inspection";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  location: string;
  scheduledDate: string;
  estimatedDuration: number; // in hours
  assignedTechnician?: Technician;
  createdDate: string;
  requiredSkills?: string[];
  notes?: string;
}

export default function InterventionManagement() {
  const { toast } = useToast();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "maintenance" as "maintenance" | "installation" | "repair" | "inspection",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    location: "",
    scheduledDate: "",
    estimatedDuration: 2,
    requiredSkills: "",
    notes: ""
  });

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockTechnicians: Technician[] = [
      {
        id: "1",
        name: "Marie Dubois",
        role: "technicien_sup",
        status: "available",
        currentInterventions: 2
      },
      {
        id: "2",
        name: "Jean Martin",
        role: "technicien",
        status: "busy",
        currentInterventions: 3
      },
      {
        id: "3",
        name: "Sophie Lambert",
        role: "technicien",
        status: "available",
        currentInterventions: 1
      },
      {
        id: "4",
        name: "Pierre Durand",
        role: "technicien_sup",
        status: "unavailable",
        currentInterventions: 0
      }
    ];

    const mockInterventions: Intervention[] = [
      {
        id: "1",
        title: "Maintenance système d'irrigation - Serre A12",
        description: "Vérification et nettoyage des buses d'irrigation automatique",
        type: "maintenance",
        priority: "high",
        status: "assigned",
        location: "Serre A12, Zone Nord",
        scheduledDate: "2024-01-25",
        estimatedDuration: 3,
        assignedTechnician: mockTechnicians[0],
        createdDate: "2024-01-20",
        requiredSkills: ["irrigation", "maintenance"],
        notes: "Vérifier la pression d'eau"
      },
      {
        id: "2",
        title: "Installation capteurs température",
        description: "Installation de nouveaux capteurs IoT pour monitoring température",
        type: "installation",
        priority: "medium",
        status: "pending",
        location: "Serre B15, Zone Est",
        scheduledDate: "2024-01-26",
        estimatedDuration: 4,
        createdDate: "2024-01-21",
        requiredSkills: ["électronique", "IoT"]
      },
      {
        id: "3",
        title: "Réparation ventilation - Serre C08",
        description: "Moteur de ventilation défaillant, remplacment nécessaire",
        type: "repair",
        priority: "urgent",
        status: "in_progress",
        location: "Serre C08, Zone Ouest",
        scheduledDate: "2024-01-24",
        estimatedDuration: 2,
        assignedTechnician: mockTechnicians[1],
        createdDate: "2024-01-22",
        notes: "Urgence - température critique"
      },
      {
        id: "4",
        title: "Inspection mensuelle - Zone Sud",
        description: "Inspection de routine des équipements zone sud",
        type: "inspection",
        priority: "low",
        status: "completed",
        location: "Zone Sud - Serres D01 à D20",
        scheduledDate: "2024-01-15",
        estimatedDuration: 6,
        assignedTechnician: mockTechnicians[2],
        createdDate: "2024-01-10"
      }
    ];

    setTechnicians(mockTechnicians);
    setInterventions(mockInterventions);
  }, []);

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === "all" || intervention.priority === selectedPriority;
    const matchesStatus = selectedStatus === "all" || intervention.status === selectedStatus;
    const matchesType = selectedType === "all" || intervention.type === selectedType;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesType;
  });

  const getTabInterventions = (tab: string) => {
    switch (tab) {
      case "pending":
        return interventions.filter(i => i.status === "pending");
      case "assigned":
        return interventions.filter(i => i.status === "assigned");
      case "in_progress":
        return interventions.filter(i => i.status === "in_progress");
      case "completed":
        return interventions.filter(i => i.status === "completed");
      default:
        return filteredInterventions;
    }
  };

  const handleCreateIntervention = () => {
    const newIntervention: Intervention = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      createdDate: new Date().toISOString().split('T')[0],
      requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim()) : []
    };

    setInterventions([...interventions, newIntervention]);
    setIsCreateModalOpen(false);
    resetForm();
    
    toast({
      title: "Intervention créée",
      description: `${newIntervention.title} a été créée avec succès.`,
    });
  };

  const handleEditIntervention = (intervention: Intervention) => {
    setEditingIntervention(intervention);
    setFormData({
      title: intervention.title,
      description: intervention.description,
      type: intervention.type,
      priority: intervention.priority,
      location: intervention.location,
      scheduledDate: intervention.scheduledDate,
      estimatedDuration: intervention.estimatedDuration,
      requiredSkills: intervention.requiredSkills?.join(', ') || "",
      notes: intervention.notes || ""
    });
  };

  const handleUpdateIntervention = () => {
    if (!editingIntervention) return;

    const updatedInterventions = interventions.map(intervention =>
      intervention.id === editingIntervention.id
        ? { 
            ...intervention, 
            ...formData,
            requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim()) : []
          }
        : intervention
    );

    setInterventions(updatedInterventions);
    setEditingIntervention(null);
    resetForm();
    
    toast({
      title: "Intervention mise à jour",
      description: `Les informations ont été sauvegardées.`,
    });
  };

  const handleDeleteIntervention = (id: string) => {
    const interventionTitle = interventions.find(i => i.id === id)?.title;
    setInterventions(interventions.filter(intervention => intervention.id !== id));
    
    toast({
      title: "Intervention supprimée",
      description: `${interventionTitle} a été supprimée.`,
      variant: "destructive",
    });
  };

  const handleAssignTechnician = (interventionId: string, technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId);
    if (!technician) return;

    const updatedInterventions = interventions.map(intervention =>
      intervention.id === interventionId
        ? { ...intervention, assignedTechnician: technician, status: "assigned" as const }
        : intervention
    );

    setInterventions(updatedInterventions);
    setAssignModalOpen(null);
    
    toast({
      title: "Technicien assigné",
      description: `${technician.name} a été assigné à l'intervention.`,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "maintenance",
      priority: "medium",
      location: "",
      scheduledDate: "",
      estimatedDuration: 2,
      requiredSkills: "",
      notes: ""
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "maintenance":
        return "Maintenance";
      case "installation":
        return "Installation";
      case "repair":
        return "Réparation";
      case "inspection":
        return "Inspection";
      default:
        return type;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "assigned":
        return "Assignée";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const getPriorityDisplayName = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "high":
        return "Élevée";
      case "medium":
        return "Moyenne";
      case "low":
        return "Basse";
      default:
        return priority;
    }
  };

  const getTechnicianStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "busy":
        return "bg-yellow-100 text-yellow-700";
      case "unavailable":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const pendingCount = interventions.filter(i => i.status === "pending").length;
  const assignedCount = interventions.filter(i => i.status === "assigned").length;
  const inProgressCount = interventions.filter(i => i.status === "in_progress").length;
  const completedCount = interventions.filter(i => i.status === "completed").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gestion des interventions
              </h1>
              <p className="text-gray-600 mt-1">
                Cr��ez et assignez des interventions aux techniciens
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer intervention
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle intervention</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Titre de l'intervention</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Maintenance système d'irrigation"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Description détaillée de l'intervention"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="repair">Réparation</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Ex: Serre A12, Zone Nord"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledDate">Date prévue</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDuration">Durée estimée (heures)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="requiredSkills">Compétences requises</Label>
                    <Input
                      id="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                      placeholder="irrigation, électronique, IoT (séparées par virgules)"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notes additionnelles"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setIsCreateModalOpen(false); resetForm();}}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateIntervention}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En attente</p>
                    <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assignées</p>
                    <p className="text-3xl font-bold text-purple-600">{assignedCount}</p>
                  </div>
                  <User className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En cours</p>
                    <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Terminées</p>
                    <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher interventions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="repair">Réparation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="assigned">Assignée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Toutes ({interventions.length})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
              <TabsTrigger value="assigned">Assignées ({assignedCount})</TabsTrigger>
              <TabsTrigger value="in_progress">En cours ({inProgressCount})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({completedCount})</TabsTrigger>
            </TabsList>

            {["all", "pending", "assigned", "in_progress", "completed"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {getTabInterventions(tab).map((intervention) => (
                  <Card key={intervention.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {intervention.title}
                            </h3>
                            <Badge variant="outline" className={getPriorityColor(intervention.priority)}>
                              {getPriorityDisplayName(intervention.priority)}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(intervention.status)}>
                              {getStatusDisplayName(intervention.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTypeDisplayName(intervention.type)}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{intervention.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {intervention.location}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(intervention.scheduledDate).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {intervention.estimatedDuration}h estimées
                            </div>
                            {intervention.assignedTechnician && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {intervention.assignedTechnician.name}
                              </div>
                            )}
                          </div>

                          {intervention.requiredSkills && intervention.requiredSkills.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-1">
                                {intervention.requiredSkills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {intervention.status === "pending" && (
                            <Dialog open={assignModalOpen === intervention.id} onOpenChange={(open) => setAssignModalOpen(open ? intervention.id : null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  <User className="h-4 w-4 mr-1" />
                                  Assigner
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assigner un technicien</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <h4 className="font-medium">Techniciens disponibles</h4>
                                  {technicians.map((technician) => (
                                    <div key={technician.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <Avatar>
                                          <AvatarImage src={technician.avatar} />
                                          <AvatarFallback>
                                            {technician.name.split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{technician.name}</p>
                                          <div className="flex items-center space-x-2">
                                            <Badge variant="outline">
                                              {technician.role === "technicien_sup" ? "Technicien Sup." : "Technicien"}
                                            </Badge>
                                            <Badge variant="outline" className={getTechnicianStatusColor(technician.status)}>
                                              {technician.status === "available" ? "Disponible" : 
                                               technician.status === "busy" ? "Occupé" : "Indisponible"}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {technician.currentInterventions} intervention(s) en cours
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        disabled={technician.status === "unavailable"}
                                        onClick={() => handleAssignTechnician(intervention.id, technician.id)}
                                      >
                                        Assigner
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <Dialog open={editingIntervention?.id === intervention.id} onOpenChange={(open) => !open && setEditingIntervention(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditIntervention(intervention)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Modifier l'intervention</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <Label htmlFor="edit-title">Titre</Label>
                                  <Input
                                    id="edit-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-type">Type</Label>
                                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="maintenance">Maintenance</SelectItem>
                                      <SelectItem value="installation">Installation</SelectItem>
                                      <SelectItem value="repair">Réparation</SelectItem>
                                      <SelectItem value="inspection">Inspection</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-priority">Priorité</Label>
                                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Basse</SelectItem>
                                      <SelectItem value="medium">Moyenne</SelectItem>
                                      <SelectItem value="high">Élevée</SelectItem>
                                      <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-location">Localisation</Label>
                                  <Input
                                    id="edit-location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-scheduledDate">Date prévue</Label>
                                  <Input
                                    id="edit-scheduledDate"
                                    type="date"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-estimatedDuration">Durée estimée (heures)</Label>
                                  <Input
                                    id="edit-estimatedDuration"
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={formData.estimatedDuration}
                                    onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-requiredSkills">Compétences requises</Label>
                                  <Input
                                    id="edit-requiredSkills"
                                    value={formData.requiredSkills}
                                    onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                                    placeholder="séparées par virgules"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="edit-notes">Notes</Label>
                                  <Textarea
                                    id="edit-notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingIntervention(null)}>
                                  Annuler
                                </Button>
                                <Button onClick={handleUpdateIntervention}>
                                  Sauvegarder
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'intervention</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette intervention ? 
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteIntervention(intervention.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getTabInterventions(tab).length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune intervention trouvée
                      </h3>
                      <p className="text-gray-600">
                        Aucune intervention ne correspond à vos critères.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
