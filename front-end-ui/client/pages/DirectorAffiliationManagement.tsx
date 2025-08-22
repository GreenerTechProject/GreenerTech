import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

import DirectorLayout from '../components/DirectorLayout';
import { useToast } from '@/hooks/use-toast';
import { affiliationService, PendingTechnician } from '../services/affiliationService';
import { technicianService } from '../services/technicianService';
import {
  Menu,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  FileText,
  Loader2,
  AlertCircle
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AffiliationRequest {
  id: string;
  applicantName: string;
  email: string;
  phone?: string;
  company?: string;
  requestedRole: 'technicien' | 'technicien_superieur';
  experience: string;
  motivation: string;
  documents: {
    cv?: string;
    certifications?: string[];
    recommendations?: string[];
  };
  location?: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  skills: string[];
  availability: string;
  references: {
    name: string;
    position: string;
    company: string;
    contact: string;
  }[];
}

export default function DirectorAffiliationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [technicians, setTechnicians] = useState<PendingTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedTechnician, setSelectedTechnician] = useState<PendingTechnician | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch technicians from backend
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get pending technicians (directeur_valide = false)
        const techniciansData = await affiliationService.getPendingTechnicians();
        setTechnicians(techniciansData);
      } catch (error: any) {
        console.error('Error fetching technicians:', error);
        setError(error.message || 'Erreur lors du chargement des techniciens en attente');
        toast({
          title: "Erreur",
          description: error.message || 'Erreur lors du chargement des techniciens en attente',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [toast]);

  const filteredTechnicians = technicians.filter(technician => {
    const matchesSearch = technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         technician.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !technician.directeur_valide) ||
                         (statusFilter === 'approved' && technician.directeur_valide);
    const matchesRole = roleFilter === 'all' || technician.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleValidateTechnician = async (technicianId: number) => {
    try {
      await affiliationService.validateTechnician(technicianId);
      
      // Update local state
      setTechnicians(prev => prev.map(tech => 
        tech.id === technicianId 
          ? { ...tech, directeur_valide: true }
          : tech
      ));
      
      toast({
        title: "Technicien validé",
        description: "Le technicien a été validé avec succès et peut maintenant accéder à la plateforme.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la validation du technicien",
        variant: "destructive"
      });
    }
  };

  const handleRejectTechnician = async (technician?: PendingTechnician) => {
    const target = technician ?? selectedTechnician;
    if (!target) return;
    
    try {
      // Delete technician in backend (rejection by removal)
      await technicianService.deleteTechnician(target.id);
      
      // Remove from local list
      setTechnicians(prev => prev.filter(tech => tech.id !== target.id));
      
      setIsRejectDialogOpen(false);
      setSelectedTechnician(null);
      setIsDetailModalOpen(false);
      setRejectionReason('');
      
      toast({
        title: "Technicien rejeté",
        description: "Le technicien a été supprimé de la base de données.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du technicien",
        variant: "destructive"
      });
    }
  };

  const openDetailModal = (technician: PendingTechnician) => {
    setSelectedTechnician(technician);
    setIsDetailModalOpen(true);
  };

  const openRejectDialog = (technician: PendingTechnician) => {
    setSelectedTechnician(technician);
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (technician: PendingTechnician) => {
    if (technician.directeur_valide) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Validé</Badge>;
    } else if (technician.email_valide) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente de validation</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Incomplet</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'technicien': 'bg-blue-100 text-blue-800 border-blue-200',
              'technicien_superieur': 'bg-green-100 text-green-800 border-green-200'
    };
    
    const roleLabels = {
      'technicien': 'Technicien',
      'technicien_superieur': 'Technicien Supérieur'
    };
    
    return (
      <Badge className={cn("border", roleColors[role as keyof typeof roleColors])}>
        {roleLabels[role as keyof typeof roleLabels]}
      </Badge>
    );
  };

  // Calculate statistics based on real data
  const pendingCount = technicians.filter(t => !t.directeur_valide).length;
  const approvedCount = technicians.filter(t => t.directeur_valide).length;
  const incompleteCount = technicians.filter(t => !t.email_valide).length;
  const completeCount = technicians.filter(t => t.email_valide).length;

            return (
        <DirectorLayout>
      {/* Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">En Attente de Validation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{approvedCount}</div>
              <div className="text-sm text-gray-600">Déjà Validés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completeCount}</div>
              <div className="text-sm text-gray-600">Comptes Complets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{incompleteCount}</div>
              <div className="text-sm text-gray-600">Comptes Incomplets</div>
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
                  <SelectItem value="pending">En attente de validation</SelectItem>
                  <SelectItem value="approved">Déjà validés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Rôle demandé" />
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

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Techniciens en Attente ({filteredTechnicians.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Chargement des techniciens en attente...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  {error}
                </div>
              ) : filteredTechnicians.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Aucun technicien en attente de validation.
                </div>
              ) : (
                filteredTechnicians.map((technician) => (
                  <div
                    key={technician.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{technician.name}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {technician.email}
                            </span>
                            {technician.telephone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {technician.telephone }
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(technician.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(technician)}
                        {getRoleBadge(technician.role)}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(technician)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {technician.directeur_valide ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectTechnician(technician)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleValidateTechnician(technician.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Valider
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Technicien</DialogTitle>
            <DialogDescription>
              Consultez les informations détaillées du technicien et prenez une décision de validation.
            </DialogDescription>
          </DialogHeader>
          {selectedTechnician && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations Personnelles</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom:</strong> {selectedTechnician.name}</p>
                    <p><strong>Email:</strong> {selectedTechnician.email}</p>
                    {selectedTechnician.telephone && <p><strong>Téléphone:</strong> {selectedTechnician.telephone}</p>}
                    {selectedTechnician.birthday && <p><strong>Date de naissance:</strong> {selectedTechnician.birthday}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Demande</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Rôle demandé:</strong> {getRoleBadge(selectedTechnician.role)}</p>
                    <p><strong>Date de candidature:</strong> {new Date(selectedTechnician.created_at).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Statut:</strong> {getStatusBadge(selectedTechnician)}</p>
                    <p><strong>Validé par directeur:</strong> {selectedTechnician.directeur_valide ? 'Oui' : 'Non'}</p>
                    <p><strong>Email validé:</strong> {selectedTechnician.email_valide ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedTechnician.directeur_valide === false ? (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleRejectTechnician(selectedTechnician)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Révoquer la Validation
                  </Button>
                  <Button
                    onClick={() => {
                      handleValidateTechnician(selectedTechnician.id);
                      setIsDetailModalOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider le Technicien
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleRejectTechnician(selectedTechnician)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Révoquer la Validation
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
}
