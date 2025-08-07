import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
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
  FileText
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
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AffiliationRequest[]>([
    {
      id: '1',
      applicantName: 'Sophie Dubois',
      email: 'sophie.dubois@email.com',
      phone: '+33 6 45 67 89 12',
      company: 'AgriTech Solutions',
      requestedRole: 'technicien_superieur',
      experience: '5 ans d\'expérience en agriculture de précision et systèmes hydroponiques',
      motivation: 'Passionnée par l\'innovation agricole, je souhaite contribuer à l\'évolution des pratiques durables...',
      documents: {
        cv: 'sophie_dubois_cv.pdf',
        certifications: ['Certification Hydroponique Avancée', 'Sécurité en Agriculture'],
        recommendations: ['lettre_recommandation_1.pdf']
      },
      location: 'Lyon, France',
      appliedDate: '2024-01-15',
      status: 'pending',
      skills: ['Hydroponique', 'Serres automatisées', 'Analyse des sols', 'Gestion IoT'],
      availability: 'Immédiate',
      references: [
        {
          name: 'Marc Leroy',
          position: 'Directeur Technique',
          company: 'Ferme du Futur',
          contact: 'marc.leroy@fermedufutur.com'
        }
      ]
    },
    {
      id: '2',
      applicantName: 'Antoine Moreau',
      email: 'antoine.moreau@email.com',
      phone: '+33 6 78 90 12 34',
      requestedRole: 'technicien',
      experience: '2 ans en maintenance de serres traditionnelles',
      motivation: 'Désireux d\'évoluer vers les technologies modernes...',
      documents: {
        cv: 'antoine_moreau_cv.pdf',
        certifications: ['CAP Agriculture']
      },
      location: 'Toulouse, France',
      appliedDate: '2024-01-18',
      status: 'under_review',
      skills: ['Maintenance', 'Irrigation', 'Culture légumes'],
      availability: 'Dans 2 semaines',
      references: []
    },
    {
      id: '3',
      applicantName: 'Lucie Petit',
      email: 'lucie.petit@email.com',
      requestedRole: 'technicien_superieur',
      experience: '8 ans en recherche agricole',
      motivation: 'Experte en optimisation de rendements...',
      documents: {
        cv: 'lucie_petit_cv.pdf',
        certifications: ['PhD Agronomie', 'Certification Bio'],
        recommendations: ['recommandation_inra.pdf']
      },
      location: 'Paris, France',
      appliedDate: '2024-01-10',
      status: 'approved',
      reviewedBy: 'Directeur Principal',
      reviewedDate: '2024-01-12',
      skills: ['Recherche', 'Optimisation', 'Agriculture bio', 'Data science'],
      availability: 'Flexible',
      references: [
        {
          name: 'Dr. Pierre Martin',
          position: 'Chercheur Senior',
          company: 'INRA',
          contact: 'pierre.martin@inra.fr'
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<AffiliationRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.company && request.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesRole = roleFilter === 'all' || request.requestedRole === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleApproveRequest = (requestId: string) => {
    const updatedRequests = requests.map(request =>
      request.id === requestId
        ? {
            ...request,
            status: 'approved' as const,
            reviewedBy: user?.name || user?.email || 'Directeur',
            reviewedDate: new Date().toISOString().split('T')[0]
          }
        : request
    );
    
    setRequests(updatedRequests);
    
    toast({
      title: "Demande approuvée",
      description: "Le technicien a été validé et peut maintenant accéder à la plateforme.",
    });
  };

  const handleRejectRequest = () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    
    const updatedRequests = requests.map(request =>
      request.id === selectedRequest.id
        ? {
            ...request,
            status: 'rejected' as const,
            reviewedBy: user?.name || user?.email || 'Directeur',
            reviewedDate: new Date().toISOString().split('T')[0],
            rejectionReason
          }
        : request
    );
    
    setRequests(updatedRequests);
    setIsRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedRequest(null);
    
    toast({
      title: "Demande rejetée",
      description: "La demande d'affiliation a été rejetée.",
      variant: "destructive"
    });
  };

  const handleSetUnderReview = (requestId: string) => {
    const updatedRequests = requests.map(request =>
      request.id === requestId
        ? { ...request, status: 'under_review' as const }
        : request
    );
    setRequests(updatedRequests);
    
    toast({
      title: "Mise en révision",
      description: "La demande est maintenant en cours de révision.",
    });
  };

  const openDetailModal = (request: AffiliationRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const openRejectDialog = (request: AffiliationRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En révision</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'technicien_superieur':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Technicien Supérieur</Badge>;
      case 'technicien':
        return <Badge variant="outline">Technicien</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const underReviewCount = requests.filter(r => r.status === 'under_review').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

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
                    Demandes d'Affiliation
                  </h1>
                  <p className="text-sm text-gray-600">
                    Valider les demandes de techniciens et techniciens supérieurs
                  </p>
                </div>
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
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">En Attente</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{underReviewCount}</div>
                <div className="text-sm text-gray-600">En Révision</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-sm text-gray-600">Approuvées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <div className="text-sm text-gray-600">Rejetées</div>
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
                      placeholder="Rechercher par nom, email ou entreprise..."
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
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="under_review">En révision</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
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
              <CardTitle>Demandes d'Affiliation ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{request.applicantName}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {request.email}
                            </span>
                            {request.phone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {request.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            {request.company && (
                              <span className="flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {request.company}
                              </span>
                            )}
                            {request.location && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {request.location}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(request.appliedDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {request.experience.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          Disponibilité: {request.availability}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(request.status)}
                        {getRoleBadge(request.requestedRole)}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetUnderReview(request.id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectDialog(request)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {request.status === 'under_review' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectDialog(request)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la Demande d'Affiliation</DialogTitle>
              <DialogDescription>
                Informations complètes du candidat
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informations Personnelles</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nom:</strong> {selectedRequest.applicantName}</p>
                      <p><strong>Email:</strong> {selectedRequest.email}</p>
                      {selectedRequest.phone && <p><strong>Téléphone:</strong> {selectedRequest.phone}</p>}
                      {selectedRequest.company && <p><strong>Entreprise:</strong> {selectedRequest.company}</p>}
                      {selectedRequest.location && <p><strong>Localisation:</strong> {selectedRequest.location}</p>}
                      <p><strong>Disponibilité:</strong> {selectedRequest.availability}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Demande</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Rôle demandé:</strong> {getRoleBadge(selectedRequest.requestedRole)}</p>
                      <p><strong>Date de candidature:</strong> {new Date(selectedRequest.appliedDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Statut:</strong> {getStatusBadge(selectedRequest.status)}</p>
                      {selectedRequest.reviewedBy && (
                        <>
                          <p><strong>Révisé par:</strong> {selectedRequest.reviewedBy}</p>
                          <p><strong>Date de révision:</strong> {selectedRequest.reviewedDate && new Date(selectedRequest.reviewedDate).toLocaleDateString('fr-FR')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Expérience</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.experience}
                  </p>
                </div>

                {/* Motivation */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Motivation</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.motivation}
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Compétences</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {selectedRequest.documents.cv && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{selectedRequest.documents.cv}</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {selectedRequest.documents.certifications?.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{cert}</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* References */}
                {selectedRequest.references.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Références</h3>
                    <div className="space-y-2">
                      {selectedRequest.references.map((ref, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{ref.name}</p>
                          <p className="text-sm text-gray-600">{ref.position} - {ref.company}</p>
                          <p className="text-sm text-gray-600">{ref.contact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Motif de Rejet</h3>
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedRequest.status === 'pending' || selectedRequest.status === 'under_review' ? (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => openRejectDialog(selectedRequest)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => {
                        handleApproveRequest(selectedRequest.id);
                        setIsDetailModalOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => setIsDetailModalOpen(false)}>
                      Fermer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeter la Demande</AlertDialogTitle>
              <AlertDialogDescription>
                Veuillez indiquer le motif du rejet de cette demande d'affiliation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <Label htmlFor="rejection-reason">Motif du rejet</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRejectionReason('')}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRejectRequest}
                className="bg-red-600 hover:bg-red-700"
                disabled={!rejectionReason.trim()}
              >
                Rejeter la Demande
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
