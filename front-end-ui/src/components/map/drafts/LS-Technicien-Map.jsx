import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, DrawingManager, GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import deleteIcon from '../../assets/images/remove.png'; 
import BillonService from '../../services/BillonService';
const libraries = ['places', 'drawing'];
const TechnicienMapComponent = () => {
    //references
    const mapRef = useRef();
    const autocompleteRef = useRef();
    const drawingManagerRef = useRef();
    const formRef = useRef();

    //state variables
    const [currentPosition, setCurrentPosition] = useState();
    const [formVisible, setFormVisible] = useState(false);
    const [center, setCenter] = useState(currentPosition);
    const [polygonPath, setPolygonPath] = useState([]);   
    const [positions, setPositions] = useState(Array(4).fill(null));

    const [positionObjects, setPositionObjects] = useState(Array(4).fill(null));
    const [polygons, setPolygons] = useState([]);
    const [drawnMarkers, setDrawnMarkers] = useState([]);
    const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
    const [strokeColor, setStrokeColor] = useState("#ff1e1eff");
    const [billons, setBillons] = useState([]);

    // Loading Google Map API 
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        libraries
    });

    // Testting default billons
    const defaultBillons = [
  {
    billon_id: 1,
    billon_name: "Billon A",
    points: [
      { lat: 30.410509, lng: -9.555253, order_point: 1 },
      { lat: 30.410800, lng: -9.554800, order_point: 2 },
      { lat: 30.410300, lng: -9.554500, order_point: 3 },
      { lat: 30.409900, lng: -9.555100, order_point: 4 }
    ]
  },
  {
    billon_id: 2,
    billon_name: "Billon B",
    points: [
      { lat: 30.409820, lng: -9.555700, order_point: 1 },
      { lat: 30.410120, lng: -9.555230, order_point: 2 },
      { lat: 30.409950, lng: -9.554850, order_point: 3 },
      { lat: 30.409650, lng: -9.555320, order_point: 4 }
    ]
  }
    ];

    // getting billon positions from local storage
   useEffect(() => {
  const stored = localStorage.getItem('billons');

  if (!stored) {
    localStorage.setItem('billons', JSON.stringify(defaultBillons));
    setBillons(defaultBillons);
    console.log("localStorage is empty");
  } else {
    try {
      const parsed = JSON.parse(stored);
      setBillons(parsed);
    } catch (e) {
      console.error("Invalid JSON in localStorage for 'billons'. Resetting...", e);
      localStorage.removeItem('billons');
      localStorage.setItem('billons', JSON.stringify(defaultBillons));
      setBillons(defaultBillons);
    }
  }
}, []);


    //Drawining polygon
    useEffect(() => {
    if (polygonPath.length === 4) {
        const interval = setInterval(() => {
            setStrokeColor(prev => prev === "#a1ff1eff" ? "#FF4500" : "#1E90FF");
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            setStrokeColor("#4fff1eff"); 
        }, 3000);
    }
    }, [polygonPath]);

    // Getting current position
    useEffect (()=>{
            if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            const coords = { lat: latitude, lng: longitude }
                            setCurrentPosition(coords);
                            setCenter(coords);
                        },
                    (error) => console.error("Error fetching location:", error),
                    { enableHighAccuracy: true }
                );
            } else {
                    console.error("Geolocation not supported");
            }
            
        }, []);


    
    // Getting billon positions from db
 useEffect(() => {
  if (billons.length === 0) return;

  const allPolygons = billons.map(billon => {
    const sortedPoints = billon.point
      .slice()
      .sort((a, b) => a.order_point - b.order_point)
      .map(point => ({
        lat: point.lat,
        lng: point.lng,
      }));

    return sortedPoints;
  });

  console.log("Setting all polygons:", allPolygons);
  setPolygons(allPolygons);
  const updatedBillons = localStorage.getItem('billons');
  console.log("Polygone from localStorage", JSON.parse(updatedBillons))
}, [billons]);


    // Styleb
    const deleteIconStyle = {
        cursor: 'pointer',
        backgroundImage: `url(${deleteIcon})`,
        height: '24px',
        width: '24px',
        marginTop: '5px', 
        backgroundColor: '#fff',
        position: 'absolute',
        top: "2px",
        left: "52%",
        zIndex: 99999,
    }

    // Options
   const drawingManagerOptions ={
    drawingControl: true,
    drawingControlOptions: {
        position: window.google?.maps?.ControlPosition?.TOP_CENTER,
        drawingModes: [
        window.google?.maps?.drawing?.OverlayType?.MARKER,
        ]
    }
    }

    const onLoadMap = (map) => {
        mapRef.current = map;
    }

    const onLoadAutocomplete = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    }

    const onPlaceChanged = () => {
        const { geometry } = autocompleteRef.current.getPlace();
        const bounds = new window.google.maps.LatLngBounds();
        if (geometry.viewport) {
            bounds.union(geometry.viewport);
        } else {
            bounds.extend(geometry.location);
        }
        mapRef.current.fitBounds(bounds);
    }

    const onLoadDrawingManager = drawingManager => {
        drawingManagerRef.current = drawingManager;
    }

    const displayFloatingForm = (latitude, longitude, positionNumber) => {
        setFormVisible(true);
         const newPositions = [...positions];
         const newPositionsObjects = [...positionObjects];
        newPositions[positionNumber - 1] = `lat: ${latitude}, lng: ${longitude}`;
        newPositionsObjects[positionNumber - 1] = { lat: latitude, lng: longitude };
        setPositions(newPositions);
        setPositionObjects(newPositionsObjects);
        setFormVisible(true);
    }

    const onOverlayComplete = ($overlayEvent) => {
        drawingManagerRef.current.setDrawingMode(null);
        if ($overlayEvent.type === window.google.maps.drawing.OverlayType.MARKER) {
            const marker = $overlayEvent.overlay;
            console.log("Marker position:", marker.getPosition());
            const lat = marker.getPosition().lat();
            const lng = marker.getPosition().lng();
            //setCenter({ lat: positionLatitude, lng: positionLongitude });
            // Show Floating Form with marker position and handle other positions
            setDrawnMarkers(prev => [...prev, marker]);
            if (currentPositionIndex < 4) {
                displayFloatingForm(lat, lng, currentPositionIndex + 1);
                setCurrentPositionIndex(prev => prev + 1);
                console.log("Marker position Latitude:",lat, "Longitude:", lng);
            
            // Remove the marker from the map if needed
        }
    }
        
    }

    const handleBillonFormSubmit = () => {
        console.log("Billon positions:", positionObjects);

        const newBillon = {
                billon_id: 3,
                billon_name: "Billon C",
                points: positionObjects
            };
            const updatedBillons = [...billons, newBillon];

            localStorage.setItem('billons', JSON.stringify(updatedBillons));
            console.log("Billon List:", updatedBillons);
            setBillons(updatedBillons);
            setPolygons(prev => [...prev, newBillon.points]);

            console.log("Billon positions saved successfully");
                setFormVisible(false);
               // setPolygonPath(positionObjects);
               // setPolygons(prev => [...prev, positionObjects]);
               // console.log("Polygons:",polygons);
               // console.log("Type od Polygons:",typeof(polygons));

               // console.log("Polygon Path:", polygonPath);
                drawnMarkers.forEach(marker => marker.setMap(null));
                setDrawnMarkers([]);
                setPositions(Array(4).fill(null));
                setCurrentPositionIndex(0);
        //Sending Billon Postions to back-end
        // BillonService.saveBillonPosition(positions)
        //     .then(response => {
        //         console.log("Billon positions saved successfully:", response);
        //         setFormVisible(false);
        //         setPolygonPath(positions);
        //         setPositions(Array(4).fill(null));
        //         setCurrentPositionIndex(0);

        //     })
        //     .catch(error => {
        //         console.error("Error saving billon positions:", error);
        //     });

    }

    const makeMarkersNull = () => {
        drawnMarkers.forEach(marker => marker.setMap(null));
        setDrawnMarkers([]);
        setPositions(Array(4).fill(null));
        setCurrentPositionIndex(0);
        setFormVisible(false);
    }
 
    return (
        isLoaded
            ?
            <div className='map-container relative' >
                <GoogleMap
                    zoom={15}
                    center={center}
                    onLoad={onLoadMap}
                    mapContainerStyle= {{ width: '100%', height: '100vh' }}
                    mapTypeId='satellite'
               >
               <DrawingManager
                    onLoad={onLoadDrawingManager}
                    onOverlayComplete={onOverlayComplete}
                    options={drawingManagerOptions}
                />

             {polygons.length > 0 && polygons.map((p, index) => (
            <Polygon
                key={index}
                paths={[...p, p[0]]} 
                options={{
                    fillColor: "#00ff6aff",
                    fillOpacity: 0.2,
                    strokeColor: strokeColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    geodesic: false,
                    zIndex: 1
                }}
            />
)

   
)}


                    
                    <Autocomplete
                        onLoad={onLoadAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            type='text'
                            placeholder='Search Location'
                            className='box-border border border-transparent w-[240px] h-[38px] px-3 rounded-full shadow-md text-sm outline-none overflow-ellipsis absolute right-[8%] top-[11px] -ml-[120px]'
                        />
                    </Autocomplete>
                </GoogleMap>

                {formVisible && (
                    <div
                    ref={formRef}
                    style={{
                        position: 'absolute',
                        top: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#fff',
                        padding: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 999,
                        draggable: true,

                    }}
                    >
                    <form>
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i}>
                            <label>{`Position ${i + 1}:`}</label><br />
                            <input type="text" id={`${i + 1}`} value={positions[i]} readOnly /><br />
                            </div>
                        ))}
                          <button 
                            type="button"
                            className={`px-4 py-2 rounded ${positions.every(pos => pos) ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                            disabled={!positions.every(pos => pos)}
                            onClick={handleBillonFormSubmit}
                        >
                            Save
                        </button>
                        <button 
                            type="button"
                            className={`px-4 py-2 rounded ${positions.every(pos => pos) ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                            onClick={() => {
                                setFormVisible(false);
                                setPositions(Array(4).fill(null));
                                setCurrentPositionIndex(0);
                                makeMarkersNull()
                            }}
                        >
                        Cancel
                        </button>
                    </form>

                    </div>
                )}
            </div>
            :
            null
    );
}

export default TechnicienMapComponent; 