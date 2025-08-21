import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  GoogleMap,
  DrawingManager,
  Polygon,
  Marker,
} from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

export interface DrawnShape {
  id: string;
  type: "domain" | "serre" | "bilan";
  name: string;
  path: google.maps.LatLng[];
  area: number; // in square meters
  center: google.maps.LatLng;
  color?: string;
  domainId?: string; // for serres, reference to parent domain
  serreId?: string; // for bilans, reference to parent serre
  metadata?: {
    domainName?: string;
    serreName?: string;
    bilanType?: string;
  };
}

interface MapComponentProps {
  onShapeComplete: (shape: DrawnShape) => void;
  existingShapes: DrawnShape[];
  drawingMode: "domain" | "serre" | null;
  selectedDomainId?: string;
  selectedSerreId?: string; // Add selected serre ID prop
  className?: string;
  onShapeClick?: (shape: DrawnShape) => void; // New prop for shape clicks
  onMapClick?: () => void; // Add map click handler prop
  hideZoomControls?: boolean;
  hideInfoPanel?: boolean;
  focusPath?: { lat: number; lng: number }[] | null;
  focusCenter?: { lat: number; lng: number } | null;
  focusZoom?: number;
}

interface MapComponentProps {
  onShapeComplete: (shape: DrawnShape) => void;
  existingShapes: DrawnShape[];
  drawingMode: "domain" | "serre" | null;
  selectedDomainId?: string;
  className?: string;
  hideZoomControls?: boolean;
  hideInfoPanel?: boolean;
  focusPath?: { lat: number; lng: number }[] | null;
  focusCenter?: { lat: number; lng: number } | null;
  focusZoom?: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
  minWidth: "300px",
};

