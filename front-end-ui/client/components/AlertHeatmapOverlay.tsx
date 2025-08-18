import React, { useEffect, useState, useCallback } from 'react';
import { Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Alert } from '@/types/alert';
import { AlertService } from '@/services/alertService';
import { bilanService, Bilan } from '@/services/bilanService';
import { AlertTriangle, MapPin, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertHeatmapOverlayProps {
  serreId: number;
  serreName: string;
  serreLocation: { lat: number; lng: number };
  onAlertClick?: (alert: Alert) => void;
  onInterventionClick?: (alert: Alert) => void;
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
  onAlertClick,
  onInterventionClick
}: AlertHeatmapOverlayProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



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

            
            // Convert normalized coordinates to actual map coordinates
            const actualCoords = convertNormalizedToMapCoordinates(alert.x1, alert.y1);
            const position = new google.maps.LatLng(actualCoords.lat, actualCoords.lng);

            
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
          }
        });

        setAlertMarkers(markers);
        setHeatmapPoints(heatmapData);



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

  const handleInterventionClick = useCallback((alert: Alert) => {
    if (onInterventionClick) {
      onInterventionClick(alert);
    }
  }, [onInterventionClick]);

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
            <div className="p-0 min-w-[240px] max-w-[260px]">
              {/* Compact Card Container */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                 {/* Header with Two-Column Layout */}
                 <div className="px-3 py-2 border-b border-gray-200">
                   <div className="flex items-center justify-between">
                     {/* Left: Alert Type */}
                     <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-gray-900 text-sm truncate">
                         {selectedAlert.alert.maladie}
                       </h3>
                     </div>
                     
                     {/* Right: Status/Severity Badge */}
                     <div className="flex-shrink-0 ml-2">
                       <div className={cn(
                         "px-2 py-1 rounded-full text-xs font-semibold text-white",
                         getAlertLevelColor(selectedAlert.alert.status_alert) === 'bg-red-500' && "bg-red-500",
                         getAlertLevelColor(selectedAlert.alert.status_alert) === 'bg-orange-500' && "bg-orange-500",
                         getAlertLevelColor(selectedAlert.alert.status_alert) === 'bg-yellow-500' && "bg-yellow-500"
                       )}>
                         {getAlertLevelText(selectedAlert.alert.status_alert)}
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Compact Content with Professional Icons */}
                 <div className="p-3 space-y-0">
                   {/* Bilan Information */}
                   <div className="flex items-center space-x-3 py-2">
                     <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                     <span className="text-xs font-medium text-gray-600 w-16">Bilan:</span>
                     <span className="text-xs text-gray-900 truncate flex-1">
                       {selectedAlert.bilan?.nom || 'Inconnu'}
                     </span>
                   </div>
                   
                   {/* Divider */}
                   <div className="border-t border-gray-100 mx-2"></div>
                   
                   {/* Alert Level */}
                   <div className="flex items-center space-x-3 py-2">
                     <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                     <span className="text-xs font-medium text-gray-600 w-16">Niveau:</span>
                     <span className="text-xs text-gray-900">
                       {getAlertLevelText(selectedAlert.alert.status_alert)}
                     </span>
                   </div>
                   
                   {/* Divider */}
                   <div className="border-t border-gray-100 mx-2"></div>
                   
                   {/* Status */}
                   <div className="flex items-center space-x-3 py-2">
                     <Circle className={cn(
                       "w-4 h-4 flex-shrink-0",
                       selectedAlert.alert.status === 'résolue' 
                         ? "text-green-600 fill-green-600"
                         : "text-red-600 fill-red-600"
                     )} />
                     <span className="text-xs font-medium text-gray-600 w-16">Statut:</span>
                     <div className={cn(
                       "px-2 py-0.5 rounded-full text-xs font-semibold",
                       selectedAlert.alert.status === 'résolue' 
                         ? "bg-green-100 text-green-800 border border-green-200"
                         : "bg-red-100 text-red-800 border border-red-200"
                     )}>
                       {selectedAlert.alert.status === 'résolue' ? 'Résolue' : 'Non Résolue'}
                     </div>
                   </div>
                   
                   {/* Divider */}
                   <div className="border-t border-gray-100 mx-2"></div>
                   
                   {/* Detection Time */}
                   <div className="flex items-center space-x-3 py-2">
                     <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                     <span className="text-xs font-medium text-gray-600 w-16">Détecté:</span>
                     <span className="text-xs text-gray-900">
                       {AlertService.formatDate(selectedAlert.alert.date)}
                     </span>
                   </div>
                 </div>
                 
                 {/* Compact Action Buttons */}
                 <div className="px-2 py-2 border-t border-gray-200">
                   <div className="flex space-x-2">
                     <Button
                       size="sm"
                       variant="outline"
                       className="flex-1 h-7 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 transition-all duration-200 font-medium text-xs px-2"
                       onClick={() => handleInterventionClick(selectedAlert.alert)}
                     >
                       <AlertTriangle className="h-3 w-3 mr-1" />
                       Intervention
                     </Button>
                     <Button
                       size="sm"
                       className="flex-1 h-7 bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 transition-all duration-200 font-medium shadow-sm text-xs px-2"
                       onClick={() => handleAlertClick(selectedAlert.alert)}
                     >
                       <MapPin className="h-3 w-3 mr-1" />
                       Voir détails
                     </Button>
                   </div>
                 </div>
              </div>
            </div>
          </InfoWindow>
        )}
    </>
  );
}
