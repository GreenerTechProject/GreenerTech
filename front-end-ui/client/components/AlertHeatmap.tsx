import React, { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, HeatmapLayer } from "@react-google-maps/api";
import { Alert } from "@/types/alert";
import { AlertService } from "@/services/alertService";
import { GOOGLE_MAPS_CONFIG } from "@/config/maps";
import { Loader2, AlertTriangle, MapPin } from "lucide-react";

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
    bilan_nom: "Bilan Serre 1",
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
    bilan_nom: "Bilan Serre 2",
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
    bilan_nom: "Bilan Serre 3",
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
    bilan_nom: "Bilan Serre 4",
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
    bilan_nom: "Bilan Serre 5",
    serre_nom: "Serre Centre",
    domaine_nom: "Domaine Nord"
  }
];

export default function AlertHeatmap({ 
  className = "w-full h-full", 
  height = "400px" 
}: AlertHeatmapProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markers, setMarkers] = useState<AlertMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<AlertMarker | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
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
      weight += 3; // Increased weight for unresolved alerts
    }
    
    // Higher weight for higher status_alert values
    if (alert.status_alert > 5) {
      weight += 4; // High priority
    } else if (alert.status_alert > 3) {
      weight += 3; // Medium priority
    } else if (alert.status_alert > 1) {
      weight += 2; // Low priority
    }
    
    return weight;
  }, []);

  // Get alert level description based on weight
  const getAlertLevel = useCallback((weight: number): string => {
    if (weight >= 7) return "Élevée";
    if (weight >= 5) return "Moyenne";
    if (weight >= 3) return "Faible";
    return "Très faible";
  }, []);

  // Get alert level color based on weight
  const getAlertColor = useCallback((weight: number): string => {
    if (weight >= 7) return "#EF4444"; // Red
    if (weight >= 5) return "#F97316"; // Orange
    if (weight >= 3) return "#EAB308"; // Yellow
    return "#22C55E"; // Green
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
      const response = await AlertService.getAllAlerts(1, 1000);
      
      if (response.alerts && response.alerts.length > 0) {
        console.log("Fetched real alerts:", response.alerts.length);
        setAlerts(response.alerts);
        setUsingSampleData(false);
      } else {
        console.log("No real alerts, using sample data");
        setAlerts(SAMPLE_ALERTS);
        setUsingSampleData(true);
      }
      
      // Don't convert to markers yet - wait for Google Maps to load
    } catch (err) {
      console.error("Error fetching alerts:", err);
      // Fallback to sample data
      setAlerts(SAMPLE_ALERTS);
      setUsingSampleData(true);
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
    
    // Process alerts now that Google Maps is loaded
    if (alerts.length > 0) {
      console.log("Processing alerts on map load");
      processAlerts();
    }
  }, [alerts, processAlerts]);

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
    height: height,
    minHeight: "300px",
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
              <span className="text-gray-600">Urgentes:</span>
              <span className="font-medium text-red-600">
                {alerts.filter(a => a.status_alert > 5).length}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm bg-[#B4CC5F] text-white rounded-md hover:bg-[#9BB54A]"
        >
          Réessayer
        </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Carte des alertes - Vue d'ensemble
        </h3>
        <p className="text-sm text-gray-600">
          La carte de chaleur montre l'intensité des alertes par zone
        </p>
        {usingSampleData && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              ⚠️ Données de démonstration - Connectez-vous à votre backend pour voir vos vraies alertes
            </p>
          </div>
        )}
        {!googleMapsLoaded && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              🔄 Chargement de Google Maps...
            </p>
          </div>
        )}
      </div>
      
      {/* Two-column layout: Map (1/2) + Alert Summary (1/2) */}
      <div className="flex gap-6">
        {/* Left side: Map */}
        <div className="w-1/2">
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
              }}
            >
              {/* Heatmap Layer with custom gradient */}
              {heatmapData.length > 0 && (
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 60,
                    opacity: 0.85,
                    gradient: [
                      'rgba(34, 197, 94, 0.2)',      // Light green (Très faible) - more visible
                      'rgba(34, 197, 94, 0.5)',      // Medium green
                      'rgba(234, 179, 8, 0.7)',      // Yellow (Faible) - more visible
                      'rgba(249, 115, 22, 0.85)',    // Orange (Moyenne) - more visible
                      'rgba(239, 68, 68, 1)'         // Red (Élevée) - fully opaque
                    ]
                  }}
                />
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
                    style={{ backgroundColor: getAlertColor(hoveredMarker.weight) }}
                  ></div>
                  <span className="text-xs font-medium">
                    {getAlertLevel(hoveredMarker.weight)}
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

            {/* Legend in bottom-left corner */}
            <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Niveaux d'alerte</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-700">Élevée</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-700">Moyenne</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-700">Faible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-700">Très faible</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Alert Summary Dashboard */}
        <div className="w-1/2 space-y-4">
          {/* Alert Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Total Alertes</p>
                  <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Non Résolues</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {alerts.filter(a => a.status === "non résolue").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Urgentes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {alerts.filter(a => a.status_alert > 5).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Résolues</p>
                  <p className="text-2xl font-bold text-green-600">
                    {alerts.filter(a => a.status === "résolue").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Level Distribution */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Distribution par Niveau</h4>
            <div className="space-y-3">
              {[
                { level: "Élevée", color: "bg-red-500", count: alerts.filter(a => getAlertWeight(a) >= 7).length },
                { level: "Moyenne", color: "bg-orange-500", count: alerts.filter(a => getAlertWeight(a) >= 5 && getAlertWeight(a) < 7).length },
                { level: "Faible", color: "bg-yellow-500", count: alerts.filter(a => getAlertWeight(a) >= 3 && getAlertWeight(a) < 5).length },
                { level: "Très faible", color: "bg-green-500", count: alerts.filter(a => getAlertWeight(a) < 3).length }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.level}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts List */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Alertes Récentes</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{alert.serre_nom}</p>
                    <p className="text-xs text-gray-600">{alert.maladie}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        getAlertWeight(alert) >= 7 ? 'bg-red-500' :
                        getAlertWeight(alert) >= 5 ? 'bg-orange-500' :
                        getAlertWeight(alert) >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    ></div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.status === "non résolue" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <p><strong>Points de chaleur:</strong> {heatmapData.length}</p>
              <p><strong>Zones surveillées:</strong> {markers.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
