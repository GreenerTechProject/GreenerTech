import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DirectorLayout from '../components/DirectorLayout';
import { useToast } from '@/hooks/use-toast';
import { AlertService } from '@/services/alertService';
import { Alert as ApiAlert } from '@/types/alert';
import { Search, AlertTriangle, Calendar, RefreshCw, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DirectorAlertManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

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

  const getSeverityLabel = (statusAlert?: number) => {
    switch (statusAlert) {
      case 0:
        return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 1:
        return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 3:
        return { label: 'Critique', color: 'bg-red-600 text-white' };
      default:
        return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.maladie.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      (a.date && new Date(a.date).toLocaleString('fr-FR').toLowerCase().includes(term))
    );
  });

  const stats = {
    total: alerts.length,
    faible: alerts.filter(a => a.status_alert === 0).length,
    moyenne: alerts.filter(a => a.status_alert === 1).length,
    critique: alerts.filter(a => a.status_alert === 3).length,
    resolues: alerts.filter(a => a.status === 'résolue').length,
  };

  return (
    <DirectorLayout>
      <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 hidden sm:block">Gestion des Alertes</h1>
            <Button 
              onClick={() => {
                setLoading(true);
                fetchAlerts();
              }}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 hidden sm:flex"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
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

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertes ({filteredAlerts.length})</CardTitle>
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
                  <p className="text-gray-600">Aucune alerte trouvée</p>
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
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{alert.maladie}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {alert.date ? new Date(alert.date).toLocaleString('fr-FR') : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge className={sev.color}>{sev.label}</Badge>
                          <Badge className={alert.status === 'résolue' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {alert.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => navigate(`/director/alerts/${alert.id}/map`)}
                            title="Voir sur la carte"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
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
