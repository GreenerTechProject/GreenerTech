import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorHeader from '@/components/DirectorHeader';
import DirectorSidebar from '@/components/DirectorSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Edit, Bot, Settings } from 'lucide-react';
import { robotService } from '@/services/robotService';

interface Robot {
  id: number;
  nom: string;
  referance: string;
  id_entreprise: number;
}

const RobotConfig: React.FC = () => {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    referance: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    try {
      setLoading(true);
      const robots = await robotService.getAllRobots();
      setRobots(robots);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de récupérer les robots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRobot = async () => {
    if (!formData.nom || !formData.referance) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await robotService.createRobot({
        nom: formData.nom,
        referance: formData.referance
      });

      if (response.status === "success") {
        toast({
          title: "Succès",
          description: response.message || "Robot créé avec succès"
        });
        setIsCreateDialogOpen(false);
        setFormData({ nom: '', referance: '' });
        fetchRobots();
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive"
      });
    }
  };

  const handleEditRobot = async () => {
    if (!editingRobot || !formData.nom || !formData.referance) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const robot = await robotService.updateRobot(editingRobot.id, {
        nom: formData.nom,
        referance: formData.referance
      });

      if (robot.id) {
        toast({
          title: "Succès",
          description: "Robot mis à jour avec succès"
        });
        setIsEditDialogOpen(false);
        setEditingRobot(null);
        setFormData({ nom: '', referance: '' });
        fetchRobots();
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la mise à jour",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRobot = async (robotId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce robot ?')) {
      return;
    }

    try {
      const response = await robotService.deleteRobot(robotId);
      
      if (response.status === "success") {
        toast({
          title: "Succès",
          description: response.message || "Robot supprimé avec succès"
        });
        fetchRobots();
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (robot: Robot) => {
    setEditingRobot(robot);
    setFormData({
      nom: robot.nom,
      referance: robot.referance
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ nom: '', referance: '' });
    setEditingRobot(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm} className="w-full sm:w-auto text-sm sm:text-base">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Nouveau Robot
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-sm sm:text-base">
                          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <span>Créer un nouveau robot</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nom" className="text-sm sm:text-base">Nom du robot</Label>
                          <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Nom du robot"
                            className="mt-1 text-sm sm:text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referance" className="text-sm sm:text-base">Référence</Label>
                          <Input
                            id="referance"
                            value={formData.referance}
                            onChange={(e) => setFormData({ ...formData, referance: e.target.value })}
                            placeholder="Référence du robot"
                            className="mt-1 text-sm sm:text-base"
                          />
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                          <p>Le robot sera automatiquement associé à votre entreprise.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                            Annuler
                          </Button>
                          <Button onClick={handleCreateRobot} className="w-full sm:w-auto text-sm sm:text-base">
                            Créer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Robots List */}
            <Card className="shadow-sm border-0">
              <CardHeader className="border-b border-gray-200 bg-white">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <span>Liste des Robots</span>
                  {robots.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {robots.length} robot{robots.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des robots...</p>
                  </div>
                ) : robots.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Bot className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun robot configuré</h3>
                    <p className="text-sm sm:text-base text-gray-500 mb-6">Commencez par créer votre premier robot pour automatiser vos tâches agricoles.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="text-sm sm:text-base">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Créer le premier robot
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Nom</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Référence</TableHead>
                          <TableHead className="font-medium text-gray-700 hidden sm:table-cell text-xs sm:text-sm">Entreprise ID</TableHead>
                          <TableHead className="font-medium text-gray-700 text-right text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {robots.map((robot) => (
                          <TableRow key={robot.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div className="flex items-center space-x-2">
                                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                <span>{robot.nom}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {robot.referance}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                              <Badge variant="outline" className="text-xs">
                                {robot.id_entreprise || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(robot)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                  title="Modifier"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRobot(robot.id)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Modifier le robot</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-nom" className="text-sm sm:text-base">Nom du robot</Label>
                    <Input
                      id="edit-nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Nom du robot"
                      className="mt-1 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-referance" className="text-sm sm:text-base">Référence</Label>
                    <Input
                      id="edit-referance"
                      value={formData.referance}
                      onChange={(e) => setFormData({ ...formData, referance: e.target.value })}
                      placeholder="Référence du robot"
                      className="mt-1 text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                      Annuler
                    </Button>
                    <Button onClick={handleEditRobot} className="w-full sm:w-auto text-sm sm:text-base">
                      Mettre à jour
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotConfig;
