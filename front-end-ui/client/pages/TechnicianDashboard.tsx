import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TechHeader from "../components/TechHeader";
import { Map, AlertTriangle, BarChart3, TrendingUp, Activity, PlusCircle, ClipboardCheck } from "lucide-react";
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
import AlertHeatmap from "../components/AlertHeatmap";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { useState, useEffect } from "react";
import { AlertService } from "../services/alertService";
import { Alert } from "../types/alert";

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

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    // Here you would typically send the data to your backend
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention draft saved:", data);
    // Here you would typically save the draft to your backend
    setIsInterventionFormOpen(false);
  };

  const openInterventionForm = () => {
    setIsInterventionFormOpen(true);
  };

  const closeInterventionForm = () => {
    setIsInterventionFormOpen(false);
  };

  // Fetch alerts for the summary
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await AlertService.getAllAlerts(1, 1000);
        setAlerts(response.alerts || []);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => a.status === "non résolue").length;
  const urgentAlerts = alerts.filter(a => a.status_alert > 5).length;
  
  // Additional real data calculations
  const alertsBySeverity = {
    low: alerts.filter(a => a.status_alert <= 3).length,
    medium: alerts.filter(a => a.status_alert > 3 && a.status_alert <= 6).length,
    high: alerts.filter(a => a.status_alert > 6).length
  };
  
  const recentAlerts = alerts.filter(a => {
    if (!a.date) return false;
    const alertDate = new Date(a.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return alertDate >= weekAgo;
  }).length;

  // Charts data generators using real alert data
  const generateMonthlyAlertData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const currentYear = new Date().getFullYear();
    
    // Group alerts by month based on their date for the current year
    const monthlyData = months.map((month, index) => {
      const monthIndex = index + 1; // 1-6 for Jan-Jun
      const monthAlerts = alerts.filter(alert => {
        if (!alert.date) return false;
        const alertDate = new Date(alert.date);
        return alertDate.getFullYear() === currentYear && alertDate.getMonth() + 1 === monthIndex;
      });
      return monthAlerts.length;
    });
    
    return monthlyData;
  };

  const generateStatusDistributionData = () => {
    const resolved = alerts.filter(a => a.status === "résolue").length;
    const inProgress = alerts.filter(a => a.status === "non résolue" && a.status_alert <= 5).length;
    const urgent = alerts.filter(a => a.status === "non résolue" && a.status_alert > 5).length;
    return [resolved, inProgress, urgent];
  };

  const generateInterventionTrendData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    // Group alerts by day of the week for the current week
    const dailyData = days.map((day, index) => {
      const dayIndex = index + 1; // 1-7 for Mon-Sun
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start from Monday
      
      const dayAlerts = alerts.filter(alert => {
        if (!alert.date) return false;
        const alertDate = new Date(alert.date);
        // Check if alert is from current week
        const weekStart = new Date(startOfWeek);
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (alertDate >= weekStart && alertDate <= weekEnd) {
          // getDay() returns 0-6 (Sun-Sat), so we need to convert to 1-7 (Mon-Sun)
          const dayOfWeek = alertDate.getDay() === 0 ? 7 : alertDate.getDay();
          return dayOfWeek === dayIndex;
        }
        return false;
      });
      return dayAlerts.length;
    });
    
    return dailyData;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TechHeader role="technicien" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Tableau de bord - Technicien
            </h1>
            <p className="text-muted-foreground">
              Gérez vos interventions et surveillez les alertes en temps réel
            </p>
          </div>

          {/* Alert Heatmap Section */}
          <div className="mb-8">
            <div className="bg-card rounded-2xl shadow-lg border p-6">
              <GoogleMapsWrapper>
                <AlertHeatmap height="520px" />
              </GoogleMapsWrapper>
            </div>
          </div>

          {/* Stats and Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Welcome Card */}
            <div className="bg-card rounded-2xl shadow-lg border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Bienvenue
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> <span className="font-semibold">{user?.email}</span>
                </p>
                {user?.name && (
                  <p>
                    <span className="font-medium">Nom:</span> <span className="font-semibold">{user.name}</span>
                  </p>
                )}
                {user?.role && (
                  <p>
                    <span className="font-medium">Rôle:</span> <span className="font-semibold">{user.role}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Map className="h-5 w-5 text-emerald-500" />
                Actions rapides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate("/technician/map")}
                  className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-blue-600 hover:bg-blue-700"
                >
                  <Map className="h-4 w-4" />
                  Voir la carte
                </button>
                <button 
                  onClick={openInterventionForm}
                  className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nouvelle intervention
                </button>
                <button 
                  onClick={() => navigate('/technician/missions')}
                  className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-amber-500 hover:bg-amber-600"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Voir les missions
                </button>
                <button 
                  onClick={() => navigate('/technician/reports')}
                  className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-indigo-600 hover:bg-indigo-700"
                >
                  <BarChart3 className="h-4 w-4" />
                  Rapports
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card rounded-2xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interventions du jour</span>
                  <span className="font-extrabold text-[#10b981] text-base">
                    {loading ? "..." : alerts.filter(a => {
                      if (!a.date) return false;
                      const alertDate = new Date(a.date);
                      const today = new Date();
                      return alertDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Missions en cours</span>
                  <span className="font-extrabold text-blue-600 text-base">
                    {loading ? "..." : alerts.filter(a => a.status === "non résolue").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rapports à compléter</span>
                  <span className="font-extrabold text-sky-600 text-base">
                    {loading ? "..." : Math.max(0, alerts.length - alerts.filter(a => a.status === "résolue").length)}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Summary */}
            <div className="bg-card rounded-2xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Résumé des alertes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total alertes</span>
                  <span className="font-extrabold text-red-600 text-base">
                    {loading ? "..." : totalAlerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Non résolues</span>
                  <span className="font-extrabold text-orange-600 text-base">
                    {loading ? "..." : unresolvedAlerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgentes</span>
                  <span className="font-extrabold text-red-600 text-base">
                    {loading ? "..." : urgentAlerts}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Intervention Trend */}
            <div className="bg-card p-6 rounded-2xl border shadow-lg">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-sm font-medium text-foreground">Tendances d'intervention</h4>
              </div>
              <div className="h-56">
                <Line
                  data={{
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    datasets: [
                      {
                        label: 'Interventions',
                        data: generateInterventionTrendData(),
                        borderColor: 'rgba(147, 51, 234, 1)',
                        backgroundColor: (ctx: any) => {
                          const chart = ctx.chart;
                          const { ctx: c, chartArea } = chart;
                          if (!chartArea) return 'rgba(147, 51, 234, 0.15)';
                          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                          gradient.addColorStop(0, 'rgba(147, 51, 234, 0.35)');
                          gradient.addColorStop(1, 'rgba(147, 51, 234, 0.05)');
                          return gradient;
                        },
                        tension: 0.45,
                        fill: true,
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            {/* Alerts by Month */}
            <div className="bg-card p-6 rounded-2xl border shadow-lg">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-foreground">Alertes par mois</h4>
              </div>
              <div className="h-56">
                <Bar
                  data={{
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [
                      {
                        label: 'Alertes',
                        data: generateMonthlyAlertData(),
                        backgroundColor: [
                          'rgba(239, 68, 68, 0.85)',
                          'rgba(249, 115, 22, 0.85)',
                          'rgba(234, 179, 8, 0.85)',
                          'rgba(34, 197, 94, 0.85)',
                          'rgba(59, 130, 246, 0.85)',
                          'rgba(99, 102, 241, 0.85)'
                        ],
                        borderColor: [
                          'rgba(239, 68, 68, 1)',
                          'rgba(249, 115, 22, 1)',
                          'rgba(234, 179, 8, 1)',
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(99, 102, 241, 1)'
                        ],
                        borderWidth: 1,
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-card p-6 rounded-2xl border shadow-lg">
              <div className="flex items-center mb-4">
                <Activity className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-foreground">Distribution des statuts</h4>
              </div>
              <div className="h-56 relative">
                <Doughnut
                  data={{
                    labels: ['Résolues', 'En cours', 'Urgentes'],
                    datasets: [
                      {
                        data: generateStatusDistributionData(),
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.85)',
                          'rgba(59, 130, 246, 0.85)',
                          'rgba(239, 68, 68, 0.85)',
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(239, 68, 68, 1)',
                        ],
                        borderWidth: 2,
                        hoverOffset: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true },
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                            const value = context.raw as number;
                            const pct = total ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value} (${pct}%)`;
                          }
                        }
                      }
                    },
                    cutout: '65%'
                  }}
                />
                {(() => {
                  const [resolved, inProgress, urgent] = generateStatusDistributionData();
                  const total = Math.max(1, resolved + inProgress + urgent);
                  const rp = Math.round((resolved / total) * 100);
                  const ip = Math.round((inProgress / total) * 100);
                  const up = Math.round((urgent / total) * 100);
                  return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center leading-tight">
                        <div className="text-xs text-muted-foreground">Résolues / En cours / Urgentes</div>
                        <div className="text-sm font-bold">
                          {rp}% <span className="text-muted-foreground">/</span> {ip}% <span className="text-muted-foreground">/</span> {up}%
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
