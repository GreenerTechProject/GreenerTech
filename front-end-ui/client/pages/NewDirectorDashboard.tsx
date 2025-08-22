import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DirectorLayout from "../components/DirectorLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  UserCheck,
  Activity,
  BarChart3,
  Calendar,
  Menu,
  Home,
  Map,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { technicianService, Technician } from "../services/technicianService";
import { InterventionService, Intervention } from "../services/interventionService";
import { AlertService } from "../services/alertService";
import { domainService, Domain } from "../services/domainService";
import { serreService } from "../services/serreService";
import { affiliationService } from "../services/affiliationService";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend as ChartLegend, Filler } from "chart.js";
import { Chart } from "react-chartjs-2";
import { ReportService, ApiReport } from "@/services/reportService";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ChartTitle, ChartTooltip, ChartLegend, Filler);

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface DashboardStats {
  totalTechnicians: number;
  activeTechnicians: number;
  pendingTechnicians: number;
  totalInterventions: number;
  completedInterventions: number;
  pendingInterventions: number;
  totalAlerts: number;
  criticalAlerts: number;
  totalDomains: number;
  totalSerres: number;
}

export default function DirectorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingAffiliations, setPendingAffiliations] = useState<number>(0);
  const [monthlyChart, setMonthlyChart] = useState<{ labels: string[]; interventions: number[]; charges: number[] }>({ labels: [], interventions: [], charges: [] });
  const [alertsMonthly, setAlertsMonthly] = useState<{ labels: string[]; low: number[]; medium: number[]; high: number[] }>({ labels: [], low: [], medium: [], high: [] });
  const [recentReports, setRecentReports] = useState<ApiReport[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTechnicians: 0,
    activeTechnicians: 0,
    pendingTechnicians: 0,
    totalInterventions: 0,
    completedInterventions: 0,
    pendingInterventions: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    totalDomains: 0,
    totalSerres: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch company-scoped data in parallel
      const [
        technicians,
        interventions,
        alerts,
        domains,
        serres
      ] = await Promise.all([
        user?.id_entreprise
          ? technicianService.getAllTechniciansByCompany(user.id_entreprise)
          : Promise.resolve([]),
        user?.id_entreprise
          ? InterventionService.getInterventionsByEnterprise(user.id_entreprise)
          : Promise.resolve([]),
        AlertService.getAlertsByDirectorEnterprise(),
        
        domainService.getMyCompanyDomains(),
        serreService.getAllSerres()
      ]);

      // Calculate statistics
      const totalTechnicians = technicians.length;
      const activeTechnicians = technicians.filter(t => t.directeur_valide && t.email_valide).length;
      const pendingTechnicians = technicians.filter(t => !t.directeur_valide).length;

      const totalInterventions = interventions.length;
      const completedInterventions = interventions.filter(i => (i as any).status === 'terminé' || (i as any).statut === 'terminé').length;
      const pendingInterventions = interventions.filter(i => (i as any).status === 'encours' || (i as any).statut === 'encours').length;

      const totalAlerts = (alerts as any[])?.length || 0;
      const criticalAlerts = (alerts as any[])?.filter((a: any) => {
        // Critical severity by status_alert value 2
        return typeof a.status_alert === 'number' && a.status_alert === 2;
      }).length || 0;

      const totalDomains = domains.length;
      const totalSerres = serres.length || 0;

      const newStats: StatCard[] = [
        {
          title: "Techniciens actifs",
          value: activeTechnicians,
          change: `${pendingTechnicians} en attente`,
          trend: pendingTechnicians > 0 ? "up" : "neutral",
          icon: Users,
          color: "blue",
          description: `${totalTechnicians} total`
        },
        {
          title: "Interventions en cours",
          value: pendingInterventions,
          change: `${completedInterventions} terminées`,
          trend: pendingInterventions > 0 ? "up" : "neutral",
          icon: Wrench,
          color: "green",
          description: `${totalInterventions} total`
        },
        {
          title: "Alertes actives",
          value: totalAlerts,
          change: `${criticalAlerts} critiques`,
          trend: criticalAlerts > 0 ? "up" : "down",
          icon: AlertTriangle,
          color: "red",
          description: "Nécessitent attention"
        },
        {
          title: "Infrastructure",
          value: totalDomains + totalSerres,
          change: `${totalDomains} domaines, ${totalSerres} serres`,
          trend: "up",
          icon: Building2,
          color: "purple",
          description: "Domaines et serres"
        }
      ];

      setStats(newStats);
      setDashboardStats({
        totalTechnicians,
        activeTechnicians,
        pendingTechnicians,
        totalInterventions,
        completedInterventions,
        pendingInterventions,
        totalAlerts,
        criticalAlerts,
        totalDomains,
        totalSerres
      });

      // Generate recent activities from real data
      const activities = [];
      
      if (pendingTechnicians > 0) {
        activities.push({
          id: 1,
          type: "affiliation",
          message: `${pendingTechnicians} demande(s) d'affiliation en attente`,
          time: "À traiter",
          status: "warning"
        });
      }

      if (criticalAlerts > 0) {
        activities.push({
          id: 2,
          type: "alert",
          message: `${criticalAlerts} alerte(s) critique(s) nécessitent attention`,
          time: "Urgent",
          status: "warning"
        });
      }

      if (pendingInterventions > 0) {
        activities.push({
          id: 3,
          type: "intervention",
          message: `${pendingInterventions} intervention(s) en cours`,
          time: "En cours",
          status: "info"
        });
      }

      if (completedInterventions > 0) {
        activities.push({
          id: 4,
          type: "report",
          message: `${completedInterventions} intervention(s) terminée(s) ce mois`,
          time: "Ce mois",
          status: "success"
        });
      }

      setRecentActivities(activities);

      // Generate pending tasks from real data
      const tasks = [];
      
      if (pendingTechnicians > 0) {
        tasks.push({
          id: 1,
          title: `Valider ${pendingTechnicians} demande(s) d'affiliation`,
          priority: "high",
          dueDate: "Aujourd'hui"
        });
      }

      if (criticalAlerts > 0) {
        tasks.push({
          id: 2,
          title: `Traiter ${criticalAlerts} alerte(s) critique(s)`,
          priority: "high",
          dueDate: "Immédiat"
        });
      }

      if (pendingInterventions > 0) {
        tasks.push({
          id: 3,
          title: `Suivre ${pendingInterventions} intervention(s) en cours`,
          priority: "medium",
          dueDate: "Cette semaine"
        });
      }

      setPendingTasks(tasks);

      // Build monthly chart data (last 12 months)
      try {
        const now = new Date();
        const monthKeys: string[] = [];
        const monthLabels: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          const key = d.toISOString().slice(0, 7); // YYYY-MM
          monthKeys.push(key);
          monthLabels.push(d.toLocaleString("fr-FR", { month: "short", year: "2-digit" }));
        }

        const counts: Record<string, number> = {};
        const chargesMap: Record<string, number> = {};
        (interventions as any[]).forEach((it: any) => {
          const when = it?.date_fin || it?.date_debut || it?.created_at;
          if (!when) return;
          const key = new Date(when).toISOString().slice(0, 7);
          counts[key] = (counts[key] || 0) + 1;
          const amount = Number(it?.total_charges ?? it?.charges_total ?? 0) || 0;
          chargesMap[key] = (chargesMap[key] || 0) + amount;
        });

        const interventionsSeries = monthKeys.map((k) => counts[k] || 0);
        const chargesSeries = monthKeys.map((k) => chargesMap[k] || 0);
        setMonthlyChart({ labels: monthLabels, interventions: interventionsSeries, charges: chargesSeries });
      } catch (_) {
        setMonthlyChart({ labels: [], interventions: [], charges: [] });
      }

      // Pending affiliations count
      try {
        const techniciansData = await affiliationService.getPendingTechnicians();
        setPendingAffiliations(Array.isArray(techniciansData) ? techniciansData.length : 0);
      } catch (_) {
        setPendingAffiliations(0);
      }

      // Build monthly alerts distribution (Low, Medium, High)
      try {
        const now = new Date();
        const monthKeys: string[] = [];
        const monthLabels: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          const key = d.toISOString().slice(0, 7);
          monthKeys.push(key);
          monthLabels.push(d.toLocaleString("fr-FR", { month: "short", year: "2-digit" }));
        }
        
        const L: Record<string, number> = {};
        const M: Record<string, number> = {};
        const H: Record<string, number> = {};
        
        // Initialize all months with 0
        monthKeys.forEach(key => {
          L[key] = 0;
          M[key] = 0;
          H[key] = 0;
        });
        
        if (Array.isArray(alerts) && alerts.length > 0) {
          alerts.forEach((a: any) => {
            // Try different possible date fields
            const when = a?.date || a?.created_at || a?.date_creation || a?.timestamp || a?.date_alerte;
            if (!when) {
              return;
            }
            
            let dateObj: Date;
            try {
              dateObj = new Date(when);
              if (isNaN(dateObj.getTime())) {
                return;
              }
            } catch (error) {
              return;
            }
            
            const key = dateObj.toISOString().slice(0, 7);
            const sev = Number(a?.status_alert) || 0;
            
            if (monthKeys.includes(key)) {
              // Handle different possible severity values - now using type field as primary
              const alertType = a?.type || '';
              if (sev === 2 || String(sev) === '2' || alertType.includes('critique') || alertType.includes('Critique') || alertType.includes('élevée') || alertType.includes('Élevée')) {
                H[key] = (H[key] || 0) + 1;
              } else if (sev === 1 || String(sev) === '1' || alertType.includes('moyenne') || alertType.includes('Moyenne') || alertType.includes('modérée') || alertType.includes('Modérée')) {
                M[key] = (M[key] || 0) + 1;
              } else if (sev === 0 || String(sev) === '0' || alertType.includes('faible') || alertType.includes('Faible') || alertType.includes('légère') || alertType.includes('Légère')) {
                L[key] = (L[key] || 0) + 1;
              } else {
                // Default classification based on alert type keywords
                if (alertType.includes('Température') || alertType.includes('température') || alertType.includes('Humidité') || alertType.includes('humidité')) {
                  M[key] = (M[key] || 0) + 1;
                } else if (alertType.includes('Mildiou') || alertType.includes('mildiou') || alertType.includes('Maladie') || alertType.includes('maladie')) {
                  H[key] = (H[key] || 0) + 1;
                } else {
                  L[key] = (L[key] || 0) + 1;
                }
              }
            }
          });
        }
        
        setAlertsMonthly({
          labels: monthLabels,
          low: monthKeys.map((k) => L[k] || 0),
          medium: monthKeys.map((k) => M[k] || 0),
          high: monthKeys.map((k) => H[k] || 0),
        });
      } catch (error) {
        console.error('[NewDirectorDashboard] Error building alerts chart:', error);
        setAlertsMonthly({ labels: [], low: [], medium: [], high: [] });
      }

      // Fetch recent reports (limit to 5)
      try {
        const reports = await ReportService.getReportsByDirectorEnterprise();
        setRecentReports((reports || []).slice(0, 5));
      } catch (_) {
        setRecentReports([]);
      }

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // no-op effects for map removed

  const getStatColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      red: "text-red-600",
      purple: "text-purple-600"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? TrendingUp : TrendingDown;
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      intervention: Wrench,
      alert: AlertTriangle,
      affiliation: UserCheck,
      report: FileText
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700"
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const handleProfile = () => {
    navigate("/directeur/profile");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleMapConfig = () => {
    navigate("/directeur/map-config");
  };

  const handleAddTechnician = () => {
    navigate("/directeur/technician-management");
  };

  const handleCreateIntervention = () => {
    navigate("/directeur/intervention-management");
  };

  const handleGenerateReport = () => {
    navigate("/directeur/report-management");
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <DirectorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greener-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </DirectorLayout>
    );
  }

  return (
    <DirectorLayout>
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre entreprise</p>
        </div>
            <div className="flex items-center space-x-4">
              {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <Button onClick={handleRefresh} variant="outline" className="flex items-center space-x-2" disabled={refreshing}>
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-greener-600"></div>
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    <span>Actualiser</span>
                  </>
                )}
              </Button>
            </div>
          </div>

                 {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              const TrendIcon = getTrendIcon(stat.trend);
              
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg", getStatColor(stat.color))}>
                          <IconComponent className={cn("h-5 w-5", getIconColor(stat.color))} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrendIcon className={cn(
                          "h-4 w-4",
                          stat.trend === "up" ? "text-green-600" : 
                          stat.trend === "down" ? "text-red-600" : "text-gray-600"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          stat.trend === "up" ? "text-green-600" : 
                          stat.trend === "down" ? "text-red-600" : "text-gray-600"
                        )}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    {stat.description && (
                      <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>


          {/* Charts & Affiliation Row (second row after stats) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Duo Chart: Interventions (bar) + Charges (line) */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Interventions & charges par mois</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80">
                  {monthlyChart.labels.length > 0 ? (
                    <Chart
                      type="bar"
                      data={{
                        labels: monthlyChart.labels,
                        datasets: [
                          {
                            type: "bar" as const,
                            label: "Interventions",
                            data: monthlyChart.interventions,
                            backgroundColor: "rgba(34,197,94,0.35)",
                            borderColor: "rgba(34,197,94,1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            borderRadius: 4,
                          },
                          {
                            type: "line" as const,
                            label: "Charges (MAD)",
                            data: monthlyChart.charges,
                            borderColor: "#0ea5e9",
                            backgroundColor: "rgba(14,165,233,0.15)",
                            fill: true,
                            yAxisID: "y1",
                            tension: 0.35,
                            pointRadius: 3,
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        interaction: { mode: "index", intersect: false },
                        plugins: {
                          legend: { position: "top" as const },
                          title: { display: false, text: "" },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const label = ctx.dataset.label || "";
                                const value = Number(ctx.parsed.y || 0);
                                if (label.includes("Charges")) {
                                  return `${label}: MAD ${value.toLocaleString("fr-MA")}`;
                                }
                                return `${label}: ${value.toLocaleString("fr-FR")}`;
                              },
                            },
                          },
                        },
                        scales: {
                          y: {
                            position: "left",
                            title: { display: true, text: "Interventions" },
                            grid: { drawOnChartArea: true },
                          },
                          y1: {
                            position: "right",
                            title: { display: true, text: "Charges (MAD)" },
                            grid: { drawOnChartArea: false },
                          },
                          x: {
                            ticks: { maxRotation: 0, autoSkip: true },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demandes d'affiliation (aligned even if empty) */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Demandes d'affiliation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[20rem] flex flex-col items-center justify-center text-center">
                  <div className="text-4xl font-bold text-gray-900">{pendingAffiliations}</div>
                  <div className="mt-2 text-sm text-gray-600">en attente de validation</div>
                  <Button onClick={() => navigate("/director/affiliations")} className="mt-6" variant="outline">
                    Gérer les affiliations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          
            {/* Alerts by month & Recent Reports Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Recent Reports */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Rapports récents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[24rem] flex flex-col">
                  {recentReports.length > 0 ? (
                    <div className="space-y-3">
                      {recentReports.map((r) => (
                        <div key={r.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900 truncate">Rapport #{r.id} {r.serre ? `• ${r.serre}` : ''}</div>
                          <div className="text-xs text-gray-500">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}</div>
                          {r.lien_pdf && (
                            <div className="mt-2">
                              <Button size="sm" variant="outline" onClick={() => ReportService.downloadReport(r.lien_pdf!, `rapport_${r.id}.pdf`)}>Télécharger</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Aucun rapport récent</div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Alerts by month (stacked bar) */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alertes par mois</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                
                <div className="w-full h-96 min-h-[24rem]">
                  {alertsMonthly.labels.length > 0 ? (
                    <Chart
                      type="bar"
                      data={{
                        labels: alertsMonthly.labels,
                        datasets: [
                          {
                            label: "Faible",
                            data: alertsMonthly.low,
                            backgroundColor: "rgba(34,197,94,0.6)",
                            borderColor: "rgba(34,197,94,1)",
                            borderWidth: 1,
                            stack: "alerts",
                          },
                          {
                            label: "Moyenne",
                            data: alertsMonthly.medium,
                            backgroundColor: "rgba(245,158,11,0.6)",
                            borderColor: "rgba(245,158,11,1)",
                            borderWidth: 1,
                            stack: "alerts",
                          },
                          {
                            label: "Critique",
                            data: alertsMonthly.high,
                            backgroundColor: "rgba(239,68,68,0.6)",
                            borderColor: "rgba(239,68,68,1)",
                            borderWidth: 1,
                            stack: "alerts",
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          legend: { 
                            position: "top",
                            labels: {
                              usePointStyle: true,
                              padding: 20
                            }
                          },
                          title: { display: false, text: "" },
                        },
                        interaction: { mode: "index", intersect: false },
                        scales: {
                          x: { 
                            stacked: true,
                            grid: {
                              display: true
                            }
                          },
                          y: { 
                            stacked: true, 
                            title: { display: true, text: "Nombre d'alertes" },
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          },
                        },
                        elements: {
                          bar: {
                            borderRadius: 4
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Aucune donnée d'alertes disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Recent Activities */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activités récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                          <div className={cn(
                            "p-2 rounded-full",
                            activity.status === "warning" ? "bg-yellow-100" :
                            activity.status === "success" ? "bg-green-100" : "bg-blue-100"
                          )}>
                            <ActivityIcon className={cn(
                              "h-4 w-4",
                              activity.status === "warning" ? "text-yellow-600" :
                              activity.status === "success" ? "text-green-600" : "text-blue-600"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


      </DirectorLayout>
    );
  }
