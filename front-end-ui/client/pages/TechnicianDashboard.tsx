import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Map, AlertTriangle, BarChart3, TrendingUp, Activity, PlusCircle, ClipboardCheck, Target, Calendar, Clock, CheckCircle, AlertCircle, Users, Zap, Shield, Target as TargetIcon } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import InterventionForm from "../components/InterventionForm";
import { useState, useEffect } from "react";
import { AlertService } from "../services/alertService";
import { Alert } from "../types/alert";
import { missionService } from "../services/missionService";
import { serreService } from "../services/serreService";
import { domainService } from "../services/domainService";
import { bilanService } from "../services/bilanService";
import { robotService } from "../services/robotService";
import { InterventionService, Intervention } from "../services/interventionService";
import { notificationService, Notification } from "../services/notificationService";
import { ReportService, ApiReport } from "../services/reportService";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Define interfaces locally since they're not exported from services
interface Mission {
  id: number;
  id_robot: number;
  id_serre: number; // Keep as number to match mission service
  date_debut: string | null;
  date_fin: string | null;
  rep_jr: number;
  rep_sem: number;
  jour: number | null;
  heure: number | null;
  minute: number | null;
  executed: boolean;
}

interface Serre {
  id: number; // Changed to match service interface
  nom: string;
  id_domaine: number; // Changed to match service interface
  surface?: number;
  center_lat?: number;
  center_lng?: number;
}

interface Domain {
  id: number; // Changed to match service interface
  nom: string; // Changed to match service interface
  surface?: number; // Changed to match service interface
  center?: { lat: number; lng: number }; // Changed to match service interface
  id_entreprise: number; // Changed to match service interface
}

