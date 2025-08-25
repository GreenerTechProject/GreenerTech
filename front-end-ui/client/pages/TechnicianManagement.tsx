import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DirectorLayout from '../components/DirectorLayout';
import { useToast } from '@/hooks/use-toast';
import { technicianService, Technician } from '../services/technicianService';
import {
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

export default function TechnicianManagement() {
  const { user } = useAuth();
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
    role: 'technicien' as 'technicien' | 'technicien_superieur'
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

        const techniciansData = await technicianService.getAllTechniciansByCompany(user.id_entreprise);
        
        // Transform backend data to match our interface
        const transformedTechnicians: Technician[] = await Promise.all(
          techniciansData.map(async (tech: any) => {
            // Fetch real interventions for this technician
            const interventions = await technicianService.getInterventionsByTechnician(tech.id);
            
            // Calculate intervention statistics
            const totalInterventions = interventions.length;
            const completedInterventions = interventions.filter(int => int.status === 'terminé').length;
            const inProgressInterventions = interventions.filter(int => int.status === 'encours').length;
            
            return {
              id: tech.id,
              fullName: tech.fullName,
              email: tech.email,
              telephone: tech.telephone,
              role: tech.role,
              status: tech.directeur_valide ? 'active' : 'inactive',
              assignedSerres: tech.assignedSerres || [],
              created_at: tech.created_at,
              updated_at: tech.updated_at,
              id_assigned: tech.id_assigned,
              setup_completed: tech.setup_completed,
              directeur_valide: tech.directeur_valide,
              email_valide: tech.email_valide,
              id_entreprise: tech.id_entreprise,
              birthday: tech.birthday,
              interventions: { 
                total: totalInterventions, 
                completed: completedInterventions, 
                inProgress: inProgressInterventions 
              }
            };
          })
        );
        
        setTechnicians(transformedTechnicians);
      } catch (error: any) {
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

  // Function to refresh technicians list
  const refreshTechnicians = async () => {
    if (!user?.id_entreprise) return;
    
    try {
      setLoading(true);
      const techniciansData = await technicianService.getAllTechniciansByCompany(user.id_entreprise);
      
      const transformedTechnicians: Technician[] = await Promise.all(
        techniciansData.map(async (tech: any) => {
          // Fetch real interventions for this technician
          const interventions = await technicianService.getInterventionsByTechnician(tech.id);
          
          // Calculate intervention statistics
          const totalInterventions = interventions.length;
          const completedInterventions = interventions.filter(int => int.status === 'terminé').length;
          const inProgressInterventions = interventions.filter(int => int.status === 'encours').length;
          
          return {
            id: tech.id,
            fullName: tech.fullName,
            email: tech.email,
            telephone: tech.telephone,
            role: tech.role,
            status: tech.directeur_valide ? 'active' : 'inactive',
            assignedSerres: tech.assignedSerres || [],
            created_at: tech.created_at,
            updated_at: tech.updated_at,
            id_assigned: tech.id_assigned,
            setup_completed: tech.setup_completed,
            directeur_valide: tech.directeur_valide,
            email_valide: tech.email_valide,
            id_entreprise: tech.id_entreprise,
            birthday: tech.birthday,
            interventions: { 
              total: totalInterventions, 
              completed: completedInterventions, 
              inProgress: inProgressInterventions 
            }
          };
        })
      );
      
      setTechnicians(transformedTechnicians);
    } catch (error: any) {
      // Error refreshing technicians
    } finally {
      setLoading(false);
    }
  };

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
        companyId: user.id_entreprise // Send as number, not string
      };

      // Call the backend API to create a technician
      const response = await technicianService.createTechnicians([technicianData]);
      
      if (response && response.length > 0) {
        const createdTech = response[0];
        
        // Create the new technician object for the UI with real data structure
        const newTechnician: Technician = {
          id: createdTech.id,
          fullName: formData.fullName,
          email: formData.email,
          telephone: null, // New technicians don't have phone yet
          role: formData.role,
          status: 'pending', // New technicians start as pending
          assignedSerres: [], // New technicians don't have assigned serres yet
          created_at: new Date().toISOString(), // Today's date
          updated_at: new Date().toISOString(), // Today's date
          id_assigned: null, // New technicians don't have assigned user yet
          setup_completed: false, // New technicians haven't completed setup
          directeur_valide: false, // New technicians haven't been validated by director
          email_valide: false, // New technicians haven't verified email
          id_entreprise: user.id_entreprise, // Company ID from current user
          birthday: null, // New technicians haven't set birthday
          interventions: { total: 0, completed: 0, inProgress: 0 } // No interventions yet
        };

        setTechnicians(prev => [...prev, newTechnician]);
        setIsCreateModalOpen(false);
        resetForm();
        
        toast({
          title: "Technicien créé",
          description: "Le compte a été créé avec succès.",
        });
        
        // Refresh the list to get the latest data with real interventions
        await refreshTechnicians();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du technicien",
        variant: "destructive"
      });
    }
  };

  const handleEditTechnician = async () => {
    if (!selectedTechnician) return;
    
    try {
      // Call the backend API to update the technician
      const updates = {
        email: formData.email,
        name: formData.fullName, // Backend expects 'name' not 'fullName'
        role: formData.role
      };
      
      await technicianService.updateTechnician(selectedTechnician.id, updates);
      
      // Update local state
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
      
      // Refresh the list to get the latest data
      await refreshTechnicians();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification du technicien",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTechnician = async (id: number) => {
    try {
      // Call the backend API to delete the technician
      await technicianService.deleteTechnician(id);
      
      // Update local state
      setTechnicians(technicians.filter(tech => tech.id !== id));
      
      toast({
        title: "Technicien supprimé",
        description: "Le compte a été supprimé avec succès.",
        variant: "destructive"
      });
      
      // Refresh the list to get the latest data
      await refreshTechnicians();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du technicien",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (technician: Technician) => {
    setSelectedTechnician(technician);
    setFormData({
      fullName: technician.fullName,
      email: technician.email,
      role: technician.role,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      role: 'technicien'
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
    <DirectorLayout title="Gestion des Techniciens" subtitle="Gérer les comptes et les accès des techniciens">
      {/* Content */}
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-greener hover:bg-greener-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un Technicien
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
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
                      
                      {technician.telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {technician.telephone}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Membre depuis {technician.created_at ? technician.created_at.split('T')[0] : 'N/A'}
                      </div>
                      
                      {/* Additional technician information */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Compte configuré:</span>
                          <Badge variant={technician.setup_completed ? "default" : "secondary"} className="text-xs">
                            {technician.setup_completed ? "Oui" : "Non"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Email vérifié:</span>
                          <Badge variant={technician.email_valide ? "default" : "secondary"} className="text-xs">
                            {technician.email_valide ? "Oui" : "Non"}
                          </Badge>
                        </div>
                        
                        {technician.birthday && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Date de naissance:</span>
                            <span>{technician.birthday}</span>
                          </div>
                        )}
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
                        
                        {/* Show intervention details if there are any */}
                        {technician.interventions.total > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <div className="flex justify-between">
                              <span>En cours: {technician.interventions.inProgress}</span>
                              <span>Terminées: {technician.interventions.completed}</span>
                            </div>
                          </div>
                        )}
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
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="jean.dupont@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Rôle *</Label>
              <Select value={formData.role} onValueChange={(value: 'technicien' | 'technicien_superieur') => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="z-[70] overflow-auto">
                  <SelectItem value="technicien">Technicien</SelectItem>
                  <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="edit-fullName">Nom complet *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rôle *</Label>
              <Select value={formData.role} onValueChange={(value: 'technicien' | 'technicien_superieur') => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technicien">Technicien</SelectItem>
                  <SelectItem value="technicien_superieur">Technicien Supérieur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Téléphone</Label>
                  <p className="text-sm font-medium">{selectedTechnician?.telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Date de naissance</Label>
                  <p className="text-sm font-medium">{selectedTechnician?.birthday || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Compte configuré</Label>
                  <Badge variant={selectedTechnician?.setup_completed ? "default" : "secondary"} className="text-xs">
                    {selectedTechnician?.setup_completed ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email vérifié</Label>
                  <Badge variant={selectedTechnician?.email_valide ? "default" : "secondary"} className="text-xs">
                    {selectedTechnician?.email_valide ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Membre depuis</Label>
                <p className="text-sm font-medium">{selectedTechnician?.created_at}</p>
              </div>
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
    </DirectorLayout>
  );
}
