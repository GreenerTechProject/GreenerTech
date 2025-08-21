import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertService } from "@/services/alertService";
import { missionService } from "@/services/missionService";
import { InterventionService, Intervention as ApiIntervention } from "@/services/interventionService";
import { serreService } from "@/services/serreService";
import { technicianService, Technician } from "@/services/technicianService";
import { bilanService } from "@/services/bilanService";
import type { Alert } from "@/types/alert";
import { MapPin, Users, Bell, ClipboardList, Rocket } from "lucide-react";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip as ChartJsTooltip, Legend as ChartJsLegend, Title } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartJsTooltip, ChartJsLegend, Title);

export default function TechnicienSupHome(): JSX.Element {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serres, setSerres] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [interventions, setInterventions] = useState<ApiIntervention[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState<Technician[]>([]);
  const [bilanIdToSerreId, setBilanIdToSerreId] = useState<Record<number, number>>({});
  const [alertsCountBySerreId, setAlertsCountBySerreId] = useState<Record<number, number>>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Fetch serres assigned to current user (with technician info)
        const serresPromise = serreService.getSerresWithTechnicians();
        // Alerts on assigned serres
        const alertsPromise = AlertService.getAlertsByAssignedSerres();
        // Interventions on assigned serres
        const interventionsPromise = InterventionService.getInterventionsByAssignedSerres();
        // All missions; will filter to our serres
        const missionsPromise = missionService.getAllMissions();
        // Company technicians to identify those assigned to this supervisor
        const techniciansPromise = user.id_entreprise
          ? technicianService.getTechniciansByCompany(user.id_entreprise)
          : Promise.resolve([]);

        const [serreList, alertList, interventionList, missionList, companyTechs] = await Promise.all([
          serresPromise,
          alertsPromise,
          interventionsPromise,
          missionsPromise,
          techniciansPromise,
        ]);

        if (!isMounted) return;

        // Normalize
        const assignedSerres = Array.isArray(serreList) ? serreList : [];
        setSerres(assignedSerres);
        setAlerts(Array.isArray(alertList) ? alertList : []);
        setInterventions(Array.isArray(interventionList) ? interventionList : []);

        // Filter missions to our serres
        const assignedSerreIds = new Set(
          assignedSerres.map((s: any) => (typeof s.id === 'string' ? parseInt(s.id, 10) : s.id))
        );
        const filteredMissions = (Array.isArray(missionList) ? missionList : []).filter((m: any) => {
          const sid = typeof m.id_serre === 'string' ? parseInt(m.id_serre, 10) : m.id_serre;
          return assignedSerreIds.has(sid);
        });
        setMissions(filteredMissions);

        // Technicians assigned to this supervisor
        const myTechs = (Array.isArray(companyTechs) ? companyTechs : []).filter((t: any) => {
          const isTech = t.role === 'technicien';
          const assignedToMe = t.id_assigned != null && String(t.id_assigned) === String(user.id);
          return isTech && assignedToMe;
        });
        setAssignedTechnicians(myTechs);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Impossible de charger le tableau de bord');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user?.id, user?.id_entreprise]);

  // Fetch bilans for each assigned serre to map alert.id_bilan -> serre id
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (serres.length === 0) return;
      try {
        const entries = await Promise.all(
          serres.map(async (s: any) => {
            const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
            try {
              const bilans = await bilanService.getBilansBySerre(sid);
              return bilans.map((b) => [b.id, sid] as [number, number]);
            } catch {
              return [] as [number, number][];
            }
          })
        );
        if (!isMounted) return;
        const map: Record<number, number> = {};
        entries.flat().forEach(([bid, sid]) => { map[bid] = sid; });
        setBilanIdToSerreId(map);
      } catch {}
    })();
    return () => { isMounted = false; };
  }, [serres]);

  // Compute alerts count per serre using id_serre, fallback to bilan mapping and serre name
  useEffect(() => {
    if (serres.length === 0) { setAlertsCountBySerreId({}); return; }
    const nameToSerreId: Record<string, number> = {};
    serres.forEach((s: any) => {
      const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
      if (typeof s.nom === 'string') nameToSerreId[s.nom.trim().toLowerCase()] = sid;
    });
    const counts: Record<number, number> = {};
    serres.forEach((s: any) => {
      const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
      counts[sid] = 0;
    });
    alerts.forEach((a: any) => {
      let sid: number | undefined = undefined;
      if (typeof a.id_serre === 'number') {
        sid = a.id_serre;
      }
      if (!sid && typeof a.id_bilan === 'number') {
        sid = bilanIdToSerreId[a.id_bilan];
      }
      if (!sid && typeof a.serre_nom === 'string') {
        sid = nameToSerreId[a.serre_nom.trim().toLowerCase()];
      }
      if (sid && counts.hasOwnProperty(sid)) {
        counts[sid] += 1;
      }
    });
    setAlertsCountBySerreId(counts);
  }, [alerts, serres, bilanIdToSerreId]);

  // Derived metrics
  const alertCounts = useMemo(() => {
    let low = 0, medium = 0, high = 0;
    alerts.forEach((a: any) => {
      if (a.status_alert === 2) high++;
      else if (a.status_alert === 1) medium++;
      else low++;
    });
    return { low, medium, high, total: alerts.length };
  }, [alerts]);

  const interventionStats = useMemo(() => {
    const total = interventions.length;
    const rejected = interventions.filter(i => i.status === 'rejetee').length;
    const validated = interventions.filter(i => i.valid === true).length;
    const inProgress = interventions.filter(i => i.status === 'encours' || i.status === 'en_attente').length;
    const completed = interventions.filter(i => i.status === 'terminé').length;
    return { total, rejected, validated, inProgress, completed };
  }, [interventions]);

  const missionStats = useMemo(() => {
    const total = missions.length;
    const executed = missions.filter((m: any) => m.executed === true).length;
    const scheduled = missions.filter((m: any) => m.executed !== true).length;
    return { total, executed, scheduled };
  }, [missions]);

  // Chart.js datasets
  const alertsChartData = useMemo(() => ({
    labels: ["Élevé", "Moyen", "Faible"],
    datasets: [
      {
        label: "Alertes",
        data: [alertCounts.high, alertCounts.medium, alertCounts.low],
        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
        borderWidth: 0,
      },
    ],
  }), [alertCounts]);

  const interventionsChartData = useMemo(() => ({
    labels: ["Validées", "Rejetées", "Terminées", "En cours/attente"],
    datasets: [
      {
        label: "Interventions",
        data: [
          interventionStats.validated,
          interventionStats.rejected,
          interventionStats.completed,
          interventionStats.inProgress,
        ],
        backgroundColor: ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  }), [interventionStats]);

  const missionsChartData = useMemo(() => ({
    labels: ["Exécutées", "Planifiées"],
    datasets: [
      {
        label: "Missions",
        data: [missionStats.executed, missionStats.scheduled],
        backgroundColor: ["#10b981", "#94a3b8"],
        borderWidth: 0,
      },
    ],
  }), [missionStats]);

  const doughnutOptions: any = {
    plugins: {
      legend: { position: "bottom" },
      title: { display: false },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  const barOptions: any = {
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Serres assignées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serres.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Techniciens sous ma supervision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedTechnicians.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" /> Alertes (Total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.total}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline" className="bg-red-50 text-red-700">Élevé: {alertCounts.high}</Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Moyen: {alertCounts.medium}</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">Faible: {alertCounts.low}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Interventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interventionStats.total}</div>
            <div className="mt-2 flex gap-2 flex-wrap text-xs">
              <Badge variant="outline" className="bg-green-50 text-green-700">Validées: {interventionStats.validated}</Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">Rejetées: {interventionStats.rejected}</Badge>
              <Badge variant="outline">Terminées: {interventionStats.completed}</Badge>
              <Badge variant="outline">En cours/attente: {interventionStats.inProgress}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missions summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Missions (mes serres)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionStats.total}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline" className="bg-green-50 text-green-700">Exécutées: {missionStats.executed}</Badge>
              <Badge variant="outline">Planifiées: {missionStats.scheduled}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Serres list with assigned technicians */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Serres et techniciens assignés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Techniciens</TableHead>
                    <TableHead>Alertes</TableHead>
                    <TableHead>Interventions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serres.map((s: any) => {
                    const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
                    const serreInterventions = interventions.filter((i: any) => i.id_serre === sid);
                    const techs = s.assignedTechnicians || [];
                    const alertCount = alertsCountBySerreId[sid] ?? 0;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nom}</TableCell>
                        <TableCell>{Math.round(s.surface || 0)} m²</TableCell>
                        <TableCell>
                          {techs.length === 0 ? (
                            <span className="text-xs text-gray-500">—</span>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              {techs.map((t: any) => (
                                <Badge key={t.id} variant="outline">{t.name || t.email}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{alertCount}</TableCell>
                        <TableCell>{serreInterventions.length}</TableCell>
                      </TableRow>
                    );
                  })}
                  {serres.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-500">Aucune serre assignée</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alternating rows: Chart | Info, then Info | Chart, then Chart | Info */}
      {/* Row 1: Alerts Doughnut | Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Répartition des alertes</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Doughnut data={alertsChartData} options={doughnutOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alertes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <div className="text-sm font-medium">{a.maladie || 'Alerte'}</div>
                    <div className="text-xs text-gray-500">Serre #{a.id_serre}</div>
                  </div>
                  <Badge variant="outline" className={a.status_alert === 2 ? 'bg-red-50 text-red-700' : a.status_alert === 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}>
                    {a.status_alert === 2 ? 'Élevé' : a.status_alert === 1 ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-sm text-gray-500">Aucune alerte</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Info (Serres table) | Interventions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Serres et techniciens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Techniciens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serres.slice(0, 6).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nom}</TableCell>
                      <TableCell>{Math.round(s.surface || 0)} m²</TableCell>
                      <TableCell>
                        {(s.assignedTechnicians || []).length === 0 ? (
                          <span className="text-xs text-gray-500">—</span>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {(s.assignedTechnicians || []).map((t: any) => (
                              <Badge key={t.id} variant="outline">{t.name || t.email}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {serres.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-gray-500">Aucune serre assignée</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Statut des interventions</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Bar data={interventionsChartData} options={barOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Missions Bar | Info (Techniciens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Missions (exécutées vs planifiées)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Bar data={missionsChartData} options={barOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Techniciens sous ma supervision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {assignedTechnicians.slice(0, 12).map((t) => (
                <Badge key={String(t.id)} variant="outline">{t.fullName || t.email}</Badge>
              ))}
              {assignedTechnicians.length === 0 && (
                <div className="text-sm text-gray-500">Aucun technicien assigné</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


