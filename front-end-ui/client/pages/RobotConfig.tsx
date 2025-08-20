import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Trash2, Plus, Edit } from 'lucide-react';
import { robotService } from '../services/robotService';

interface Robot {
  id: number;
  nom: string;
  referance: string;
  id_entreprise: number;
}

const RobotConfig: React.FC = () => {
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configuration des Robots</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Robot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau robot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom du robot</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom du robot"
                />
              </div>
              <div>
                <Label htmlFor="referance">Référence</Label>
                <Input
                  id="referance"
                  value={formData.referance}
                  onChange={(e) => setFormData({ ...formData, referance: e.target.value })}
                  placeholder="Référence du robot"
                />
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>Le robot sera automatiquement associé à votre entreprise.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateRobot}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Robots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : robots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun robot configuré. Créez votre premier robot.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Entreprise ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {robots.map((robot) => (
                  <TableRow key={robot.id}>
                    <TableCell className="font-medium">{robot.nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{robot.referance}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{robot.id_entreprise || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(robot)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRobot(robot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le robot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nom">Nom du robot</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du robot"
              />
            </div>
            <div>
              <Label htmlFor="edit-referance">Référence</Label>
              <Input
                id="edit-referance"
                value={formData.referance}
                onChange={(e) => setFormData({ ...formData, referance: e.target.value })}
                placeholder="Référence du robot"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditRobot}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RobotConfig;
