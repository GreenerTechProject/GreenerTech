import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Alert } from '@/types/alert';
import { AlertService } from '@/services/alertService';
import { bilanService, Bilan } from '@/services/bilanService';
import { AlertTriangle, MapPin, Circle as CircleIcon, Clock, Image as ImageIcon, Search, RefreshCw, Target, MapPin as MapPinIcon, Flame, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertHeatmapOverlayProps {
  serreId: number;
  serreName: string;
  serreLocation: { lat: number; lng: number };
  map?: google.maps.Map | null;
  onAlertClick?: (alert: Alert) => void;
  onInterventionClick?: (alert: Alert) => void;
}

interface AlertMarker {
  id: number;
  position: google.maps.LatLng;
  alert: Alert;
  bilan: Bilan | null;
  weight: number;
  level: 'Faible' | 'Moyenne' | 'Dangereux';
}

interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
}

export default function AlertHeatmapOverlay({
  serreId,
  serreName,
  serreLocation,
  map,
  onAlertClick,
  onInterventionClick
}: AlertHeatmapOverlayProps) {
  console.log('AlertHeatmapOverlay rendered with props:', {
    serreId,
    serreName,
    serreLocation,
    map: !!map,
    onAlertClick: !!onAlertClick,
    onInterventionClick: !!onInterventionClick
  });
  
  // This component creates a modern heatmap overlay for alerts in a selected serre
  // Optimized for clarity over satellite/terrain backgrounds with custom gradient colors
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for the native heatmap
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Modern alert level mapping based on status_alerte field
  const getAlertLevel = (statusAlerte: number): 'Faible' | 'Moyenne' | 'Dangereux' => {
    switch (statusAlerte) {
      case 0:
        return 'Faible';
      case 1:
        return 'Moyenne';
      case 2:
        return 'Dangereux';
      default:
        return 'Faible'; // Fallback to low priority
    }
  };

  // Get weight based on alert level for heatmap intensity
  const getAlertWeight = (statusAlerte: number): number => {
    switch (statusAlerte) {
      case 0: // Faible
        return 1; // Low weight for subtle visibility
      case 1: // Moyenne
        return 3; // Medium weight for moderate visibility
      case 2: // Dangereux
        return 12; // Very high weight for critical alerts - maximum emphasis
      default:
        return 1;
    }
  };

  // Get color by alert level for markers and fallback visualization
  const getAlertLevelColor = (statusAlerte: number): string => {
    switch (statusAlerte) {
      case 0: // Faible
        return '#32CD32'; // Light green
      case 1: // Moyenne
        return '#FFA500'; // Orange
      case 2: // Dangereux
        return '#DC143C'; // Crimson
      default:
        return '#32CD32';
    }
  };

  // Get background color for alert level badges
  const getAlertLevelBgColor = (statusAlerte: number): string => {
    switch (statusAlerte) {
      case 0: // Faible
        return 'bg-green-100 text-green-800 border-green-200';
      case 1: // Moyenne
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 2: // Dangereux
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Utility function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Function to convert normalized coordinates (0-1) to actual map coordinates
  const convertNormalizedToMapCoordinates = (normalizedX: number, normalizedY: number) => {
    // Define a bounding box around the serre (adjust these values as needed)
    const boundingBoxSize = 0.01; // About 1km in degrees
    
    const minLat = serreLocation.lat - boundingBoxSize / 2;
    const maxLat = serreLocation.lat + boundingBoxSize / 2;
    const minLng = serreLocation.lng - boundingBoxSize / 2;
    const maxLng = serreLocation.lng + boundingBoxSize / 2;
    
    // Convert normalized coordinates to actual coordinates
    const actualLat = minLat + (normalizedY * (maxLat - minLat));
    const actualLng = minLng + (normalizedX * (maxLng - minLng));
    
    return { lat: actualLat, lng: actualLng };
  };

  // Function to create native Google Maps heatmap with custom gradient
  const createNativeHeatmap = useCallback((map: google.maps.Map, points: HeatmapPoint[]) => {
    console.log('[AlertHeatmapOverlay] Creating heatmap with points:', points.length);
    
    // Check if visualization library is available
    if (!google.maps.visualization || !google.maps.visualization.HeatmapLayer) {
      console.error('[AlertHeatmapOverlay] Google Maps visualization library not available');
      return;
    }
    
    // Clean up existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    if (points.length === 0) {
      console.log('[AlertHeatmapOverlay] No points to create heatmap');
      return;
    }

    try {
      console.log('[AlertHeatmapOverlay] Creating heatmap layer...');
      
      // Create heatmap data in the format expected by Google Maps
      const heatmapData = points.map(point => ({
        location: point.location,
        weight: point.weight
      }));

      // Create the heatmap layer with enhanced visibility settings
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 200, // Increased radius for better visibility
        opacity: 0.95, // Higher opacity for better visibility over satellite
        maxIntensity: 15, // Increased max intensity to accommodate higher dangerous alert weights
        gradient: [
          'rgba(0, 0, 0, 0)',              // No data = transparent
          'rgba(50, 205, 50, 0.6)',        // Faible (status 0) - more visible green
          'rgba(255, 165, 0, 1.0)',        // Moyenne (status 1) - fully visible orange
          'rgba(220, 20, 60, 1.0)',        // Dangereux (status 2) - very visible crimson
          'rgba(220, 20, 60, 1.0)',        // Dangereux (status 2) - extra emphasis
          'rgba(139, 0, 0, 1.0)'           // Dangereux (status 2) - dark red for maximum visibility
        ],
        dissipating: false // Disable dissipating for more consistent visibility
      });
      
      console.log('[AlertHeatmapOverlay] Heatmap created successfully');
      
      // Add zoom level listener to adjust heatmap visibility
      const zoomListener = map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom < 14) {
          // At low zoom levels, reduce opacity but keep it visible
          heatmap.setOptions({ opacity: 0.6 });
        } else {
          // At higher zoom levels, show full opacity for satellite clarity
          heatmap.setOptions({ opacity: 0.95 });
        }
      });
      
      // Store the listener for cleanup
      (heatmap as any).zoomListener = zoomListener;
      
      heatmapRef.current = heatmap;
      
      // Force a redraw to ensure visibility
      setTimeout(() => {
        if (heatmapRef.current) {
          heatmapRef.current.setMap(map);
          console.log('[AlertHeatmapOverlay] Heatmap redrawn');
        }
      }, 100);
      
    } catch (error) {
      console.error('[AlertHeatmapOverlay] Heatmap creation failed:', error);
    }
  }, []);

  // Load alerts and bilans for the serre
  useEffect(() => {
    console.log(`[AlertHeatmapOverlay] Loading data for serre ${serreId}`);
    
    const loadSerreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load bilans for the serre
        let serreBilans: Bilan[] = [];
        try {
          const bilansResponse = await bilanService.getBilansBySerre(serreId);
          console.log(`[AlertHeatmapOverlay] Loaded ${Array.isArray(bilansResponse) ? bilansResponse.length : 0} bilans`);
          
          // Ensure we have an array of bilans
          if (Array.isArray(bilansResponse)) {
            serreBilans = bilansResponse;
          } else if (bilansResponse && typeof bilansResponse === 'object' && 'bilans' in bilansResponse && Array.isArray((bilansResponse as any).bilans)) {
            serreBilans = (bilansResponse as any).bilans;
          } else {
            serreBilans = [];
          }
        } catch (bilanError) {
          console.error(`[AlertHeatmapOverlay] Error loading bilans:`, bilanError);
          serreBilans = [];
        }
        
        setBilans(serreBilans);

        // Load alerts for the serre (filter by bilan IDs)
        let allAlerts;
        let serreAlerts: Alert[] = [];
        
        try {
          allAlerts = await AlertService.getAllAlerts(1, 1000);
          console.log(`🚨 [AlertHeatmapOverlay] Loaded ${allAlerts?.alerts?.length || 0} total alerts`);
          
          // Check if the response has the expected structure
          if (allAlerts && allAlerts.alerts && Array.isArray(allAlerts.alerts)) {
            if (serreBilans.length > 0) {
              serreAlerts = allAlerts.alerts.filter(alert => 
                serreBilans.some(bilan => bilan.id === alert.id_bilan)
              );
            } else {
              serreAlerts = allAlerts.alerts;
            }
          } else {
            // Try alternative approach - maybe the response is directly an array
            if (Array.isArray(allAlerts)) {
              if (serreBilans.length > 0) {
                serreAlerts = allAlerts.filter(alert => 
                  serreBilans.some(bilan => bilan.id === alert.id_bilan)
                );
              } else {
                serreAlerts = allAlerts;
              }
            }
          }
          
          console.log(`[AlertHeatmapOverlay] Filtered to ${serreAlerts.length} alerts for this serre`);
        } catch (alertError) {
          console.error(`[AlertHeatmapOverlay] Error loading alerts:`, alertError);
          serreAlerts = [];
        }
        
        setAlerts(serreAlerts);

        // Create alert markers and heatmap points with modern alert level mapping
        const markers: AlertMarker[] = [];
        const heatmapData: HeatmapPoint[] = [];

        serreAlerts.forEach(alert => {
          // Ensure alert has required properties
          if (!alert || typeof alert !== 'object') {
            return;
          }
          
          const bilan = serreBilans.find(b => b.id === alert.id_bilan);
          if (alert.x1 && alert.y1 && alert.status_alert !== undefined) {
            try {
            // Convert normalized coordinates to actual map coordinates
            const actualCoords = convertNormalizedToMapCoordinates(alert.x1, alert.y1);
            const position = new google.maps.LatLng(actualCoords.lat, actualCoords.lng);
            
              // Validate that coordinates are within reasonable bounds (within ~2km of serre center)
              const serreLat = serreLocation.lat;
              const serreLng = serreLocation.lng;
              const latDiff = Math.abs(actualCoords.lat - serreLat);
              const lngDiff = Math.abs(actualCoords.lng - serreLng);
              
              // Only include alerts within ~2km radius (approximately 0.02 degrees) for better heatmap coverage
              if (latDiff < 0.02 && lngDiff < 0.02) {
                // Use modern alert level mapping
                const level = getAlertLevel(alert.status_alert);
                const weight = getAlertWeight(alert.status_alert);

                console.log(`[AlertHeatmapOverlay] Processing alert ${alert.id}: level=${level}, weight=${weight}, coords=(${actualCoords.lat.toFixed(6)}, ${actualCoords.lng.toFixed(6)})`);

            markers.push({
              id: alert.id,
              position,
              alert,
              bilan,
                  weight,
                  level
            });

            heatmapData.push({
              location: position,
              weight
            });
              } else {
                console.log(`[AlertHeatmapOverlay] Alert ${alert.id} outside range: latDiff=${latDiff.toFixed(6)}, lngDiff=${lngDiff.toFixed(6)}`);
              }
                    } catch (coordError) {
                        console.error(`[AlertHeatmapOverlay] Error processing alert ${alert.id}:`, coordError);
        }
          } else {
                          console.log(`[AlertHeatmapOverlay] Alert ${alert.id} missing required properties: x1=${alert.x1}, y1=${alert.y1}, status_alert=${alert.status_alert}`);
          }
        });

                  console.log(`[AlertHeatmapOverlay] Processed ${markers.length} markers and ${heatmapData.length} heatmap points`);

        // If no alerts with coordinates, no heatmap will be displayed

        setAlertMarkers(markers);
        setHeatmapPoints(heatmapData);

        // Create native heatmap if map is available and we have enough data points
        if (map && heatmapData.length > 0) {
          // Only create heatmap if we have at least 1 point to prevent full map coverage
          if (heatmapData.length >= 1) {
            console.log(`[AlertHeatmapOverlay] Creating heatmap with ${heatmapData.length} points`);
            createNativeHeatmap(map, heatmapData);
          }
        } else {
          console.log(`[AlertHeatmapOverlay] Cannot create heatmap: map=${!!map}, points=${heatmapData.length}`);
        }

      } catch (err: any) {
        console.error('Error loading serre data:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (serreId) {
      loadSerreData();
    }
  }, [serreId, createNativeHeatmap]);

  // Effect to create heatmap when map becomes available
  useEffect(() => {
            console.log(`[AlertHeatmapOverlay] Map effect triggered: map=${!!map}, points=${heatmapPoints.length}`);
    
    if (map && heatmapPoints.length > 0) {
      // Only create heatmap if we have at least 1 point to prevent full map coverage
      if (heatmapPoints.length >= 1) {
                  console.log(`[AlertHeatmapOverlay] Creating heatmap from effect with ${heatmapPoints.length} points`);
        // Add a small delay to ensure Google Maps API is fully loaded
        const timer = setTimeout(() => {
          createNativeHeatmap(map, heatmapPoints);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    } else {
              console.log(`[AlertHeatmapOverlay] Map effect conditions not met: map=${!!map}, points=${heatmapPoints.length}`);
    }
  }, [map, heatmapPoints, createNativeHeatmap]);

  // Cleanup heatmap on unmount
  useEffect(() => {
    return () => {
      if (heatmapRef.current) {
        // Remove zoom listener if it exists
        if ((heatmapRef.current as any).zoomListener) {
          google.maps.event.removeListener((heatmapRef.current as any).zoomListener);
        }
        heatmapRef.current.setMap(null);
      }
    };
  }, []);

  const handleMarkerClick = useCallback((marker: AlertMarker) => {
    setSelectedAlert(marker);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  const handleAlertClick = useCallback((alert: Alert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  }, [onAlertClick]);

  const handleInterventionClick = useCallback((alert: Alert) => {
    if (onInterventionClick) {
      onInterventionClick(alert);
    }
  }, [onInterventionClick]);

  // Show loading state
  if (loading) {
    return (
      <div className="absolute top-4 left-4 z-[5] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
          <span className="text-sm text-red-600 font-medium">Chargement de la carte de chaleur...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="absolute top-4 left-4 z-[5] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-red-200 p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 font-medium">Erreur: {error}</span>
        </div>
        <div className="mt-2 text-xs text-red-500">
          La carte de chaleur ne peut pas être affichée. Vérifiez votre connexion et réessayez.
        </div>
      </div>
    );
  }

  // Show no alerts state
  if (alerts.length === 0) {
    return (
      <div className="absolute top-4 left-4 z-[5] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-green-200 p-3">
        <div className="flex items-center space-x-2">
          <CircleIcon className="h-4 w-4 text-green-500" />
          <div className="text-sm text-green-600 font-medium">Aucune alerte détectée pour {serreName}</div>
        </div>
        <div className="mt-2 text-xs text-green-600">
          La carte de chaleur sera affichée une fois des alertes détectées.
        </div>
      </div>
    );
  }

  return (
    <>


      {/* Modern Alert Markers - Clickable with Color Coding */}
      {alertMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="markerGradient-${marker.id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="${getAlertLevelColor(marker.alert.status_alert)}" stop-opacity="0.9"/>
                    <stop offset="70%" stop-color="${getAlertLevelColor(marker.alert.status_alert)}" stop-opacity="0.7"/>
                    <stop offset="100%" stop-color="${getAlertLevelColor(marker.alert.status_alert)}" stop-opacity="0.4"/>
                  </radialGradient>
                  ${marker.alert.status_alert === 2 ? `
                  <filter id="glow-${marker.id}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  ` : ''}
                </defs>
                <circle cx="8" cy="8" r="6" fill="url(#markerGradient-${marker.id})" stroke="${getAlertLevelColor(marker.alert.status_alert)}" stroke-width="${marker.alert.status_alert === 2 ? '2.5' : '1.5'}" ${marker.alert.status_alert === 2 ? 'filter="url(#glow-' + marker.id + ')"' : ''}/>
                <circle cx="8" cy="8" r="2.5" fill="white" opacity="0.9"/>
                ${marker.alert.status_alert === 2 ? '<circle cx="8" cy="8" r="11" fill="none" stroke="rgba(220, 20, 60, 0.5)" stroke-width="1.5" stroke-dasharray="3,2"/>' : ''}
                ${marker.alert.status_alert === 2 ? '<circle cx="8" cy="8" r="14" fill="none" stroke="rgba(139, 0, 0, 0.4)" stroke-width="1" stroke-dasharray="1,1"/>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(16, 16),
            anchor: new google.maps.Point(8, 8)
          }}
          onClick={() => handleMarkerClick(marker)}
          title={`${marker.level} - ${marker.alert.maladie} - ${marker.bilan?.nom || 'Billon inconnu'}`}
        />
      ))}

      {/* Clean Heatmap Only - No Fallback Circles */}
      {/* The native Google Maps heatmap layer provides the visualization */}

      {/* Compact Info Window for Selected Alert */}
      {selectedAlert && (
        <InfoWindow
          position={selectedAlert.position}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-0 min-w-[200px] max-w-[220px]">
            {/* Compact Card Container */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Alert Image - First thing you see */}
              {selectedAlert.alert.lien_image && (
                <div className="w-full">
                  <img 
                    src={selectedAlert.alert.lien_image} 
                    alt="Alerte"
                    className="w-full h-24 object-cover"
                  />
                </div>
              )}
              
              {/* Compact Content */}
              <div className="p-3 space-y-2">
                {/* Alert Type & Level Badge */}
                 <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm truncate flex-1">
                       {selectedAlert.alert.maladie}
                     </h3>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-2 py-0.5 text-xs font-semibold border ml-2 flex-shrink-0",
                      getAlertLevelBgColor(selectedAlert.alert.status_alert)
                    )}
                  >
                    {selectedAlert.level}
                  </Badge>
                   </div>
                   
                {/* Billon Name */}
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Billon:</span> {selectedAlert.bilan?.nom || 'Inconnu'}
                 </div>
                 
                 {/* Status */}
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Statut:</span> 
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded text-xs font-medium",
                     selectedAlert.alert.status === 'résolue' 
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                   )}>
                     {selectedAlert.alert.status === 'résolue' ? 'Résolue' : 'Non Résolue'}
                   </span>
               </div>
               
                {/* Date */}
                <div className="text-xs text-gray-600">
                  <span className="text-sm font-medium">Détecté:</span> {formatDate(selectedAlert.alert.date)}
                 </div>
               </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
