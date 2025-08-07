import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
import {
  Menu,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Intervention {
  id: string;
  title: string;
  description: string;
  type: 'maintenance' | 'inspection' | 'repair' | 'installation' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  assignedTo: {
    id: string;
    name: string;
    role: 'technicien' | 'technicien_superieur';
  }[];
  location: {
    domain: string;
    greenhouse?: string;
    area?: string;
  };
  scheduledDate: string;
  estimatedDuration: number; // in hours
  actualDuration?: number;
  createdDate: string;
  createdBy: string;
  completedDate?: string;
  equipmentNeeded: string[];
  notes?: string;
  progress: number; // 0-100
  checkpoints: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }[];
}

const mockTechnicians = [
  { id: '1', name: 'Jean Dupont', role: 'technicien_superieur' as const },
  { id: '2', name: 'Marie Martin', role: 'technicien' as const },
  { id: '3', name: 'Pierre Lefort', role: 'technicien' as const },
  { id: '4', name: 'Sophie Dubois', role: 'technicien_superieur' as const }
];

export default function DirectorInterventionManagement() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: '1',
      title: 'Maintenance préventive système irrigation',
      description: 'Vérification et maintenance des systèmes d\'irrigation automatique dans les serres A1-A5',
      type: 'maintenance',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: [
        { id: '1', name: 'Jean Dupont', role: 'technicien_superieur' },
        { id: '2', name: 'Marie Martin', role: 'technicien' }
      ],
      location: {
        domain: 'Domaine Nord',
        greenhouse: 'Serres A1-A5',
        area: 'Zone irrigation'
      },
      scheduledDate: '2024-01-22',
      estimatedDuration: 4,
      actualDuration: 2.5,
      createdDate: '2024-01-20',
      createdBy: 'Directeur',
      equipmentNeeded: ['Outils de maintenance', 'Capteurs de remplacement', 'Multimètre'],
      progress: 65,
      checkpoints: [
        { id: '1', title: 'Vérification des valves', completed: true, completedAt: '2024-01-22T09:00:00' },
        { id: '2', title: 'Test des capteurs', completed: true, completedAt: '2024-01-22T10:30:00' },
        { id: '3', title: 'Calibrage système', completed: false },
        { id: '4', title: 'Tests finaux', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Installation nouveau système de surveillance',
      description: 'Installation d\'un nouveau système IoT de surveillance environnementale',
      type: 'installation',
      priority: 'high',
      status: 'planned',
      assignedTo: [
        { id: '4', name: 'Sophie Dubois', role: 'technicien_superieur' }
      ],
      location: {
        domain: 'Domaine Sud',
        greenhouse: 'Serre C1',
        area: 'Zone de contrôle'
      },
      scheduledDate: '2024-01-25',
      estimatedDuration: 6,
      createdDate: '2024-01-19',
      createdBy: 'Directeur',
      equipmentNeeded: ['Capteurs IoT', 'Raspberry Pi', 'Câblage', 'Outils électriques'],
      progress: 0,
      checkpoints: [
        { id: '1', title: 'Préparation matériel', completed: false },
        { id: '2', title: 'Installation capteurs', completed: false },
        { id: '3', title: 'Configuration réseau', completed: false },
        { id: '4', title: 'Tests et validation', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Réparation urgente système climatisation',
      description: 'Panne du système de climatisation - intervention d\'urgence requise',
      type: 'emergency',
      priority: 'critical',
      status: 'completed',
      assignedTo: [
        { id: '1', name: 'Jean Dupont', role: 'technicien_superieur' },
        { id: '3', name: 'Pierre Lefort', role: 'technicien' }
      ],
      location: {
        domain: 'Domaine Est',
        greenhouse: 'Serre B3',
        area: 'Système climatique'
      },
      scheduledDate: '2024-01-18',
      estimatedDuration: 3,
      actualDuration: 4.5,
      createdDate: '2024-01-18',
      createdBy: 'Alerte automatique',
      completedDate: '2024-01-18',
      equipmentNeeded: ['Compresseur de remplacement', 'Réfrigérant', 'Outils spécialisés'],
      progress: 100,
      checkpoints: [
        { id: '1', title: 'Diagnostic panne', completed: true, completedAt: '2024-01-18T14:00:00' },
        { id: '2', title: 'Remplacement compresseur', completed: true, completedAt: '2024-01-18T16:30:00' },
        { id: '3', title: 'Test système', completed: true, completedAt: '2024-01-18T17:45:00' },
        { id: '4', title: 'Validation finale', completed: true, completedAt: '2024-01-18T18:00:00' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'maintenance' as Intervention['type'],
    priority: 'medium' as Intervention['priority'],
    assignedTo: [] as string[],
    domain: '',
    greenhouse: '',
    scheduledDate: '',
    estimatedDuration: 2,
    equipmentNeeded: [] as string[],
    notes: ''
  });

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.location.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || intervention.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || intervention.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || intervention.type === typeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleCreateIntervention = () => {
    const assignedTechnicians = mockTechnicians.filter(tech => 
      formData.assignedTo.includes(tech.id)
    ).map(tech => ({
      id: tech.id,
      name: tech.name,
      role: tech.role
    }));

    const newIntervention: Intervention = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: 'planned',
      assignedTo: assignedTechnicians,
      location: {
        domain: formData.domain,
        greenhouse: formData.greenhouse
      },
      scheduledDate: formData.scheduledDate,
      estimatedDuration: formData.estimatedDuration,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: user?.name || user?.email || 'Directeur',
      equipmentNeeded: formData.equipmentNeeded,
      notes: formData.notes,
      progress: 0,
      checkpoints: []
    };
    
    setInterventions([...interventions, newIntervention]);
    setIsCreateModalOpen(false);
    resetForm();
    
    toast({
      title: "Intervention créée",
      description: `${formData.title} a été planifiée avec succès.`,
    });
  };

  const handleUpdateStatus = (id: string, newStatus: Intervention['status']) => {
    const updatedInterventions = interventions.map(intervention =>
      intervention.id === id
        ? { 
            ...intervention, 
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
            progress: newStatus === 'completed' ? 100 : intervention.progress
          }
        : intervention
    );
    
    setInterventions(updatedInterventions);
    
    toast({
      title: "Statut mis à jour",
      description: `L'intervention a été marquée comme ${newStatus}.`,
    });
  };

  const handleDeleteIntervention = (id: string) => {
    setInterventions(interventions.filter(intervention => intervention.id !== id));
    toast({
      title: "Intervention supprimée",
      description: "L'intervention a été supprimée avec succès.",
      variant: "destructive"
    });
  };

  const openDetailModal = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'maintenance',
      priority: 'medium',
      assignedTo: [],
      domain: '',
      greenhouse: '',
      scheduledDate: '',
      estimatedDuration: 2,
      equipmentNeeded: [],
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Planifiée</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Terminée</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Annulée</Badge>;
      case 'on_hold':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Basse</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      maintenance: 'Maintenance',
      inspection: 'Inspection',
      repair: 'Réparation',
      installation: 'Installation',
      emergency: 'Urgence'
    };
    return <Badge variant="secondary">{typeLabels[type as keyof typeof typeLabels] || type}</Badge>;
  };

  const stats = {
    total: interventions.length,
    planned: interventions.filter(i => i.status === 'planned').length,
    inProgress: interventions.filter(i => i.status === 'in_progress').length,
    completed: interventions.filter(i => i.status === 'completed').length,
    critical: interventions.filter(i => i.priority === 'critical').length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Gestion des Interventions
                  </h1>
                  <p className="text-sm text-gray-600">
                    Créer, assigner et suivre les interventions techniques
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-greener hover:bg-greener-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Intervention
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-greener-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.planned}</div>
                <div className="text-sm text-gray-600">Planifiées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-gray-600">En cours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Terminées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-gray-600">Critiques</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par titre, description ou localisation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="planned">Planifiée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                    <SelectItem value="on_hold">En attente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Réparation</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="emergency">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interventions List */}
          <Card>
            <CardHeader>
              <CardTitle>Interventions ({filteredInterventions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInterventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-greener-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-greener-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{intervention.title}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {intervention.description}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {intervention.location.domain}
                            {intervention.location.greenhouse && ` - ${intervention.location.greenhouse}`}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(intervention.scheduledDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {intervention.assignedTo.length} technicien(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Progression: {intervention.progress}%
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-greener h-2 rounded-full transition-all"
                            style={{ width: `${intervention.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(intervention.status)}
                        {getPriorityBadge(intervention.priority)}
                        {getTypeBadge(intervention.type)}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailModal(intervention)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          
                          {intervention.status === 'planned' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(intervention.id, 'in_progress')}>
                              <Play className="h-4 w-4 mr-2" />
                              Démarrer
                            </DropdownMenuItem>
                          )}
                          
                          {intervention.status === 'in_progress' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(intervention.id, 'on_hold')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Mettre en pause
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(intervention.id, 'completed')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marquer terminée
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {intervention.status === 'on_hold' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(intervention.id, 'in_progress')}>
                              <Play className="h-4 w-4 mr-2" />
                              Reprendre
                            </DropdownMenuItem>
                          )}
                          
                          {['planned', 'on_hold'].includes(intervention.status) && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(intervention.id, 'cancelled')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteIntervention(intervention.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Create Intervention Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Intervention</DialogTitle>
              <DialogDescription>
                Planifier une intervention technique
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Titre de l'intervention</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Maintenance système irrigation"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description détaillée de l'intervention..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type d'intervention</Label>
                  <Select value={formData.type} onValueChange={(value: Intervention['type']) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Réparation</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="emergency">Urgence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value: Intervention['priority']) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="domain">Domaine</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    placeholder="Ex: Domaine Nord"
                  />
                </div>
                
                <div>
                  <Label htmlFor="greenhouse">Serre (optionnel)</Label>
                  <Input
                    id="greenhouse"
                    value={formData.greenhouse}
                    onChange={(e) => setFormData({...formData, greenhouse: e.target.value})}
                    placeholder="Ex: Serre A1"
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
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="assignedTo">Techniciens assignés</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {mockTechnicians.map((tech) => (
                      <label key={tech.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.assignedTo.includes(tech.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, assignedTo: [...formData.assignedTo, tech.id]});
                            } else {
                              setFormData({...formData, assignedTo: formData.assignedTo.filter(id => id !== tech.id)});
                            }
                          }}
                        />
                        <span className="text-sm">{tech.name} ({tech.role === 'technicien_superieur' ? 'Senior' : 'Standard'})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateIntervention} className="bg-greener hover:bg-greener-600">
                  Créer l'Intervention
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'Intervention</DialogTitle>
              <DialogDescription>
                Informations complètes et progression
              </DialogDescription>
            </DialogHeader>
            {selectedIntervention && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informations Générales</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Titre:</strong> {selectedIntervention.title}</p>
                      <p><strong>Type:</strong> {getTypeBadge(selectedIntervention.type)}</p>
                      <p><strong>Priorité:</strong> {getPriorityBadge(selectedIntervention.priority)}</p>
                      <p><strong>Statut:</strong> {getStatusBadge(selectedIntervention.status)}</p>
                      <p><strong>Progression:</strong> {selectedIntervention.progress}%</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Planning</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Date prévue:</strong> {new Date(selectedIntervention.scheduledDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Durée estimée:</strong> {selectedIntervention.estimatedDuration}h</p>
                      {selectedIntervention.actualDuration && (
                        <p><strong>Durée réelle:</strong> {selectedIntervention.actualDuration}h</p>
                      )}
                      <p><strong>Créée le:</strong> {new Date(selectedIntervention.createdDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Créée par:</strong> {selectedIntervention.createdBy}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedIntervention.description}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded-lg">
                    <p><strong>Domaine:</strong> {selectedIntervention.location.domain}</p>
                    {selectedIntervention.location.greenhouse && (
                      <p><strong>Serre:</strong> {selectedIntervention.location.greenhouse}</p>
                    )}
                    {selectedIntervention.location.area && (
                      <p><strong>Zone:</strong> {selectedIntervention.location.area}</p>
                    )}
                  </div>
                </div>

                {/* Assigned Team */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Équipe Assignée</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntervention.assignedTo.map((tech) => (
                      <Badge key={tech.id} variant="outline" className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{tech.name} ({tech.role === 'technicien_superieur' ? 'Senior' : 'Standard'})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                {selectedIntervention.equipmentNeeded.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Équipement Nécessaire</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedIntervention.equipmentNeeded.map((equipment, index) => (
                        <Badge key={index} variant="secondary">{equipment}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkpoints */}
                {selectedIntervention.checkpoints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Points de Contrôle</h3>
                    <div className="space-y-2">
                      {selectedIntervention.checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          {checkpoint.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={cn(
                            "text-sm",
                            checkpoint.completed ? "text-green-800" : "text-gray-600"
                          )}>
                            {checkpoint.title}
                          </span>
                          {checkpoint.completedAt && (
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(checkpoint.completedAt).toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedIntervention.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedIntervention.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
