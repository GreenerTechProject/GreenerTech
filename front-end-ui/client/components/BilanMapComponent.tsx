import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, Polygon, Polyline, Circle } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target, Route } from 'lucide-react';
import { BilanPoint } from '../services/bilanService';
import { useLoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';

interface BilanMapComponentProps {
  serreLocation: { lat: number; lng: number };
  selectedPoints: BilanPoint[];
  currentLocation: { lat: number; lng: number; accuracy?: number } | null;
  isTracking: boolean;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Responsive map container styles
const getMapContainerStyle = (isMobile: boolean, isTablet: boolean) => ({
  width: '100%',
  height: '100%', // Use 100% height to fill available space
  minHeight: '100%', // Ensure minimum height is also 100%
});

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = [
  "drawing",
  "geometry",
  "places",
  "visualization",
];

export default function BilanMapComponent({
  serreLocation,
  selectedPoints,
  currentLocation,
  isTracking,
  className = 'w-full',
  onMapClick,
}: BilanMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userPath, setUserPath] = useState<{ lat: number; lng: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.API_KEY,
    libraries,
  });

  // Center map on serre location when component mounts
  useEffect(() => {
    if (map && serreLocation) {
      map.panTo(serreLocation);
      map.setZoom(isMobile ? 16 : isTablet ? 17 : 18); // Responsive zoom levels
    }
  }, [map, serreLocation, isMobile, isTablet]);

  // Center map on current location when tracking
  useEffect(() => {
    if (map && currentLocation && isTracking) {
      map.panTo(currentLocation);
    }
  }, [map, currentLocation, isTracking]);

  // Update user path when current location changes during tracking
  useEffect(() => {
    if (!currentLocation || !isTracking) return;
    setUserPath(prev => {
      const next = [...prev, { lat: currentLocation.lat, lng: currentLocation.lng }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, [currentLocation, isTracking]);

  // Reset user path when tracking starts
  useEffect(() => {
    if (isTracking) {
      setUserPath([]);
    }
  }, [isTracking]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Create polygon path from selected points
  const getPolygonPath = useCallback(() => {
    if (selectedPoints.length < 3) return [];
    
    // Sort points by order
    const sortedPoints = [...selectedPoints].sort((a, b) => a.ordre - b.ordre);
    
    // Convert to Google Maps LatLng objects
    return sortedPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
    }));
  }, [selectedPoints]);

  // Calculate center of all points for better map centering
  const getMapCenter = useCallback(() => {
    if (selectedPoints.length > 0) {
      const avgLat = selectedPoints.reduce((sum, point) => sum + point.lat, 0) / selectedPoints.length;
      const avgLng = selectedPoints.reduce((sum, point) => sum + point.lng, 0) / selectedPoints.length;
      return { lat: avgLat, lng: avgLng };
    }
    return serreLocation;
  }, [selectedPoints, serreLocation]);

  // Calculate total distance walked
  const calculateTotalDistance = useCallback(() => {
    if (userPath.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < userPath.length; i++) {
      const prev = userPath[i - 1];
      const curr = userPath[i];
      
      // Haversine formula for distance calculation
      const R = 6371000; // Earth's radius in meters
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLng = (curr.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  }, [userPath]);

  // Handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (onMapClick && e.latLng) {
      onMapClick(e.latLng.lat(), e.latLng.lng());
    }
  }, [onMapClick]);

  // Show loading state while Google Maps is loading
  if (!isLoaded) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <Route className="h-4 w-4 sm:h-5 sm:w-5" />
            Carte Interactive du Bilan
            {isTracking && (
              <Badge variant="secondary" className="ml-2 animate-pulse text-xs sm:text-sm">
                <Navigation className="h-3 w-3 mr-1" />
                Suivi actif
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm text-gray-600">Chargement de Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if Google Maps failed to load
  if (loadError) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <Route className="h-4 w-4 sm:h-5 sm:w-5" />
            Carte Interactive du Bilan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-base sm:text-lg mb-2">⚠️ Erreur de chargement</div>
              <p className="text-xs sm:text-sm text-gray-600">Impossible de charger Google Maps</p>
              <p className="text-xs text-gray-500 mt-1">{loadError.message}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
          <Route className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Carte Interactive du Bilan</span>
          <span className="sm:hidden">Bilan</span>
          {isTracking && (
            <Badge variant="secondary" className="ml-2 animate-pulse text-xs sm:text-sm">
              <Navigation className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Suivi actif</span>
              <span className="sm:hidden">Actif</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <div className="relative h-full w-full">
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%',
              minHeight: '100%',
            }}
            center={getMapCenter()}
            zoom={isMobile ? 16 : isTablet ? 17 : 18}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={handleMapClick}
            options={{
              mapTypeId: 'satellite',
              tilt: 0,
              streetViewControl: false,
              fullscreenControl: true,
              mapTypeControl: !isMobile, // Hide on mobile to save space
              zoomControl: true,
              scaleControl: !isMobile, // Hide on mobile to save space
              gestureHandling: 'greedy',
            }}
          >
            {/* Serre Location Marker */}
            <Marker
              position={serreLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#10B981" opacity="0.8"/>
                    <circle cx="16" cy="16" r="8" fill="#10B981"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
              }}
              title="Serre"
            />

            {/* User Movement Path */}
            {userPath.length > 1 && (
              <Polyline
                path={userPath}
                options={{
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: isMobile ? 2 : 3,
                  geodesic: true,
                }}
              />
            )}

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="16" fill="#3B82F6" opacity="0.8"/>
                      <circle cx="16" cy="16" r="8" fill="#3B82F6"/>
                      <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title="Votre position actuelle"
              />
            )}

            {/* Accuracy Circle */}
            {currentLocation?.accuracy !== undefined && currentLocation.accuracy > 0 && (
              <Circle
                center={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                radius={currentLocation.accuracy}
                options={{
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.4,
                  strokeWeight: 1,
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  clickable: false,
                }}
              />
            )}

            {/* Selected Points Markers */}
            {selectedPoints.map((point, index) => (
              <Marker
                key={index}
                position={{ lat: point.lat, lng: point.lng }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="16" fill="#F59E0B" opacity="0.8"/>
                      <circle cx="16" cy="16" r="8" fill="#F59E0B"/>
                      <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${point.ordre}</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={`Point ${point.ordre} du bilan`}
              />
            ))}

            {/* Polygon connecting the selected points */}
            {selectedPoints.length >= 3 && (
              <Polygon
                paths={getPolygonPath()}
                options={{
                  fillColor: '#10B981',
                  fillOpacity: 0.3,
                  strokeColor: '#10B981',
                  strokeWeight: isMobile ? 2 : 3,
                  strokeOpacity: 0.8,
                }}
              />
            )}
          </GoogleMap>

          {/* Responsive Map Legend and Stats */}
          <div className={`absolute bg-white bg-opacity-95 p-2 sm:p-3 lg:p-4 rounded-lg shadow-lg text-xs sm:text-sm max-w-48 sm:max-w-56 lg:max-w-64 ${
            isMobile ? 'top-2 right-2' : 'top-4 right-4'
          }`}>
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Légende</h4>
              
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 text-xs sm:text-sm">Serre</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700 text-xs sm:text-sm">Votre position</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-700 text-xs sm:text-sm">Points du bilan</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-0.5 sm:w-3 sm:h-0.5 bg-blue-500"></div>
                  <span className="text-gray-700 text-xs sm:text-sm">Votre parcours</span>
                </div>
              </div>

              {isTracking && (
                <>
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-600">
                      Distance: {((calculateTotalDistance() || 0) / 1000).toFixed(2)} km
                    </div>
                    <div className="text-xs text-gray-600">
                      Points: {selectedPoints.length}/4
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Responsive Progress Indicator */}
          {selectedPoints.length > 0 && (
            <div className={`absolute bg-white p-2 sm:p-3 rounded-lg shadow-lg ${
              isMobile ? 'bottom-2 left-2 right-2' : 'bottom-4 left-4'
            }`}>
              <div className="text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                Progression: {selectedPoints.length}/4 points
              </div>
              <div className={`bg-gray-200 rounded-full h-1.5 sm:h-2 ${
                isMobile ? 'w-full' : 'w-32'
              }`}>
                <div 
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedPoints.length / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
