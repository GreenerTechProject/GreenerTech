import React, { useEffect, useState, useCallback } from 'react';
import { Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Alert } from '@/types/alert';
import { AlertService } from '@/services/alertService';
import { bilanService, Bilan } from '@/services/bilanService';
import { AlertTriangle, MapPin, Info, Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AlertHeatmapOverlayProps {
  serreId: number;
  serreName: string;
  serreLocation: { lat: number; lng: number };
  onAlertClick?: (alert: Alert) => void;
}

interface AlertMarker {
  id: number;
  position: google.maps.LatLng;
  alert: Alert;
  bilan: Bilan | null;
  weight: number;
}

interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
}

export default function AlertHeatmapOverlay({
  serreId,
  serreName,
  serreLocation,
  onAlertClick
}: AlertHeatmapOverlayProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('AlertHeatmapOverlay rendered for serre:', serreId);
  console.log('Google Maps HeatmapLayer available:', typeof HeatmapLayer !== 'undefined');
  console.log('Google Maps object available:', typeof google !== 'undefined');
  console.log('Google Maps maps object available:', typeof google?.maps !== 'undefined');
  console.log('Component state - loading:', loading, 'error:', error);
  console.log('Component state - alerts count:', alerts.length, 'bilans count:', bilans.length);
  console.log('Component state - alertMarkers count:', alertMarkers.length, 'heatmapPoints count:', heatmapPoints.length);
  console.log('Serre location:', serreLocation);

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
    
    console.log(`Converting normalized (${normalizedX}, ${normalizedY}) to actual (${actualLat}, ${actualLng})`);
    
    return { lat: actualLat, lng: actualLng };
  };

  // Load alerts and bilans for the serre
  useEffect(() => {
    const loadSerreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load bilans for the serre
        const serreBilans = await bilanService.getBilansBySerre(serreId);
        setBilans(serreBilans);

        // Load alerts for the serre (filter by bilan IDs)
        const allAlerts = await AlertService.getAllAlerts(1, 1000);
        const serreAlerts = allAlerts.alerts.filter(alert => 
          serreBilans.some(bilan => bilan.id === alert.id_bilan)
        );
        setAlerts(serreAlerts);

        // Create alert markers and heatmap points
        const markers: AlertMarker[] = [];
        const heatmapData: HeatmapPoint[] = [];

        serreAlerts.forEach(alert => {
          const bilan = serreBilans.find(b => b.id === alert.id_bilan);
          if (alert.x1 && alert.y1) {
            console.log(`Alert ${alert.id}: x1=${alert.x1}, y1=${alert.y1}`);
            
            // Convert normalized coordinates to actual map coordinates
            const actualCoords = convertNormalizedToMapCoordinates(alert.x1, alert.y1);
            const position = new google.maps.LatLng(actualCoords.lat, actualCoords.lng);
            console.log(`Created position: lat=${position.lat()}, lng=${position.lng()}`);
            
            const weight = AlertService.getAlertLevel(alert.status_alert) === 'High' ? 3 : 
                          AlertService.getAlertLevel(alert.status_alert) === 'Medium' ? 2 : 1;

            markers.push({
              id: alert.id,
              position,
              alert,
              bilan,
              weight
            });

            heatmapData.push({
              location: position,
              weight
            });
          } else {
            console.log(`Alert ${alert.id} missing coordinates: x1=${alert.x1}, y1=${alert.y1}`);
          }
        });

        setAlertMarkers(markers);
        setHeatmapPoints(heatmapData);

        console.log(`Loaded ${serreAlerts.length} alerts and ${serreBilans.length} bilans for serre ${serreId}`);
        console.log('Alert markers created:', markers);
        console.log('Heatmap points created:', heatmapData);
        console.log('Heatmap points with coordinates:', heatmapData.map(p => ({
          lat: p.location.lat(),
          lng: p.location.lng(),
          weight: p.weight
        })));

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
  }, [serreId]);

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

  const getAlertLevelColor = (statusAlert: number) => {
    const level = AlertService.getAlertLevel(statusAlert);
    switch (level) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-orange-500';
      case 'Low':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertLevelText = (statusAlert: number) => {
    const level = AlertService.getAlertLevel(statusAlert);
    switch (level) {
      case 'High':
        return 'Élevé';
      case 'Medium':
        return 'Moyen';
      case 'Low':
        return 'Faible';
      default:
        return 'Inconnu';
    }
  };

  // Show loading state
  if (loading) {
    return null; // Don't render anything while loading
  }

  // Show error state
  if (error) {
    return null; // Don't render anything on error
  }

  return (
    <>
      {/* Alert markers */}
      {alertMarkers.map((marker) => (
        <>
          {console.log(`Rendering marker ${marker.id} at position:`, marker.position.lat(), marker.position.lng())}
          <Marker
            key={marker.id}
            position={marker.position}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="${getAlertLevelColor(marker.alert.status_alert)}" stroke="white" stroke-width="3"/>
                  <path d="M12 6v8M12 18v-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }}
            onClick={() => handleMarkerClick(marker)}
            title={`${marker.alert.maladie} - ${marker.bilan?.nom || 'Bilan inconnu'}`}
          />
        </>
      ))}

      {/* Heatmap layer */}
      {heatmapPoints.length > 0 && (
        <>
          {console.log('Rendering HeatmapLayer with', heatmapPoints.length, 'points')}
          <HeatmapLayer
            data={heatmapPoints}
            options={{
              radius: 80,
              opacity: 0.8,
              gradient: [
                'rgba(255, 255, 0, 0)',      // Transparent yellow
                'rgba(255, 255, 0, 0.3)',    // Light yellow
                'rgba(255, 165, 0, 0.6)',    // Orange
                'rgba(255, 69, 0, 0.8)',     // Red-orange
                'rgba(255, 0, 0, 1)'         // Bright red
              ]
            }}
          />
        </>
      )}

      {/* Alternative heatmap format for testing */}
      {heatmapPoints.length > 0 && (
        <>
          {console.log('Rendering alternative HeatmapLayer')}
          <HeatmapLayer
            data={heatmapPoints.map(point => ({
              location: point.location,
              weight: point.weight
            }))}
            options={{
              radius: 120,
              opacity: 0.9,
              gradient: [
                'rgba(0, 255, 255, 0)',      // Transparent cyan
                'rgba(0, 255, 255, 0.4)',    // Light cyan
                'rgba(0, 191, 255, 0.7)',    // Blue
                'rgba(0, 0, 255, 1)'         // Bright blue
              ]
            }}
          />
        </>
      )}

      {/* Test heatmap with a simple point at serre center for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {console.log('Rendering test heatmap at serre center')}
          
          {/* Test 1: Simple LatLng array - BRIGHT RED */}
          <HeatmapLayer
            data={[
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng)
            ]}
            options={{
              radius: 250,
              opacity: 1.0,
              gradient: [
                'rgba(255, 0, 0, 0)',
                'rgba(255, 0, 0, 0.5)',
                'rgba(255, 0, 0, 1)'
              ]
            }}
          />
          
          {/* Test 2: Object format with location - BRIGHT GREEN */}
          <HeatmapLayer
            data={[
              {
                location: new google.maps.LatLng(serreLocation.lat, serreLocation.lng),
                weight: 10
              }
            ]}
            options={{
              radius: 200,
              opacity: 1.0,
              gradient: [
                'rgba(0, 255, 0, 0)',
                'rgba(0, 255, 0, 0.6)',
                'rgba(0, 255, 0, 1)'
              ]
            }}
          />
          
          {/* Test 3: Multiple points around serre - BRIGHT BLUE */}
          <HeatmapLayer
            data={[
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng),
              new google.maps.LatLng(serreLocation.lat + 0.001, serreLocation.lng),
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng + 0.001)
            ]}
            options={{
              radius: 150,
              opacity: 1.0,
              gradient: [
                'rgba(0, 0, 255, 0)',
                'rgba(0, 0, 255, 0.7)',
                'rgba(0, 0, 255, 1)'
              ]
            }}
          />
          
          {/* Test Marker - Simple red marker for debugging */}
          <Marker
            position={new google.maps.LatLng(serreLocation.lat, serreLocation.lng)}
            title="Test Marker - Serre Center"
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="red" stroke="white" stroke-width="4"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }}
          />
        </>
      )}

      {/* Info window for selected alert */}
      {selectedAlert && (
        <InfoWindow
          position={selectedAlert.position}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 min-w-[250px]">
            <div className="flex items-start space-x-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${getAlertLevelColor(selectedAlert.alert.status_alert)}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {selectedAlert.alert.maladie}
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span><strong>Bilan:</strong> {selectedAlert.bilan?.nom || 'Inconnu'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span><strong>Niveau:</strong> {getAlertLevelText(selectedAlert.alert.status_alert)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span><strong>Statut:</strong> {selectedAlert.alert.status}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {AlertService.formatDate(selectedAlert.alert.date)}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="mt-2 w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90"
                  onClick={() => handleAlertClick(selectedAlert.alert)}
                >
                  Voir détails
                </Button>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
