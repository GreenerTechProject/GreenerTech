import React, { useState, useEffect } from "react";
import DirectorSidebar from "../components/DirectorSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "technicien" | "technicien_sup";
  status: "active" | "inactive" | "pending";
  location?: string;
  joinDate: string;
  interventions: number;
  avatar?: string;
}

export default function TechnicianManagement() {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "technicien" as "technicien" | "technicien_sup",
    location: ""
  });

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockTechnicians: Technician[] = [
      {
        id: "1",
        name: "Marie Dubois",
        email: "marie.dubois@example.com",
        phone: "+33 6 12 34 56 78",
        role: "technicien_sup",
        status: "active",
        location: "Paris, France",
        joinDate: "2023-01-15",
        interventions: 45
      },
      {
        id: "2",
        name: "Jean Martin",
        email: "jean.martin@example.com",
        phone: "+33 6 98 76 54 32",
        role: "technicien",
        status: "active",
        location: "Lyon, France",
        joinDate: "2023-03-20",
        interventions: 32
      },
      {
        id: "3",
        name: "Sophie Lambert",
        email: "sophie.lambert@example.com",
        role: "technicien",
        status: "pending",
        location: "Marseille, France",
        joinDate: "2024-01-10",
        interventions: 8
      },
      {
        id: "4",
        name: "Pierre Durand",
        email: "pierre.durand@example.com",
        phone: "+33 6 55 44 33 22",
        role: "technicien_sup",
        status: "inactive",
        location: "Toulouse, France",
        joinDate: "2022-11-05",
        interventions: 67
      }
    ];
    setTechnicians(mockTechnicians);
  }, []);

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || tech.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || tech.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateTechnician = () => {
    const newTechnician: Technician = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      joinDate: new Date().toISOString().split('T')[0],
      interventions: 0
    };

    setTechnicians([...technicians, newTechnician]);
    setIsCreateModalOpen(false);
    setFormData({ name: "", email: "", phone: "", role: "technicien", location: "" });
    
    toast({
      title: "Technicien créé",
      description: `${newTechnician.name} a été ajouté avec succès.`,
    });
  };

  const handleEditTechnician = (technician: Technician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      email: technician.email,
      phone: technician.phone || "",
      role: technician.role,
      location: technician.location || ""
    });
  };

  const handleUpdateTechnician = () => {
    if (!editingTechnician) return;

    const updatedTechnicians = technicians.map(tech =>
      tech.id === editingTechnician.id
        ? { ...tech, ...formData }
        : tech
    );

    setTechnicians(updatedTechnicians);
    setEditingTechnician(null);
    setFormData({ name: "", email: "", phone: "", role: "technicien", location: "" });
    
    toast({
      title: "Technicien mis à jour",
      description: `Les informations ont été sauvegardées.`,
    });
  };

  const handleDeleteTechnician = (id: string) => {
    const technicianName = technicians.find(t => t.id === id)?.name;
    setTechnicians(technicians.filter(tech => tech.id !== id));
    
    toast({
      title: "Technicien supprimé",
      description: `${technicianName} a été supprimé du système.`,
      variant: "destructive",
    });
  };

  const handleStatusChange = (id: string, newStatus: "active" | "inactive") => {
    const updatedTechnicians = technicians.map(tech =>
      tech.id === id ? { ...tech, status: newStatus } : tech
    );
    setTechnicians(updatedTechnicians);
    
    toast({
      title: "Statut mis à jour",
      description: `Le statut du technicien a été changé.`,
    });
  };

  const getRoleDisplayName = (role: string) => {
    return role === "technicien_sup" ? "Technicien Supérieur" : "Technicien";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 border-green-200 text-green-700";
      case "inactive":
        return "bg-red-50 border-red-200 text-red-700";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "inactive":
        return "Inactif";
      case "pending":
        return "En attente";
      default:
        return "Non défini";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gestion des techniciens
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les comptes et autorisations des techniciens
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter technicien
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau technicien</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nom du technicien"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
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
                    <Select value={formData.role} onValueChange={(value: "technicien" | "technicien_sup") => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technicien">Technicien</SelectItem>
                        <SelectItem value="technicien_sup">Technicien Supérieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Ville, Pays"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateTechnician}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6">
          {/* Filters and Search */}
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
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="technicien_sup">Technicien Supérieur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Technicians List */}
          <div className="grid gap-4">
            {filteredTechnicians.map((technician) => (
              <Card key={technician.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={technician.avatar} />
                        <AvatarFallback>
                          {technician.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {technician.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {technician.email}
                          </span>
                          {technician.phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {technician.phone}
                            </span>
                          )}
                          {technician.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {technician.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleDisplayName(technician.role)}
                        </Badge>
                        <div>
                          <Badge variant="outline" className={getStatusColor(technician.status)}>
                            {getStatusDisplayName(technician.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-600">
                        <div>{technician.interventions} interventions</div>
                        <div>Depuis {new Date(technician.joinDate).toLocaleDateString('fr-FR')}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {technician.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(technician.id, "inactive")}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(technician.id, "active")}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}

                        <Dialog open={editingTechnician?.id === technician.id} onOpenChange={(open) => !open && setEditingTechnician(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTechnician(technician)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Modifier le technicien</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Nom complet</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                <Select value={formData.role} onValueChange={(value: "technicien" | "technicien_sup") => setFormData({...formData, role: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="technicien">Technicien</SelectItem>
                                    <SelectItem value="technicien_sup">Technicien Supérieur</SelectItem>
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
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingTechnician(null)}>
                                Annuler
                              </Button>
                              <Button onClick={handleUpdateTechnician}>
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
                              <AlertDialogTitle>Supprimer le technicien</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {technician.name} ? 
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTechnician(technician.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTechnicians.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun technicien trouvé
                </h3>
                <p className="text-gray-600">
                  Aucun technicien ne correspond à vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
