import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Bot, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { missionService } from '../services/missionService';
import { robotService } from '../services/robotService';
import { serreService } from '../services/serreService';
import { toast } from 'sonner';
import { MissionCreation } from '../components/MissionCreation';
import { MissionEdit } from '../components/MissionEdit';
import TechHeader from '../components/TechHeader';
import { useAuth } from '../contexts/AuthContext';

// Define Mission interface to match the service
interface Mission {
  id: number;
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut: string | null;
  date_fin: string | null;
  jour: number | null;
  heure: number | null;
  minute: number | null;
  executed: boolean;
}

interface Robot {
  id: number;
  nom: string;
  referance: string;
}

interface Serre {
  id: number;
  nom: string;
  surface: number;
  domainId: string;
  guideId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: {
    id: string;
    nom: string;
    variete: string;
    rendement: number;
    date_debut_saison: Date | string;
    date_fin_saison: Date | string;
    irrigationType?: string;
    notes?: string;
  };
}

export const MissionManagement: React.FC = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
    fetchRobots();
    fetchSerres();
  }, []);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const missionsData = await missionService.getAllMissions();
      console.log('Missions data received:', missionsData);
      
      // Ensure missionsData is an array
      if (Array.isArray(missionsData)) {
        setMissions(missionsData);
      } else {
        console.error('Expected array but received:', typeof missionsData, missionsData);
        setMissions([]);
        setError('Format de données inattendu pour les missions');
        toast.error('Format de données inattendu pour les missions');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des missions:', error);
      const errorMessage = error.message || 'Erreur lors de la récupération des missions';
      setError(errorMessage);
      toast.error(errorMessage);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRobots = async () => {
    try {
      const robotsData = await robotService.getAllRobots();
      console.log('Robots data received:', robotsData);
      
      if (Array.isArray(robotsData)) {
        setRobots(robotsData);
      } else {
        console.error('Expected array but received:', typeof robotsData, robotsData);
        setRobots([]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des robots:', error);
      setRobots([]);
    }
  };

  const fetchSerres = async () => {
    try {
      // For mission management, only show serres the current user has access to
      const serresData = await serreService.getSerresByCurrentUser();
      console.log('Serres data received for current user:', serresData);
      if (Array.isArray(serresData)) {
        setSerres(serresData);
      } else {
        console.error('Expected array but received:', typeof serresData, serresData);
        setSerres([]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des serres:', error);
      setSerres([]);
    }
  };

  const handleDeleteMission = async (missionId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      try {
        await missionService.deleteMission(missionId);
        toast.success('Mission supprimée avec succès');
        fetchMissions();
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getRobotName = (robotId: number) => {
    if (!Array.isArray(robots)) return 'Robot inconnu';
    const robot = robots.find(r => r.id === robotId);
    return robot ? `${robot.nom} (${robot.referance})` : 'Robot inconnu';
  };

  const getSerreName = (serreId: number) => {
    
    if (!Array.isArray(serres)) return 'Serre inconnue';
    const serre = serres.find(s => s.id === serreId);
    return serre ? serre.nom : 'Serre inconnue';
  };

  const filteredMissions = Array.isArray(missions) ? missions.filter(mission => {
    const matchesSearch = 
      getRobotName(mission.id_robot).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSerreName(mission.id_serre).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'executed' && mission.executed) ||
      (statusFilter === 'pending' && !mission.executed);
    
    return matchesSearch && matchesStatus;
  }) : [];

  const handleMissionCreated = () => {
    setShowCreateDialog(false);
    fetchMissions();
  };

  const handleEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setShowEditDialog(true);
  };

  const handleMissionUpdated = () => {
    setShowEditDialog(false);
    setEditingMission(null);
    fetchMissions();
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setEditingMission(null);
  };

  // Determine user role for TechHeader
  const userRole = user?.role === 'technicien_sup' ? 'technicien_sup' : 'technicien';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TechHeader for Technician */}
      <TechHeader role={userRole} />
      
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
          <div className="flex-1">
          
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvelle Mission</span>
                <span className="sm:hidden">Nouvelle</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle mission</DialogTitle>
                <DialogDescription>
                  Configurez une mission pour un robot dans une serre spécifique
                </DialogDescription>
              </DialogHeader>
              <MissionCreation onMissionCreated={handleMissionCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Mission Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Modifier la mission</DialogTitle>
              <DialogDescription>
                Modifiez les paramètres de la mission sélectionnée
              </DialogDescription>
            </DialogHeader>
            {editingMission && (
              <MissionEdit
                mission={editingMission}
                onMissionUpdated={handleMissionUpdated}
                onCancel={handleCancelEdit}
              />
            )}
          </DialogContent>
        </Dialog>

             {/* Error Display */}
       {error && (
         <Card className="border-red-200 bg-red-50">
           <CardContent className="pt-4 sm:pt-6">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
               <div className="flex items-center gap-2 text-red-700">
                 <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                 <span className="font-medium">Erreur:</span>
                 <span className="text-sm sm:text-base">{error}</span>
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={fetchMissions}
                 disabled={loading}
                 className="w-full sm:w-auto"
               >
                 Réessayer
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

       {/* Filters */}
       <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm sm:text-base">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher par robot ou serre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm sm:text-base">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les missions</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="executed">Exécutées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm sm:text-base">Total des missions</Label>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {filteredMissions.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Liste des Missions</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {filteredMissions.length} mission(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
              Aucune mission trouvée
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Robot</TableHead>
                      <TableHead className="text-sm">Serre</TableHead>
                      <TableHead className="text-sm">Répétitions</TableHead>
                      <TableHead className="text-sm">Date de début</TableHead>
                      <TableHead className="text-sm">Date de fin</TableHead>
                      <TableHead className="text-sm">Statut</TableHead>
                      <TableHead className="text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMissions.map((mission) => (
                      <TableRow key={mission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">
                              {getRobotName(mission.id_robot)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{getSerreName(mission.id_serre)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>J: {mission.rep_jr}</div>
                            <div>S: {mission.rep_sem}</div>
                            {(mission.rep_jr > 0 || mission.rep_sem > 0) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {mission.heure !== null && mission.minute !== null && (
                                  <span>{mission.heure.toString().padStart(2, '0')}:{mission.minute.toString().padStart(2, '0')}</span>
                                )}
                                {mission.rep_sem > 0 && mission.jour && (
                                  <span className="ml-1">
                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][mission.jour - 1]}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {mission.date_debut ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {format(new Date(mission.date_debut), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mission.date_fin ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {format(new Date(mission.date_fin), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mission.executed ? "default" : "secondary"} className="text-xs">
                            {mission.executed ? "Exécutée" : "En attente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: View mission details */}}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMission(mission)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMission(mission.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredMissions.map((mission) => (
                  <Card key={mission.id} className="p-4">
                    <div className="space-y-3">
                      {/* Mission Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-sm">
                            {getRobotName(mission.id_robot)}
                          </span>
                        </div>
                        <Badge variant={mission.executed ? "default" : "secondary"} className="text-xs">
                          {mission.executed ? "Exécutée" : "En attente"}
                        </Badge>
                      </div>

                      {/* Mission Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span>{getSerreName(mission.id_serre)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Répétitions</div>
                          <div>J: {mission.rep_jr} | S: {mission.rep_sem}</div>
                          {(mission.rep_jr > 0 || mission.rep_sem > 0) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {mission.heure !== null && mission.minute !== null && (
                                <span>{mission.heure.toString().padStart(2, '0')}:{mission.minute.toString().padStart(2, '0')}</span>
                              )}
                              {mission.rep_sem > 0 && mission.jour && (
                                <span className="ml-1">
                                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][mission.jour - 1]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {mission.date_debut ? 
                              format(new Date(mission.date_debut), 'dd/MM/yyyy', { locale: fr }) : 
                              <span className="text-gray-400">-</span>
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {mission.date_fin ? 
                              format(new Date(mission.date_fin), 'dd/MM/yyyy', { locale: fr }) : 
                              <span className="text-gray-400">-</span>
                            }
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: View mission details */}}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMission(mission)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMission(mission.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
  );
};
