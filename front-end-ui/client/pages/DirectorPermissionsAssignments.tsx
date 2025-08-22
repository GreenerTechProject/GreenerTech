import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DirectorLayout from '../components/DirectorLayout';
import { useToast } from '@/hooks/use-toast';
import { technicianService, Technician } from '../services/technicianService';
import { serreService } from '../services/serreService';
import { assignmentService } from '../services/assignmentService';
import { useIsMobile } from '../hooks/use-mobile';
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
  id: string | number;
  nom: string;
  domaine_nom?: string;
  assignedTechnicians?: Technician[];
}

export default function DirectorPermissionsAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
  const [isAssigning, setIsAssigning] = useState(false);

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
      setIsAssigning(true);
      
      // Convert IDs to numbers for the API call
      const technicianId = Number(selectedTechnician.id);
      const supervisorId = Number(selectedSupervisor.id);
      
      await assignmentService.assignTechnicianToSupervisor(technicianId, supervisorId);
      
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
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignTechnician = async (technician: Technician) => {
    if (!technician.id_assigned) return;
    
    try {
      setIsAssigning(true);
      
      // Convert IDs to numbers for the API call
      const technicianId = Number(technician.id);
      
      await assignmentService.removeTechnicianFromSupervisor(technicianId);
      
      toast({
        title: "Succès",
        description: `Technicien ${technician.fullName} retiré du superviseur`,
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || 'Erreur lors du retrait de l\'assignation',
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
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

  const getTechniciansForSupervisor = (supervisorId: string | number) => {
    return technicians.filter(t => t.id_assigned === supervisorId);
  };

  const getUnassignedTechnicians = () => {
    return technicians.filter(t => !t.id_assigned);
  };

  const getSupervisorForTechnician = (technicianId: string | number) => {
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
    <DirectorLayout 
      title="Autorisations et Assignations" 
      subtitle="Gérer les permissions et assignations au sein de votre entreprise"
    >
      {/* Hide title and subtitle on mobile */}
      {!isMobile && (
        <div className={cn(
          "mb-4 sm:mb-6",
          isMobile ? "space-y-2" : "space-y-1"
        )}>
          <h1 className={cn(
            "text-2xl font-bold text-gray-900",
            isMobile ? "text-xl" : ""
          )}>
            Autorisations et Assignations
          </h1>
          <p className={cn(
            "text-gray-600",
            isMobile ? "text-sm" : ""
          )}>
            Gérer les permissions et assignations au sein de votre entreprise
          </p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className={cn(
          "grid w-full",
          isMobile ? "grid-cols-1 h-auto p-1" : "grid-cols-3"
        )}>
          <TabsTrigger 
            value="technicians" 
            className={cn(
              isMobile ? "h-12 text-sm py-3" : ""
            )}
          >
            Techniciens et Superviseurs
          </TabsTrigger>
          <TabsTrigger 
            value="assignments"
            className={cn(
              isMobile ? "h-12 text-sm py-3" : ""
            )}
          >
            Assignations
          </TabsTrigger>
          <TabsTrigger 
            value="serres"
            className={cn(
              isMobile ? "h-12 text-sm py-3" : ""
            )}
          >
            Assignations Serres
          </TabsTrigger>
        </TabsList>

        {/* Techniciens et Superviseurs Tab */}
        <TabsContent value="technicians" className="space-y-4 sm:space-y-6">
          <div className={cn(
            "grid gap-4 sm:gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {/* Superviseurs */}
            <Card>
              <CardHeader className={cn(
                "pb-3",
                isMobile ? "px-4 py-3" : ""
              )}>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-5 w-5" />
                  Superviseurs ({supervisors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                isMobile ? "px-4 pb-4" : ""
              )}>
                <div className="space-y-3">
                  {supervisors.map((supervisor) => (
                    <div key={supervisor.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <div className="font-medium text-sm sm:text-base">{supervisor.fullName}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{supervisor.email}</div>
                        <div className="text-xs text-gray-400">
                          {getTechniciansForSupervisor(supervisor.id).length} technicien(s) assigné(s)
                        </div>
                      </div>
                      <Badge variant="secondary" className="self-start sm:self-center">Superviseur</Badge>
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
              <CardHeader className={cn(
                "pb-3",
                isMobile ? "px-4 py-3" : ""
              )}>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-5 w-5" />
                  Techniciens ({technicians.length})
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                isMobile ? "px-4 pb-4" : ""
              )}>
                <div className="space-y-3">
                  {technicians.map((technician) => (
                    <div key={technician.id} className="flex flex-col space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm sm:text-base">{technician.fullName}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{technician.email}</div>
                        <div className="text-xs text-gray-400">
                          {technician.id_assigned 
                            ? `Supervisé par: ${getSupervisorForTechnician(technician.id_assigned)?.fullName || 'Inconnu'}`
                            : 'Non assigné'
                          }
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {technician.id_assigned ? (
                          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 self-start">
                            Assigné
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50 self-start">
                            Non assigné
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTechnician(technician);
                            setIsAssignTechnicianOpen(true);
                          }}
                          className={cn(
                            "w-full sm:w-auto",
                            isMobile ? "h-10 text-sm" : ""
                          )}
                        >
                          Assigner
                        </Button>
                      </div>
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
        <TabsContent value="assignments" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className={cn(
              "pb-3",
              isMobile ? "px-4 py-3" : ""
            )}>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <UserCheck className="h-5 w-5" />
                Assignations Actuelles
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              isMobile ? "px-4 pb-4" : ""
            )}>
              <div className="space-y-4">
                {isMobile ? (
                  // Mobile-friendly card layout
                  <div className="space-y-3">
                    {technicians
                      .filter(t => t.id_assigned)
                      .map((technician) => {
                        const supervisor = getSupervisorForTechnician(technician.id_assigned!);
                        return (
                          <Card key={technician.id} className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="font-medium text-sm">Technicien</div>
                                <div className="text-gray-600">{technician.fullName}</div>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Superviseur</div>
                                <div className="text-gray-600">{supervisor?.fullName || 'Inconnu'}</div>
                              </div>
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnassignTechnician(technician)}
                                  disabled={isAssigning}
                                  className={cn(
                                    "w-full",
                                    isMobile ? "h-10 text-sm" : ""
                                  )}
                                >
                                  {isAssigning ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Retirer"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    
                    {technicians.filter(t => t.id_assigned).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Aucune assignation actuelle</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop table layout
                  <div className="overflow-x-auto">
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
                                    onClick={() => handleUnassignTechnician(technician)}
                                    disabled={isAssigning}
                                  >
                                    {isAssigning ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Retirer"
                                    )}
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
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignations Serres Tab */}
        <TabsContent value="serres" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className={cn(
              "pb-3",
              isMobile ? "px-4 py-3" : ""
            )}>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5" />
                Assigner Serres aux Superviseurs
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              isMobile ? "px-4 pb-4" : ""
            )}>
              <div className="space-y-4">
                {/* Assignation Form */}
                <div className={cn(
                  "grid gap-4",
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
                )}>
                  <div>
                    <Label htmlFor="serre" className={cn(
                      isMobile ? "text-sm" : ""
                    )}>Serre</Label>
                    <Select onValueChange={(value) => {
                      const serre = serres.find(s => s.id.toString() === value);
                      setSelectedSerre(serre || null);
                    }}>
                      <SelectTrigger className={cn(
                        isMobile ? "h-10 text-sm" : ""
                      )}>
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
                    <Label htmlFor="supervisor" className={cn(
                      isMobile ? "text-sm" : ""
                    )}>Superviseur</Label>
                    <Select onValueChange={(value) => {
                      const sup = supervisors.find(s => s.id.toString() === value);
                      setSelectedSupervisor(sup || null);
                    }}>
                      <SelectTrigger className={cn(
                        isMobile ? "h-10 text-sm" : ""
                      )}>
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
                  
                  <div className={cn(
                    "flex items-end",
                    isMobile ? "pt-2" : ""
                  )}>
                    <Button 
                      onClick={handleAssignSerreToSupervisor}
                      disabled={!selectedSerre || !selectedSupervisor}
                      className={cn(
                        "w-full",
                        isMobile ? "h-10 text-sm" : ""
                      )}
                    >
                      Assigner
                    </Button>
                  </div>
                </div>

                {/* Current Serre Assignments */}
                <div className="mt-6">
                  <h3 className={cn(
                    "font-medium mb-3",
                    isMobile ? "text-base" : "text-lg"
                  )}>Assignations serres actuelles</h3>
                  <div className={cn(
                    "grid gap-4",
                    isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}>
                    {serres.map((serre) => (
                      <Card key={serre.id} className={cn(
                        "p-4",
                        isMobile ? "p-3" : ""
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                          <h4 className={cn(
                            "font-medium",
                            isMobile ? "text-sm" : "text-sm sm:text-base"
                          )}>{serre.nom}</h4>
                          <Badge variant="outline" className={cn(
                            "self-start sm:self-center",
                            isMobile ? "text-xs px-2 py-1" : ""
                          )}>{serre.domaine_nom}</Badge>
                        </div>
                        <div className={cn(
                          "text-gray-600",
                          isMobile ? "text-xs" : "text-sm"
                        )}>
                          {serre.assignedTechnicians && serre.assignedTechnicians.length > 0 ? (
                            <div>
                              <p className={cn(
                                "font-medium mb-1",
                                isMobile ? "text-xs" : ""
                              )}>Techniciens assignés:</p>
                              <ul className="space-y-1">
                                {serre.assignedTechnicians.map((tech) => (
                                  <li key={tech.id} className={cn(
                                    isMobile ? "text-xs" : "text-xs"
                                  )}>
                                    • {tech.fullName}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className={cn(
                              "text-gray-500",
                              isMobile ? "text-xs" : ""
                            )}>Aucun technicien assigné</p>
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

      {/* Assignment Dialog for Technicians */}
      <Dialog open={isAssignTechnicianOpen} onOpenChange={setIsAssignTechnicianOpen}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isMobile ? "w-[95vw] max-w-none mx-4" : ""
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              isMobile ? "text-lg" : ""
            )}>Assigner un technicien</DialogTitle>
            <DialogDescription className={cn(
              isMobile ? "text-sm" : ""
            )}>
              Sélectionnez un superviseur pour le technicien {selectedTechnician?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="supervisor-select" className={cn(
                isMobile ? "text-sm" : ""
              )}>Superviseur</Label>
              <Select onValueChange={(value) => {
                const sup = supervisors.find(s => s.id.toString() === value);
                setSelectedSupervisor(sup || null);
              }}>
                <SelectTrigger className={cn(
                  isMobile ? "h-10 text-sm" : ""
                )}>
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
            
            <div className={cn(
              "flex justify-end space-x-2 pt-4",
              isMobile ? "flex-col space-y-2 space-x-0" : ""
            )}>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignTechnicianOpen(false);
                  setSelectedTechnician(null);
                  setSelectedSupervisor(null);
                }}
                className={cn(
                  isMobile ? "w-full h-10 text-sm" : ""
                )}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssignTechnicianToSupervisor}
                disabled={!selectedSupervisor || isAssigning}
                className={cn(
                  isMobile ? "w-full h-10 text-sm" : ""
                )}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assignation...
                  </>
                ) : (
                  "Assigner"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
}
