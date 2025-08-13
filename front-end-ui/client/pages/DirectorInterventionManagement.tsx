import React, { useState, useEffect } from 'react';
import { InterventionService } from '../services/interventionService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../contexts/AuthContext';

interface Intervention {
  id: number;
  date_intervention: string;
  description: string;
  statut: string;
  serre_id: number;
  technicien_id: number;
  type_tache_id: number;
  created_at: string;
  updated_at: string;
}

const DirectorInterventionManagement: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id_entreprise) {
      fetchInterventions();
    } else if (user && !user.id_entreprise) {
      setError('Aucune entreprise associée à votre compte');
      setLoading(false);
    }
  }, [user]);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InterventionService.getInterventionsByEnterprise(user?.id_entreprise);
      setInterventions(data);
    } catch (err) {
      setError('Erreur lors du chargement des interventions');
      console.error('Error fetching interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || intervention.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
      'encours': { variant: 'secondary', label: 'En cours' },
      'terminé': { variant: 'default', label: 'Terminée' },
      'en_attente': { variant: 'outline', label: 'En attente' },
      'annulee': { variant: 'destructive', label: 'Annulée' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des interventions...</div>
      </div>
    );
  }

  if (!user || user.role !== 'directeur') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">Accès non autorisé. Seuls les directeurs peuvent accéder à cette page.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Interventions</h1>
        <p className="text-gray-600">Gérez toutes les interventions de votre entreprise</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par description ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="encours">En cours</SelectItem>
                  <SelectItem value="terminé">Terminée</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchInterventions} variant="outline">
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {interventions.length}
            </div>
            <p className="text-sm text-gray-600">Total Interventions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {interventions.filter(i => i.statut === 'encours').length}
            </div>
            <p className="text-sm text-gray-600">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {interventions.filter(i => i.statut === 'terminé').length}
            </div>
            <p className="text-sm text-gray-600">Terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {interventions.filter(i => i.statut === 'en_attente').length}
            </div>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Interventions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Interventions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune intervention trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Serre ID</TableHead>
                  <TableHead>Technicien ID</TableHead>
                  <TableHead>Type Tâche</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterventions.map((intervention) => (
                  <TableRow key={intervention.id}>
                    <TableCell className="font-medium">{intervention.id}</TableCell>
                    <TableCell>
                      {intervention.date_intervention ? 
                        new Date(intervention.date_intervention).toLocaleDateString('fr-FR') : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={intervention.description}>
                      {intervention.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(intervention.statut)}</TableCell>
                    <TableCell>{intervention.serre_id}</TableCell>
                    <TableCell>{intervention.technicien_id}</TableCell>
                    <TableCell>{intervention.type_tache_id}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorInterventionManagement;
