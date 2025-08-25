import React, { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, HeatmapLayer } from "@react-google-maps/api";
import { Alert } from "@/types/alert";
import { AlertService } from "@/services/alertService";
import { GOOGLE_MAPS_CONFIG } from "@/config/maps";
import { Loader2, AlertTriangle, MapPin, Activity, Clock, CheckCircle2 } from "lucide-react";

interface AlertHeatmapProps {
  className?: string;
  height?: string;
}

interface AlertMarker {
  id: number;
  position: google.maps.LatLng;
  alert: Alert;
  weight: number;
}

interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
}

// Sample alert data for demonstration purposes
const SAMPLE_ALERTS: Alert[] = [
  {
    id: 1,
    id_bilan: 1,
    status_alert: 5,
    maladie: "Mildiou",
    date: "2024-01-15",
    status: "non résolue",
    x1: -6.8498,
    y1: 33.9716,
    bilan_nom: "Billon Serre 1",
    serre_nom: "Serre Principale",
    domaine_nom: "Domaine Nord"
  },
  {
    id: 2,
    id_bilan: 2,
    status_alert: 3,
    maladie: "Oïdium",
    date: "2024-01-14",
    status: "non résolue",
    x1: -6.8500,
    y1: 33.9718,
    bilan_nom: "Billon Serre 2",
    serre_nom: "Serre Secondaire",
    domaine_nom: "Domaine Nord"
  },
  {
    id: 3,
    id_bilan: 3,
    status_alert: 7,
    maladie: "Botrytis",
    date: "2024-01-13",
    status: "résolue",
    x1: -6.8495,
    y1: 33.9714,
    bilan_nom: "Billon Serre 3",
    serre_nom: "Serre Est",
    domaine_nom: "Domaine Sud"
  },
  {
    id: 4,
    id_bilan: 4,
    status_alert: 4,
    maladie: "Pucerons",
    date: "2024-01-12",
    status: "non résolue",
    x1: -6.8505,
    y1: 33.9720,
    bilan_nom: "Billon Serre 4",
    serre_nom: "Serre Ouest",
    domaine_nom: "Domaine Sud"
  },
  {
    id: 5,
    id_bilan: 5,
    status_alert: 6,
    maladie: "Thrips",
    date: "2024-01-11",
    status: "non résolue",
    x1: -6.8490,
    y1: 33.9710,
    bilan_nom: "Billon Serre 5",
    serre_nom: "Serre Centre",
    domaine_nom: "Domaine Nord"
  }
];

