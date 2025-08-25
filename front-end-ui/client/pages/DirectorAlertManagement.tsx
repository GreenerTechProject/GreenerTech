import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DirectorLayout from '../components/DirectorLayout';
import { useToast } from '@/hooks/use-toast';
import { AlertService } from '@/services/alertService';
import { Alert as ApiAlert } from '@/types/alert';
import { Search, AlertTriangle, Calendar, RefreshCw, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { domainService, Domain } from '@/services/domainService';
import { serreService, Serre } from '@/services/serreService';

export default function DirectorAlertManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedSerre, setSelectedSerre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    faible: 0,
    moyenne: 0,
    critique: 0,
    resolues: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
    fetchFilters();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [alerts]);

  useEffect(() => {
    if (selectedDomain && selectedDomain !== 'all') {
      fetchSerresByDomain(selectedDomain);
    } else {
      // When no domain is selected, show all serres from the enterprise
      fetchAllSerres();
      setSelectedSerre('all');
    }
  }, [selectedDomain]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      if (!user?.id_entreprise) {
        setAlerts([]);
        return;
      }
      const enterpriseAlerts = await AlertService.getAlertsByEnterprise(user.id_entreprise);
      setAlerts(enterpriseAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les alertes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      setLoadingFilters(true);
      if (!user?.id_entreprise) {
        setDomains([]);
        setSerres([]);
        return;
      }
      
      // Fetch domains for the enterprise
      const enterpriseDomains = await domainService.getMyCompanyDomains();
      setDomains(enterpriseDomains);
      
      // Initially set all serres (will be filtered by domain when domain is selected)
      if (enterpriseDomains.length > 0) {
        const allSerres = await serreService.getAllSerres();
        setSerres(allSerres);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les filtres.",
        variant: "destructive"
      });
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchAllSerres = async () => {
    try {
      if (!user?.id_entreprise) return;
      const allSerres = await serreService.getAllSerres();
      setSerres(allSerres);
    } catch (error) {
      console.error('Error fetching all serres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer toutes les serres.",
        variant: "destructive"
      });
    }
  };

  const fetchSerresByDomain = async (domainId: string) => {
    try {
      const domainSerres = await serreService.getSerresByDomain(domainId);
      setSerres(domainSerres);
      setSelectedSerre('all'); // Reset serre selection when domain changes
    } catch (error) {
      console.error('Error fetching serres by domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les serres du domaine.",
        variant: "destructive"
      });
    }
  };

  const calculateStats = () => {
    const total = alerts.length;
    const faible = alerts.filter(alert => alert.status_alert === 0).length;
    const moyenne = alerts.filter(alert => alert.status_alert === 1).length;
    const critique = alerts.filter(alert => alert.status_alert === 3).length;
    const resolues = alerts.filter(alert => alert.status === 'résolue').length;
    
    setStats({
      total,
      faible,
      moyenne,
      critique,
      resolues
    });
  };

  const getSeverityLabel = (statusAlert?: number) => {
    switch (statusAlert) {
      case 0:
        return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 1:
        return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 2:
        return { label: 'Critique', color: 'bg-red-600 text-white' };
      default:
        return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      a.maladie.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      (a.date && new Date(a.date).toLocaleString('fr-FR').toLowerCase().includes(term))
    );
    
    // Domain filtering - check if alert belongs to selected domain
    const matchesDomain = selectedDomain === 'all' || 
      (a.domaine_nom && a.domaine_nom === domains.find(d => d.id.toString() === selectedDomain)?.nom);
    
    // Serre filtering - check if alert belongs to selected serre
    const matchesSerre = selectedSerre === 'all' || 
      (a.serre_nom && a.serre_nom === serres.find(s => s.id.toString() === selectedSerre)?.nom);
    
    // Status filtering
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    
    // Severity filtering
    const matchesSeverity = selectedSeverity === 'all' || a.status_alert.toString() === selectedSeverity;
    
    return matchesSearch && matchesDomain && matchesSerre && matchesStatus && matchesSeverity;
  });



  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDomain('all');
    setSelectedSerre('all');
    setSelectedStatus('all');
    setSelectedSeverity('all');
    // Refresh serres to show all available ones
    fetchAllSerres();
  };

  const hasActiveFilters = searchTerm || selectedDomain !== 'all' || selectedSerre !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all';
  
  const getActiveFiltersText = () => {
    const filters = [];
    if (searchTerm) filters.push(`Recherche: "${searchTerm}"`);
    if (selectedDomain !== 'all') {
      const domain = domains.find(d => d.id.toString() === selectedDomain);
      if (domain) filters.push(`Domaine: ${domain.nom}`);
    }
    if (selectedSerre !== 'all') {
      const serre = serres.find(s => s.id.toString() === selectedSerre);
      if (serre) filters.push(`Serre: ${serre.nom}`);
    }
    if (selectedStatus !== 'all') {
      filters.push(`Statut: ${selectedStatus === 'résolue' ? 'Résolues' : 'Non résolues'}`);
    }
    if (selectedSeverity !== 'all') {
      const severityLabels = { '0': 'Faible', '1': 'Moyenne', '3': 'Critique' };
      filters.push(`Sévérité: ${severityLabels[selectedSeverity as keyof typeof severityLabels] || selectedSeverity}`);
    }
    return filters.join(', ');
  };

  return (
    <DirectorLayout>
      <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Gestion des Alertes
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Gérez et surveillez toutes les alertes de votre entreprise
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  fetchAlerts();
                  fetchFilters();
                }}
                disabled={loading || loadingFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || loadingFilters) ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-greener-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Alertes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.faible}</div>
                <div className="text-sm text-gray-600">Faibles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.moyenne}</div>
                <div className="text-sm text-gray-600">Moyennes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-700">{stats.critique}</div>
                <div className="text-sm text-gray-600">Critiques</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.resolues}</div>
                <div className="text-sm text-gray-600">Résolues</div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Severity Legend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Légende des Niveaux d'Alerte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded-full"></div>
                  <div>
                    <div className="font-medium text-blue-800">Niveau 0 - Faible</div>
                    <div className="text-sm text-blue-600">Problème mineur, surveillance recommandée</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-200 rounded-full"></div>
                  <div>
                    <div className="font-medium text-yellow-800">Niveau 1 - Moyenne</div>
                    <div className="text-sm text-yellow-600">Problème modéré, intervention recommandée</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <div>
                    <div className="font-medium text-red-800">Niveau 2 - Critique</div>
                    <div className="text-sm text-red-600">Problème grave, intervention urgente requise</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Recherche
              </CardTitle>
              <div className="text-sm text-gray-600">
                Utilisez les filtres ci-dessous pour affiner votre recherche d'alertes
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par maladie, statut ou date..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Domaine</label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={loadingFilters}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingFilters ? "Chargement..." : "Tous les domaines"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les domaines</SelectItem>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id.toString()}>
                            {domain.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingFilters && (
                      <div className="text-xs text-gray-500">Chargement des domaines...</div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Serre</label>
                    <Select 
                      value={selectedSerre} 
                      onValueChange={setSelectedSerre}
                      disabled={loadingFilters}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingFilters ? "Chargement..." : "Toutes les serres"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les serres</SelectItem>
                        {serres.map((serre) => (
                          <SelectItem key={serre.id} value={serre.id.toString()}>
                            {serre.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingFilters && (
                      <div className="text-xs text-gray-500">Chargement des serres...</div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <Select 
                      value={selectedStatus} 
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="non résolue">Non résolues</SelectItem>
                        <SelectItem value="résolue">Résolues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Sévérité</label>
                    <Select 
                      value={selectedSeverity} 
                      onValueChange={setSelectedSeverity}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toutes les sévérités" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les sévérités</SelectItem>
                        <SelectItem value="0">Faible</SelectItem>
                        <SelectItem value="1">Moyenne</SelectItem>
                        <SelectItem value="3">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <div className="col-span-full flex items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Filtres actifs:</span>
                        <span className="text-sm text-blue-700">{getActiveFiltersText()}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Filter className="h-4 w-4" />
                        Effacer tous les filtres
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Alertes ({filteredAlerts.length})
              </CardTitle>
              {hasActiveFilters && (
                <div className="text-sm text-gray-600">
                  Affichage de {filteredAlerts.length} alerte{filteredAlerts.length !== 1 ? 's' : ''} sur {alerts.length} au total
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Chargement des alertes...</p>
                  </div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {hasActiveFilters ? "Aucune alerte trouvée avec les filtres actuels" : "Aucune alerte trouvée"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    const sev = getSeverityLabel(alert.status_alert);
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        )}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Alert Image */}
                          <div className="flex-shrink-0">
                            {alert.lien_image ? (
                              <img 
                                src={alert.lien_image} 
                                alt={`Image de l'alerte ${alert.maladie}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                  e.currentTarget.alt = 'Image non disponible';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{alert.maladie}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {alert.date ? new Date(alert.date).toLocaleString('fr-FR') : '—'}
                              </span>
                              {alert.domaine_nom && (
                                <span className="text-blue-600 font-medium">
                                  Domaine: {alert.domaine_nom}
                                </span>
                              )}
                              {alert.serre_nom && (
                                <span className="text-green-600 font-medium">
                                  Serre: {alert.serre_nom}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-center">
                            <Badge className={sev.color}>{sev.label}</Badge>
                            <span className="text-xs text-gray-500 mt-1">
                              Niveau {alert.status_alert}
                            </span>
                          </div>
                          <Badge className={alert.status === 'résolue' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {alert.status}
                          </Badge>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
    </DirectorLayout>
  );
}
