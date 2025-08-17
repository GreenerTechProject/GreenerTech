import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Navigation, Target, Play, Pause, Square, CheckCircle, XCircle, RotateCcw, X, Move, Square as SquareIcon } from 'lucide-react';
import { BilanPoint, bilanService } from '../services/bilanService';
import { lineString, buffer, simplify } from '@turf/turf';
import BilanMapComponent from './BilanMapComponent';

interface BilanCreationProps {
  serreId: number;
  serreName: string;
  serreLocation: { lat: number; lng: number };
  onBilanCreated: () => void;
  onCancel: () => void;
  isMobile?: boolean;
}

export default function BilanCreation({
  serreId,
  serreName,
  serreLocation,
  onBilanCreated,
  onCancel,
  isMobile = false,
}: BilanCreationProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<BilanPoint[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bilanName, setBilanName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(false);
  const [useCenterlineBuffer, setUseCenterlineBuffer] = useState<boolean>(false);
  const [rowWidthMeters, setRowWidthMeters] = useState<number>(0.8);
  const [creationMode, setCreationMode] = useState<'gps' | 'manual' | 'rectangleCenterline'>('manual');
  const [rectangleParams, setRectangleParams] = useState<{ length: number; width: number }>({ length: 10, width: 0.8 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const lastAcceptedPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const locationHistoryRef = useRef<{ lat: number; lng: number; timestamp: number }[]>([]);

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
    // Set default bilan name
    setBilanName(`Bilan ${serreName} - ${new Date().toLocaleDateString()}`);
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [serreName]);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      try {
        if (typeof window !== 'undefined' && 
            window.google && 
            window.google.maps && 
            typeof window.google.maps.Size === 'function' &&
            typeof window.google.maps.LatLng === 'function' &&
            typeof window.google.maps.Map === 'function') {
          // Add a small delay to ensure all libraries are fully loaded
          setTimeout(() => {
            // Double-check that everything is still available
            if (typeof window !== 'undefined' && 
                window.google && 
                window.google.maps && 
                typeof window.google.maps.Size === 'function' &&
                typeof window.google.maps.LatLng === 'function' &&
                typeof window.google.maps.Map === 'function') {
              setIsMapLoaded(true);
            } else {
              // If not available, retry
              setTimeout(checkGoogleMaps, 200);
            }
          }, 500);
        } else {
          // Retry after a short delay
          setTimeout(checkGoogleMaps, 200);
        }
      } catch (error) {
        console.warn('Error checking Google Maps availability:', error);
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 200);
      }
    };
    
    // Start checking after a short initial delay
    setTimeout(checkGoogleMaps, 100);
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError("Impossible d'obtenir votre position actuelle");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsTracking(true);
    setError(null);
    setSuccess("Suivi GPS activé. Marchez dans le champ pour créer votre bilan.");

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        // Basic filtering: ignore very low-quality readings (> 30m)
        if (typeof accuracy === 'number' && accuracy > 30) {
          return;
        }

        const newLocation = { lat: latitude, lng: longitude, accuracy };

        // Optional minimal movement threshold (2m) to reduce jitter
        const last = lastAcceptedPositionRef.current;
        if (last) {
          const movedMeters = haversineDistanceMeters(last, newLocation);
          if (movedMeters < 2) {
            // Too little movement; skip update
            return;
          }
        }

        lastAcceptedPositionRef.current = { lat: latitude, lng: longitude };
        setCurrentLocation(newLocation);
        
        // Add to history for path tracking
        locationHistoryRef.current.push({
          ...newLocation,
          timestamp: Date.now(),
        });

        // Keep only last 100 points to avoid memory issues
        if (locationHistoryRef.current.length > 100) {
          locationHistoryRef.current = locationHistoryRef.current.slice(-100);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
        setError("Erreur lors du suivi GPS");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSuccess("Suivi GPS arrêté");
  };

  const metersPerDegLat = 111320;
  const metersPerDegLng = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180) || 1e-9;

  function snapToGrid(lat: number, lng: number, gridMeters = 0.8) {
    const dLat = gridMeters / metersPerDegLat;
    const dLng = gridMeters / metersPerDegLng(lat);
    const snappedLat = Math.round(lat / dLat) * dLat;
    const snappedLng = Math.round(lng / dLng) * dLng;
    return { lat: snappedLat, lng: snappedLng };
  }

  function haversineDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  const addCurrentPosition = () => {
    if (!currentLocation) {
      setError("Position actuelle non disponible");
      return;
    }

    const base = { lat: currentLocation.lat, lng: currentLocation.lng };
    const p = snapEnabled ? snapToGrid(base.lat, base.lng, 0.8) : base;

    const newPoint: BilanPoint = {
      lat: p.lat,
      lng: p.lng,
      ordre: selectedPoints.length + 1,
    };

    setSelectedPoints(prev => [...prev, newPoint]);
    setSuccess(`Point ${newPoint.ordre} ajouté à la position actuelle`);
    setError(null);

    // Auto-stop tracking after 4 points
    if (selectedPoints.length + 1 >= 4) {
      stopTracking();
      setSuccess("4 points sélectionnés ! Vous pouvez maintenant créer le bilan.");
    }
  };

  const removeLastPoint = () => {
    if (selectedPoints.length > 0) {
      setSelectedPoints(prev => prev.slice(0, -1));
    }
  };

  const clearAllPoints = () => {
    setSelectedPoints([]);
  };

  const resetPoints = () => {
    setSelectedPoints([]);
  };

  // Manual map click handler: add point directly (with optional snapping)
  const handleMapClick = (lat: number, lng: number) => {
    if (creationMode !== 'manual') return;
    const base = { lat, lng };
    const p = snapEnabled ? snapToGrid(base.lat, base.lng, 0.8) : base;
    const newPoint: BilanPoint = { lat: p.lat, lng: p.lng, ordre: selectedPoints.length + 1 };
    setSelectedPoints(prev => [...prev, newPoint]);
  };

  // Rectangle from centerline: user clicks two points defining a centerline and length; we build a rectangle with width
  useEffect(() => {
    if (creationMode !== 'rectangleCenterline') return;
    // This mode relies on two first selected points defining the centerline
    if (selectedPoints.length === 2) {
      const [p1, p2] = selectedPoints;
      const rect = buildRectangleFromCenterline(p1, p2, rectangleParams.width);
      if (rect) {
        setSelectedPoints(rect);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoints.length, creationMode, rectangleParams.width]);

  function buildRectangleFromCenterline(p1: BilanPoint, p2: BilanPoint, widthMeters: number): BilanPoint[] | null {
    // Compute a perpendicular offset of half-width on both sides to create 4 corners
    const half = widthMeters / 2;
    const metersLng = metersPerDegLng((p1.lat + p2.lat) / 2);
    const dx = (p2.lng - p1.lng) * metersLng;
    const dy = (p2.lat - p1.lat) * metersPerDegLat;
    const len = Math.hypot(dx, dy) || 1e-9;
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular unit vector
    const px = -uy;
    const py = ux;
    // Half-width offsets in degrees
    const dLng = (px * half) / metersLng;
    const dLat = (py * half) / metersPerDegLat;
    // Build 4 corners around endpoints: p1-left, p2-left, p2-right, p1-right
    const c1 = { lat: p1.lat + dLat, lng: p1.lng + dLng };
    const c2 = { lat: p2.lat + dLat, lng: p2.lng + dLng };
    const c3 = { lat: p2.lat - dLat, lng: p2.lng - dLng };
    const c4 = { lat: p1.lat - dLat, lng: p1.lng - dLng };
    return [c1, c2, c3, c4].map((c, idx) => ({ lat: c.lat, lng: c.lng, ordre: idx + 1 }));
  }

  const calculateArea = (): number => {
    if (selectedPoints.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      area += selectedPoints[i].lat * selectedPoints[j].lng;
      area -= selectedPoints[j].lat * selectedPoints[i].lng;
    }
    return Math.abs(area) / 2 * 111000 * 111000; // Convert to square meters (approximate)
  };

  const calculateCenter = () => {
    if (selectedPoints.length === 0) return null;
    
    const avgLat = selectedPoints.reduce((sum, point) => sum + point.lat, 0) / selectedPoints.length;
    const avgLng = selectedPoints.reduce((sum, point) => sum + point.lng, 0) / selectedPoints.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const handleCreateBilan = () => {
    setShowConfirmation(true);
  };

  const createBilan = async () => {
    if (!bilanName.trim()) {
      setError("Veuillez entrer un nom pour le bilan");
      return;
    }

    let pointsToSend: BilanPoint[] = selectedPoints;

    // Option: Build polygon from tracked centerline using buffer (rowWidthMeters/2)
    if (creationMode === 'gps' && useCenterlineBuffer) {
      const history = locationHistoryRef.current.map(p => [p.lat, p.lng]) as [number, number][];
      if (history.length < 2) {
        setError("Parcours insuffisant pour générer le polygone. Marchez davantage avant de créer le bilan.");
        return;
      }

      try {
        // Build line from history (lat,lng) → GeoJSON expects [lng,lat]
        const line = lineString(history.map(([lat, lng]) => [lng, lat]));
        const halfWidth = Math.max(0.1, rowWidthMeters / 2);
        const buffered = buffer(line, halfWidth, { units: 'meters' });
        const simplified = simplify(buffered, { tolerance: 0.05, highQuality: false });
        const geom: any = simplified.geometry;
        const coords: number[][][] = geom.type === 'Polygon' ? geom.coordinates : (geom.type === 'MultiPolygon' ? geom.coordinates[0] : []);
        const ring: number[][] = coords && coords[0] ? coords[0] : [];
        if (!ring || ring.length < 3) {
          setError("Impossible de générer un polygone valide à partir du parcours.");
          return;
        }
        pointsToSend = ring.map(([lng, lat], idx) => ({ lat, lng, ordre: idx + 1 }));
      } catch (e: any) {
        setError("Erreur lors de la génération du polygone à partir du parcours");
        return;
      }
    } else if (creationMode === 'manual' || creationMode === 'rectangleCenterline') {
      if (selectedPoints.length < 3) {
        setError("Vous devez sélectionner au moins 3 points pour créer un bilan");
        return;
      }
    }

    setIsCreating(true);
    setError(null);
    setShowConfirmation(false);

    try {
      const bilanData = {
        name: bilanName.trim(),
        id_serre: serreId,
        position: pointsToSend,
        area: calculateArea(),
        center: calculateCenter() || undefined,
      };

      await bilanService.createBilan(bilanData);
      setSuccess("Bilan créé avec succès !");
      
      // Wait a moment to show success message
      setTimeout(() => {
        onBilanCreated();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating bilan:', error);
      setError(error.message || "Erreur lors de la création du bilan");
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateBilan = selectedPoints.length >= 3 && !isCreating && bilanName.trim();

  // Debug logging
  useEffect(() => {
    console.log('BilanCreation Debug:', {
      selectedPoints: selectedPoints.length,
      isCreating,
      bilanName: bilanName.trim(),
      canCreateBilan,
      hasName: !!bilanName.trim(),
      hasPoints: selectedPoints.length >= 3
    });
  }, [selectedPoints.length, isCreating, bilanName, canCreateBilan]);

  return (
    <>
      {isMobile ? (
        // Mobile Layout - Full Screen with Touch-Friendly Controls
        <div className="h-full flex flex-col bg-white">
          {/* Mobile Header */}
          <div className="bg-[#B4CC5F] text-white p-4 shadow-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-white" />
                <div>
                  <h1 className="text-lg font-semibold">Création de Bilan</h1>
                  <p className="text-sm text-white/90">{serreName}</p>
                </div>
              </div>
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-white/20 text-white"
                disabled={isCreating}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Map Section - Takes most of the screen */}
            <div className="flex-1 min-h-0">
              {!isMapLoaded ? (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B4CC5F] mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Chargement de la carte...</p>
                  </div>
                </div>
              ) : (
                <BilanMapComponent
                  serreLocation={serreLocation}
                  selectedPoints={selectedPoints}
                  currentLocation={currentLocation}
                  isTracking={isTracking}
                  className="h-full"
                  onMapClick={handleMapClick}
                />
              )}
            </div>

            {/* Mobile Control Panel - Collapsible from bottom */}
            <div className="bg-white border-t border-gray-200 shadow-lg">
              {/* Control Panel Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Contrôles</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs">
                      GPS: {currentLocation ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={isTracking ? "default" : "secondary"} className="text-xs">
                      Suivi: {isTracking ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Control Panel Content */}
              <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                {/* Bilan Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="bilanName" className="text-sm font-medium">Nom du bilan *</Label>
                  <Input
                    id="bilanName"
                    value={bilanName}
                    onChange={(e) => setBilanName(e.target.value)}
                    placeholder="Ex: Bilan Nord-Est - Juin 2024"
                    className="w-full"
                  />
                </div>

                {/* GPS Controls */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Contrôles GPS</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {!isTracking ? (
                      <Button 
                        onClick={startTracking}
                        className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                        disabled={!currentLocation}
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Démarrer
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopTracking}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Arrêter
                      </Button>
                    )}
                    
                    <Button 
                      onClick={getCurrentLocation}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </div>

                {/* Point Management */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Points du bilan</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Points collectés:</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedPoints.length}/4
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={addCurrentPosition}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!currentLocation || !isTracking || selectedPoints.length >= 4}
                        size="sm"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                      
                      <Button 
                        onClick={removeLastPoint}
                        variant="outline"
                        size="sm"
                        disabled={selectedPoints.length === 0}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress and Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression:</span>
                    <span className="font-medium">{Math.round((selectedPoints.length / 4) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#B4CC5F] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedPoints.length / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Create Bilan Button */}
                <Button 
                  onClick={handleCreateBilan}
                  className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white h-12 text-base font-medium"
                  disabled={!canCreateBilan}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {isCreating ? "Création en cours..." : "Créer le Bilan"}
                </Button>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout - Original Modal Design
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full h-full max-w-none sm:max-w-6xl sm:max-h-[90vh] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-bold truncate">Création de Bilan GPS</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-normal truncate">
                      Serre: {serreName} • Marchez dans le champ pour marquer les positions
                    </div>
                  </div>
                </CardTitle>
                
                {/* Close Button */}
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0 ml-2"
                  disabled={isCreating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 flex-1 min-h-0">
                {/* Left Panel - Controls and Status */}
                <div className="lg:col-span-1 border-r border-b lg:border-b-0 bg-gray-50 flex flex-col overflow-hidden">
                  {/* Scrollable Content Area */}
                  <div 
                    className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 border-l-2 border-blue-200"
                    style={{
                      maxHeight: 'calc(100vh - 200px)',
                      minHeight: '400px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#CBD5E0 #F7FAFC',
                      WebkitOverflowScrolling: 'touch',
                      msOverflowStyle: 'auto'
                    }}
                  >
                    {/* Scroll Indicator */}
                    <div className="sticky top-0 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-3 text-center z-10">
                      📜 Zone défilable - Utilisez la molette ou les flèches pour naviguer
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6 pb-4">
                      {/* Bilan Name Input */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg">Nom du Bilan</h3>
                        <div className="space-y-2">
                          <Label htmlFor="bilanName" className="text-sm sm:text-base">Nom *</Label>
                          <Input
                            id="bilanName"
                            value={bilanName}
                            onChange={(e) => setBilanName(e.target.value)}
                            placeholder="Ex: Bilan Nord-Est - Juin 2024"
                            className="w-full text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* GPS Status */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                          Statut GPS
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Position actuelle:</span>
                            <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs">
                              {currentLocation ? "Disponible" : "Non disponible"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Suivi actif:</span>
                            <Badge variant={isTracking ? "default" : "secondary"} className="text-xs">
                              {isTracking ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>

                        {currentLocation && (
                          <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                            Lat: {currentLocation.lat.toFixed(6)}<br />
                            Lng: {currentLocation.lng.toFixed(6)}
                            {currentLocation.accuracy !== undefined && (
                              <>
                                <br />
                                Précision: ±{Math.round(currentLocation.accuracy)} m
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* GPS Controls */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg">Contrôles</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {!isTracking ? (
                            <Button 
                              onClick={startTracking}
                              className="w-full text-xs sm:text-sm"
                              disabled={!currentLocation}
                              size="sm"
                            >
                              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Démarrer
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopTracking}
                              variant="outline"
                              className="w-full text-xs sm:text-sm"
                              size="sm"
                            >
                              <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Arrêter
                            </Button>
                          )}
                          
                          <Button 
                            onClick={getCurrentLocation}
                            variant="outline"
                            className="w-full text-xs sm:text-sm"
                            size="sm"
                          >
                            <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Actualiser
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Point Management */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg">Gestion des Points</h3>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              onClick={addCurrentPosition}
                              className="w-full text-xs sm:text-sm"
                              disabled={creationMode !== 'gps' || !currentLocation || !isTracking || selectedPoints.length >= 4}
                              size="sm"
                            >
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Ajouter (GPS)
                            </Button>
                            <Button 
                              onClick={() => setCreationMode(m => m === 'manual' ? 'gps' : 'manual')}
                              variant="outline"
                              className="w-full text-xs sm:text-sm"
                              size="sm"
                            >
                              <Move className="h-3 w-3 mr-1" />
                              Mode: {creationMode === 'manual' ? 'Manuel' : 'GPS'}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              onClick={removeLastPoint}
                              variant="outline"
                              size="sm"
                              disabled={selectedPoints.length === 0}
                              className="text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Annuler dernier
                            </Button>
                            <Button 
                              onClick={clearAllPoints}
                              variant="outline"
                              size="sm"
                              disabled={selectedPoints.length === 0}
                              className="text-xs"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Tout effacer
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Advanced Options */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg">Options avancées</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="snapEnabled"
                              checked={snapEnabled}
                              onChange={(e) => setSnapEnabled(e.target.checked)}
                              className="rounded border-gray-300 text-[#B4CC5F] focus:ring-[#B4CC5F]"
                            />
                            <Label htmlFor="snapEnabled" className="text-sm">Aligner sur grille 0,8 m</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="useCenterlineBuffer"
                              checked={useCenterlineBuffer}
                              onChange={(e) => setUseCenterlineBuffer(e.target.checked)}
                              className="rounded border-gray-300 text-[#B4CC5F] focus:ring-[#B4CC5F]"
                            />
                            <Label htmlFor="useCenterlineBuffer" className="text-sm">Rectangle (centre + largeur)</Label>
                          </div>
                          
                          {useCenterlineBuffer && (
                            <div className="pl-6 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="rowWidthMeters" className="text-xs">Largeur (m)</Label>
                                  <Input
                                    id="rowWidthMeters"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10"
                                    value={rowWidthMeters}
                                    onChange={(e) => setRowWidthMeters(parseFloat(e.target.value))}
                                    className="w-full text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="rectangleLength" className="text-xs">Longueur (m)</Label>
                                  <Input
                                    id="rectangleLength"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="100"
                                    value={rectangleParams.length}
                                    onChange={(e) => setRectangleParams(prev => ({ ...prev, length: parseFloat(e.target.value) }))}
                                    className="w-full text-xs"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                Cliquez 2 points sur la carte (ligne centrale)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Debug Information */}
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="font-semibold text-base sm:text-lg">Informations de débogage</h3>
                        
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>• Points sélectionnés: {selectedPoints.length}</div>
                            <div>• Création en cours: {isCreating ? 'Oui' : 'Non'}</div>
                            <div>• Nom saisi: {bilanName ? '✅' : '❌'} "{bilanName}"</div>
                            <div>• Peut créer: {canCreateBilan ? '✅ Oui' : '❌ Non'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions - Always at the bottom */}
                      <div className="space-y-3 pt-2">
                        {/* Create Bilan Button */}
                        <Button 
                          onClick={handleCreateBilan}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={!canCreateBilan}
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {isCreating ? "Création en cours..." : "Créer le Bilan"}
                        </Button>
                        
                        {/* Alternative Save Button */}
                        <Button 
                          onClick={handleCreateBilan}
                          variant="outline"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50"
                          disabled={!canCreateBilan}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Sauvegarder le Bilan
                        </Button>
                        
                        {/* Test Button - Direct Creation */}
                        <Button 
                          onClick={() => {
                            if (canCreateBilan) {
                              createBilan();
                            } else {
                              setError("Conditions non remplies pour créer le bilan");
                            }
                          }}
                          variant="secondary"
                          className="w-full"
                          size="sm"
                        >
                          🧪 Test - Créer Directement
                        </Button>
                        
                        {/* Cancel Button */}
                        <Button 
                          onClick={onCancel}
                          variant="outline"
                          className="w-full"
                          disabled={isCreating}
                        >
                          Annuler
                        </Button>
                      </div>

                      {/* Messages */}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                      
                      {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-600">{success}</p>
                        </div>
                      )}

                      {/* Spacer to ensure buttons are reachable */}
                      <div className="h-4"></div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Map */}
                <div className="lg:col-span-2 h-full min-h-[300px] sm:min-h-[400px]">
                  {!isMapLoaded ? (
                    <Card className="h-full">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Chargement de Google Maps...</p>
                          <p className="text-xs text-gray-500 mt-1">Veuillez patienter pendant le chargement</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Vérification de l'API Google Maps...</p>
                            <p>Chargement des bibliothèques...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <BilanMapComponent
                      serreLocation={serreLocation}
                      selectedPoints={selectedPoints}
                      currentLocation={currentLocation}
                      isTracking={isTracking}
                      className="h-full"
                      onMapClick={handleMapClick}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création du bilan</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir créer le bilan "{bilanName}" ?
              <br /><br />
              <strong>Détails du bilan :</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Serre : {serreName}</li>
                <li>• Points sélectionnés : {selectedPoints.length}/4</li>
                <li>• Surface estimée : {calculateArea().toFixed(1)} m²</li>
                <li>• Nom : {bilanName}</li>
              </ul>
              <br />
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={createBilan}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? "Création..." : "Créer le Bilan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
