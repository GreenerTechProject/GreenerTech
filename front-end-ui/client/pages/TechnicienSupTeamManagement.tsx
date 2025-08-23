import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { technicianService, Technician } from "@/services/technicianService";
import { serreService } from "@/services/serreService";
import { toast } from "sonner";

interface SupervisedTechnician extends Technician {
  assignedSerres: string[];
  interventionStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export default function TechnicienSupTeamManagement(): JSX.Element {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<SupervisedTechnician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<SupervisedTechnician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTechnician, setSelectedTechnician] = useState<SupervisedTechnician | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!user?.id_entreprise) return;
      
      try {
        setLoading(true);
        setError(null);

        const allTechnicians = await technicianService.getAllTechniciansByCompany(user.id_entreprise);
        
        const supervisedTechnicians = allTechnicians.filter((tech: any) => 
          tech.role === 'technicien' && 
          String(tech.id_assigned) === String(user.id)
        );

        const enhancedTechnicians: SupervisedTechnician[] = await Promise.all(
          supervisedTechnicians.map(async (tech: any) => {
            try {
              const interventions = await technicianService.getInterventionsByTechnician(tech.id);
              
              const assignedSerres = await serreService.getSerresAssignedToUser(tech.id);
              
              return {
                id: tech.id,
                fullName: tech.fullName || tech.name || tech.email,
                email: tech.email,
                telephone: tech.telephone,
                role: tech.role,
                birthday: tech.birthday,
                created_at: tech.created_at,
                updated_at: tech.updated_at,
                id_assigned: tech.id_assigned,
                setup_completed: tech.setup_completed,
                directeur_valide: tech.directeur_valide,
                email_valide: tech.email_valide,
                id_entreprise: tech.id_entreprise,
                assignedSerres: assignedSerres.map((s: any) => s.nom),
                interventionStats: {
                  total: interventions.length,
                  completed: interventions.filter((int: any) => int.status === 'terminé').length,
                  inProgress: interventions.filter((int: any) => int.status === 'encours').length,
                  pending: interventions.filter((int: any) => int.status === 'en_attente').length,
                },
                status,
              };
            } catch (error) {
              return {
                ...tech,
                assignedSerres: [],
                interventionStats: { total: 0, completed: 0, inProgress: 0, pending: 0 },
                status: 'inactive' as const,
              };
            }
          })
        );

        if (!isMounted) return;
        setTechnicians(enhancedTechnicians);
        setFilteredTechnicians(enhancedTechnicians);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Impossible de charger les techniciens');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user?.id, user?.id_entreprise]);

  useEffect(() => {
    let filtered = technicians;
    
    if (searchTerm) {
      filtered = filtered.filter(tech => 
        tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(tech => tech.status === statusFilter);
    }
    
    setFilteredTechnicians(filtered);
  }, [technicians, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion de l'Équipe</h1>
          <p className="text-sm text-gray-600">Techniciens sous votre supervision</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-base font-semibold text-gray-700">
            {technicians.length} Technicien{technicians.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-700">Actifs</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {technicians.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs font-medium text-yellow-700">En attente</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">
                  {technicians.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center space-x-2">
              <UserX className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs font-medium text-red-700">Inactifs</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">
                  {technicians.filter(t => t.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-700">Total Serres</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  {technicians.reduce((total, tech) => total + tech.assignedSerres.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            
            <div className="text-xs text-gray-500 flex items-center justify-center sm:justify-start">
              <Filter className="h-4 w-4 mr-2" />
              {filteredTechnicians.length} résultat{filteredTechnicians.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {filteredTechnicians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun technicien trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Technicien</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Serres</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Interventions</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Dernière Modif.</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {technician.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {technician.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {technician.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-xs truncate max-w-32">{technician.email}</span>
                          </div>
                          {technician.telephone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{technician.telephone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(technician.status)}
                          <span className="text-xs">
                            {technician.status === 'active' ? 'Actif' : 
                             technician.status === 'pending' ? 'En attente' : 'Inactif'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {technician.assignedSerres.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {technician.assignedSerres.slice(0, 2).map((serre, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {serre}
                                </Badge>
                              ))}
                              {technician.assignedSerres.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{technician.assignedSerres.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Aucune</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs">
                              {technician.interventionStats.completed}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs">
                              {technician.interventionStats.inProgress}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs text-gray-500">
                          {technician.updated_at ? (
                            new Date(technician.updated_at).toLocaleDateString('fr-FR')
                          ) : (
                            'Jamais'
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTechnician(technician)}
                          className="text-xs px-2 py-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTechnician} onOpenChange={() => setSelectedTechnician(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Technicien</DialogTitle>
            <DialogDescription>
              Informations détaillées et statistiques du technicien
            </DialogDescription>
          </DialogHeader>
          
          {selectedTechnician && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {selectedTechnician.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedTechnician.fullName}</h3>
                        <p className="text-sm text-gray-500">ID: {selectedTechnician.id}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedTechnician.email}</span>
                      </div>
                      {selectedTechnician.telephone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedTechnician.telephone}</span>
                        </div>
                      )}
                      {selectedTechnician.birthday && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(selectedTechnician.birthday).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Statut et Validation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedTechnician.status)}
                      <span className="font-medium">
                        {selectedTechnician.status === 'active' ? 'Actif' : 
                         selectedTechnician.status === 'pending' ? 'En attente' : 'Inactif'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Validation Directeur:</span>
                        <Badge variant={selectedTechnician.directeur_valide ? "default" : "secondary"}>
                          {selectedTechnician.directeur_valide ? "Validé" : "Non validé"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Email Validé:</span>
                        <Badge variant={selectedTechnician.email_valide ? "default" : "secondary"}>
                          {selectedTechnician.email_valide ? "Validé" : "Non validé"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Configuration:</span>
                        <Badge variant={selectedTechnician.setup_completed ? "default" : "secondary"}>
                          {selectedTechnician.setup_completed ? "Terminée" : "En cours"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Serres Assignées</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTechnician.assignedSerres.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTechnician.assignedSerres.map((serre, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {serre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune serre assignée</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Statistiques des Interventions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedTechnician.interventionStats.total}
                      </div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedTechnician.interventionStats.completed}
                      </div>
                      <div className="text-sm text-gray-600">Terminées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedTechnician.interventionStats.inProgress}
                      </div>
                      <div className="text-sm text-gray-600">En cours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedTechnician.interventionStats.pending}
                      </div>
                      <div className="text-sm text-gray-600">En attente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

       
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
