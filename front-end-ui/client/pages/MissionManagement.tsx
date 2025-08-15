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
import TechHeader from '../components/TechHeader';
import { useAuth } from '../contexts/AuthContext';

interface Mission {
  id: number;
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut: string;
  date_fin: string | null;
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
  id_domaine: number;
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
  const [error, setError] = useState<string | null>(null);

  // Determine user role for header
  const userRole = user?.role === 'technicien_superieur' ? 'technicien_sup' : 'technicien';

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
      // For technicians, only show serres they have access to
      const serresData = await serreService.getSerresByCurrentUser();
      console.log('Serres data received:', serresData);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role={userRole} />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Missions</h1>
            <p className="text-gray-600 mt-2">
              Gérez les missions des robots dans vos serres accessibles
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Erreur:</span>
                  <span>{error}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMissions}
                  disabled={loading}
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
           <CardTitle>Filtres</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="search">Rechercher</Label>
               <div className="relative">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                 <Input
                   id="search"
                   placeholder="Rechercher par robot ou serre..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="status">Statut</Label>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger>
                   <SelectValue placeholder="Filtrer par statut" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Toutes les missions</SelectItem>
                   <SelectItem value="pending">En attente</SelectItem>
                   <SelectItem value="executed">Exécutées</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Total des missions</Label>
               <div className="text-2xl font-bold text-blue-600">
                 {filteredMissions.length}
               </div>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Missions Table */}
       <Card>
         <CardHeader>
           <CardTitle>Liste des Missions</CardTitle>
           <CardDescription>
             {filteredMissions.length} mission(s) trouvée(s)
           </CardDescription>
         </CardHeader>
         <CardContent>
           {loading ? (
             <div className="flex justify-center items-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
           ) : filteredMissions.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
               Aucune mission trouvée
             </div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Robot</TableHead>
                     <TableHead>Serre</TableHead>
                     <TableHead>Répétitions</TableHead>
                     <TableHead>Date de début</TableHead>
                     <TableHead>Date de fin</TableHead>
                     <TableHead>Statut</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredMissions.map((mission) => (
                     <TableRow key={mission.id}>
                                              <TableCell>
                         <div className="flex items-center gap-2">
                           <Bot className="h-4 w-4 text-blue-600" />
                           <span className="font-medium">
                             {getRobotName(mission.id_robot)}
                           </span>
                         </div>
                       </TableCell>
                                              <TableCell>
                         <div className="flex items-center gap-2">
                           <Building2 className="h-4 w-4 text-green-600" />
                           <span>{getSerreName(mission.id_serre)}</span>
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>J: {mission.rep_jr}</div>
                          <div>S: {mission.rep_sem}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {format(new Date(mission.date_debut), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mission.date_fin ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {format(new Date(mission.date_fin), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mission.executed ? "default" : "secondary"}>
                          {mission.executed ? "Exécutée" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: View mission details */}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Edit mission */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMission(mission.id)}
                            className="text-red-600 hover:text-red-700"
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
          )}
        </CardContent>
      </Card>
    </div>
  </div>
  );
};
