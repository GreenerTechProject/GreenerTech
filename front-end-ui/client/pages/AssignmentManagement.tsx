import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
import { assignmentService, User, Serre, Assignment } from '../services/assignmentService';
import { tokenManager } from '../services/authService';
import {
  Users,
  MapPin,
  Link,
  Unlink,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AssignmentManagement() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSerre, setSelectedSerre] = useState<string>('');

  // Fetch data on component mount
  useEffect(() => {
    if (user?.id_entreprise) {
      fetchData();
    }
  }, [user]);

  // Debug: Log assignments state changes
  useEffect(() => {
    console.log('Assignments state changed:', assignments);
    console.log('Assignments type:', typeof assignments, Array.isArray(assignments));
  }, [assignments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if we have a token
      const token = tokenManager.getToken();
      console.log('Debug: Token available:', !!token);
      console.log('Debug: User role:', user?.role);
      
      // Fetch users, serres, and current assignments using the service
      const [usersData, serresData, assignmentsData] = await Promise.all([
        assignmentService.getCompanyUsers(user.id_entreprise),
        assignmentService.getCompanySerres(user.id_entreprise),
        assignmentService.getCompanyAssignments()
      ]);
      
      console.log('Fetched data:', { usersData, serresData, assignmentsData });
      console.log('Assignments data type:', typeof assignmentsData, Array.isArray(assignmentsData));
      
      setUsers(usersData);
      setSerres(serresData);
      // Ensure assignments is always an array
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTechnicianToSupervisor = async () => {
    if (!selectedTech || !selectedSupervisor) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un technicien et un superviseur",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignmentService.assignTechnicianToSupervisor(
        parseInt(selectedTech),
        parseInt(selectedSupervisor)
      );

      toast({
        title: "Succès",
        description: "Technicien assigné au superviseur avec succès",
      });
      
      // Refresh data
      fetchData();
      
      // Reset form
      setSelectedTech('');
      setSelectedSupervisor('');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible d'assigner le technicien: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const assignUserToSerre = async () => {
    if (!selectedUser || !selectedSerre) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur et une serre",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignmentService.assignUserToSerre(
        parseInt(selectedUser),
        parseInt(selectedSerre)
      );

      toast({
        title: "Succès",
        description: "Utilisateur assigné à la serre avec succès",
      });
      
      // Refresh data
      fetchData();
      
      // Reset form
      setSelectedUser('');
      setSelectedSerre('');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible d'assigner l'utilisateur à la serre: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const removeUserFromSerre = async (userId: number, serreId: number) => {
    try {
      await assignmentService.removeUserFromSerre(userId, serreId);
      
      toast({
        title: "Succès",
        description: "Utilisateur retiré de la serre avec succès",
      });
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de retirer l'utilisateur: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Filter users by role
  const technicians = users.filter(u => u.role === 'technicien');
  const supervisors = users.filter(u => u.role === 'technicien_superieur');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <DirectorSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Gestion des Assignations</h1>
              <p className="text-gray-600">Gérez les assignations des techniciens et des serres</p>
            </div>
            <Button onClick={fetchData} variant="outline">
              Actualiser
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Technician to Supervisor Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Assigner un Technicien à un Superviseur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="technician">Technicien</Label>
                    <Select value={selectedTech} onValueChange={setSelectedTech}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un technicien" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id.toString()}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supervisor">Superviseur</Label>
                    <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un superviseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisors.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id.toString()}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={assignTechnicianToSupervisor}
                  disabled={!selectedTech || !selectedSupervisor}
                  className="w-full"
                >
                  Assigner
                </Button>
              </CardContent>
            </Card>

            {/* User to Serre Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>Assigner un Utilisateur à une Serre</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user">Utilisateur</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="serre">Serre</Label>
                    <Select value={selectedSerre} onValueChange={setSelectedSerre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une serre" />
                      </SelectTrigger>
                      <SelectContent>
                        {serres.map((serre) => (
                          <SelectItem key={serre.id} value={serre.id.toString()}>
                            {serre.nom} ({serre.domaine_nom})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={assignUserToSerre}
                  disabled={!selectedUser || !selectedSerre}
                  className="w-full"
                >
                  Assigner
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          {/* Current Assignments Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Assignations Actuelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(assignments) || assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune assignation trouvée</p>
                  <p className="text-sm">Les assignations apparaîtront ici une fois créées</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{assignment.user_name}</p>
                          <p className="text-sm text-gray-500">{assignment.serre_nom}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserFromSerre(assignment.id_user, assignment.id_serre)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-gray-600">Utilisateurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{serres.length}</p>
                    <p className="text-sm text-gray-600">Serres</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Link className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{Array.isArray(assignments) ? assignments.length : 0}</p>
                    <p className="text-sm text-gray-600">Assignations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
