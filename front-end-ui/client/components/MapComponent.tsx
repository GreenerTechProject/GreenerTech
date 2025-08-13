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
  type: "domain" | "serre";
  name: string;
  path: google.maps.LatLng[];
  area: number; // in square meters
  center: google.maps.LatLng;
  color?: string;
  domainId?: string; // for serres, reference to parent domain
}

interface MapComponentProps {
  onShapeComplete: (shape: DrawnShape) => void;
  existingShapes: DrawnShape[];
  drawingMode: "domain" | "serre" | null;
  selectedDomainId?: string;
  className?: string;
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
  className = "w-full h-full",
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

        // Handle polygon completion
        google.maps.event.addListener(
          newDrawingManager,
          "polygoncomplete",
          (polygon: google.maps.Polygon) => {
            const path = polygon.getPath();
            const pathArray: google.maps.LatLng[] = [];

            for (let i = 0; i < path.getLength(); i++) {
              pathArray.push(path.getAt(i));
            }

            // Calculate area using Google Maps geometry library
            const area = google.maps.geometry.spherical.computeArea(path);

            // Calculate center point
            const bounds = new google.maps.LatLngBounds();
            pathArray.forEach((point) => bounds.extend(point));
            const center = bounds.getCenter();

            const shape: DrawnShape = {
              id: Date.now().toString(),
              type: drawingMode || "domain",
              name: "",
              path: pathArray,
              area,
              center,
              color: drawingMode === "serre" ? "#FF6B6B" : "#B4CC5F",
              domainId: drawingMode === "serre" ? selectedDomainId : undefined,
            };

            onShapeComplete(shape);

            // Remove the drawing
            polygon.setMap(null);
            newDrawingManager.setDrawingMode(null);
          },
        );
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
    } else {
      drawingManager.setDrawingMode(null);
    }
  }, [drawingMode, drawingManager]);

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
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy', // Better touch handling
          disableDefaultUI: false,
          mapTypeId: 'hybrid',
        }}
        onError={(error) => {
          console.error('Google Maps error:', error);
        }}
      >
        {/* Render existing shapes only if Google Maps is loaded */}
        {typeof google !== 'undefined' && shapesToDisplay.map((shape) => (
          <Polygon
            key={shape.id}
            paths={shape.path.map((point) => ({
              lat: point.lat(),
              lng: point.lng(),
            }))}
            options={{
              fillColor:
                shape.color || (shape.type === "serre" ? "#FF6B6B" : "#B4CC5F"),
              fillOpacity: 0.3,
              strokeWeight: 2,
              strokeColor: shape.type === "serre" ? "#E53E3E" : "#8FA53A",
              clickable: true,
              zIndex: shape.type === "serre" ? 2 : 1,
            }}
            onClick={() => {
              if (shape.name && map && typeof google !== 'undefined') {
                const infoWindow = new google.maps.InfoWindow({
                  content: `<div><strong>${shape.name}</strong><br/>Type: ${shape.type}<br/>Surface: ${(shape.area / 10000).toFixed(2)} hectares</div>`,
                  position: {
                    lat: shape.center.lat(),
                    lng: shape.center.lng(),
                  },
                });
                infoWindow.open(map);
              }
            }}
          />
        ))}
      </GoogleMap>

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
