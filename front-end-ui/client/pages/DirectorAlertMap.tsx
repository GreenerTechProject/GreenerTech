import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import DirectorSidebar from '@/components/DirectorSidebar';
import DirectorHeader from '@/components/DirectorHeader';
import { useSidebar } from '@/hooks/useSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent, { DrawnShape } from '@/components/MapComponent';
import GoogleMapsWrapper from '@/components/GoogleMapsWrapper';

import { AlertService } from '@/services/alertService';
import { bilanService, Bilan } from '@/services/bilanService';
import { serreService } from '@/services/serreService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function DirectorAlertMap() {
  const { alertId } = useParams();
  const { isOpen, setIsOpen } = useSidebar();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any | null>(null);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [serre, setSerre] = useState<any | null>(null);
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!alertId) return;
        const a = await AlertService.getAlert(Number(alertId));
        setAlert(a);
        const b = await bilanService.getBilan(a.id_bilan);
        setBilan(b);
        const s = await serreService.getSerre(String(b.id_serre));
        setSerre(s);
        try {
          const g = await serreService.getGuidesBySerre(Number(b.id_serre));
          setGuides(g || []);
        } catch (_) {}
      } catch (e) {
        console.error(e);
        toast({ title: 'Erreur', description: "Impossible de charger la carte de l'alerte", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [alertId]);

  const googleReady = typeof window !== 'undefined' && (window as any).google && (window as any).google.maps;

  const shapes: DrawnShape[] = useMemo(() => {
    if (!googleReady) return [];
    const result: DrawnShape[] = [];
    if (serre?.position?.length) {
      result.push({
        id: `serre-${serre.id}`,
        type: 'serre',
        name: serre.nom || 'Serre',
        path: serre.position.map((p: any) => new google.maps.LatLng(p.point_x, p.point_y)),
        area: (serre.surface || 0) * 10000,
        center: new google.maps.LatLng(serre.center?.lat || 0, serre.center?.lng || 0),
        color: '#FF6B6B',
      });
    }
    if (bilan?.position?.length) {
      result.push({
        id: `bilan-${bilan.id}`,
        type: 'bilan',
        name: bilan.nom,
        path: bilan.position.map((p: any) => new google.maps.LatLng(p.point_x, p.point_y)),
        area: (bilan.surface || 0) * 10000,
        center: new google.maps.LatLng(bilan.center_lat || serre?.center?.lat || 0, bilan.center_lng || serre?.center?.lng || 0),
        color: '#2196F3',
      });
    }
    return result;
  }, [serre, bilan, googleReady]);

  const focusCenter = useMemo(() => {
    if (alert?.x1 && alert?.y1) {
      return { lat: alert.x1, lng: alert.y1 };
    }
    if (bilan?.center_lat && bilan?.center_lng) return { lat: bilan.center_lat, lng: bilan.center_lng };
    if (serre?.center?.lat && serre?.center?.lng) return { lat: serre.center.lat, lng: serre.center.lng };
    return null;
  }, [alert, bilan, serre]);

  const sev = useMemo(() => {
    switch (alert?.status_alert) {
      case 0: return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 1: return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 3: return { label: 'Critique', color: 'bg-red-600 text-white' };
      default: return { label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  }, [alert]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1">
        <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Carte de l'alerte</CardTitle>
              </CardHeader>
              <CardContent className="h-[70vh]">
                {!loading && (
                  <GoogleMapsWrapper>
                    <MapComponent
                      onShapeComplete={() => {}}
                      existingShapes={shapes}
                      drawingMode={null}
                      hideZoomControls={false}
                      hideInfoPanel={true}
                      focusCenter={focusCenter}
                      focusZoom={18}
                    />
                  </GoogleMapsWrapper>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{alert?.maladie || '—'}</div>
                  <Badge className={sev.color}>{sev.label}</Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>Statut: <span className="font-medium">{alert?.status || '—'}</span></div>
                  <div>Date: <span className="font-medium">{alert?.date ? new Date(alert.date).toLocaleString('fr-FR') : '—'}</span></div>
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div>Bilan: <span className="font-medium">{bilan?.nom || '—'}</span></div>
                  <div>Serre: <span className="font-medium">{serre?.nom || '—'}</span></div>
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div>Variété (guide culture): <span className="font-medium">{guides[0]?.variete ?? '—'}</span></div>
                  <div>Nombre de plants: <span className="font-medium">{guides[0]?.nombre_de_plants ?? '—'}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

