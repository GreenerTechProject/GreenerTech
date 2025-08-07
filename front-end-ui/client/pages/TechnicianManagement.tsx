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
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
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
  DialogTrigger,
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

interface Technician {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'technicien' | 'technicien_superieur';
  status: 'active' | 'inactive' | 'pending';
  assignedSerres: string[];
  location?: string;
  joinDate: string;
  lastActivity?: string;
  interventions: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export default function TechnicianManagement() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: '1',
      fullName: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      role: 'technicien_superieur',
      status: 'active',
      assignedSerres: ['Serre A-1', 'Serre A-2', 'Serre B-1'],
      location: 'Domaine Nord',
      joinDate: '2023-01-15',
      lastActivity: '2024-01-20 14:30',
      interventions: { total: 45, completed: 42, inProgress: 3 }
    },
    {
      id: '2',
      fullName: 'Marie Martin',
      email: 'marie.martin@email.com',
      phone: '+33 6 98 76 54 32',
      role: 'technicien',
      status: 'active',
      assignedSerres: ['Serre C-1', 'Serre C-2'],
      location: 'Domaine Sud',
      joinDate: '2023-03-10',
      lastActivity: '2024-01-20 16:15',
      interventions: { total: 28, completed: 26, inProgress: 2 }
    },
    {
      id: '3',
      fullName: 'Pierre Lefort',
      email: 'pierre.lefort@email.com',
      role: 'technicien',
      status: 'pending',
      assignedSerres: [],
      location: 'En attente d\'affectation',
      joinDate: '2024-01-18',
      interventions: { total: 0, completed: 0, inProgress: 0 }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'technicien' as 'technicien' | 'technicien_superieur',
    location: '',
    assignedSerres: [] as string[]
  });

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    const matchesRole = roleFilter === 'all' || tech.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateTechnician = () => {
    // Here you would call the backend API to create a technician
    const newTechnician: Technician = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      interventions: { total: 0, completed: 0, inProgress: 0 }
    };
    
    setTechnicians([...technicians, newTechnician]);
    setIsCreateModalOpen(false);
    resetForm();
    
    toast({
      title: "Technicien créé",
      description: `${formData.fullName} a été ajouté avec succès.`,
    });
  };

  const handleEditTechnician = () => {
    if (!selectedTechnician) return;
    
    const updatedTechnicians = technicians.map(tech =>
      tech.id === selectedTechnician.id
        ? { ...tech, ...formData }
        : tech
    );
    
    setTechnicians(updatedTechnicians);
    setIsEditModalOpen(false);
    setSelectedTechnician(null);
    resetForm();
    
    toast({
      title: "Technicien modifié",
      description: "Les informations ont été mises à jour avec succès.",
    });
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians(technicians.filter(tech => tech.id !== id));
    toast({
      title: "Technicien supprimé",
      description: "Le compte a été supprimé avec succès.",
      variant: "destructive"
    });
  };

  const handleActivateTechnician = (id: string) => {
    const updatedTechnicians = technicians.map(tech =>
      tech.id === id ? { ...tech, status: 'active' as const } : tech
    );
    setTechnicians(updatedTechnicians);
    toast({
      title: "Technicien activé",
      description: "Le compte a été activé avec succès.",
    });
  };

  const handleDeactivateTechnician = (id: string) => {
    const updatedTechnicians = technicians.map(tech =>
      tech.id === id ? { ...tech, status: 'inactive' as const } : tech
    );
    setTechnicians(updatedTechnicians);
    toast({
      title: "Technicien désactivé",
      description: "Le compte a été désactivé.",
      variant: "destructive"
    });
  };

  const openEditModal = (technician: Technician) => {
    setSelectedTechnician(technician);
    setFormData({
      fullName: technician.fullName,
      email: technician.email,
      phone: technician.phone || '',
      role: technician.role,
      location: technician.location || '',
      assignedSerres: technician.assignedSerres
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'technicien',
      location: '',
      assignedSerres: []
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'technicien_superieur':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Technicien Supérieur</Badge>;
      case 'technicien':
        return <Badge variant="outline">Technicien</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
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
                    Gestion des Techniciens
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gérer les comptes et les accès des techniciens
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-greener hover:bg-greener-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Technicien
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-greener-600">
                  {technicians.length}
                </div>
                <div className="text-sm text-gray-600">Total Techniciens</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {technicians.filter(t => t.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Actifs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {technicians.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">En Attente</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {technicians.filter(t => t.role === 'technicien_superieur').length}
                </div>
                <div className="text-sm text-gray-600">Supérieurs</div>
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
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Technicians Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Techniciens ({filteredTechnicians.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTechnicians.map((technician) => (
                  <div
                    key={technician.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-greener-100 rounded-full flex items-center justify-center">
                        <span className="text-greener-700 font-semibold">
                          {technician.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{technician.fullName}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-4">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {technician.email}
                          </span>
                          {technician.phone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {technician.phone}
                            </span>
                          )}
                          {technician.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {technician.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {technician.interventions.total} interventions
                        </div>
                        <div className="text-xs text-gray-500">
                          {technician.interventions.completed} terminées
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(technician.status)}
                        {getRoleBadge(technician.role)}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(technician)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {technician.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleActivateTechnician(technician.id)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          {technician.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleDeactivateTechnician(technician.id)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTechnician(technician.id)}
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

        {/* Create Technician Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un Technicien</DialogTitle>
              <DialogDescription>
                Créer un nouveau compte technicien
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={formData.role} onValueChange={(value: 'technicien' | 'technicien_superieur') => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Domaine Nord"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTechnician} className="bg-greener hover:bg-greener-600">
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Technician Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le Technicien</DialogTitle>
              <DialogDescription>
                Mettre à jour les informations du technicien
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-fullName">Nom complet</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rôle</Label>
                <Select value={formData.role} onValueChange={(value: 'technicien' | 'technicien_superieur') => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditTechnician} className="bg-greener hover:bg-greener-600">
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
