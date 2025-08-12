import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, Polygon, Polyline } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target, Route } from 'lucide-react';
import { BilanPoint } from '../services/bilanService';
import GoogleMapsWrapper from './GoogleMapsWrapper';
import { getGoogleMapsAPIKey } from '@/config/maps';

interface BilanMapComponentProps {
  serreLocation: { lat: number; lng: number };
  selectedPoints: BilanPoint[];
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
};

export default function BilanMapComponent({
  serreLocation,
  selectedPoints,
  currentLocation,
  isTracking,
  className = 'w-full',
}: BilanMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userPath, setUserPath] = useState<{ lat: number; lng: number }[]>([]);

  // Center map on serre location when component mounts
  useEffect(() => {
    if (map && serreLocation) {
      map.panTo(serreLocation);
      map.setZoom(18); // High zoom for field-level view
    }
  }, [map, serreLocation]);

  // Center map on current location when tracking
  useEffect(() => {
    if (map && currentLocation && isTracking) {
      map.panTo(currentLocation);
    }
  }, [map, currentLocation, isTracking]);

  // Update user path when current location changes during tracking
  useEffect(() => {
    if (currentLocation && isTracking) {
      setUserPath(prev => [...prev, currentLocation]);
      
      // Keep only last 200 points to avoid performance issues
      if (userPath.length > 200) {
        setUserPath(prev => prev.slice(-200));
      }
    }
  }, [currentLocation, isTracking]);

  // Reset user path when tracking starts
  useEffect(() => {
    if (isTracking) {
      setUserPath([]);
    }
  }, [isTracking]);

  const onMapLoad = (map: google.maps.Map) => {
    setMap(map);
    setMapLoaded(true);
  };

  const onMapUnmount = () => {
    setMap(null);
    setMapLoaded(false);
  };

  // Create polygon path from selected points
  const getPolygonPath = () => {
    if (selectedPoints.length < 3) return [];
    
    // Sort points by order
    const sortedPoints = [...selectedPoints].sort((a, b) => a.ordre - b.ordre);
    
    // Convert to Google Maps LatLng objects
    return sortedPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
    }));
  };

  // Calculate center of all points for better map centering
  const getMapCenter = () => {
    if (selectedPoints.length > 0) {
      const avgLat = selectedPoints.reduce((sum, point) => sum + point.lat, 0) / selectedPoints.length;
      const avgLng = selectedPoints.reduce((sum, point) => sum + point.lng, 0) / selectedPoints.length;
      return { lat: avgLat, lng: avgLng };
    }
    return serreLocation;
  };

  // Calculate total distance walked
  const calculateTotalDistance = () => {
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
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5" />
          Carte Interactive du Bilan
          {isTracking && (
            <Badge variant="secondary" className="ml-2 animate-pulse">
              <Navigation className="h-3 w-3 mr-1" />
              Suivi actif
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <GoogleMapsWrapper apiKey={getGoogleMapsAPIKey()}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={getMapCenter()}
              zoom={18}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={{
                mapTypeId: 'satellite', // Satellite view for better field visualization
                tilt: 0,
                streetViewControl: false,
                fullscreenControl: true,
                mapTypeControl: true,
                zoomControl: true,
                scaleControl: true,
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
                    strokeWeight: 3,
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
                    strokeWeight: 3,
                    strokeOpacity: 0.8,
                  }}
                />
              )}
            </GoogleMap>
          </GoogleMapsWrapper>

          {/* Map Legend and Stats */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg text-sm max-w-64">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Légende</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">Serre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">Votre position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-700">Points du bilan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className="text-gray-700">Votre parcours</span>
                </div>
              </div>

              {isTracking && (
                <>
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-600">
                      Distance parcourue: {(calculateTotalDistance() / 1000).toFixed(2)} km
                    </div>
                    <div className="text-xs text-gray-600">
                      Points du bilan: {selectedPoints.length}/4
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions Overlay */}
          {selectedPoints.length === 0 && (
            <div className="absolute bottom-4 left-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-80">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Instructions</div>
                  <div className="space-y-1 text-blue-100">
                    <div>1. Démarrer le suivi GPS</div>
                    <div>2. Marcher dans le champ</div>
                    <div>3. Cliquer "Ajouter Point" à chaque position</div>
                    <div>4. Continuer jusqu'à 4 points</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {selectedPoints.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
              <div className="text-sm font-medium text-gray-800 mb-2">
                Progression: {selectedPoints.length}/4 points
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
