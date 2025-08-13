import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
import { technicianService, Technician as TechnicianType } from '../services/technicianService';
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
  MoreVertical,
  Loader2
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
  id: number;
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
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch technicians from the backend
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!user?.id_entreprise) {
        setError('Company ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('[TechManagement] Fetching technicians for company:', user.id_entreprise);
        const techniciansData = await technicianService.getTechniciansByCompany(user.id_entreprise.toString());
        
        // Transform backend data to match our interface
        const transformedTechnicians: Technician[] = techniciansData.map((tech: TechnicianType) => ({
          id: tech.id,
          fullName: tech.fullName,
          email: tech.email,
          phone: '', // Backend doesn't provide phone yet
          role: tech.role,
          status: 'active', // Default status since backend doesn't provide it
          assignedSerres: tech.assignedSerres || [],
          location: 'Domaine Principal', // Default location
          joinDate: new Date().toISOString().split('T')[0], // Default join date
          lastActivity: new Date().toISOString().split('T')[0], // Default last activity
          interventions: { total: 0, completed: 0, inProgress: 0 } // Default interventions
        }));
        
        console.log('[TechManagement] Transformed technicians:', transformedTechnicians);
        setTechnicians(transformedTechnicians);
      } catch (error: any) {
        console.error('[TechManagement] Error fetching technicians:', error);
        setError(error.message || 'Failed to fetch technicians');
        toast({
          title: "Erreur",
          description: error.message || 'Failed to fetch technicians',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [user?.id_entreprise, toast]);

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    const matchesRole = roleFilter === 'all' || tech.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateTechnician = async () => {
    if (!user?.id_entreprise) {
      toast({
        title: "Erreur",
        description: "Company ID not found",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare data for the backend
      const technicianData = {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        companyId: user.id_entreprise.toString()
      };

      // Call the backend API to create a technician
      const response = await technicianService.createTechnicians([technicianData]);
      
      if (response && response.length > 0) {
        const createdTech = response[0];
        
        // Create the new technician object for the UI
        const newTechnician: Technician = {
          id: createdTech.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: 'pending',
          assignedSerres: formData.assignedSerres,
          location: formData.location,
          joinDate: new Date().toISOString().split('T')[0],
          lastActivity: new Date().toISOString().split('T')[0],
          interventions: { total: 0, completed: 0, inProgress: 0 }
        };

        // Add to the local state
        setTechnicians([...technicians, newTechnician]);
        
        // Close modal and reset form
        setIsCreateModalOpen(false);
        resetForm();
        
        toast({
          title: "Technicien créé",
          description: `${formData.fullName} a été ajouté avec succès.`,
        });
      }
    } catch (error: any) {
      console.error('Error creating technician:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du technicien",
        variant: "destructive"
      });
    }
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

  const handleDeleteTechnician = (id: number) => {
    setTechnicians(technicians.filter(tech => tech.id !== id));
    toast({
      title: "Technicien supprimé",
      description: "Le compte a été supprimé avec succès.",
      variant: "destructive"
    });
  };

  const handleActivateTechnician = (id: number) => {
    const updatedTechnicians = technicians.map(tech =>
      tech.id === id ? { ...tech, status: 'active' as const } : tech
    );
    setTechnicians(updatedTechnicians);
    toast({
      title: "Technicien activé",
      description: "Le compte a été activé avec succès.",
    });
  };

  const handleDeactivateTechnician = (id: number) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-greener animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

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
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Filters and Search */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
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
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-greener animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Chargement des techniciens...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <UserX className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {/* Technicians List */}
          {!loading && !error && (
            <>
              {/* Results Summary */}
              <div className="mb-4 text-sm text-gray-600">
                {filteredTechnicians.length} technicien{filteredTechnicians.length !== 1 ? 's' : ''} trouvé{filteredTechnicians.length !== 1 ? 's' : ''}
                {searchTerm && ` pour "${searchTerm}"`}
              </div>

              {/* Technicians Grid */}
              {filteredTechnicians.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTechnicians.map((technician) => (
                    <Card key={technician.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {technician.fullName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{technician.email}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(technician)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleActivateTechnician(technician.id)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeactivateTechnician(technician.id)}>
                                <UserX className="h-4 w-4 mr-2" />
                                Désactiver
                              </DropdownMenuItem>
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
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          {getRoleBadge(technician.role)}
                          {getStatusBadge(technician.status)}
                        </div>
                        
                        {technician.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {technician.phone}
                          </div>
                        )}
                        
                        {technician.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {technician.location}
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Membre depuis {technician.joinDate}
                        </div>
                        
                        {technician.assignedSerres.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Serres assignées:</p>
                            <div className="flex flex-wrap gap-1">
                              {technician.assignedSerres.map((serre, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {serre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Interventions:</span>
                            <span className="font-medium">
                              {technician.interventions.completed}/{technician.interventions.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-greener h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${technician.interventions.total > 0 
                                  ? (technician.interventions.completed / technician.interventions.total) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <UserX className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-2">Aucun technicien trouvé</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                      ? 'Essayez de modifier vos filtres de recherche'
                      : 'Commencez par ajouter votre premier technicien'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>

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
