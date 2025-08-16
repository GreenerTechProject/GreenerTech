import React, { useState, useEffect } from 'react';
import { InterventionService } from '../services/interventionService';
import type { Intervention as ApiIntervention } from '../services/interventionService';
import { serreService } from '../services/serreService';
import { technicianService } from '../services/technicianService';
import { typeTacheService } from '../services/typeTacheService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DirectorHeader from '@/components/DirectorHeader';
import DirectorSidebar from '@/components/DirectorSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';

interface DirectorIntervention {
  id: number;
  date_intervention: string;
  description: string;
  statut: string;
  serre_id: number;
  technicien_id: number;
  type_tache_id: number;
  created_at: string;
  updated_at: string;
  serre_nom?: string;
  technicien_nom?: string;
  total_charges?: number;
  date_fin?: string;
  type_tache_nom?: string;
}

const DirectorInterventionManagement: React.FC = () => {
  const [interventions, setInterventions] = useState<DirectorIntervention[]>([]);
  const { isOpen, setIsOpen } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const [serreNameById, setSerreNameById] = useState<Record<number, string>>({});
  const [technicianNameById, setTechnicianNameById] = useState<Record<number, string>>({});
  const [typeNameById, setTypeNameById] = useState<Record<number, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState<DirectorIntervention | null>(null);

  useEffect(() => {
    if (user?.id_entreprise) {
      fetchInterventions();
      fetchReferenceData();
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
      const mapped: DirectorIntervention[] = (data as ApiIntervention[]).map((item) => ({
        id: (item as any).id,
        date_intervention: (item as any).date_intervention ?? (item as any).date_debut ?? '',
        description: (item as any).description ?? '',
        statut: (item as any).statut ?? '',
        serre_id: (item as any).serre_id ?? (item as any).id_serre ?? 0,
        technicien_id: (item as any).technicien_id ?? (item as any).id_user ?? 0,
        type_tache_id: (item as any).type_tache_id ?? (item as any).id_type_tache ?? 0,
        created_at: (item as any).created_at ?? '',
        updated_at: (item as any).updated_at ?? '',
        serre_nom: (item as any).serre_nom ?? undefined,
        technicien_nom: (item as any).technicien_nom ?? (item as any).technicien_name ?? undefined,
        total_charges: (() => {
          const raw = (item as any).total_charges ?? (item as any).charges ?? (item as any).totalCharges;
          const trimmed = typeof raw === 'string' ? raw.replace(/[^\d,.-]/g, '').replace(',', '.') : raw;
          const num = typeof trimmed === 'string' ? Number(trimmed) : trimmed;
          return typeof num === 'number' && !Number.isNaN(num) ? num : undefined;
        })(),
        date_fin: (item as any).date_fin ?? undefined,
        type_tache_nom: (item as any).type_nom ?? (item as any).type_tache_nom ?? undefined,
      }));
      setInterventions(mapped);

      // Backfill missing charges by fetching individual intervention details
      const missing = mapped.filter(m => m.total_charges === undefined).map(m => m.id);
      if (missing.length > 0) {
        try {
          const details = await Promise.all(missing.map(id => InterventionService.getIntervention(id).catch(() => null)));
          const chargesById: Record<number, number> = {};
          details.forEach((d: any) => {
            if (d && d.id != null) {
              const raw = (d as any).total_charges ?? (d as any).charges ?? (d as any).totalCharges;
              const trimmed = typeof raw === 'string' ? raw.replace(/[^\d,.-]/g, '').replace(',', '.') : raw;
              const num = typeof trimmed === 'string' ? Number(trimmed) : trimmed;
              if (typeof num === 'number' && !Number.isNaN(num)) {
                chargesById[(d as any).id] = num;
              }
            }
          });

          if (Object.keys(chargesById).length > 0) {
            setInterventions(prev => prev.map(i => ({
              ...i,
              total_charges: i.total_charges ?? chargesById[i.id] ?? i.total_charges,
            })));
          }
        } catch (_) {
          // ignore backfill errors
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des interventions');
      console.error('Error fetching interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Fetch all serres (to map id -> nom)
      const [allSerres, allTechnicians, allTypes] = await Promise.all([
        serreService.getAllSerres().catch(() => []),
        user?.id_entreprise ? technicianService.getAllTechniciansByCompany(user.id_entreprise).catch(() => []) : Promise.resolve([]),
        typeTacheService.getAllTypeTaches().catch(() => []),
      ]);

      const serreMap: Record<number, string> = {};
      (allSerres as any[]).forEach((s: any) => {
        if (s && (s.id || s.serreId)) {
          const key = typeof s.id === 'number' ? s.id : parseInt(String(s.id ?? s.serreId), 10);
          if (!Number.isNaN(key)) {
            serreMap[key] = s.nom || s.name || `Serre ${key}`;
          }
        }
      });
      setSerreNameById(serreMap);

      const techMap: Record<number, string> = {};
      (allTechnicians as any[]).forEach((t: any) => {
        if (t && t.id) {
          techMap[t.id] = t.fullName || t.name || t.email || `Technicien ${t.id}`;
        }
      });
      setTechnicianNameById(techMap);

      const tMap: Record<number, string> = {};
      (allTypes as any[]).forEach((t: any) => {
        if (t && t.id) {
          tMap[t.id] = t.nom || `Type ${t.id}`;
        }
      });
      setTypeNameById(tMap);
    } catch (e) {
      // Non-blocking
      console.warn('Failed to fetch reference data for names', e);
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

  const getSerreDisplay = (id: number, fallbackName?: string) => {
    return fallbackName || serreNameById[id] || id;
  };

  const getTechnicianDisplay = (id: number, fallbackName?: string) => {
    return fallbackName || technicianNameById[id] || id;
  };

  const formatMAD = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    try {
      return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    } catch (_) {
      return `${amount} MAD`;
    }
  };

  // Helper removed to avoid scope issues; inline where needed

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
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 transition-all duration-300">
        <DirectorHeader />
        <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mt-4 mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Interventions</h1>
        <p className="text-gray-600 text-sm sm:text-base">Gérez toutes les interventions de votre entreprise</p>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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


      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Rechercher par description ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
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
            <Button onClick={fetchInterventions} variant="outline" className="w-full sm:w-auto">
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interventions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Interventions</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune intervention trouvée</div>
          ) : (
            <>
              {/* Mobile, tablet, and mid-large list (below 1145px) */}
              <div className="lg2:hidden space-y-4">
                {filteredInterventions.map((intervention) => (
                  <div key={intervention.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">#{intervention.id}</div>
                      {getStatusBadge(intervention.statut)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {intervention.date_intervention ? new Date(intervention.date_intervention).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-800 mb-2 truncate" title={intervention.description}>{intervention.description}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Serre</div>
                      <div className="truncate">{getSerreDisplay(intervention.serre_id, intervention.serre_nom)}</div>
                      <div className="text-gray-500">Technicien</div>
                      <div className="truncate">{getTechnicianDisplay(intervention.technicien_id, intervention.technicien_nom)}</div>
                      <div className="text-gray-500">Type</div>
                      <div>{intervention.type_tache_nom || typeNameById[intervention.type_tache_id] || intervention.type_tache_id}</div>
                      <div className="text-gray-500">Charges</div>
                      <div>{formatMAD(intervention.total_charges)}</div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => { setActiveIntervention(intervention); setDetailsOpen(true); }}>
                        Voir détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (≥1145px) */}
              <div className="hidden lg2:block w-full max-w-full overflow-x-auto scrollbar-mobile">
                <Table className="w-full lg:min-w-[900px] xl:min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Serre</TableHead>
                      <TableHead>Technicien</TableHead>
                      <TableHead>Type Tâche</TableHead>
                      <TableHead>Charges</TableHead>
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
                        <TableCell className="max-w-xs lg:max-w-none truncate lg:whitespace-normal lg:overflow-visible" title={intervention.description}>
                          {intervention.description}
                        </TableCell>
                        <TableCell>{getStatusBadge(intervention.statut)}</TableCell>
                        <TableCell className="max-w-[200px] lg:max-w-[280px] xl:max-w-[360px] 2xl:max-w-none truncate lg:whitespace-normal lg:overflow-visible">{getSerreDisplay(intervention.serre_id, intervention.serre_nom)}</TableCell>
                        <TableCell className="max-w-[200px] lg:max-w-[280px] xl:max-w-[360px] 2xl:max-w-none truncate lg:whitespace-normal lg:overflow-visible">{getTechnicianDisplay(intervention.technicien_id, intervention.technicien_nom)}</TableCell>
                        <TableCell>{intervention.type_tache_nom || typeNameById[intervention.type_tache_id] || intervention.type_tache_id}</TableCell>
                        <TableCell>{formatMAD(intervention.total_charges)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => { setActiveIntervention(intervention); setDetailsOpen(true); }}>
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[640px] w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Détails de l'intervention #{activeIntervention?.id}</DialogTitle>
            <DialogDescription>Informations complètes de l'intervention sélectionnée.</DialogDescription>
          </DialogHeader>
          {activeIntervention && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Date début</div>
                <div>{activeIntervention.date_intervention ? new Date(activeIntervention.date_intervention).toLocaleString('fr-FR') : 'N/A'}</div>
                <div className="text-sm text-gray-500">Date fin</div>
                <div>{activeIntervention.date_fin ? new Date(activeIntervention.date_fin).toLocaleString('fr-FR') : '—'}</div>
                <div className="text-sm text-gray-500">Serre</div>
                <div>{getSerreDisplay(activeIntervention.serre_id, activeIntervention.serre_nom)}</div>
                <div className="text-sm text-gray-500">Technicien</div>
                <div>{getTechnicianDisplay(activeIntervention.technicien_id, activeIntervention.technicien_nom)}</div>
                <div className="text-sm text-gray-500">Type Tâche</div>
                <div>{activeIntervention.type_tache_nom || typeNameById[activeIntervention.type_tache_id] || activeIntervention.type_tache_id}</div>
                <div className="text-sm text-gray-500">Statut</div>
                <div>{getStatusBadge(activeIntervention.statut)}</div>
                <div className="text-sm text-gray-500">Charges</div>
                <div>{formatMAD(activeIntervention.total_charges)}</div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <div className="text-sm whitespace-pre-wrap">{activeIntervention.description || '—'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
        </main>
      </div>
    </div>
  );
};

export default DirectorInterventionManagement;
