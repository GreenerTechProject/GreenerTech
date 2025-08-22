import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  lastActivity?: string;
  status: 'active' | 'inactive' | 'pending';
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

        // Fetch all technicians from the company
        const allTechnicians = await technicianService.getAllTechniciansByCompany(user.id_entreprise);
        
        // Filter only technicians assigned to this supervisor
        const supervisedTechnicians = allTechnicians.filter((tech: any) => 
          tech.role === 'technicien' && 
          String(tech.id_assigned) === String(user.id)
        );

        // Enhance technician data with additional information
        const enhancedTechnicians: SupervisedTechnician[] = await Promise.all(
          supervisedTechnicians.map(async (tech: any) => {
            try {
              // Get intervention statistics
              const interventions = await technicianService.getInterventionsByTechnician(tech.id);
              
              // Get assigned serres
              const assignedSerres = await serreService.getSerresAssignedToUser(tech.id);
              
              // Calculate status
              let status: 'active' | 'inactive' | 'pending' = 'inactive';
              if (tech.directeur_valide && tech.email_valide) {
                status = 'active';
              } else if (tech.directeur_valide && !tech.email_valide) {
                status = 'pending';
              }

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
                lastActivity: tech.updated_at,
                status,
              };
            } catch (error) {
              console.error(`Error enhancing technician ${tech.id}:`, error);
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

  // Filter technicians based on search and status
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
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de l'Équipe</h1>
          <p className="text-gray-600">Gérez les techniciens sous votre supervision</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-700">
            {technicians.length} Technicien{technicians.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un technicien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {filteredTechnicians.length} résultat{filteredTechnicians.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technicians List */}
      <Card>
        <CardHeader>
          <CardTitle>Techniciens Supervisés</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Technicien</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Serres Assignées</TableHead>
                    <TableHead>Interventions</TableHead>
                    <TableHead>Dernière Activité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {technician.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {technician.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {technician.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{technician.email}</span>
                          </div>
                          {technician.telephone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{technician.telephone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(technician.status)}
                          {getStatusBadge(technician.status)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {technician.assignedSerres.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {technician.assignedSerres.slice(0, 3).map((serre, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {serre}
                                </Badge>
                              ))}
                              {technician.assignedSerres.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{technician.assignedSerres.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Aucune serre assignée</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              {technician.interventionStats.completed} terminées
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">
                              {technician.interventionStats.inProgress} en cours
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: {technician.interventionStats.total}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {technician.lastActivity ? (
                            new Date(technician.lastActivity).toLocaleDateString('fr-FR')
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
                        >
                          <Eye className="h-4 w-4 mr-2" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {technicians.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {technicians.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inactifs</p>
                <p className="text-2xl font-bold text-red-600">
                  {technicians.filter(t => t.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Serres</p>
                <p className="text-2xl font-bold text-blue-600">
                  {technicians.reduce((total, tech) => total + tech.assignedSerres.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