export default function MapComponent({
  onShapeComplete,
  existingShapes,
  drawingMode,
  selectedDomainId,
  selectedSerreId,
  className = "w-full h-full",
  onShapeClick,
  onMapClick,
  hideZoomControls = false,
  hideInfoPanel = false,
  focusPath = null,
  focusCenter = null,
  focusZoom = 16,
}: MapComponentProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 33.9716, lng: -6.8498 }); // Default to Morocco center
  const [searchMarkers, setSearchMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedShape, setSelectedShape] = useState<DrawnShape | null>(null);
  const [hoveredShape, setHoveredShape] = useState<DrawnShape | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPolygonId, setHoveredPolygonId] = useState<string | null>(null);

  // Function to zoom to a specific shape
  const zoomToShape = useCallback((shape: DrawnShape) => {
    if (map && shape.path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Add all points to bounds
      shape.path.forEach(point => bounds.extend(point));
      
      // Add center point to ensure it's visible
      bounds.extend(shape.center);
      
      // Fit map to bounds with padding
      map.fitBounds(bounds);
      
      // Add some padding and zoom out slightly for better view
      const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
      
      // No explicit setBounds API; fitBounds is sufficient
    }
  }, [map]);

  // Programmatic focus to a given path or center
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (focusPath && focusPath.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      focusPath.forEach((pt) => bounds.extend(new google.maps.LatLng(pt.lat, pt.lng)));
      map.fitBounds(bounds);
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom() > focusZoom) {
          map.setZoom(focusZoom);
        }
      });
      return;
    }

    if (focusCenter) {
      map.panTo(focusCenter);
      map.setZoom(focusZoom);
    }
  }, [map, focusPath, focusCenter, focusZoom]);

  // Handle shape click with zoom and callback
  const handleShapeClick = useCallback((shape: DrawnShape) => {
    // Set selected shape for info panel
    setSelectedShape(shape);
    
    // Zoom to the clicked shape
    zoomToShape(shape);
    
    // Call the parent callback if provided
    if (onShapeClick) {
      onShapeClick(shape);
    }
  }, [zoomToShape, onShapeClick]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
        },
        (error) => {
          console.warn("Error getting user location:", error);
          // Keep fallback to Morocco center
        },
      );
    }
  }, []);

  // Handle window resize to ensure map displays properly
  useEffect(() => {
    const handleResize = () => {
      if (map && typeof google !== 'undefined' && google.maps) {
        // Trigger a resize event on the map to ensure it renders correctly
        google.maps.event.trigger(map, 'resize');
        
        // Force a repaint by temporarily changing zoom and restoring it
        const currentZoom = map.getZoom();
        if (currentZoom) {
          map.setZoom(currentZoom + 0.001);
          setTimeout(() => map.setZoom(currentZoom), 100);
        }
      }
    };

    // Handle both resize and orientation change
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Also handle when the container becomes visible
    const observer = new ResizeObserver(handleResize);
    const mapContainer = document.querySelector('[data-testid="map-section"]');
    if (mapContainer) {
      observer.observe(mapContainer);
    }

    // Initial resize after a short delay to ensure proper sizing
    const initialResize = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
      clearTimeout(initialResize);
    };
  }, [map]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      setMapLoaded(true);

      // Set map type to hybrid/satellite explicitly
      if (typeof google !== 'undefined' && google.maps) {
        console.log('Setting map to hybrid view');
        console.log('Available map types:', {
          roadmap: google.maps.MapTypeId.ROADMAP,
          satellite: google.maps.MapTypeId.SATELLITE,
          hybrid: google.maps.MapTypeId.HYBRID,
          terrain: google.maps.MapTypeId.TERRAIN
        });
        console.log('Initial map type:', map.getMapTypeId());
        // Try hybrid first, then satellite
        try {
          map.setMapTypeId('hybrid');
          console.log('After setting hybrid, map type:', map.getMapTypeId());
        } catch (error) {
          console.log('Error setting hybrid, trying satellite:', error);
          try {
            map.setMapTypeId('satellite');
            console.log('After setting satellite, map type:', map.getMapTypeId());
          } catch (satelliteError) {
            console.log('Error setting satellite view:', satelliteError);
          }
        }
        
        // Verify the change took effect
        setTimeout(() => {
          console.log('Verification - current map type:', map.getMapTypeId());
        }, 100);
      } else {
        console.log('Google Maps API not available yet');
      }

      // Ensure the map is properly sized and set hybrid view
      setTimeout(() => {
        if (typeof google !== 'undefined' && google.maps) {
          google.maps.event.trigger(map, 'resize');
          // Double-check hybrid view is set
          try {
            map.setMapTypeId('hybrid');
          } catch (error) {
            console.log('Error setting hybrid in timeout:', error);
          }
        }
      }, 100);

      // Additional timeout to ensure hybrid view is set after API is fully loaded
      setTimeout(() => {
        if (map && typeof google !== 'undefined' && google.maps) {
          console.log('Delayed hybrid view setting');
          try {
            map.setMapTypeId('hybrid');
            console.log('Final map type (hybrid):', map.getMapTypeId());
          } catch (error) {
            console.log('Error setting hybrid view, trying satellite:', error);
            try {
              map.setMapTypeId('satellite');
              console.log('Satellite map type set:', map.getMapTypeId());
            } catch (satelliteError) {
              console.log('Error setting satellite view:', satelliteError);
            }
          }
        }
      }, 500);

      // Initialize drawing manager only if Google Maps is loaded
      if (typeof google !== 'undefined' && google.maps && google.maps.drawing) {
        const newDrawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          polygonOptions: {
            fillColor: "#B4CC5F",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#8FA53A",
            clickable: true,
            editable: true,
            zIndex: 1,
          },
        });

        newDrawingManager.setMap(map);
        setDrawingManager(newDrawingManager);

        // Listener is attached in the drawing mode effect to keep latest mode
      }
    },
    [drawingMode, selectedDomainId, onShapeComplete],
  );

  const onUnmount = useCallback(() => {
    setMap(null);
    setDrawingManager(null);
  }, []);

  // Search functionality
  const handleSearch = (query: string) => {
    if (!map || !query.trim() || typeof google === 'undefined') return;

    const service = new google.maps.places.PlacesService(map);
    const request: google.maps.places.TextSearchRequest = {
      query: query,
      location: map.getCenter(),
      radius: 50000, // 50km radius
    };

    service.textSearch(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results &&
        results[0]
      ) {
        const place = results[0];
        if (place.geometry && place.geometry.location) {
          map.setCenter(place.geometry.location);
          map.setZoom(15);

          // Clear previous search markers
          searchMarkers.forEach((marker) => marker.setMap(null));

          // Add a marker for the searched location
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.58172 7.02944 2 12 2S21 5.58172 21 10Z" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
                  <circle cx="12" cy="10" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 23),
            },
          });

          setSearchMarkers([marker]);
        }
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputRef.current) {
      handleSearch(searchInputRef.current.value);
    }
  };

  const goToCurrentLocation = () => {
    if (navigator.geolocation && map && typeof google !== 'undefined') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(location);
          map.setZoom(15);

          // Clear previous search markers
          searchMarkers.forEach((marker) => marker.setMap(null));

          // Add a marker for current location
          const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: "Your current location",
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            },
          });

          setSearchMarkers([marker]);
        },
        (error) => {
          console.error("Error getting current location:", error);
        },
      );
    }
  };

  // Update drawing mode
  useEffect(() => {
    if (!drawingManager || typeof google === 'undefined') return;

    if (drawingMode) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);

      // Update polygon options based on drawing mode
      const options = {
        fillColor: drawingMode === "serre" ? "#FF6B6B" : "#B4CC5F",
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: drawingMode === "serre" ? "#E53E3E" : "#8FA53A",
        clickable: true,
        editable: true,
        zIndex: drawingMode === "serre" ? 2 : 1,
      };

      drawingManager.setOptions({
        polygonOptions: options,
      });

      // Rebind polygoncomplete listener with current drawingMode
      google.maps.event.clearListeners(drawingManager, 'polygoncomplete');
      google.maps.event.addListener(
        drawingManager,
        'polygoncomplete',
        (polygon: google.maps.Polygon) => {
          const path = polygon.getPath();
          const pathArray: google.maps.LatLng[] = [];
          for (let i = 0; i < path.getLength(); i++) {
            pathArray.push(path.getAt(i));
          }

          const area = google.maps.geometry.spherical.computeArea(path);
          const bounds = new google.maps.LatLngBounds();
          pathArray.forEach((point) => bounds.extend(point));
          const center = bounds.getCenter();

          const shape: DrawnShape = {
            id: Date.now().toString(),
            type: drawingMode,
            name: "",
            path: pathArray,
            area,
            center,
            color: drawingMode === 'serre' ? '#FF6B6B' : '#B4CC5F',
            domainId: drawingMode === 'serre' ? selectedDomainId : undefined,
          };

          onShapeComplete(shape);

          // Clean up polygon and stop drawing
          polygon.setMap(null);
          drawingManager.setDrawingMode(null);
        }
      );
    } else {
      drawingManager.setDrawingMode(null);
      // Clear listeners when not drawing
      google.maps.event.clearListeners(drawingManager, 'polygoncomplete');
    }
  }, [drawingMode, drawingManager, selectedDomainId, onShapeComplete]);

  // Ensure hybrid/satellite view is set when map is available
  useEffect(() => {
    if (map && typeof google !== 'undefined' && google.maps) {
              console.log('useEffect: Setting map to hybrid view');
      try {
        // Try hybrid first, then satellite
        try {
          map.setMapTypeId('hybrid');
          console.log('useEffect: Current map type (hybrid):', map.getMapTypeId());
        } catch (error) {
          console.log('useEffect: Error setting hybrid, trying satellite:', error);
          try {
            map.setMapTypeId('satellite');
            console.log('useEffect: Current map type (satellite):', map.getMapTypeId());
          } catch (satelliteError) {
            console.log('useEffect: Error setting satellite view:', satelliteError);
          }
        }
        
        // Add a listener to monitor map type changes
        const listener = google.maps.event.addListener(map, 'maptypeid_changed', () => {
          console.log('Map type changed to:', map.getMapTypeId());
        });
        
        return () => {
          google.maps.event.removeListener(listener);
        };
      } catch (error) {
        console.log('useEffect: Error setting satellite view:', error);
      }
    }
  }, [map]);

  // Filter shapes to display
  const shapesToDisplay = existingShapes.filter((shape) => {
    if (
      drawingMode === "serre" &&
      shape.type === "domain" &&
      shape.id !== selectedDomainId
    ) {
      return false;
    }
    return true;
  });

  // Debug: Log what shapes are being displayed
  console.log("MapComponent - existingShapes:", existingShapes);
  console.log("MapComponent - shapesToDisplay:", shapesToDisplay);
  console.log("MapComponent - drawingMode:", drawingMode);
  console.log("MapComponent - selectedDomainId:", selectedDomainId);

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      {/* Search Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location..."
            className="w-64 bg-white shadow-lg"
          />
          <Button type="submit" size="sm" variant="default">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={goToCurrentLocation}
          className="bg-white shadow-lg"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation}
        zoom={15}
        mapTypeId="hybrid"
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick} // Add map click handler
        options={{
          zoomControl: !hideZoomControls,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy', // Better touch handling
          disableDefaultUI: false,
          mapTypeId: 'hybrid',
        }}
      >
        {/* Render existing shapes only if Google Maps is loaded */}
        {typeof google !== 'undefined' && shapesToDisplay.map((shape) => {
          console.log("Rendering shape:", shape);
          
          // Enhanced colors and styling based on shape type
          let fillColor = shape.color;
          let strokeColor = shape.color;
          let fillOpacity = 0.3;
          let strokeWeight = 2;
          let zIndex = 1;
          let hoverColor = "#FFD700"; // Gold hover color
          
          // Check if this shape is selected
          const isSelectedDomain = shape.type === 'domain' && shape.id === selectedDomainId;
          const isSelectedSerre = shape.type === 'serre' && shape.id === selectedSerreId;
          
          if (!fillColor) {
            switch (shape.type) {
              case "domain":
                fillColor = "#4CAF50"; // Green
                strokeColor = "#2E7D32";
                fillOpacity = 0.4;
                zIndex = 1;
                break;
              case "serre":
                fillColor = "#FF5722"; // Red-Orange
                strokeColor = "#D84315";
                fillOpacity = 0.5;
                zIndex = 2;
                break;
              case "bilan":
                fillColor = "#2196F3"; // Blue
                strokeColor = "#1565C0";
                fillOpacity = 0.6;
                strokeWeight = 3;
                zIndex = 3;
                break;
              default:
                fillColor = "#9E9E9E";
                strokeColor = "#616161";
            }
          }
          
          // Apply selection highlighting
          if (isSelectedDomain) {
            strokeColor = "#FFD700"; // Gold for selected domain
            strokeWeight = 4;
            fillOpacity = 0.6;
            zIndex = 10;
          } else if (isSelectedSerre) {
            strokeColor = "#FFD700"; // Gold for selected serre
            strokeWeight = 4;
            fillOpacity = 0.7;
            zIndex = 11;
          }
          
          return (
            <Polygon
              key={shape.id}
              paths={shape.path.map((point) => ({
                lat: point.lat(),
                lng: point.lng(),
              }))}
              options={{
                fillColor,
                fillOpacity,
                strokeWeight,
                strokeColor,
                clickable: true,
                zIndex,
                // Add some cool visual effects
                strokeOpacity: 0.8,
                // Add a subtle shadow effect
                strokePosition: google.maps.StrokePosition.OUTSIDE,
              }}
              onClick={() => handleShapeClick(shape)}
              onMouseOver={(e) => {
                // Set hovered shape and mouse position
                setHoveredShape(shape);
                const domEvent = (e as any).domEvent as MouseEvent | undefined;
                if (domEvent) {
                  setMousePosition({
                    x: domEvent.clientX,
                    y: domEvent.clientY
                  });
                }
                // Use state-driven hover styling instead of mutating polygon instance
                setHoveredPolygonId(shape.id);
              }}
              onMouseOut={(e) => {
                // Clear hovered shape
                setHoveredShape(null);
                setHoveredPolygonId((curr) => (curr === shape.id ? null : curr));
              }}
            />
          );
        })}
      </GoogleMap>

      {/* Cool Floating Info Panel */}
      {!hideInfoPanel && selectedShape && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm animate-in slide-in-from-right duration-300 z-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: selectedShape.type === 'domain' ? '#4CAF50' : 
                                selectedShape.type === 'serre' ? '#FF5722' : '#2196F3' 
                }}
              ></div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {selectedShape.type === 'domain' ? 'Domaine' : 
                 selectedShape.type === 'serre' ? 'Serre' : 'Bilan'}
              </span>
            </div>
            <button
              onClick={() => setSelectedShape(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedShape.name}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Surface:</span>
              <span className="font-medium">{(selectedShape.area / 10000).toFixed(2)} ha</span>
            </div>
            
            {selectedShape.metadata?.domainName && (
              <div className="flex justify-between">
                <span>Domaine:</span>
                <span className="font-medium">{selectedShape.metadata.domainName}</span>
              </div>
            )}
            
            {selectedShape.metadata?.serreName && (
              <div className="flex justify-between">
                <span>Serre:</span>
                <span className="font-medium">{selectedShape.metadata.serreName}</span>
              </div>
            )}
            
            {selectedShape.metadata?.bilanType && (
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{selectedShape.metadata.bilanType}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => zoomToShape(selectedShape)}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔍 Zoom sur la zone
            </button>
          </div>
        </div>
      )}


      {/* Zoom Control Panel */}
      {!hideZoomControls && (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-40 backdrop-blur-sm bg-white/90">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => map?.setZoom((map.getZoom() || 10) + 1)}
            className="w-8 h-8 bg-white border border-gray-300 rounded-t-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Zoom In"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => map?.setZoom((map.getZoom() || 10) - 1)}
            className="w-8 h-8 bg-white border border-gray-300 rounded-b-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Zoom Out"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>
      )}

      {/* Cool Hover Tooltip */}
      {hoveredShape && (
        <div 
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 30,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium">{hoveredShape.name}</div>
          <div className="text-gray-300">
            {hoveredShape.type === 'domain' ? 'Domaine' : 
             hoveredShape.type === 'serre' ? 'Serre' : 'Bilan'} • 
            {(hoveredShape.area / 10000).toFixed(2)} ha
          </div>
        </div>
      )}

      {/* Fallback display if map fails to load */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
}
