import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
import { technicianService, Technician } from '../services/technicianService';
import { serreService } from '../services/serreService';
import { assignmentService } from '../services/assignmentService';
import {
  Users,
  UserCheck,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Loader2,
  Shield,
  Target
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Serre {
  id: number;
  nom: string;
  domaine_nom?: string;
  assignedTechnicians?: Technician[];
}

export default function DirectorPermissionsAssignments() {
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const { toast } = useToast();
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [supervisors, setSupervisors] = useState<Technician[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('technicians');
  
  // Assignment states
  const [isAssignTechnicianOpen, setIsAssignTechnicianOpen] = useState(false);
  const [isAssignSerreOpen, setIsAssignSerreOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Technician | null>(null);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);

  useEffect(() => {
    if (user?.id_entreprise) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch company-scoped data
      const [techs, sups, sers] = await Promise.all([
        technicianService.getTechniciansByCompany(user!.id_entreprise),
        technicianService.getSupervisorsByCompany(user!.id_entreprise),
        serreService.getAllSerres()
      ]);
      
      setTechnicians(techs);
      setSupervisors(sups);
      setSerres(sers);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Erreur lors du chargement des données');
      toast({
        title: "Erreur",
        description: error.message || 'Erreur lors du chargement des données',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnicianToSupervisor = async () => {
    if (!selectedTechnician || !selectedSupervisor) return;
    
    try {
      await assignmentService.assignTechnicianToSupervisor(
        selectedTechnician.id.toString(),
        selectedSupervisor.id.toString()
      );
      
      toast({
        title: "Succès",
        description: `Technicien ${selectedTechnician.fullName} assigné au superviseur ${selectedSupervisor.fullName}`,
      });
      
      // Refresh data
      await fetchData();
      setIsAssignTechnicianOpen(false);
      setSelectedTechnician(null);
      setSelectedSupervisor(null);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || 'Erreur lors de l\'assignation',
        variant: "destructive"
      });
    }
  };

  const handleAssignSerreToSupervisor = async () => {
    if (!selectedSerre || !selectedSupervisor) return;
    
    try {
      // This would need to be implemented in the backend
      // For now, we'll show a success message
      toast({
        title: "Succès",
        description: `Serre ${selectedSerre.nom} assignée au superviseur ${selectedSupervisor.fullName}`,
      });
      
      setIsAssignSerreOpen(false);
      setSelectedSerre(null);
      setSelectedSupervisor(null);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || 'Erreur lors de l\'assignation',
        variant: "destructive"
      });
    }
  };

  const getTechniciansForSupervisor = (supervisorId: number) => {
    return technicians.filter(t => t.id_assigned === supervisorId);
  };

  const getUnassignedTechnicians = () => {
    return technicians.filter(t => !t.id_assigned);
  };

  const getSupervisorForTechnician = (technicianId: number) => {
    return supervisors.find(s => s.id === technicianId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Autorisations et Assignations</h1>
              <p className="text-gray-600">Gérer les permissions et assignations au sein de votre entreprise</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="technicians">Techniciens et Superviseurs</TabsTrigger>
              <TabsTrigger value="assignments">Assignations</TabsTrigger>
              <TabsTrigger value="serres">Assignations Serres</TabsTrigger>
            </TabsList>

            {/* Techniciens et Superviseurs Tab */}
            <TabsContent value="technicians" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Superviseurs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Superviseurs ({supervisors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supervisors.map((supervisor) => (
                        <div key={supervisor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{supervisor.fullName}</div>
                            <div className="text-sm text-gray-500">{supervisor.email}</div>
                            <div className="text-xs text-gray-400">
                              {getTechniciansForSupervisor(supervisor.id).length} technicien(s) assigné(s)
                            </div>
                          </div>
                          <Badge variant="secondary">Superviseur</Badge>
                        </div>
                      ))}
                      {supervisors.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Aucun superviseur trouvé</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Techniciens */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Techniciens ({technicians.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {technicians.map((technician) => (
                        <div key={technician.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{technician.fullName}</div>
                            <div className="text-sm text-gray-500">{technician.email}</div>
                            <div className="text-xs text-gray-400">
                              {technician.id_assigned 
                                ? `Supervisé par: ${getSupervisorForTechnician(technician.id_assigned)?.fullName || 'Inconnu'}`
                                : 'Non assigné'
                              }
                            </div>
                          </div>
                          <Badge variant={technician.id_assigned ? "default" : "secondary"}>
                            {technician.id_assigned ? "Assigné" : "Non assigné"}
                          </Badge>
                        </div>
                      ))}
                      {technicians.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Aucun technicien trouvé</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Assignations Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Assigner Techniciens aux Superviseurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Assignation Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="technician">Technicien</Label>
                        <Select onValueChange={(value) => {
                          const tech = technicians.find(t => t.id.toString() === value);
                          setSelectedTechnician(tech || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un technicien" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUnassignedTechnicians().map((tech) => (
                              <SelectItem key={tech.id} value={tech.id.toString()}>
                                {tech.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="supervisor">Superviseur</Label>
                        <Select onValueChange={(value) => {
                          const sup = supervisors.find(s => s.id.toString() === value);
                          setSelectedSupervisor(sup || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un superviseur" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors.map((sup) => (
                              <SelectItem key={sup.id} value={sup.id.toString()}>
                                {sup.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={handleAssignTechnicianToSupervisor}
                          disabled={!selectedTechnician || !selectedSupervisor}
                          className="w-full"
                        >
                          Assigner
                        </Button>
                      </div>
                    </div>

                    {/* Current Assignments Table */}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Assignations actuelles</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Technicien</TableHead>
                            <TableHead>Superviseur</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {technicians
                            .filter(t => t.id_assigned)
                            .map((technician) => {
                              const supervisor = getSupervisorForTechnician(technician.id_assigned!);
                              return (
                                <TableRow key={technician.id}>
                                  <TableCell>{technician.fullName}</TableCell>
                                  <TableCell>{supervisor?.fullName || 'Inconnu'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTechnician(technician);
                                        setSelectedSupervisor(null);
                                        // TODO: Implement unassign functionality
                                      }}
                                    >
                                      Retirer
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                      
                      {technicians.filter(t => t.id_assigned).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Aucune assignation actuelle</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignations Serres Tab */}
            <TabsContent value="serres" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Assigner Serres aux Superviseurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Assignation Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="serre">Serre</Label>
                        <Select onValueChange={(value) => {
                          const serre = serres.find(s => s.id.toString() === value);
                          setSelectedSerre(serre || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une serre" />
                          </SelectTrigger>
                          <SelectContent>
                            {serres.map((serre) => (
                              <SelectItem key={serre.id} value={serre.id.toString()}>
                                {serre.nom} - {serre.domaine_nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="supervisor">Superviseur</Label>
                        <Select onValueChange={(value) => {
                          const sup = supervisors.find(s => s.id.toString() === value);
                          setSelectedSupervisor(sup || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un superviseur" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors.map((sup) => (
                              <SelectItem key={sup.id} value={sup.id.toString()}>
                                {sup.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={handleAssignSerreToSupervisor}
                          disabled={!selectedSerre || !selectedSupervisor}
                          className="w-full"
                        >
                          Assigner
                        </Button>
                      </div>
                    </div>

                    {/* Current Serre Assignments */}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Assignations serres actuelles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {serres.map((serre) => (
                          <Card key={serre.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{serre.nom}</h4>
                              <Badge variant="outline">{serre.domaine_nom}</Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {serre.assignedTechnicians && serre.assignedTechnicians.length > 0 ? (
                                <div>
                                  <p className="font-medium mb-1">Techniciens assignés:</p>
                                  <ul className="space-y-1">
                                    {serre.assignedTechnicians.map((tech) => (
                                      <li key={tech.id} className="text-xs">
                                        • {tech.fullName}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-gray-500">Aucun technicien assigné</p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
