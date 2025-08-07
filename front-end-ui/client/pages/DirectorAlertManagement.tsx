import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import { useToast } from '@/hooks/use-toast';
import {
  Menu,
  Search,
  Filter,
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Alert {
  id: string;
  type: 'temperature' | 'humidity' | 'irrigation' | 'ventilation' | 'power' | 'security' | 'equipment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  location: {
    domain: string;
    greenhouse: string;
    sensor?: string;
    coordinates?: { lat: number; lng: number };
  };
  timestamp: string;
  value?: number;
  threshold?: number;
  unit?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  priority: number; // 1-10
  affectedSystems: string[];
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
}

interface HeatmapData {
  domain: string;
  greenhouse: string;
  alertCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  coordinates: { lat: number; lng: number };
  color: string;
  intensity: number;
}

export default function DirectorAlertManagement() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'temperature',
      severity: 'critical',
      status: 'active',
      title: 'Température critique - Serre A1',
      description: 'Température dépassant les seuils critiques, risque pour les cultures',
      location: {
        domain: 'Domaine Nord',
        greenhouse: 'Serre A1',
        sensor: 'TEMP_001',
        coordinates: { lat: 45.764, lng: 4.835 }
      },
      timestamp: '2024-01-20T14:35:00Z',
      value: 35.2,
      threshold: 28.0,
      unit: '°C',
      priority: 9,
      affectedSystems: ['Climatisation', 'Irrigation automatique'],
      estimatedImpact: 'critical'
    },
    {
      id: '2',
      type: 'humidity',
      severity: 'high',
      status: 'acknowledged',
      title: 'Humidité élevée - Serre B2',
      description: 'Taux d\'humidité au-dessus des recommandations',
      location: {
        domain: 'Domaine Sud',
        greenhouse: 'Serre B2',
        sensor: 'HUM_005',
        coordinates: { lat: 45.760, lng: 4.840 }
      },
      timestamp: '2024-01-20T13:20:00Z',
      value: 88.5,
      threshold: 75.0,
      unit: '%',
      acknowledgedBy: 'Jean Dupont',
      acknowledgedAt: '2024-01-20T13:45:00Z',
      priority: 7,
      affectedSystems: ['Ventilation', 'Déshumidification'],
      estimatedImpact: 'medium'
    },
    {
      id: '3',
      type: 'irrigation',
      severity: 'medium',
      status: 'resolved',
      title: 'Panne pompe irrigation - Serre C1',
      description: 'Dysfonctionnement détecté sur la pompe principale',
      location: {
        domain: 'Domaine Est',
        greenhouse: 'Serre C1',
        sensor: 'PUMP_003',
        coordinates: { lat: 45.768, lng: 4.845 }
      },
      timestamp: '2024-01-20T10:15:00Z',
      resolvedBy: 'Marie Martin',
      resolvedAt: '2024-01-20T12:30:00Z',
      priority: 6,
      affectedSystems: ['Irrigation', 'Distribution eau'],
      estimatedImpact: 'medium'
    },
    {
      id: '4',
      type: 'power',
      severity: 'high',
      status: 'active',
      title: 'Consommation électrique anormale',
      description: 'Pic de consommation détecté - investigation nécessaire',
      location: {
        domain: 'Domaine Ouest',
        greenhouse: 'Serre D3',
        coordinates: { lat: 45.762, lng: 4.830 }
      },
      timestamp: '2024-01-20T15:10:00Z',
      value: 45.8,
      threshold: 35.0,
      unit: 'kW',
      priority: 8,
      affectedSystems: ['Éclairage LED', 'Système de chauffage'],
      estimatedImpact: 'high'
    },
    {
      id: '5',
      type: 'ventilation',
      severity: 'low',
      status: 'active',
      title: 'Ventilation réduite - Serre A3',
      description: 'Débit d\'air inférieur aux paramètres optimaux',
      location: {
        domain: 'Domaine Nord',
        greenhouse: 'Serre A3',
        sensor: 'VENT_007',
        coordinates: { lat: 45.766, lng: 4.837 }
      },
      timestamp: '2024-01-20T16:00:00Z',
      value: 1200,
      threshold: 1500,
      unit: 'm³/h',
      priority: 4,
      affectedSystems: ['Ventilation'],
      estimatedImpact: 'low'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');

  // Generate heatmap data from alerts
  const generateHeatmapData = (): HeatmapData[] => {
    const groupedAlerts = alerts.reduce((acc, alert) => {
      const key = `${alert.location.domain}-${alert.location.greenhouse}`;
      if (!acc[key]) {
        acc[key] = {
          domain: alert.location.domain,
          greenhouse: alert.location.greenhouse,
          alerts: [],
          coordinates: alert.location.coordinates || { lat: 45.764, lng: 4.835 }
        };
      }
      acc[key].alerts.push(alert);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedAlerts).map((group: any) => {
      const criticalCount = group.alerts.filter((a: Alert) => a.severity === 'critical').length;
      const highCount = group.alerts.filter((a: Alert) => a.severity === 'high').length;
      const mediumCount = group.alerts.filter((a: Alert) => a.severity === 'medium').length;
      const lowCount = group.alerts.filter((a: Alert) => a.severity === 'low').length;
      const totalCount = group.alerts.length;

      // Calculate intensity based on severity weight
      const intensity = (criticalCount * 4 + highCount * 3 + mediumCount * 2 + lowCount * 1) / totalCount;
      
      // Determine color based on highest severity
      let color = '#22c55e'; // green for low
      if (criticalCount > 0) color = '#ef4444'; // red for critical
      else if (highCount > 0) color = '#f97316'; // orange for high
      else if (mediumCount > 0) color = '#eab308'; // yellow for medium

      return {
        domain: group.domain,
        greenhouse: group.greenhouse,
        alertCount: totalCount,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        coordinates: group.coordinates,
        color,
        intensity: Math.min(intensity, 4)
      };
    });
  };

  const heatmapData = generateHeatmapData();

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.greenhouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const handleAcknowledgeAlert = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id
        ? {
            ...alert,
            status: 'acknowledged' as const,
            acknowledgedBy: user?.name || user?.email || 'Directeur',
            acknowledgedAt: new Date().toISOString()
          }
        : alert
    );
    
    setAlerts(updatedAlerts);
    toast({
      title: "Alerte acquittée",
      description: "L'alerte a été prise en compte.",
    });
  };

  const handleResolveAlert = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id
        ? {
            ...alert,
            status: 'resolved' as const,
            resolvedBy: user?.name || user?.email || 'Directeur',
            resolvedAt: new Date().toISOString()
          }
        : alert
    );
    
    setAlerts(updatedAlerts);
    toast({
      title: "Alerte résolue",
      description: "L'alerte a été marquée comme résolue.",
    });
  };

  const openDetailModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'humidity': return <Droplets className="h-4 w-4" />;
      case 'irrigation': return <Droplets className="h-4 w-4" />;
      case 'ventilation': return <Wind className="h-4 w-4" />;
      case 'power': return <Zap className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Basse</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Active</Badge>;
      case 'acknowledged':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Acquittée</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Résolue</Badge>;
      case 'false_positive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Faux positif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Gestion des Alertes
                  </h1>
                  <p className="text-sm text-gray-600">
                    Surveillance et gestion des alertes système avec HeatMap
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Select value={viewMode} onValueChange={(value: 'list' | 'heatmap') => setViewMode(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Liste</SelectItem>
                    <SelectItem value="heatmap">HeatMap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-greener-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Alertes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.active}</div>
                <div className="text-sm text-gray-600">Actives</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
                <div className="text-sm text-gray-600">Critiques</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</div>
                <div className="text-sm text-gray-600">Acquittées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-gray-600">Résolues</div>
              </CardContent>
            </Card>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Rechercher par titre, description ou localisation..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="temperature">Température</SelectItem>
                        <SelectItem value="humidity">Humidité</SelectItem>
                        <SelectItem value="irrigation">Irrigation</SelectItem>
                        <SelectItem value="ventilation">Ventilation</SelectItem>
                        <SelectItem value="power">Électricité</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                        <SelectItem value="equipment">Équipement</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Sévérité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes sévérités</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="acknowledged">Acquittée</SelectItem>
                        <SelectItem value="resolved">Résolue</SelectItem>
                        <SelectItem value="false_positive">Faux positif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts List */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertes ({filteredAlerts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors",
                          alert.severity === 'critical' && "border-red-200 bg-red-50",
                          alert.severity === 'high' && "border-orange-200 bg-orange-50"
                        )}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            alert.severity === 'critical' && "bg-red-100 text-red-600",
                            alert.severity === 'high' && "bg-orange-100 text-orange-600",
                            alert.severity === 'medium' && "bg-yellow-100 text-yellow-600",
                            alert.severity === 'low' && "bg-blue-100 text-blue-600"
                          )}>
                            {getTypeIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{alert.title}</div>
                            <div className="text-sm text-gray-600 truncate">
                              {alert.description}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {alert.location.domain} - {alert.location.greenhouse}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(alert.timestamp).toLocaleString('fr-FR')}
                              </span>
                              {alert.value && alert.threshold && (
                                <span className="flex items-center">
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  {alert.value}{alert.unit} (seuil: {alert.threshold}{alert.unit})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Priorité: {alert.priority}/10
                            </div>
                            <div className="text-xs text-gray-500">
                              Impact: {alert.estimatedImpact}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            {getStatusBadge(alert.status)}
                            {getSeverityBadge(alert.severity)}
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailModal(alert)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {alert.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {(alert.status === 'active' || alert.status === 'acknowledged') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* HeatMap View */
            <div className="space-y-6">
              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>HeatMap des Alertes - Légende</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Critique</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Haute</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Moyenne</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Basse</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* HeatMap Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Alertes par Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {heatmapData.map((zone, index) => (
                      <div
                        key={index}
                        className="relative p-4 border-2 rounded-lg cursor-pointer hover:shadow-lg transition-all"
                        style={{
                          borderColor: zone.color,
                          backgroundColor: `${zone.color}15`
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{zone.greenhouse}</h3>
                            <p className="text-sm text-gray-600">{zone.domain}</p>
                          </div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: zone.color }}
                          >
                            {zone.alertCount}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          {zone.criticalCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-red-700">Critiques:</span>
                              <span className="font-medium">{zone.criticalCount}</span>
                            </div>
                          )}
                          {zone.highCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-700">Hautes:</span>
                              <span className="font-medium">{zone.highCount}</span>
                            </div>
                          )}
                          {zone.mediumCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Moyennes:</span>
                              <span className="font-medium">{zone.mediumCount}</span>
                            </div>
                          )}
                          {zone.lowCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Basses:</span>
                              <span className="font-medium">{zone.lowCount}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Intensité</span>
                            <span>{Math.round(zone.intensity * 25)}%</span>
                          </div>
                          <Progress value={zone.intensity * 25} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary by Domain */}
              <Card>
                <CardHeader>
                  <CardTitle>Résumé par Domaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...new Set(heatmapData.map(z => z.domain))].map(domain => {
                      const domainZones = heatmapData.filter(z => z.domain === domain);
                      const totalAlerts = domainZones.reduce((sum, z) => sum + z.alertCount, 0);
                      const totalCritical = domainZones.reduce((sum, z) => sum + z.criticalCount, 0);
                      
                      return (
                        <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{domain}</h4>
                            <p className="text-sm text-gray-600">{domainZones.length} serre(s)</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{totalAlerts}</div>
                            <div className="text-sm text-gray-600">
                              {totalCritical > 0 && (
                                <span className="text-red-600">{totalCritical} critique(s)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'Alerte</DialogTitle>
              <DialogDescription>
                Informations complètes sur l'alerte
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informations Générales</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Titre:</strong> {selectedAlert.title}</p>
                      <p><strong>Type:</strong> {selectedAlert.type}</p>
                      <p><strong>Sévérité:</strong> {getSeverityBadge(selectedAlert.severity)}</p>
                      <p><strong>Statut:</strong> {getStatusBadge(selectedAlert.status)}</p>
                      <p><strong>Priorité:</strong> {selectedAlert.priority}/10</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Domaine:</strong> {selectedAlert.location.domain}</p>
                      <p><strong>Serre:</strong> {selectedAlert.location.greenhouse}</p>
                      {selectedAlert.location.sensor && (
                        <p><strong>Capteur:</strong> {selectedAlert.location.sensor}</p>
                      )}
                      <p><strong>Timestamp:</strong> {new Date(selectedAlert.timestamp).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedAlert.description}
                  </p>
                </div>

                {selectedAlert.value && selectedAlert.threshold && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Mesures</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Valeur mesurée:</span>
                        <span className="font-bold text-lg">{selectedAlert.value}{selectedAlert.unit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Seuil configuré:</span>
                        <span className="text-sm text-gray-600">{selectedAlert.threshold}{selectedAlert.unit}</span>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(selectedAlert.value / (selectedAlert.threshold * 1.5)) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedAlert.affectedSystems.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Systèmes Affectés</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAlert.affectedSystems.map((system, index) => (
                        <Badge key={index} variant="outline">{system}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.acknowledgedBy && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Acquittée</h4>
                    <p className="text-sm text-yellow-700">
                      Par {selectedAlert.acknowledgedBy} le {selectedAlert.acknowledgedAt && new Date(selectedAlert.acknowledgedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                {selectedAlert.resolvedBy && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800">Résolue</h4>
                    <p className="text-sm text-green-700">
                      Par {selectedAlert.resolvedBy} le {selectedAlert.resolvedAt && new Date(selectedAlert.resolvedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  {selectedAlert.status === 'active' && (
                    <Button
                      onClick={() => {
                        handleAcknowledgeAlert(selectedAlert.id);
                        setIsDetailModalOpen(false);
                      }}
                      variant="outline"
                      className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Acquitter
                    </Button>
                  )}
                  {(selectedAlert.status === 'active' || selectedAlert.status === 'acknowledged') && (
                    <Button
                      onClick={() => {
                        handleResolveAlert(selectedAlert.id);
                        setIsDetailModalOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Résoudre
                    </Button>
                  )}
                  <Button onClick={() => setIsDetailModalOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
