import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { technicianService, Technician } from "@/services/technicianService";
import { serreService, AutorisationSerre } from "@/services/serreService";
import { toast } from "sonner";

export default function TechnicienSupAuthorizations(): JSX.Element {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serres, setSerres] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [authBySerreId, setAuthBySerreId] = useState<Record<number, AutorisationSerre[]>>({});

  // UI state for creating new authorization
  const [selectedSerreId, setSelectedSerreId] = useState<string>("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const [serresList, techs] = await Promise.all([
          serreService.getSerresWithTechnicians(),
          user.id_entreprise ? technicianService.getTechniciansByCompany(user.id_entreprise) : Promise.resolve([]),
        ]);

        if (!isMounted) return;
        setSerres(Array.isArray(serresList) ? serresList : []);
        // Only technicians assigned to this supervisor
        const myTechs = (Array.isArray(techs) ? techs : []).filter((t: any) => t.role === 'technicien' && String(t.id_assigned) === String(user.id));
        setTechnicians(myTechs);

        // Fetch authorizations per serre (to show current links)
        const entries = await Promise.all((Array.isArray(serresList) ? serresList : []).map(async (s: any) => {
          const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
          try {
            const list = await serreService.getAutorisationSerre({ id_serre: sid });
            return [sid, list] as [number, AutorisationSerre[]];
          } catch {
            return [sid, []] as [number, AutorisationSerre[]];
          }
        }));
        if (!isMounted) return;
        const map: Record<number, AutorisationSerre[]> = {};
        entries.forEach(([sid, list]) => { map[sid] = list; });
        setAuthBySerreId(map);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Impossible de charger les autorisations');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user?.id, user?.id_entreprise]);

  const handleCreateAuthorization = async () => {
    if (!selectedSerreId || !selectedTechnicianId) {
      toast.error("Sélectionnez une serre et un technicien");
      return;
    }
    try {
      setActionLoading(true);
      const created = await serreService.createAutorisationSerre({
        id_user: parseInt(selectedTechnicianId, 10),
        id_serre: parseInt(selectedSerreId, 10),
      });
      const sid = parseInt(selectedSerreId, 10);
      setAuthBySerreId((prev) => ({
        ...prev,
        [sid]: [...(prev[sid] || []), created],
      }));
      toast.success("Autorisation créée");
    } catch (e: any) {
      toast.error(e?.message || "Échec de la création de l'autorisation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAuthorization = async (sid: number, auth: AutorisationSerre) => {
    try {
      setActionLoading(true);
      await serreService.deleteAutorisationSerre(auth.id);
      setAuthBySerreId((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).filter((a) => a.id !== auth.id),
      }));
      toast.success("Autorisation supprimée");
    } catch (e: any) {
      toast.error(e?.message || "Échec de la suppression");
    } finally {
      setActionLoading(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Créer une autorisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Serre</Label>
              <Select value={selectedSerreId} onValueChange={setSelectedSerreId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir une serre" />
                </SelectTrigger>
                <SelectContent>
                  {serres.map((s: any) => (
                    <SelectItem key={String(s.id)} value={String(typeof s.id === 'string' ? parseInt(s.id, 10) : s.id)}>
                      {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Technicien</Label>
              <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>
                      {t.fullName || t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleCreateAuthorization} disabled={actionLoading} className="w-full">
                Donner l'accès
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Autorisations par serre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serre</TableHead>
                  <TableHead>Techniciens autorisés</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serres.map((s: any) => {
                  const sid = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
                  const list = (authBySerreId[sid] || []).filter((a) => String(a.id_user) !== String(user?.id));
                  const techMap: Record<string, string> = {};
                  technicians.forEach((t) => { techMap[String(t.id)] = t.fullName || t.email; });
                  return (
                    <TableRow key={String(s.id)}>
                      <TableCell className="font-medium">{s.nom}</TableCell>
                      <TableCell>
                        {list.length === 0 ? (
                          <span className="text-xs text-gray-500">Aucun</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {list.map((a) => (
                              <Badge key={a.id} variant="outline">{techMap[String(a.id_user)] || `Technicien ${a.id_user}`}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {list.map((a) => (
                            <Button key={a.id} variant="outline" size="sm" disabled={actionLoading} onClick={() => handleDeleteAuthorization(sid, a)}>
                              Retirer accès ({a.id_user})
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </div>
  );
}


