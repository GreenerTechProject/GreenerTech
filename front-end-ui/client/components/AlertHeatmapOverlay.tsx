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

  // Get intuitive danger level colors for heatmap
  const getDangerLevelColor = (statusAlert: number) => {
    const level = AlertService.getAlertLevel(statusAlert);
    switch (level) {
      case 'High':
        return '#dc2626'; // Deep crimson red
      case 'Medium':
        return '#f59e0b'; // Amber orange
      case 'Low':
        return '#10b981'; // Emerald green
      default:
        return '#6b7280'; // Gray
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
      {/* Alert markers - Modern Style with Intuitive Colors */}
      {alertMarkers.map((marker) => (
        <>
          {console.log(`Rendering marker ${marker.id} at position:`, marker.position.lat(), marker.position.lng())}
          <Marker
            key={marker.id}
            position={marker.position}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <radialGradient id="markerGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="${getDangerLevelColor(marker.alert.status_alert)}" stop-opacity="0.9"/>
                      <stop offset="70%" stop-color="${getDangerLevelColor(marker.alert.status_alert)}" stop-opacity="0.7"/>
                      <stop offset="100%" stop-color="${getDangerLevelColor(marker.alert.status_alert)}" stop-opacity="0.4"/>
                    </radialGradient>
                  </defs>
                  <circle cx="14" cy="14" r="12" fill="url(#markerGradient)" stroke="${getDangerLevelColor(marker.alert.status_alert)}" stroke-width="2" filter="url(#glow)"/>
                  <path d="M14 8v8M14 16v-2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(28, 28),
              anchor: new google.maps.Point(14, 14)
            }}
            onClick={() => handleMarkerClick(marker)}
            title={`${marker.alert.maladie} - ${marker.bilan?.nom || 'Bilan inconnu'}`}
          />
        </>
      ))}

      {/* Primary Alert Heatmap - Intuitive Danger Levels */}
      {heatmapPoints.length > 0 && (
        <>
          {console.log('Rendering intuitive danger level HeatmapLayer with', heatmapPoints.length, 'points')}
          <HeatmapLayer
            data={heatmapPoints}
            options={{
              radius: 100,
              opacity: 0.85,
              gradient: [
                'rgba(16, 185, 129, 0)',      // Transparent emerald green
                'rgba(16, 185, 129, 0.2)',    // Faint emerald green
                'rgba(34, 197, 94, 0.4)',     // Green
                'rgba(59, 130, 246, 0.6)',    // Blue
                'rgba(245, 158, 11, 0.8)',    // Amber orange
                'rgba(220, 38, 38, 1)'        // Deep crimson red
              ]
            }}
          />
        </>
      )}

      {/* Alert Level-Specific Heatmaps for Better Visibility */}
      {heatmapPoints.length > 0 && (
        <>
          {/* Low Level Alerts - Green to Cyan */}
          <HeatmapLayer
            data={heatmapPoints.filter(point => point.weight === 1)}
            options={{
              radius: 80,
              opacity: 0.9,
              gradient: [
                'rgba(16, 185, 129, 0)',      // Transparent
                'rgba(16, 185, 129, 0.3)',    // Emerald green
                'rgba(34, 197, 94, 0.6)',     // Green
                'rgba(6, 182, 212, 1)'        // Cyan
              ]
            }}
          />
          
          {/* Medium Level Alerts - Yellow to Orange */}
          <HeatmapLayer
            data={heatmapPoints.filter(point => point.weight === 2)}
            options={{
              radius: 90,
              opacity: 0.9,
              gradient: [
                'rgba(245, 158, 11, 0)',      // Transparent
                'rgba(245, 158, 11, 0.4)',    // Amber
                'rgba(251, 146, 60, 0.7)',    // Orange
                'rgba(249, 115, 22, 1)'       // Deep orange
              ]
            }}
          />
          
          {/* High Level Alerts - Red to Deep Crimson */}
          <HeatmapLayer
            data={heatmapPoints.filter(point => point.weight === 3)}
            options={{
              radius: 110,
              opacity: 0.95,
              gradient: [
                'rgba(239, 68, 68, 0)',       // Transparent
                'rgba(239, 68, 68, 0.5)',     // Red
                'rgba(220, 38, 38, 0.8)',     // Deep red
                'rgba(185, 28, 28, 1)'        // Deep crimson
              ]
            }}
          />
        </>
      )}

      {/* Test heatmap with intuitive danger levels at serre center for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {console.log('Rendering intuitive danger level test heatmap at serre center')}
          
          {/* Test 1: Green to Cyan - Low Level Style */}
          <HeatmapLayer
            data={[
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng)
            ]}
            options={{
              radius: 250,
              opacity: 0.9,
              gradient: [
                'rgba(16, 185, 129, 0)',      // Transparent
                'rgba(16, 185, 129, 0.3)',    // Emerald green
                'rgba(6, 182, 212, 0.7)',     // Cyan
                'rgba(6, 182, 212, 1)'        // Bright cyan
              ]
            }}
          />
          
          {/* Test 2: Yellow to Orange - Medium Level Style */}
          <HeatmapLayer
            data={[
              {
                location: new google.maps.LatLng(serreLocation.lat, serreLocation.lng),
                weight: 10
              }
            ]}
            options={{
              radius: 200,
              opacity: 0.9,
              gradient: [
                'rgba(245, 158, 11, 0)',      // Transparent
                'rgba(245, 158, 11, 0.4)',    // Amber
                'rgba(249, 115, 22, 0.8)',    // Deep orange
                'rgba(249, 115, 22, 1)'       // Bright orange
              ]
            }}
          />
          
          {/* Test 3: Red to Deep Crimson - High Level Style */}
          <HeatmapLayer
            data={[
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng),
              new google.maps.LatLng(serreLocation.lat + 0.001, serreLocation.lng),
              new google.maps.LatLng(serreLocation.lat, serreLocation.lng + 0.001)
            ]}
            options={{
              radius: 150,
              opacity: 0.9,
              gradient: [
                'rgba(239, 68, 68, 0)',       // Transparent
                'rgba(239, 68, 68, 0.5)',     // Red
                'rgba(185, 28, 28, 0.8)',     // Deep crimson
                'rgba(185, 28, 28, 1)'        // Bright deep crimson
              ]
            }}
          />
          
          {/* Test Marker - Modern style marker for debugging */}
          <Marker
            position={new google.maps.LatLng(serreLocation.lat, serreLocation.lng)}
            title="Test Marker - Serre Center (Intuitive Danger Levels)"
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="testGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
                      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.6"/>
                      <stop offset="100%" stop-color="#dc2626" stop-opacity="0.4"/>
                    </radialGradient>
                  </defs>
                  <circle cx="16" cy="16" r="14" fill="url(#testGradient)" stroke="#dc2626" stroke-width="3"/>
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