interface Bilan {
  id: number;
  nom: string;
  id_serre: number; // Keep as number to match mission service
  surface?: number; // Make optional to match service interface
}

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [robots, setRobots] = useState<{id: number, nom: string, referance: string}[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reports, setReports] = useState<ApiReport[]>([]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Logout error
    }
  };

  const handleInterventionSubmit = (data: any) => {
    // Here you would typically send the data to your backend
    setIsInterventionFormOpen(false);
  };

  const openInterventionForm = () => {
    setIsInterventionFormOpen(true);
  };

  const closeInterventionForm = () => {
    setIsInterventionFormOpen(false);
  };

  // Fetch all data for the dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [alertsData, missionsData, serresData, domainsData, bilansData, robotsData, interventionsData, notificationsData, reportsData] = await Promise.all([
          AlertService.getAlertsByAssignedSerres(),
          missionService.getAllMissions(),
          serreService.getAllSerres(),
          domainService.getMyCompanyDomains(),
          bilanService.getAllBilans(),
          robotService.getAllRobots(),
          InterventionService.getInterventionsByAssignedSerres(),
          notificationService.getNotifications(),
          ReportService.getReportsByAssignedSerres()
        ]);

        setAlerts(alertsData || []);
        console.log("[DEBUG] TechnicianDashboard - Alerts data:", alertsData);
        console.log("[DEBUG] TechnicianDashboard - Sample alert severity values:", alertsData?.slice(0, 5).map(a => ({ id: a.id, status_alert: a.status_alert, maladie: a.maladie })));
        setMissions(missionsData);
        setSerres(serresData);
        setDomains(domainsData);
        setBilans(bilansData);
        setRobots(robotsData);
        setInterventions(interventionsData);
        setNotifications(notificationsData);
        setReports(reportsData);
      } catch (error) {
        console.error("[ERROR] TechnicianDashboard - Failed to fetch dashboard data:", error);
        setAlerts([]);
        setMissions([]);
        setSerres([]);
        setDomains([]);
        setBilans([]);
        setRobots([]);
        setInterventions([]);
        setNotifications([]);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper functions for mission data analysis
  const getMissionCountForSerre = (serreId: number) => {
    return missions.filter(m => m.id_serre === serreId).length;
  };

  const getLastMissionDate = (serreId: number) => {
    const serreMissions = missions.filter(m => m.id_serre === serreId);
    if (serreMissions.length === 0) return "Aucune";
    
    const lastMission = serreMissions.sort((a, b) => {
      if (!a.date_fin || !b.date_fin) return 0;
      return new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime();
    })[0];
    
    if (!lastMission.date_fin) return "En cours";
    return new Date(lastMission.date_fin).toLocaleDateString('fr-FR');
  };

  const getMissionsForDomain = (domainId: number) => {
    const domainSerres = serres.filter(s => s.id_domaine === domainId);
    return missions.filter(m => domainSerres.some(s => s.id === m.id_serre));
  };

  const calculateCompletionRate = (domainMissions: Mission[]) => {
    if (domainMissions.length === 0) return 0;
    const completed = domainMissions.filter(m => m.executed).length;
    return Math.round((completed / domainMissions.length) * 100);
  };

  const getDailyRepetitionCount = () => {
    return missions.filter(m => m.rep_jr === 1).length;
  };

  const getWeeklyRepetitionCount = () => {
    return missions.filter(m => m.rep_sem > 0).length;
  };

  const getOptimizationSuggestion = () => {
    const dailyMissions = missions.filter(m => m.rep_jr === 1);
    const weeklyMissions = missions.filter(m => m.rep_sem > 0);
    
    if (dailyMissions.length > weeklyMissions.length) {
      return "Considérez des missions hebdomadaires pour réduire la charge de travail";
    }
    return "Pattern de mission optimal détecté";
  };

  // Helper function for robot health status
  const getRobotHealthStatus = (robotId: number) => {
    const robotMissions = missions.filter(m => m.id_robot === robotId);
    const successRate = robotMissions.length > 0 ? 
      (robotMissions.filter(m => m.executed).length / robotMissions.length) * 100 : 0;
    
    if (successRate >= 90) return 'excellent';
    if (successRate >= 75) return 'bon';
    return 'attention';
  };

  // Calculate real weekly mission data from backend
  const getWeeklyMissionData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return days.map((day, index) => {
      const dayIndex = index + 1; // 1-7 for Mon-Sun
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start from Monday
      
      const dayMissions = missions.filter(mission => {
        if (!mission.date_debut) return false;
        const missionDate = new Date(mission.date_debut);
        
        // Check if mission is from current week
        const weekStart = new Date(startOfWeek);
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (missionDate >= weekStart && missionDate <= weekEnd) {
          // getDay() returns 0-6 (Sun-Sat), so we need to convert to 1-7 (Mon-Sun)
          const dayOfWeek = missionDate.getDay() === 0 ? 7 : missionDate.getDay();
          return dayOfWeek === dayIndex;
        }
        return false;
      });
      
      return dayMissions.length;
    });
  };

  // Calculate mission status distribution for the timeline chart
  const getMissionStatusData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return days.map((day, index) => {
      const dayIndex = index + 1; // 1-7 for Mon-Sun
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start from Monday
      
      const dayMissions = missions.filter(mission => {
        if (!mission.date_debut) return false;
        const missionDate = new Date(mission.date_debut);
        
        // Check if mission is from current week
        const weekStart = new Date(startOfWeek);
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (missionDate >= weekStart && missionDate <= weekEnd) {
          // getDay() returns 0-6 (Sun-Sat), so we need to convert to 1-7 (Mon-Sun)
          const dayOfWeek = missionDate.getDay() === 0 ? 7 : missionDate.getDay();
          return dayOfWeek === dayIndex;
        }
        return false;
      });
      
      // Count missions by status for this day
      const completed = dayMissions.filter(m => m.executed).length;
      const inProgress = dayMissions.filter(m => !m.executed).length;
      
      return { completed, inProgress, total: dayMissions.length };
    });
  };

  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => a.status === "non résolue").length;
  const urgentAlerts = alerts.filter(a => (a.status_alert as number) === 2).length; // Only high severity (status_alert === 2) are urgent
  
  // Bilan collection progress calculations
  const totalBilansCollected = bilans.length;
  const totalExpectedBilans = serres.length * 4; // Assuming 4 bilans per serre per year
  const completedSerres = serres.filter(serre => {
    const serreBilans = bilans.filter(b => b.id_serre === serre.id);
    return serreBilans.length >= 4;
  }).length;
  const pendingSerres = serres.length - completedSerres;
  
  // Additional real data calculations with correct severity mapping
  // status_alert values: 0=Low/Faible, 1=Medium/Moyenne, 2=High/Critique
  const alertsBySeverity = {
    low: alerts.filter(a => {
      const severity = a.status_alert as number;
      return severity === 0; // Low severity: exactly 0
    }).length,
    medium: alerts.filter(a => {
      const severity = a.status_alert as number;
      return severity === 1; // Medium severity: exactly 1
    }).length,
    high: alerts.filter(a => {
      const severity = a.status_alert as number;
      return severity === 2; // High severity: exactly 2
    }).length
  };

  console.log("[DEBUG] TechnicianDashboard - Alert severity breakdown:", alertsBySeverity);
  console.log("[DEBUG] TechnicianDashboard - Total alerts count:", alerts.length);
  console.log("[DEBUG] TechnicianDashboard - Unresolved alerts:", unresolvedAlerts);
  console.log("[DEBUG] TechnicianDashboard - Urgent alerts:", urgentAlerts);
  
  const recentAlerts = alerts.filter(a => {
    if (!a.date) return false;
    const alertDate = new Date(a.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return alertDate >= weekAgo;
  }).length;

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header removed: provided by TechnicianLayout */}

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Tableau de bord technicien</h1>
            <p className="text-muted-foreground">Vue d'ensemble de vos missions et interventions</p>
          </div>

          {/* PRIMARY DASHBOARD - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium mb-1">Alertes totales</p>
                  <p className="text-red-700 text-2xl font-bold">{loading ? "..." : totalAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium mb-1">Alertes non résolues</p>
                  <p className="text-orange-700 text-2xl font-bold">{loading ? "..." : unresolvedAlerts}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-4 rounded-2xl border border-greener-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-greener-600 text-sm font-medium mb-1">Missions totales</p>
                  <p className="text-greener-700 text-2xl font-bold">{loading ? "..." : missions.length}</p>
                </div>
                <Target className="h-8 w-8 text-greener-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">Interventions</p>
                  <p className="text-blue-700 text-2xl font-bold">{loading ? "..." : interventions.length}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID - Organized Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* LEFT COLUMN - Alerts & Performance */}
            <div className="xl:col-span-2 space-y-6">
              {/* Alert Analysis Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Analyse des alertes
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Alert Severity Chart */}
                  <div>
                    <h4 className="font-medium text-foreground mb-4">Répartition par sévérité</h4>
                    <div className="h-64">
                      {loading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                      ) : (
                        <Bar
                          data={{
                            labels: ['Faible', 'Moyenne', 'Élevée'],
                            datasets: [{
                              label: 'Alertes par sévérité',
                              data: [
                                alertsBySeverity.low,
                                alertsBySeverity.medium,
                                alertsBySeverity.high
                              ],
                              backgroundColor: [
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(249, 115, 22, 0.8)',
                                'rgba(239, 68, 68, 0.8)'
                              ],
                              borderColor: [
                                'rgba(34, 197, 94, 1)',
                                'rgba(249, 115, 22, 1)',
                                'rgba(239, 68, 68, 1)'
                              ],
                              borderWidth: 2,
                              borderRadius: 6,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((context.raw as number / total) * 100) : 0;
                                    return `${context.label}: ${context.raw} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                                ticks: { stepSize: 1 }
                              },
                              x: { grid: { display: false } }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Recent Alerts */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Alertes récentes
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {loading ? (
                        <div className="text-sm text-muted-foreground">Chargement...</div>
                      ) : alerts.slice(0, 5).map(alert => (
                        <div key={alert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className={`w-3 h-3 rounded-full ${
                            (alert.status_alert as number) === 0 ? 'bg-greener-500' : // Low severity
                            (alert.status_alert as number) === 1 ? 'bg-orange-500' : // Medium severity
                            'bg-red-500' // High severity (status_alert === 2)
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{alert.maladie}</div>
                            <div className="text-xs text-muted-foreground">{alert.serre_nom}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.date ? new Date(alert.date).toLocaleDateString('fr-FR') : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Performance Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-greener-500" />
                  Performance des missions
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mission Efficiency Chart */}
                  <div>
                    <h4 className="font-medium text-foreground mb-4">Tendances hebdomadaires</h4>
                    <div className="h-64">
                      {loading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-500"></div>
                        </div>
                      ) : (
                        <Line
                          data={{
                            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                            datasets: [
                              {
                                label: 'Missions planifiées',
                                data: getWeeklyMissionData(),
                                borderColor: 'rgba(46, 125, 50, 1)',
                                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                tension: 0.4,
                                fill: true,
                                borderWidth: 2,
                                pointBackgroundColor: 'rgba(46, 125, 50, 1)',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                              },
                              {
                                label: 'Missions terminées',
                                data: getMissionStatusData().map(d => d.completed),
                                borderColor: 'rgba(255, 107, 53, 1)',
                                backgroundColor: 'rgba(255, 107, 53, 0.05)',
                                tension: 0.4,
                                fill: false,
                                borderWidth: 2,
                                pointBackgroundColor: 'rgba(255, 107, 53, 1)',
                                borderDash: [5, 5],
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                  usePointStyle: true,
                                  font: { size: 11 }
                                }
                              },
                              tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                                ticks: { stepSize: 1 }
                              },
                              x: { grid: { display: false } }
                            },
                            interaction: {
                              mode: 'nearest',
                              axis: 'x',
                              intersect: false
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Mission Stats */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Statistiques des missions</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-4 rounded-2xl border border-greener-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-greener-600">
                            {loading ? "..." : missions.length > 0 ? Math.round((missions.filter(m => m.executed).length / missions.length) * 100) : 0}%
                          </div>
                          <div className="text-xs text-greener-600">Taux de réussite</div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {loading ? "..." : missions.filter(m => !m.executed).length}
                          </div>
                          <div className="text-xs text-orange-600">En cours</div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {loading ? "..." : getDailyRepetitionCount()}
                          </div>
                          <div className="text-xs text-blue-600">Quotidiennes</div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {loading ? "..." : getWeeklyRepetitionCount()}
                          </div>
                          <div className="text-xs text-purple-600">Hebdomadaires</div>
                        </div>
                      </div>
                    </div>

                    {/* Optimization Insight */}
                    <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-4 rounded-xl border border-greener-200">
                      <h5 className="font-medium text-greener-800 text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Insight d'optimisation
                      </h5>
                      <div className="text-xs text-greener-700">
                        {loading ? "..." : getOptimizationSuggestion()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Actions & Quick Info */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-greener-500" />
                  Actions rapides
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/technician/map")}
                    className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-greener-600 hover:bg-greener-700 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Map className="h-4 w-4" />
                    Voir la carte
                  </button>

                  <button
                    onClick={openInterventionForm}
                    className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nouvelle intervention
                  </button>

                  <button
                    onClick={() => navigate('/technician/missions')}
                    className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-greener-600 hover:bg-greener-700 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Voir les missions
                  </button>

                  <button
                    onClick={() => navigate('/technician/reports')}
                    className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Rapports
                  </button>
                </div>
              </div>

              {/* Workload Summary */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-greener-500" />
                  Charge de travail
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-greener-50 to-greener-100 rounded-xl border border-greener-200">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="h-4 w-4 text-greener-600" />
                      <span className="text-sm font-medium">Charge active</span>
                    </div>
                    <span className="font-bold text-greener-600 text-lg">
                      {loading ? "..." : interventions.filter(i => i.status === 'encours').length + alerts.filter(a => a.status === "non résolue").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-greener-50 to-greener-100 rounded-xl border border-greener-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-greener-600" />
                      <span className="text-sm font-medium">Tâches terminées</span>
                    </div>
                    <span className="font-bold text-greener-600 text-lg">
                      {loading ? "..." : interventions.filter(i => i.status === 'terminé').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-greener-500" />
                  Activité récente
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    [...interventions.slice(0, 2), ...reports.slice(0, 2)]
                      .sort((a, b) => {
                        const dateA = new Date('date_debut' in a ? a.date_debut || '' : a.date || '');
                        const dateB = new Date('date_debut' in b ? b.date_debut || '' : b.date || '');
                        return dateB.getTime() - dateA.getTime();
                      })
                      .slice(0, 4)
                      .map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="w-2 h-2 bg-greener-500 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {'status' in item ? `Intervention ${item.status}` : 'Rapport créé'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {'serre_nom' in item ? item.serre_nom : 'N/A'}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date('date_debut' in item ? item.date_debut || '' : item.date || '').toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY SECTION - Mission Coverage */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-greener-500" />
              Couverture des missions par serre
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2">
                <div className="h-64 mb-6">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-500"></div>
                    </div>
                  ) : serres.length > 0 ? (
                    <Bar
                      data={{
                        labels: serres.map(serre => serre.nom),
                        datasets: [{
                          label: 'Missions par serre',
                          data: serres.map(serre => getMissionCountForSerre(serre.id)),
                          backgroundColor: 'rgba(46, 125, 50, 0.8)',
                          borderColor: 'rgba(46, 125, 50, 1)',
                          borderWidth: 2,
                          borderRadius: 6,
                          borderSkipped: false,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              afterLabel: function(context) {
                                const serreId = serres[context.dataIndex]?.id;
                                if (serreId) {
                                  return `Dernière mission: ${getLastMissionDate(serreId)}`;
                                }
                                return '';
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            ticks: { stepSize: 1 }
                          },
                          x: {
                            grid: { display: false },
                            ticks: {
                              maxRotation: 45,
                              minRotation: 0,
                              font: { size: window.innerWidth < 640 ? 10 : 12 }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Aucune serre trouvée
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Résumé</h4>

                <div className="grid grid-cols-1 gap-3">
                  <div className="text-center p-4 bg-gradient-to-br from-greener-50 to-greener-100 rounded-xl border border-greener-200">
                    <div className="text-xl font-bold text-greener-600">
                      {loading ? "..." : serres.length > 0 ? Math.max(...serres.map(s => getMissionCountForSerre(s.id))) : 0}
                    </div>
                    <div className="text-xs text-greener-600">Max missions par serre</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="text-xl font-bold text-orange-600">
                      {loading ? "..." : serres.length > 0 ? Math.round(serres.reduce((acc, s) => acc + getMissionCountForSerre(s.id), 0) / serres.length) : 0}
                    </div>
                    <div className="text-xs text-orange-600">Moyenne par serre</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">
                      {loading ? "..." : serres.length}
                    </div>
                    <div className="text-xs text-blue-600">Total serres</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </main>

      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={closeInterventionForm}
        onSubmit={handleInterventionSubmit}
      />
    </div>
  );
}
