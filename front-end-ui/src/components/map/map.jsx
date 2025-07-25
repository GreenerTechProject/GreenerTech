    
    
import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, DrawingManager, GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import deleteIcon from '../../assets/images/remove.png'; 
import BillonService from '../../services/BillonService';
const libraries = ['places', 'drawing'];
const TechnicienMapComponent = () => {
    const mapRef = useRef();
    const autocompleteRef = useRef();
    const drawingManagerRef = useRef();
    const [formVisible, setFormVisible] = useState(false);
    const formRef = useRef();
    const [currentPosition, setCurrentPosition] = useState({lat : 30.4278, lng:-9.5981});
    const [center, setCenter] = useState(currentPosition);
    const [positions, setPositions] = useState(Array(4).fill(null));
    const [enableDrawing, setEnabledDrawing] = useState(false);
    const [polygonPath, setPolygonPath] = useState([]);
    const [positionObjects, setPositionObjects] = useState(Array(4).fill(null));
    const [polygons, setPolygons] = useState([]);
    const [drawnMarkers, setDrawnMarkers] = useState([]);
    const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
    // Loading Google Map API 
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        libraries
    });

    useEffect(() => {
    if (polygonPath.length === 4) {
        let flashing = true;
        const interval = setInterval(() => {
            setStrokeColor(prev => prev === "#1E90FF" ? "#FF4500" : "#1E90FF");
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            setStrokeColor("#1E90FF"); // Reset
        }, 3000);
    }
}, [polygonPath]);

const [strokeColor, setStrokeColor] = useState("#1E90FF");

    // Styles
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
        console.log("Billon positions:", positions);
        console.log("Billon positions saved successfully");
                setFormVisible(false);
                setPolygonPath(positionObjects);
                setPolygons(prev => [...prev, positionObjects]);
                console.log("Polygon Path:", polygonPath);
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
 
    return (
        isLoaded
            ?
            <div className='map-container relative' >
                <GoogleMap
                    zoom={15}
                    center={center}
                    onLoad={onLoadMap}
                    mapContainerStyle= {{ width: '100%', height: '100vh' }}

           >
               <DrawingManager
                    onLoad={onLoadDrawingManager}
                    onOverlayComplete={onOverlayComplete}
                    options={drawingManagerOptions}
                />

             {polygons.length > 0 && polygons.map((p, index) => (
    <Polygon
        key={index}
        paths={[...p, p[0]]} // Ensure polygon is closed
        options={{
            fillColor: "#00BFFF",
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