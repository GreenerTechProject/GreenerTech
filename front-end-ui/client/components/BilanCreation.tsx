import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  isMobile = false
}: BilanCreationProps) {
  const [bilanName, setBilanName] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<BilanPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Mobile panel resize state
  const [mobilePanelHeight, setMobilePanelHeight] = useState(250);
  const [isResizingMobile, setIsResizingMobile] = useState(false);
  
  // Advanced options state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(false);
  const [useCenterlineBuffer, setUseCenterlineBuffer] = useState<boolean>(false);
  const [rowWidthMeters, setRowWidthMeters] = useState<number>(0.8);
  const [creationMode, setCreationMode] = useState<'gps' | 'manual' | 'rectangleCenterline'>('manual');
  const [rectangleParams, setRectangleParams] = useState<{ length: number; width: number }>({ length: 10, width: 0.8 });
  
  // Mobile panel resize handlers
  const handleMobileResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsResizingMobile(true);
    e.preventDefault();
  };

  const handleMobileResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizingMobile) return;
    
    let clientY: number;
    if (e instanceof MouseEvent) {
      clientY = e.clientY;
    } else {
      clientY = e.touches[0].clientY;
    }
    
    const windowHeight = window.innerHeight;
    const newHeight = windowHeight - clientY;
    
    // Constrain height between 200px and 80% of viewport
    const constrainedHeight = Math.max(200, Math.min(newHeight, windowHeight * 0.8));
    setMobilePanelHeight(constrainedHeight);
  }, [isResizingMobile]);

  const handleMobileResizeEnd = useCallback(() => {
    setIsResizingMobile(false);
  }, []);

  // Add/remove resize event listeners
  useEffect(() => {
    if (isResizingMobile) {
      document.addEventListener('mousemove', handleMobileResizeMove);
      document.addEventListener('mouseup', handleMobileResizeEnd);
      document.addEventListener('touchmove', handleMobileResizeMove);
      document.addEventListener('touchend', handleMobileResizeEnd);
    } else {
      document.removeEventListener('mousemove', handleMobileResizeMove);
      document.removeEventListener('mouseup', handleMobileResizeEnd);
      document.removeEventListener('touchmove', handleMobileResizeMove);
      document.removeEventListener('touchend', handleMobileResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMobileResizeMove);
      document.removeEventListener('mouseup', handleMobileResizeEnd);
      document.removeEventListener('touchmove', handleMobileResizeMove);
      document.removeEventListener('touchend', handleMobileResizeEnd);
    };
  }, [isResizingMobile, handleMobileResizeMove, handleMobileResizeEnd]);
  
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPanelOpen) {
          setIsPanelOpen(false);
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, onCancel]);

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
      isMobile,
      selectedPoints: selectedPoints.length,
      isCreating,
      bilanName: bilanName.trim(),
      canCreateBilan,
      hasName: !!bilanName.trim(),
      hasPoints: selectedPoints.length >= 3
    });
  }, [isMobile, selectedPoints.length, isCreating, bilanName, canCreateBilan]);

  return (
    <>
      {isMobile ? (
        // Mobile Layout - Fullscreen Map with Bottom Sheet
        <div className="h-full flex flex-col bg-white relative overflow-hidden">
          {/* Mobile Header - Floating */}
          <div className="absolute top-2 left-2 right-2 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-[#B4CC5F]" />
                <div>
                    <h1 className="text-sm font-semibold text-gray-900">Création de Bilan GPS</h1>
                    <p className="text-xs text-gray-600">{serreName}</p>
                </div>
              </div>
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-700"
                disabled={isCreating}
              >
                  <X className="h-4 w-4" />
              </Button>
              </div>
            </div>
          </div>

          {/* Fullscreen Map - Takes remaining space */}
          <div className="flex-1 w-full min-h-0 relative pb-4">
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
                className="h-full w-full"
                  onMapClick={handleMapClick}
                />
              )}
            </div>

          {/* Mobile Control Panel - Fixed at Bottom, Stretchable */}
          <div 
            className="bg-white border-t-2 border-[#B4CC5F] shadow-2xl rounded-t-3xl flex-shrink-0 relative z-30 ring-1 ring-gray-200/50 transition-all duration-200 ease-out"
            style={{ height: `${mobilePanelHeight}px` }}
          >
            {/* Drag Handle - Resizable */}
            <div 
              className={`flex justify-center pt-3 pb-2 cursor-ns-resize select-none transition-colors ${
                isResizingMobile ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onMouseDown={handleMobileResizeStart}
              onTouchStart={handleMobileResizeStart}
            >
              <div className={`w-16 h-1.5 rounded-full transition-all duration-200 ${
                isResizingMobile 
                  ? 'bg-[#B4CC5F] scale-110' 
                  : 'bg-[#B4CC5F] hover:bg-[#B4CC5F]/80'
              }`}></div>
              {isResizingMobile && (
                <div className="absolute top-1 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                  {mobilePanelHeight}px
                </div>
              )}
              {/* Reset Size Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobilePanelHeight(250);
                }}
                className="absolute top-1 left-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm hover:bg-gray-50 transition-colors"
                title="Reset to default size"
              >
                ↺
              </button>
            </div>
            
            {/* Control Panel Header - Always Visible */}
            <div className="px-4 pb-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-[#B4CC5F]" />
                  <h3 className="font-semibold text-gray-900 text-base">Contrôles Bilan GPS</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {Math.round(mobilePanelHeight)}px
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs bg-green-100 text-green-800">
                      GPS: {currentLocation ? "✓" : "✗"}
                    </Badge>
                  <Badge variant={isTracking ? "default" : "secondary"} className="text-xs bg-blue-100 text-blue-800">
                      Suivi: {isTracking ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

            {/* Control Panel Content - Scrollable */}
            <ScrollArea className="flex-1 h-[calc(100%-80px)] px-4">
              <div className="py-4 space-y-4">
                {/* Bilan Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="bilanName" className="text-sm font-medium text-gray-700">Nom du bilan *</Label>
                  <Input
                    id="bilanName"
                    value={bilanName}
                    onChange={(e) => setBilanName(e.target.value)}
                    placeholder="Ex: Bilan Nord-Est - Juin 2024"
                    className="w-full border-gray-300 focus:border-[#B4CC5F] focus:ring-[#B4CC5F]"
                  />
                </div>

                {/* GPS Controls */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-gray-700">
                    <Navigation className="h-4 w-4" />
                    Contrôles GPS
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {!isTracking ? (
                      <Button 
                        onClick={startTracking}
                        className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white text-xs"
                        disabled={!currentLocation}
                        size="sm"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Démarrer
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopTracking}
                        variant="outline"
                        className="w-full text-xs"
                        size="sm"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Arrêter
                      </Button>
                    )}
                    
                    <Button 
                      onClick={getCurrentLocation}
                      variant="outline"
                      className="w-full text-xs"
                      size="sm"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Actualiser
                    </Button>
                  </div>
                </div>

                {/* Point Management */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    Points du bilan
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Points collectés:</span>
                      <span className="font-medium">{selectedPoints.length}/4</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={addCurrentPosition}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        disabled={!currentLocation || !isTracking || selectedPoints.length >= 4}
                        size="sm"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                      
                      <Button 
                        onClick={removeLastPoint}
                        variant="outline"
                        size="sm"
                        disabled={selectedPoints.length === 0}
                        className="w-full text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress and Status */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progression:</span>
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
                  className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white font-medium"
                  disabled={!canCreateBilan}
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isCreating ? "Création..." : "Créer le Bilan"}
                </Button>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-600">{success}</p>
                  </div>
                )}

                {/* Scroll Indicator */}
                <div className="flex justify-center pt-2 pb-4">
                  <div className="w-8 h-1 bg-gray-300 rounded-full opacity-50"></div>
              </div>
            </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        // Desktop Layout - Fullscreen Map with Floating Panel
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
          <Card className="w-full h-full max-w-none overflow-hidden relative">
            {/* Floating Control Panel - Hidden on very small screens */}
            <div 
              className={`absolute top-2 sm:top-4 left-2 sm:left-4 z-20 transition-all duration-300 ease-in-out ${
                isPanelOpen ? 'translate-x-0' : '-translate-x-full'
              } hidden sm:block`}
            >
              <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[280px] sm:w-[320px] md:w-[350px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(95vh-2rem)] overflow-hidden">
                {/* Panel Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">Contrôles Bilan GPS</h3>
                        <p className="text-xs text-gray-600 truncate">{serreName}</p>
                        <p className="text-xs text-gray-500 mt-1 hidden sm:block">Appuyez sur Échap pour fermer</p>
                    </div>
                  </div>
                <Button
                      onClick={() => setIsPanelOpen(false)}
                  variant="ghost"
                  size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200 rounded-full flex-shrink-0 ml-2"
                      title="Fermer le panneau (Échap)"
                >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
                    </div>
                    
                {/* Panel Content */}
                <ScrollArea className="h-[calc(100vh-140px)] sm:h-[calc(95vh-120px)]">
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {/* Bilan Name Input */}
                        <div className="space-y-2">
                      <Label htmlFor="bilanName" className="text-sm font-medium">Nom du Bilan *</Label>
                          <Input
                            id="bilanName"
                            value={bilanName}
                            onChange={(e) => setBilanName(e.target.value)}
                            placeholder="Ex: Bilan Nord-Est - Juin 2024"
                        className="w-full"
                          />
                      </div>

                      <Separator />

                      {/* GPS Status */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                          Statut GPS
                      </h4>
                        
                        <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Position:</span>
                            <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs">
                            {currentLocation ? "✓" : "✗"}
                            </Badge>
                          </div>
                          
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Suivi:</span>
                            <Badge variant={isTracking ? "default" : "secondary"} className="text-xs">
                              {isTracking ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>

                        {currentLocation && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
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
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Contrôles GPS</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {!isTracking ? (
                            <Button 
                              onClick={startTracking}
                            className="w-full text-xs"
                              disabled={!currentLocation}
                              size="sm"
                            >
                            <Play className="h-3 w-3 mr-1" />
                              Démarrer
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopTracking}
                              variant="outline"
                            className="w-full text-xs"
                              size="sm"
                            >
                            <Pause className="h-3 w-3 mr-1" />
                              Arrêter
                            </Button>
                          )}
                          
                          <Button 
                            onClick={getCurrentLocation}
                            variant="outline"
                          className="w-full text-xs"
                            size="sm"
                          >
                          <Target className="h-3 w-3 mr-1" />
                            Actualiser
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Point Management */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Points du bilan</h4>
                        
                        <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Points collectés:</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedPoints.length}/4
                          </Badge>
                        </div>
                        
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              onClick={addCurrentPosition}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            disabled={!currentLocation || !isTracking || selectedPoints.length >= 4}
                              size="sm"
                            >
                            <MapPin className="h-3 w-3 mr-1" />
                            Ajouter
                            </Button>
                          
                            <Button 
                              onClick={removeLastPoint}
                              variant="outline"
                              size="sm"
                              disabled={selectedPoints.length === 0}
                            className="w-full text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                            Annuler
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Advanced Options */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Options avancées</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="snapEnabled"
                              checked={snapEnabled}
                              onChange={(e) => setSnapEnabled(e.target.checked)}
                              className="rounded border-gray-300 text-[#B4CC5F] focus:ring-[#B4CC5F]"
                            />
                          <Label htmlFor="snapEnabled" className="text-xs">Aligner sur grille 0,8 m</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="useCenterlineBuffer"
                              checked={useCenterlineBuffer}
                              onChange={(e) => setUseCenterlineBuffer(e.target.checked)}
                              className="rounded border-gray-300 text-[#B4CC5F] focus:ring-[#B4CC5F]"
                            />
                          <Label htmlFor="useCenterlineBuffer" className="text-xs">Rectangle (centre + largeur)</Label>
                          </div>
                          
                          {useCenterlineBuffer && (
                          <div className="pl-4 space-y-2">
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
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                    {/* Progress and Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
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
                      className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                          disabled={!canCreateBilan}
                      size="sm"
                        >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isCreating ? "Création..." : "Créer le Bilan"}
                        </Button>
                        
                    {/* Messages */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs text-red-600">{error}</p>
                      </div>
                    )}
                    
                    {success && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-xs text-green-600">{success}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Panel Toggle Button - Hidden on very small screens */}
            {!isPanelOpen && (
                        <Button 
                onClick={() => setIsPanelOpen(true)}
                className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-lg transition-all duration-200 hover:shadow-xl hidden sm:block"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ouvrir</span>
              </Button>
            )}

            {/* Mobile Control Panel for Very Small Screens - Enhanced */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-white border-t-2 border-[#B4CC5F] shadow-2xl rounded-t-3xl max-h-[70vh] overflow-hidden">
              {/* Drag Handle - More Prominent */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-16 h-1.5 bg-[#B4CC5F] rounded-full"></div>
              </div>
              
              {/* Control Panel Header - Enhanced */}
              <div className="px-4 pb-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-[#B4CC5F]" />
                    <h3 className="font-semibold text-gray-900 text-base">Contrôles Bilan GPS</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs bg-green-100 text-green-800">
                      GPS: {currentLocation ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={isTracking ? "default" : "secondary"} className="text-xs bg-blue-100 text-blue-800">
                      Suivi: {isTracking ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Control Panel Content - Enhanced */}
              <ScrollArea className="max-h-[50vh] min-h-[200px]">
                <div className="p-4 space-y-4">
                  {/* Bilan Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="bilanNameMobile" className="text-sm font-medium text-gray-700">Nom du bilan *</Label>
                    <Input
                      id="bilanNameMobile"
                      value={bilanName}
                      onChange={(e) => setBilanName(e.target.value)}
                      placeholder="Ex: Bilan Nord-Est - Juin 2024"
                      className="w-full border-gray-300 focus:border-[#B4CC5F] focus:ring-[#B4CC5F]"
                    />
                  </div>

                  {/* GPS Controls */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      Contrôles GPS
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {!isTracking ? (
                        <Button 
                          onClick={startTracking}
                          className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white font-medium"
                          disabled={!currentLocation}
                          size="sm"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Démarrer
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopTracking}
                          variant="outline"
                          className="w-full border-[#B4CC5F] text-[#B4CC5F] hover:bg-[#B4CC5F]/10 font-medium"
                          size="sm"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Arrêter
                        </Button>
                      )}
                        
                        <Button 
                        onClick={getCurrentLocation}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                          size="sm"
                        >
                        <Target className="h-3 w-3 mr-1" />
                        Actualiser
                        </Button>
                    </div>
                  </div>

                  {/* Point Management */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Points du bilan
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Points collectés:</span>
                        <Badge variant="outline" className="text-xs border-[#B4CC5F] text-[#B4CC5F]">
                          {selectedPoints.length}/4
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={addCurrentPosition}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          disabled={!currentLocation || !isTracking || selectedPoints.length >= 4}
                          size="sm"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                        
                        <Button 
                          onClick={removeLastPoint}
                          variant="outline"
                          size="sm"
                          disabled={selectedPoints.length === 0}
                          className="w-full text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                      </div>

                  {/* Progress and Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Progression:</span>
                      <span className="font-semibold text-[#B4CC5F]">{Math.round((selectedPoints.length / 4) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#B4CC5F] h-3 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${(selectedPoints.length / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Create Bilan Button */}
                  <Button 
                    onClick={handleCreateBilan}
                    className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white h-10 text-sm font-semibold shadow-lg"
                    disabled={!canCreateBilan}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCreating ? "Création..." : "Créer le Bilan"}
                  </Button>

                  {/* Error/Success Messages */}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-600">{error}</p>
                        </div>
                      )}
                      
                      {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-xs text-green-600">{success}</p>
                        </div>
                      )}
                </div>
              </ScrollArea>
            </div>

            {/* Close Button - Top Right */}
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-white/20 bg-white/80 text-gray-700 border border-gray-200 shadow-lg"
              disabled={isCreating}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Floating Header for Very Small Screens */}
            <div className="sm:hidden absolute top-2 left-2 right-2 z-20">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-[#B4CC5F]" />
                    <div>
                      <h1 className="text-sm font-semibold text-gray-900">Création de Bilan</h1>
                      <p className="text-xs text-gray-600">{serreName}</p>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>

            {/* Fullscreen Map */}
            <div className="absolute inset-0 transition-all duration-300 ease-in-out">
                  {!isMapLoaded ? (
                <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B4CC5F] mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Chargement de Google Maps...</p>
                          <p className="text-xs text-gray-500 mt-1">Veuillez patienter pendant le chargement</p>
                          </div>
                        </div>
                  ) : (
                    <BilanMapComponent
                      serreLocation={serreLocation}
                      selectedPoints={selectedPoints}
                      currentLocation={currentLocation}
                      isTracking={isTracking}
                  className="h-full w-full"
                      onMapClick={handleMapClick}
                    />
                  )}
                </div>
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