export default function AlertHeatmap({ 
  className = "w-full h-full", 
  height = "400px" 
}: AlertHeatmapProps) {
  // Responsive height calculation
  const getResponsiveHeight = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) return "300px";      // Mobile
      if (screenWidth < 1024) return "400px";     // Tablet
      if (screenWidth < 1280) return "450px";     // Small desktop
      return "500px";                             // Large desktop
    }
    return height; // Fallback to prop
  };

  const [responsiveHeight, setResponsiveHeight] = useState(getResponsiveHeight());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markers, setMarkers] = useState<AlertMarker[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle window resize for responsive height
  useEffect(() => {
    const handleResize = () => {
      setResponsiveHeight(getResponsiveHeight());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<AlertMarker | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isDark, setIsDark] = useState<boolean>(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Check if Google Maps is loaded
  const isGoogleMapsLoaded = () => {
    return typeof window !== "undefined" && 
           window.google && 
           window.google.maps && 
           window.google.maps.LatLng;
  };

  // Calculate weight based on alert severity and status
  const getAlertWeight = useCallback((alert: Alert): number => {
    let weight = 1;
    
    // Higher weight for unresolved alerts
    if (alert.status === "non résolue") {
      weight += 2; // Increased weight for unresolved alerts
    }
    
    // Weight based on status_alert values (0, 1, 2)
    if (alert.status_alert === 2) {
      weight += 4; // Élevée (High) - Red
    } else if (alert.status_alert === 1) {
      weight += 2; // Moyenne (Medium) - Orange
    } else if (alert.status_alert === 0) {
      weight += 1; // Faible (Low) - Yellow
    }
    
    return weight;
  }, []);

  // Get alert level description based on status_alert
  const getAlertLevel = useCallback((statusAlert: number): string => {
    switch (statusAlert) {
      case 2:
        return "Élevée";
      case 1:
        return "Moyenne";
      case 0:
        return "Faible";
      default:
        return "Inconnu";
    }
  }, []);

  // Get alert level color based on status_alert
  const getAlertColor = useCallback((statusAlert: number): string => {
    switch (statusAlert) {
      case 2:
        return "#EF4444"; // Red for Élevée
      case 1:
        return "#F97316"; // Orange for Moyenne
      case 0:
        return "#EAB308"; // Yellow for Faible
      default:
        return "#22C55E"; // Green for unknown
    }
  }, []);

  // Convert alerts to heatmap data points with more spread for smooth blending
  const convertAlertsToHeatmapData = useCallback((alertList: Alert[]): HeatmapPoint[] => {
    if (!isGoogleMapsLoaded()) {
      console.log("Google Maps not loaded yet, returning empty heatmap data");
      return [];
    }

    console.log("Converting alerts to heatmap data:", alertList.length);
    const heatmapPoints: HeatmapPoint[] = [];
    
    alertList
      .filter(alert => alert.x1 && alert.y1) // Only alerts with coordinates
      .forEach(alert => {
        const weight = getAlertWeight(alert);
        
        // Create multiple points around the alert location to create a smooth heatmap effect
        const baseLat = alert.y1!;
        const baseLng = alert.x1!;
        
        // Main point with full weight
        heatmapPoints.push({
          location: new window.google.maps.LatLng(baseLat, baseLng),
          weight: weight
        });
        
        // Additional points around the main location for smooth blending
        const spreadRadius = 0.001; // About 100 meters for better coverage
        const numPoints = Math.min(weight * 2, 8); // More points for higher weight alerts
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const radius = (Math.random() * 0.7 + 0.3) * spreadRadius;
          const lat = baseLat + radius * Math.cos(angle);
          const lng = baseLng + radius * Math.sin(angle);
          
          heatmapPoints.push({
            location: new window.google.maps.LatLng(lat, lng),
            weight: weight * 0.6 // Reduced weight for spread points
          });
        }
      });
    
    console.log("Created heatmap points:", heatmapPoints.length);
    return heatmapPoints;
  }, [getAlertWeight]);

  // Convert alerts to invisible markers for hover events
  const convertAlertsToMarkers = useCallback((alertList: Alert[]): AlertMarker[] => {
    if (!isGoogleMapsLoaded()) {
      console.log("Google Maps not loaded yet, returning empty markers");
      return [];
    }

    console.log("Converting alerts to markers:", alertList.length);
    const markers = alertList
      .filter(alert => alert.x1 && alert.y1) // Only alerts with coordinates
      .map(alert => {
        return {
          id: alert.id,
          position: new window.google.maps.LatLng(alert.y1!, alert.x1!), // Note: x1 is lng, y1 is lat
          alert,
          weight: getAlertWeight(alert)
        };
      });
    
    console.log("Created markers:", markers.length);
    return markers;
  }, [getAlertWeight]);

  // Fetch alerts from the service
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get alerts by assigned serres (more specific for technicians)
      let realAlerts: Alert[] = [];
      
      try {
        const assignedSerresAlerts = await AlertService.getAlertsByAssignedSerres();
        if (assignedSerresAlerts && assignedSerresAlerts.length > 0) {
          console.log("Fetched alerts by assigned serres:", assignedSerresAlerts.length);
          realAlerts = assignedSerresAlerts;
        }
      } catch (assignedError) {
        console.log("Could not fetch alerts by assigned serres, trying getAllAlerts");
      }
      
      // If no alerts from assigned serres, try getAllAlerts
      if (realAlerts.length === 0) {
        try {
          const response = await AlertService.getAllAlerts(1, 1000);
          if (response.alerts && response.alerts.length > 0) {
            console.log("Fetched all alerts:", response.alerts.length);
            realAlerts = response.alerts;
          }
        } catch (allAlertsError) {
          console.log("Could not fetch all alerts");
        }
      }
      
      // Use real alerts if available
      if (realAlerts.length > 0) {
        console.log("Using real alerts:", realAlerts.length);
        setAlerts(realAlerts);
        setUsingSampleData(false);
      } else {
        console.log("No real alerts available, using sample data for demonstration");
        setAlerts(SAMPLE_ALERTS);
        setUsingSampleData(true);
        setError("Aucune alerte réelle trouvée. Affichage des données de démonstration.");
      }
      
    } catch (err) {
      console.error("Error fetching alerts:", err);
      // Only use sample data as absolute last resort
      setAlerts(SAMPLE_ALERTS);
      setUsingSampleData(true);
      setError("Erreur lors du chargement des alertes. Affichage des données de démonstration.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process alerts once Google Maps is loaded
  const processAlerts = useCallback(() => {
    if (!isGoogleMapsLoaded() || alerts.length === 0) {
      console.log("Cannot process alerts - Google Maps not loaded or no alerts");
      return;
    }

    console.log("Processing alerts:", alerts.length);
    
    // Create both heatmap data and markers
    const heatmapPoints = convertAlertsToHeatmapData(alerts);
    const alertMarkers = convertAlertsToMarkers(alerts);
    
    setHeatmapData(heatmapPoints);
    setMarkers(alertMarkers);
  }, [alerts, convertAlertsToHeatmapData, convertAlertsToMarkers]);

  // Fetch alerts when component mounts
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Process alerts when Google Maps loads
  useEffect(() => {
    if (googleMapsLoaded && alerts.length > 0) {
      console.log("Google Maps loaded, processing alerts");
      processAlerts();
    }
  }, [googleMapsLoaded, alerts, processAlerts]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log("Map loaded successfully");
    setMap(map);
    mapRef.current = map;
    setGoogleMapsLoaded(true);
    // Apply theme style
    try {
      const theme = localStorage.getItem('theme');
      const dark = theme ? theme === 'dark' : document.documentElement.classList.contains('dark');
      setIsDark(dark);
      map.setOptions({ styles: dark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE });
    } catch (e) {}
    
    // Process alerts now that Google Maps is loaded
    if (alerts.length > 0) {
      console.log("Processing alerts on map load");
      processAlerts();
    }
  }, [alerts, processAlerts]);

  // Listen for theme changes
  useEffect(() => {
    const handler = (e: any) => {
      const dark = !!e?.detail?.dark;
      setIsDark(dark);
      if (mapRef.current) {
        mapRef.current.setOptions({ styles: dark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE });
      }
    };
    window.addEventListener('theme-changed', handler as EventListener);
    return () => window.removeEventListener('theme-changed', handler as EventListener);
  }, []);

  // Fit bounds when markers change
  useEffect(() => {
    if (map && markers.length > 0) {
      console.log("Fitting bounds for", markers.length, "markers");
      try {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(marker.position);
        });
        map.fitBounds(bounds);
        
        // Set a reasonable zoom level
        setTimeout(() => {
          if (map.getZoom() > 15) {
            map.setZoom(15);
          }
        }, 100);
      } catch (err) {
        console.error("Error fitting bounds:", err);
      }
    }
  }, [map, markers]);

  // Handle mouse move for tooltip positioning
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const mapContainerStyle = {
    width: "100%",
    height: responsiveHeight,
    minHeight: "250px",
  };

  // Fallback view when Google Maps fails to load
  const renderFallbackView = () => (
    <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border`}>
      <div className="text-center p-8">
        <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Carte des alertes non disponible
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Impossible de charger Google Maps. Voici un résumé des alertes :
        </p>
        
        {/* Data source indicator */}
        {usingSampleData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Données de démonstration</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Les vraies alertes n'ont pas pu être chargées
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Erreur de chargement</span>
            </div>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        )}
        
        {/* Alert summary table */}
        <div className="bg-white rounded-lg border p-4 max-w-md mx-auto">
          <h4 className="font-medium text-gray-900 mb-3">Résumé des alertes</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{alerts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Non résolues:</span>
              <span className="font-medium text-orange-600">
                {alerts.filter(a => a.status === "non résolue").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Élevées (2):</span>
              <span className="font-medium text-red-600">
                {alerts.filter(a => a.status_alert === 2).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Moyennes (1):</span>
              <span className="font-medium text-orange-600">
                {alerts.filter(a => a.status_alert === 1).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Faibles (0):</span>
              <span className="font-medium text-yellow-600">
                {alerts.filter(a => a.status_alert === 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#B4CC5F]" />
          <p className="text-sm text-gray-600">Chargement de la carte des alertes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return renderFallbackView();
  }

  return (
    <div className={className}>
      <div className="mb-4">
        {usingSampleData && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              Données de démonstration - Connectez-vous à votre backend pour voir vos vraies alertes
            </p>
          </div>
        )}
        {!googleMapsLoaded && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              Chargement de Google Maps...
            </p>
          </div>
        )}
      </div>
      
      {/* Layout: Sidebar on top, Map below, then Stats/Alerts, then Interventions Chart */}
        <div className="w-full space-y-6">
          {/* Map Section - Full width */}
          <div className="relative" onMouseMove={handleMouseMove}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={GOOGLE_MAPS_CONFIG.DEFAULT_CENTER}
              zoom={GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM}
              onLoad={onMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                mapTypeId: "satellite",
                gestureHandling: "greedy", // Enable dragging on mobile
                draggable: true,
                scrollwheel: true,
                disableDoubleClickZoom: false,
             
              }}
            >
              {/* Heatmap Layers: subtle glow + main neon gradient */}
              {heatmapData.length > 0 && (
                <>
                  <HeatmapLayer
                    data={heatmapData}
                    options={{
                      radius: 85,
                      opacity: 0.35,
                      gradient: NEON_GLOW_GRADIENT
                    }}
                  />
                  <HeatmapLayer
                    data={heatmapData}
                    options={{
                      radius: 55,
                      opacity: 0.95,
                      gradient: NEON_GRADIENT
                    }}
                  />
                </>
              )}

              {/* Invisible markers for hover events */}
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  onMouseOver={() => {
                    console.log("Marker hovered:", marker.alert.serre_nom);
                    setHoveredMarker(marker);
                  }}
                  onMouseOut={() => {
                    console.log("Marker unhovered:", marker.alert.serre_nom);
                    setHoveredMarker(null);
                  }}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="10" fill="transparent"/>
                      </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(20, 20),
                    anchor: new google.maps.Point(10, 10)
                  }}
                />
              ))}
            </GoogleMap>

            {/* Hover tooltip */}
            {hoveredMarker && (
              <div 
                className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
                style={{
                  left: mousePosition.x + 15,
                  top: mousePosition.y - 15,
                  transform: 'translateY(-100%)',
                  maxWidth: '250px'
                }}
              >
                <div className="text-sm font-medium text-gray-900">
                  {hoveredMarker.alert.serre_nom}
                </div>
                <div className="text-xs text-gray-600">
                  {hoveredMarker.alert.domaine_nom}
                </div>
                <div className="flex items-center mt-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getAlertColor(hoveredMarker.alert.status_alert) }}
                  ></div>
                  <span className="text-xs font-medium">
                    {getAlertLevel(hoveredMarker.alert.status_alert)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {hoveredMarker.alert.maladie}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Poids: {hoveredMarker.weight}
                </div>
              </div>
            )}

            {/* Legend in bottom-left corner: 3 alert levels */}
            <div className="absolute bottom-4 left-4 ">
              <div className="rounded-2xl shadow-xl border border-black/5 dark:border-white/10 backdrop-blur bg-white/80 dark:bg-gray-900/70 p-3">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Niveaux d'alerte</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Élevée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F97316]"></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Moyenne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#EAB308]"></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Faible</span>
                  </div>
                </div>
              </div>
            </div>

          </div>


        </div>
      </div>
    );
}

// Neon gradient and map styles
const NEON_GRADIENT = [
  'rgba(59,130,246,0.15)', // blue faint
  'rgba(59,130,246,0.6)',  // blue
  'rgba(6,182,212,0.8)',   // cyan
  'rgba(132,204,22,0.9)',  // lime
  'rgba(234,179,8,0.95)',  // yellow
  'rgba(249,115,22,0.98)', // orange
  'rgba(239,68,68,1.0)'    // red
];

const NEON_GLOW_GRADIENT = [
  'rgba(6,182,212,0.0)',  // transparent
  'rgba(6,182,212,0.08)',
  'rgba(59,130,246,0.12)',
  'rgba(132,204,22,0.16)',
  'rgba(234,179,8,0.18)',
  'rgba(249,115,22,0.2)',
  'rgba(239,68,68,0.22)'
];

const DARK_MAP_STYLE: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d1d5db' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }]
  },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#4b5563' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4b5563' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
];

const LIGHT_MAP_STYLE: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
];
