import React, { useState, useEffect } from "react";
import DirectorSidebar from "../components/DirectorSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  requestedRole: "technicien" | "technicien_sup";
  company?: string;
  location?: string;
  experience?: string;
  motivation?: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  documents?: string[];
  avatar?: string;
}

export default function AffiliationManagement() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AffiliationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AffiliationRequest | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockRequests: AffiliationRequest[] = [
      {
        id: "1",
        name: "Thomas Rousseau",
        email: "thomas.rousseau@example.com",
        phone: "+33 6 11 22 33 44",
        requestedRole: "technicien",
        company: "Agri-Tech Solutions",
        location: "Bordeaux, France",
        experience: "3 ans d'expérience en maintenance agricole",
        motivation: "Passionné par l'agriculture moderne et les technologies vertes.",
        requestDate: "2024-01-20",
        status: "pending",
        documents: ["CV_Thomas_Rousseau.pdf", "Certificat_Formation.pdf"]
      },
      {
        id: "2",
        name: "Emma Leclerc",
        email: "emma.leclerc@example.com",
        phone: "+33 6 55 66 77 88",
        requestedRole: "technicien_sup",
        company: "Green Solutions SARL",
        location: "Nantes, France",
        experience: "5 ans en tant que technicienne senior, spécialisée en systèmes d'irrigation",
        motivation: "Souhaitant rejoindre une équipe innovante dans le domaine agricole.",
        requestDate: "2024-01-18",
        status: "pending",
        documents: ["CV_Emma_Leclerc.pdf", "Diplome_Ingenieur.pdf", "Recommandations.pdf"]
      },
      {
        id: "3",
        name: "Julien Moreau",
        email: "julien.moreau@example.com",
        requestedRole: "technicien",
        location: "Strasbourg, France",
        experience: "2 ans d'expérience en maintenance d'équipements",
        motivation: "Intéressé par le développement durable et l'agriculture de précision.",
        requestDate: "2024-01-15",
        status: "approved"
      },
      {
        id: "4",
        name: "Alice Bernard",
        email: "alice.bernard@example.com",
        requestedRole: "technicien_sup",
        location: "Lille, France",
        experience: "1 an d'expérience",
        motivation: "Motivation insuffisante pour le poste de technicien supérieur.",
        requestDate: "2024-01-10",
        status: "rejected"
      }
    ];
    setRequests(mockRequests);
  }, []);

  const handleApproveRequest = (id: string) => {
    const updatedRequests = requests.map(request =>
      request.id === id ? { ...request, status: "approved" as const } : request
    );
    setRequests(updatedRequests);
    
    const requestName = requests.find(r => r.id === id)?.name;
    toast({
      title: "Demande approuvée",
      description: `La demande de ${requestName} a été approuvée.`,
    });
  };

  const handleRejectRequest = (id: string) => {
    const updatedRequests = requests.map(request =>
      request.id === id ? { ...request, status: "rejected" as const } : request
    );
    setRequests(updatedRequests);
    
    const requestName = requests.find(r => r.id === id)?.name;
    toast({
      title: "Demande rejetée",
      description: `La demande de ${requestName} a été rejetée.`,
      variant: "destructive",
    });
  };

  const getFilteredRequests = (status: string) => {
    if (status === "all") return requests;
    return requests.filter(request => request.status === status);
  };

  const getRoleDisplayName = (role: string) => {
    return role === "technicien_sup" ? "Technicien Supérieur" : "Technicien";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200 text-green-700";
      case "rejected":
        return "bg-red-50 border-red-200 text-red-700";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvée";
      case "rejected":
        return "Rejetée";
      case "pending":
        return "En attente";
      default:
        return "Non défini";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "rejected":
        return XCircle;
      case "pending":
        return Clock;
      default:
        return Clock;
    }
  };

  const RequestCard = ({ request }: { request: AffiliationRequest }) => {
    const StatusIcon = getStatusIcon(request.status);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.avatar} />
                <AvatarFallback>
                  {request.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {request.email}
                  </span>
                  {request.phone && (
                    <span className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {request.phone}
                    </span>
                  )}
                  {request.location && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {request.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">
                    {getRoleDisplayName(request.requestedRole)}
                  </Badge>
                  <span className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <Badge variant="outline" className={getStatusColor(request.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {getStatusDisplayName(request.status)}
                </Badge>
                {request.documents && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <FileText className="h-4 w-4 mr-1" />
                    {request.documents.length} document(s)
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>

                {request.status === "pending" && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approuver la demande</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir approuver la demande d'affiliation de {request.name} ? 
                            Un compte sera automatiquement créé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approuver
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <UserX className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rejeter la demande</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir rejeter la demande d'affiliation de {request.name} ? 
                            Cette action peut être annulée ultérieurement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRejectRequest(request.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Rejeter
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gestion des demandes d'affiliation
              </h1>
              <p className="text-gray-600 mt-1">
                Validez les comptes de techniciens et techniciens supérieurs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} en attente
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                    <p className="text-sm font-medium text-gray-600">Approuvées</p>
                    <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejetées</p>
                    <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different request statuses */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Approuvées ({approvedCount})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées ({rejectedCount})</TabsTrigger>
              <TabsTrigger value="all">Toutes ({requests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {getFilteredRequests("pending").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {getFilteredRequests("pending").length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune demande en attente
                    </h3>
                    <p className="text-gray-600">
                      Toutes les demandes d'affiliation ont été traitées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {getFilteredRequests("approved").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {getFilteredRequests("rejected").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Request Details Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande d'affiliation</DialogTitle>
            <DialogDescription>
              Informations complètes du candidat
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRequest.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedRequest.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedRequest.name}</h3>
                  <p className="text-gray-600">{selectedRequest.email}</p>
                  <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                    {getStatusDisplayName(selectedRequest.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rôle demandé</label>
                  <p className="mt-1">{getRoleDisplayName(selectedRequest.requestedRole)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de demande</label>
                  <p className="mt-1">{new Date(selectedRequest.requestDate).toLocaleDateString('fr-FR')}</p>
                </div>
                {selectedRequest.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1">{selectedRequest.phone}</p>
                  </div>
                )}
                {selectedRequest.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Localisation</label>
                    <p className="mt-1">{selectedRequest.location}</p>
                  </div>
                )}
                {selectedRequest.company && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Entreprise actuelle</label>
                    <p className="mt-1">{selectedRequest.company}</p>
                  </div>
                )}
              </div>

              {selectedRequest.experience && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Expérience</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.experience}</p>
                </div>
              )}

              {selectedRequest.motivation && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Motivation</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.motivation}</p>
                </div>
              )}

              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Documents joints</label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{doc}</span>
                        <Button variant="outline" size="sm" className="ml-auto">
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleApproveRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRejectRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
