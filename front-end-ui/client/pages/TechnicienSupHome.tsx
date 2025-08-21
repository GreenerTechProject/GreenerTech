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
import type { Alert } from "@/types/alert";
import { MapPin, Users, Bell, ClipboardList, Rocket } from "lucide-react";

export default function TechnicienSupHome(): JSX.Element {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serres, setSerres] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [interventions, setInterventions] = useState<ApiIntervention[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState<Technician[]>([]);

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
                    const serreAlerts = alerts.filter((a: any) => a.id_serre === sid);
                    const serreInterventions = interventions.filter((i: any) => i.id_serre === sid);
                    const techs = s.assignedTechnicians || [];
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
                        <TableCell>{serreAlerts.length}</TableCell>
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

      {/* Recent activity: alerts and interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Interventions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {interventions.slice(0, 8).map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <div className="text-sm font-medium">{i.description || 'Intervention'}</div>
                    <div className="text-xs text-gray-500">Serre #{i.id_serre}</div>
                  </div>
                  <div className="flex gap-2">
                    {i.valid ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Validée</Badge>
                    ) : i.status === 'rejetee' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700">Rejetée</Badge>
                    ) : (
                      <Badge variant="outline">{i.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
              {interventions.length === 0 && (
                <div className="text-sm text-gray-500">Aucune intervention</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


