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
  id: string; // Changed to string to match service
  nom: string;
  domainId: string; // Changed from id_domaine to match service
  surface: number;
  center_lat?: number;
  center_lng?: number;
}

interface Domain {
  id: string; // Changed to string to match service
  name: string; // Changed from nom to match service
  area: number; // Changed from surface to match service
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  companyId?: string;
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
          AlertService.getAllAlerts(1, 1000),
          missionService.getAllMissions(),
          serreService.getAllSerres(),
          domainService.getMyCompanyDomains(),
          bilanService.getAllBilans(),
          robotService.getAllRobots(),
          InterventionService.getInterventionsByAssignedSerres(),
          notificationService.getNotifications(),
          ReportService.getReportsByAssignedSerres()
        ]);

        setAlerts(alertsData.alerts || []);
        setMissions(missionsData);
        setSerres(serresData);
        setDomains(domainsData);
        setBilans(bilansData);
        setRobots(robotsData);
        setInterventions(interventionsData);
        setNotifications(notificationsData);
        setReports(reportsData);
      } catch (error) {
        setAlerts([]);
        setMissions([]);
        setSerres([]);
        setDomains([]);
        setBilans([]);
        setRobots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper functions for mission data analysis
  const getMissionCountForSerre = (serreId: string) => {
    return missions.filter(m => m.id_serre === parseInt(serreId, 10)).length;
  };

  const getLastMissionDate = (serreId: string) => {
    const serreMissions = missions.filter(m => m.id_serre === parseInt(serreId, 10));
    if (serreMissions.length === 0) return "Aucune";
    
    const lastMission = serreMissions.sort((a, b) => {
      if (!a.date_fin || !b.date_fin) return 0;
      return new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime();
    })[0];
    
    if (!lastMission.date_fin) return "En cours";
    return new Date(lastMission.date_fin).toLocaleDateString('fr-FR');
  };

  const getMissionsForDomain = (domainId: string) => {
    const domainSerres = serres.filter(s => s.domainId === domainId);
    return missions.filter(m => domainSerres.some(s => parseInt(s.id, 10) === m.id_serre));
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
  const urgentAlerts = alerts.filter(a => (a.status_alert as number) > 5).length;
  
  // Bilan collection progress calculations
  const totalBilansCollected = bilans.length;
  const totalExpectedBilans = serres.length * 4; // Assuming 4 bilans per serre per year
  const completedSerres = serres.filter(serre => {
    const serreBilans = bilans.filter(b => b.id_serre === parseInt(serre.id, 10));
    return serreBilans.length >= 4;
  }).length;
  const pendingSerres = serres.length - completedSerres;
  
  // Additional real data calculations
  const alertsBySeverity = {
    low: alerts.filter(a => (a.status_alert as number) == 0).length,
    medium: alerts.filter(a => (a.status_alert as number) ==1).length,
    high: alerts.filter(a => (a.status_alert as number) == 2).length
  };
  
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
        <main className="flex-1 overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Responsive Layout: Mobile-first approach */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Left Column: Alert Statistics Dashboard (2/3 width on large screens) */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Tableau de bord des alertes et interventions
                </h3>
                
                {/* Alert Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-2xl border border-red-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {loading ? "..." : totalAlerts}
                        </div>
                        <div className="text-sm text-red-600">Total alertes</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                          {loading ? "..." : unresolvedAlerts}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600">Non résolues</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-3 sm:p-4 rounded-2xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-greener-600" />
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-greener-600">
                          {loading ? "..." : interventions.length}
                        </div>
                        <div className="text-xs sm:text-sm text-greener-600">Interventions</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-3 sm:p-4 rounded-2xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-greener-600" />
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-greener-600">
                          {loading ? "..." : interventions.filter(i => i.status === 'terminé').length}
                        </div>
                        <div className="text-xs sm:text-sm text-greener-600">Terminées</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Severity Chart */}
                <div className="h-48 sm:h-64 mb-4 sm:mb-6">
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

                {/* Recent Alerts and Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm sm:text-base">Alertes récentes</span>
                    </h4>
                    <div className="space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
                      {loading ? (
                        <div className="text-sm text-muted-foreground">Chargement...</div>
                      ) : alerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.status_alert === 0 ? 'bg-greener-500' : 
                            alert.status_alert === 1 ? 'bg-orange-500' : 'bg-red-500'
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

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-greener-500" />
                      <span className="text-sm sm:text-base">Notifications</span>
                    </h4>
                    <div className="space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
                      {loading ? (
                        <div className="text-sm text-muted-foreground">Chargement...</div>
                      ) : notifications.slice(0, 3).map(notification => (
                        <div key={notification.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className={`w-2 h-2 rounded-full ${
                            notification.status === 'non_vue' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{notification.description}</div>
                            <div className="text-xs text-muted-foreground">{notification.type_notification}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(notification.date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions (1/3 width on large screens) */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-10 m-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-greener-500" />
                  <span>Actions rapides</span>
              </h3>
                <div className="grid grid-cols-1 gap-3">
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

                
          {/* NEW MISSION-BASED VISUALIZATIONS */}
            {/* Mission Coverage Heatmap by Serre */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-greener-500" />
                Couverture des missions par serre
              </h3>
              <div className="h-48 sm:h-64 mb-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-greener-500"></div>
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
              {/* Summary cards below chart */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-greener-50 to-greener-100 rounded-xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-base sm:text-lg font-bold text-greener-600">
                    {loading ? "..." : serres.length > 0 ? Math.max(...serres.map(s => getMissionCountForSerre(s.id))) : 0}
                  </div>
                  <div className="text-xs text-greener-600">Max missions</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-base sm:text-lg font-bold text-orange-600">
                    {loading ? "..." : serres.length > 0 ? Math.round(serres.reduce((acc, s) => acc + getMissionCountForSerre(s.id), 0) / serres.length) : 0}
                  </div>
                  <div className="text-xs text-orange-600">Moyenne</div>
                </div>
              </div>
            </div>

          
              </div>

            </div>



          {/* NEW MISSION-BASED VISUALIZATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Mission Coverage Heatmap by Serre */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-greener-500" />
                Couverture des missions par serre
              </h3>
              <div className="h-48 sm:h-64 mb-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-greener-500"></div>
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
              {/* Summary cards below chart */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-greener-50 to-greener-100 rounded-xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-base sm:text-lg font-bold text-greener-600">
                    {loading ? "..." : serres.length > 0 ? Math.max(...serres.map(s => getMissionCountForSerre(s.id))) : 0}
                  </div>
                  <div className="text-xs text-greener-600">Max missions</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-base sm:text-lg font-bold text-orange-600">
                    {loading ? "..." : serres.length > 0 ? Math.round(serres.reduce((acc, s) => acc + getMissionCountForSerre(s.id), 0) / serres.length) : 0}
                  </div>
                  <div className="text-xs text-orange-600">Moyenne</div>
                </div>
              </div>
            </div>

          
          </div>

          {/* Mission Pattern Analysis - Full Width with Charts */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-greener-500" />
                <span>Analyse des patterns de mission</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left side: Mission Repetition Patterns Chart */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Patterns de répétition</h4>
                  <div className="h-40 sm:h-48">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-greener-500"></div>
                      </div>
                    ) : (
                <Doughnut
                  data={{
                          labels: ['Missions quotidiennes', 'Missions hebdomadaires', 'Missions ponctuelles'],
                          datasets: [{
                            data: [
                              getDailyRepetitionCount(),
                              getWeeklyRepetitionCount(),
                              missions.length - getDailyRepetitionCount() - getWeeklyRepetitionCount()
                            ],
                        backgroundColor: [
                              'rgba(46, 125, 50, 0.8)',
                              'rgba(255, 107, 53, 0.8)',
                              'rgba(156, 163, 175, 0.8)'
                        ],
                        borderColor: [
                              'rgba(46, 125, 50, 1)',
                              'rgba(255, 107, 53, 1)',
                              'rgba(156, 163, 175, 1)'
                        ],
                        borderWidth: 2,
                            hoverOffset: 4,
                          }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                              labels: { 
                                padding: 15, 
                                usePointStyle: true,
                                font: { size: 11 }
                              }
                            }
                          },
                          cutout: '50%'
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Right side: Mission Status and Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Statut et tendances</h4>
                  <div className="h-40 sm:h-48">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-greener-500"></div>
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
                              borderColor: 'rgba(46, 125, 50, 1)',
                              backgroundColor: 'rgba(46, 125, 50, 0.05)',
                              tension: 0.4,
                              fill: false,
                              borderWidth: 2,
                              pointBackgroundColor: 'rgba(46, 125, 50, 1)',
                              borderDash: [5, 5],
                            },
                            {
                              label: 'Missions en cours',
                              data: getMissionStatusData().map(d => d.inProgress),
                              borderColor: 'rgba(255, 107, 53, 1)',
                              backgroundColor: 'rgba(255, 107, 53, 0.05)',
                              tension: 0.4,
                              fill: false,
                              borderWidth: 2,
                              pointBackgroundColor: 'rgba(255, 107, 53, 1)',
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
              </div>

              {/* Bottom section: Mission Status Distribution and Optimization */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Mission Status Distribution */}
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground text-xs sm:text-sm">Statut des missions</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-greener-50 to-greener-100 rounded-xl border border-greener-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-greener-600" />
                        <span className="text-xs sm:text-sm">Terminées</span>
                      </div>
                      <span className="font-bold text-greener-600 text-sm sm:text-base">
                        {loading ? "..." : missions.filter(m => m.executed).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-xs sm:text-sm">En cours</span>
                      </div>
                      <span className="font-bold text-orange-600 text-sm sm:text-base">
                        {loading ? "..." : missions.filter(m => !m.executed).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mission Efficiency Metrics */}
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground text-sm">Métriques d'efficacité</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-greener-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-greener-600" />
                        <span className="text-sm">Taux de réussite</span>
                      </div>
                      <span className="font-bold text-greener-600">
                        {loading ? "..." : missions.length > 0 ? Math.round((missions.filter(m => m.executed).length / missions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestion */}
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground text-sm">Optimisation suggérée</h5>
                  <div className="p-2 bg-greener-50 rounded-lg">
                    <div className="text-xs text-greener-700">
                      {loading ? "..." : getOptimizationSuggestion()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Efficiency Dashboard */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-greener-500" />
                <span>Efficacité des missions</span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: Mission Efficiency Metrics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Métriques d'efficacité</h4>
                  
                  {/* Efficiency Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-3 rounded-2xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-greener-600">
                          {loading ? "..." : missions.length > 0 ? Math.round((missions.filter(m => m.executed).length / missions.length) * 100) : 0}%
                        </div>
                        <div className="text-xs sm:text-sm text-greener-600">Taux de réussite</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                          {loading ? "..." : missions.length}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600">Total missions</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-3 rounded-2xl border border-greener-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-greener-600">
                          {loading ? "..." : missions.filter(m => m.executed).length}
                        </div>
                        <div className="text-xs sm:text-sm text-greener-600">Terminées</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                          {loading ? "..." : missions.filter(m => !m.executed).length}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600">En cours</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission Type Distribution */}
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <h5 className="font-medium text-foreground text-sm mb-2">Types de missions</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Quotidiennes</span>
                        <span className="font-semibold text-greener-600">
                          {loading ? "..." : getDailyRepetitionCount()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Hebdomadaires</span>
                        <span className="font-semibold text-orange-600">
                          {loading ? "..." : getWeeklyRepetitionCount()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Ponctuelles</span>
                        <span className="font-semibold text-greener-600">
                          {loading ? "..." : missions.length - getDailyRepetitionCount() - getWeeklyRepetitionCount()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Mission Efficiency Chart */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Tendances d'efficacité</h4>
                  <div className="h-48 sm:h-56">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-greener-500"></div>
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
                  
                  {/* Efficiency Insights */}
                  <div className="bg-gradient-to-br from-greener-50 to-greener-100 p-3 rounded-xl border border-greener-200">
                    <h5 className="font-medium text-greener-800 text-sm mb-2">💡 Insight d'optimisation</h5>
                    <div className="text-xs text-greener-700">
                      {loading ? "..." : getOptimizationSuggestion()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Mission Performance by Serre */}
              <div className="mt-6">
                <h4 className="font-medium text-foreground mb-3 text-sm sm:text-base">Performance par serre</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                  ) : serres.slice(0, 6).map(serre => {
                    const serreMissions = missions.filter(m => m.id_serre === parseInt(serre.id, 10));
                    const completedMissions = serreMissions.filter(m => m.executed).length;
                    const totalMissions = serreMissions.length;
                    const efficiency = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
                    
                    return (
                      <div key={serre.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 truncate">{serre.nom}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            efficiency >= 80 ? 'bg-greener-100 text-greener-700' :
                            efficiency >= 60 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {efficiency}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {completedMissions}/{totalMissions} missions terminées
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Intervention Performance Dashboard */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-greener-500" />
                <span>Performance des interventions et rapports</span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: Intervention Performance Chart */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Performance des interventions</h4>
                  <div className="h-40 sm:h-48">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-greener-500"></div>
                      </div>
                    ) : (
                      <Doughnut
                        data={{
                          labels: ['Terminées', 'En cours', 'En attente'],
                          datasets: [{
                            data: [
                              interventions.filter(i => i.status === 'terminé').length,
                              interventions.filter(i => i.status === 'encours').length,
                              interventions.filter(i => i.status !== 'terminé' && i.status !== 'encours').length
                            ],
                            backgroundColor: [
                              'rgba(46, 125, 50, 0.8)',
                              'rgba(255, 107, 53, 0.8)',
                              'rgba(156, 163, 175, 0.8)'
                            ],
                            borderColor: [
                              'rgba(46, 125, 50, 1)',
                              'rgba(255, 107, 53, 1)',
                              'rgba(156, 163, 175, 1)'
                            ],
                            borderWidth: 2,
                            hoverOffset: 4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { 
                                padding: 15, 
                                usePointStyle: true,
                                font: { size: 11 }
                              }
                            }
                          },
                          cutout: '50%'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Intervention Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-greener-50 rounded-lg">
                      <div className="text-lg font-bold text-greener-600">
                        {loading ? "..." : interventions.length > 0 ? Math.round((interventions.filter(i => i.status === 'terminé').length / interventions.length) * 100) : 0}%
                      </div>
                      <div className="text-xs text-greener-600">Taux de réussite</div>
                    </div>
                    <div className="text-center p-3 bg-greener-50 rounded-lg">
                      <div className="text-lg font-bold text-greener-600">
                        {loading ? "..." : interventions.filter(i => i.status === 'terminé').length}
                      </div>
                      <div className="text-xs text-greener-600">Terminées</div>
                    </div>
                  </div>
                </div>

                {/* Right: Reports and Workload */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Rapports et charge de travail</h4>
                  <div className="h-40 sm:h-48">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-greener-500"></div>
                      </div>
                    ) : (
                      <Bar
                        data={{
                          labels: ['Rapports créés', 'Interventions actives', 'Alertes en cours'],
                          datasets: [{
                            label: 'Activité récente',
                            data: [
                              reports.length,
                              interventions.filter(i => i.status === 'encours').length,
                              alerts.filter(a => a.status === "non résolue").length
                            ],
                            backgroundColor: [
                              'rgba(99, 102, 241, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(239, 68, 68, 0.8)'
                            ],
                            borderColor: [
                              'rgba(99, 102, 241, 1)',
                              'rgba(59, 130, 246, 1)',
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
                                  return `${context.label}: ${context.raw}`;
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
                  
                  {/* Workload Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-greener-50 to-greener-100 rounded-xl border border-greener-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <TargetIcon className="h-4 w-4 text-greener-600" />
                        <span className="text-xs sm:text-sm">Charge de travail</span>
                      </div>
                      <span className="font-bold text-greener-600 text-sm sm:text-base">
                        {loading ? "..." : interventions.filter(i => i.status === 'encours').length + alerts.filter(a => a.status === "non résolue").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-greener-50 to-greener-100 rounded-xl border border-greener-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-greener-600" />
                        <span className="text-xs sm:text-sm">Tâches complétées</span>
                      </div>
                      <span className="font-bold text-greener-600 text-sm sm:text-base">
                        {loading ? "..." : interventions.filter(i => i.status === 'terminé').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Recent Activity Timeline */}
              <div className="mt-6">
                <h4 className="font-medium text-foreground mb-3 text-sm sm:text-base">Activité récente</h4>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
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
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
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

          {/* Real-time Performance Indicators */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-slate-900 via-greener-900 to-greener-900 rounded-3xl p-4 sm:p-6 text-white overflow-hidden relative">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')}`
              }}></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-3 h-3 bg-greener-400 rounded-full animate-pulse"></div>
                  📊 Indicateurs de performance en temps réel
                </h3>
                
                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-2xl sm:text-3xl font-bold text-greener-400 mb-2">
                      {loading ? "..." : Math.round((missions.filter(m => m.executed).length / Math.max(1, missions.length)) * 100)}%
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Taux de réussite missions</div>
                  </div>
                  
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-2xl sm:text-3xl font-bold text-greener-400 mb-2">
                      {loading ? "..." : Math.round((interventions.filter(i => i.status === 'terminé').length / Math.max(1, interventions.length)) * 100)}%
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Taux de réussite interventions</div>
                  </div>
                  
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-2xl sm:text-3xl font-bold text-greener-400 mb-2">
                      {loading ? "..." : Math.round((alerts.filter(a => a.status === "résolue").length / Math.max(1, totalAlerts)) * 100)}%
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Alertes résolues</div>
                  </div>
                  
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-2xl sm:text-3xl font-bold text-greener-400 mb-2">
                      {loading ? "..." : Math.round((reports.length / Math.max(1, serres.length)) * 100)}%
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Couverture rapports</div>
                  </div>
                </div>

                {/* Efficiency Trends Chart */}
                <div className="h-48 sm:h-64 mb-4 sm:mb-6">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-greener-400"></div>
                    </div>
                  ) : (
                    <Line
                      data={{
                        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                        datasets: [
                          {
                            label: 'Efficacité missions',
                            data: getWeeklyMissionData().map((count, index) => {
                              const totalMissions = getMissionStatusData()[index]?.total || 0;
                              return totalMissions > 0 ? Math.round((count / totalMissions) * 100) : 0;
                            }),
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
                            label: 'Interventions actives',
                            data: getWeeklyMissionData().map(() => interventions.filter(i => i.status === 'encours').length),
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            tension: 0.4,
                            fill: false,
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
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
                              font: { size: 11 },
                              color: 'rgba(255, 255, 255, 0.8)'
                            }
                          },
                          tooltip: { 
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'rgba(255, 255, 255, 1)',
                            bodyColor: 'rgba(255, 255, 255, 0.8)'
                          }
                        },
                        scales: {
                          y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { 
                              stepSize: 20,
                              color: 'rgba(255, 255, 255, 0.8)'
                            }
                          },
                          x: { 
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.8)' }
                          }
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

                {/* Mission Coverage Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-xl sm:text-2xl font-bold text-greener-400">
                      {loading ? "..." : serres.length}
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Serres couvertes</div>
                  </div>
                  
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-xl sm:text-2xl font-bold text-greener-400">
                      {loading ? "..." : missions.length}
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Total missions</div>
                  </div>
                  
                  <div className="bg-greener-900/50 p-3 sm:p-4 rounded-2xl border border-greener-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-xl sm:text-2xl font-bold text-greener-400">
                      {loading ? "..." : domains.length}
                    </div>
                    <div className="text-greener-200 text-xs sm:text-sm">Domaines actifs</div>
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
