import React, { useEffect, useState } from 'react';
import { GoogleMap, HeatmapLayerF, LoadScript } from '@react-google-maps/api';
import axios from 'axios';

const mapContainerStyle = {
  height: '500px',
  width: '100%',
};

const center = {
  lat: -1.2921,
  lng: 36.8219,
};

const fakeAlerts = [
  { y1: -1.2921, x1: 36.8219 },
  { y1: -1.2910, x1: 36.8200 },
  { y1: -1.2935, x1: 36.8230 },
  { y1: -1.2905, x1: 36.8220 },
  { y1: -1.2940, x1: 36.8245 }
];

const AlertHeatMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false); // optional: helps with debugging

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/alerte`);
        const alertData = response.data;

        const dataToUse = (!alertData || alertData.length === 0)
          ? fakeAlerts
          : alertData;

        const formatted = dataToUse
          .filter(a => a.x1 && a.y1)
          .map(alert => ({
            location: new window.google.maps.LatLng(alert.y1, alert.x1),
            weight: 1
          }));

        setHeatmapData(formatted);
      } catch (error) {
        console.error("Failed to fetch alerts. Using fallback data.", error);
        const fallbackData = fakeAlerts.map(alert => ({
          location: new window.google.maps.LatLng(alert.y1, alert.x1),
          weight: 1
        }));
        setHeatmapData(fallbackData);
      }
    };

    if (window.google && window.google.maps) {
      loadData();
    } else {
      // Retry after maps are loaded
      setTimeout(loadData, 1000);
    }
  }, []);

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyBU1VhlgGYX7SXOH1EIGIxkeF7C8YTEomk"
      libraries={['visualization']}
      onLoad={() => setMapLoaded(true)}
    >
      {mapLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
        >
          {heatmapData.length > 0 && (
            <HeatmapLayerF
              data={heatmapData}
              options={{
                radius: 30,
                opacity: 0.6,
                gradient: [
                  'rgba(0, 255, 255, 0)',
                  'rgba(0, 255, 255, 1)',
                  'rgba(0, 191, 255, 1)',
                  'rgba(0, 127, 255, 1)',
                  'rgba(0, 63, 255, 1)',
                  'rgba(0, 0, 255, 1)',
                  'rgba(0, 0, 223, 1)',
                  'rgba(0, 0, 191, 1)',
                  'rgba(0, 0, 159, 1)',
                  'rgba(0, 0, 127, 1)',
                  'rgba(63, 0, 91, 1)',
                  'rgba(127, 0, 63, 1)',
                  'rgba(191, 0, 31, 1)',
                  'rgba(255, 0, 0, 1)'
                ]
              }}
            />
          )}
        </GoogleMap>
      )}
    </LoadScript>
  );
};

export default AlertHeatMap;
