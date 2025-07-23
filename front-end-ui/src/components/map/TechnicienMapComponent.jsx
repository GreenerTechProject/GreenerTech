import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, DrawingManager, GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';

import defaultBillons from '../../data/defaultBillons';
import BillonService from '../../services/BillonService';
import PopUp from '../utils/messages/PopUp';
import FloatingDashboardFAB from './FloatingDashboardFAB';


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
    const [positions, setPositions] = useState(Array(4).fill(null)); // String Format of the positions
    const [positionObjects, setPositionObjects] = useState(Array(4).fill(null)); // Billon Area Position

    const [drawnMarkers, setDrawnMarkers] = useState([]);
    const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
    const [polygonPath, setPolygonPath] = useState([]);

    const [billons, setBillons] = useState([]); // represents the state of the fetched billons data
    const [strokeColor, setStrokeColor] = useState("#ff1e1eff");
    
    const [mapLoaded, setMapLoaded] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const [popupMessage, setPopUpMessage] = useState('please do not add anymore position , only four are accepted!');
    const infoWindowRef = useRef(null);

    // Loading Google Map API 
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        libraries
    });

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
            billons.map(billon => {
            const sortedPoints = billon.points
                .slice()
                .sort((a, b) => a.order_point - b.order_point)
            
            return {
                points: sortedPoints,
                billon_id: billon.billon_id,
                billon_name: billon.billon_name
            };
            });

        
        const updatedBillons = localStorage.getItem('billons');
        console.log("Polygone from localStorage", JSON.parse(updatedBillons))
    }, [billons]);

   
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
        setMapLoaded(true);
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
        newPositionsObjects[positionNumber - 1] = { lat: latitude, lng: longitude, order_point: positionNumber };
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
            setDrawnMarkers(prev => [...prev, marker]);
            if (currentPositionIndex < 4) {
                displayFloatingForm(lat, lng, currentPositionIndex + 1);
                setCurrentPositionIndex(prev => prev + 1);
                console.log("Marker position Latitude:",lat, "Longitude:", lng);
             } else {
                makeMarkersNull();
                drawnMarkers.forEach(marker => marker.setMap(null));

                setShowPopup(true);
                
             }
       
    }
        
    }

    const handleBillonFormSubmit = () => {
        console.log("Billon positions:", positionObjects);
        const newBillon = {
            billon_id: billons.length + 1,  // Assign a new ID
            billon_name: `Billon ${billons.length + 1}`,
            points: positionObjects.map((pos, idx) => ({
            ...pos,
            order_point: idx + 1  // Ensure order_point is set
            }))
        };

        const updatedBillons = [...billons, newBillon];

        localStorage.setItem('billons', JSON.stringify(updatedBillons));
        console.log("Billon List:", updatedBillons);
        setBillons(updatedBillons);

        console.log("Billon positions saved successfully");
            setFormVisible(false);
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

    const deleteBillon = async(billon_id) => {
        const filteredBillons =billons.filter((b)=>{
              return b.billon_id !== billon_id 
        })

        setBillons(filteredBillons);
        localStorage.setItem('billons',  JSON.stringify(filteredBillons));

        // Using database
        // const res_status = BillonService.deleteBillon(billon_id);
        // if (res_status) {
        //     console.log("deleted successfully");
        // } else {
        //     console.log("delete operation failed!");
        // }
    }

    


    const showInfoBillon = (e, billon) => {
            if (!mapRef.current || !mapLoaded) return;

            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }
            
            infoWindowRef.current = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; min-width: 150px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">Billon Information</h3>
                        <p style="margin: 4px 0; color: #555;"><strong>ID:</strong> ${billon.billon_id}</p>
                        <p style="margin: 4px 0; color: #555;"><strong>Name:</strong> ${billon.billon_name}</p>
                        <button id="delete-billon-btn" style="margin-top: 8px; padding: 6px 10px; background-color: red; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Supprimer
                        </button>                    
                    </div>
                `,
                position: e.latLng
            });

            infoWindowRef.current.open(mapRef.current);
            infoWindowRef.current.addListener("domready", () => {
            const btn = document.getElementById("delete-billon-btn");
            if (btn) {
                btn.addEventListener("click", () => {
                deleteBillon(billon.billon_id);
                });
            }
            });
        };

    const redirectToBillonDetails = (p) => {
        //Are we gonna use router tantack or just react-router-dom?
        console.log("Redirecting to Billon Details with info:", p.billon_name);
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
                    {billons.length > 0 && billons.map((b, index) => (
                    <Polygon
                    key={index}
                    paths={[...b.points, b.points[0]]}
                    options={{
                        fillColor: "#00ff6aff",
                        fillOpacity: 0.2,
                        strokeColor: strokeColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        clickable: true,
                        draggable: false,
                        editable: false,
                        geodesic: false,
                        zIndex: 1
                    }}
                    onMouseOver={(e) => showInfoBillon(e, b)}
                    onClick={() => redirectToBillonDetails(b)}
                    onMouseOut={() => infoWindowRef.current?.close()}
                    />
                    ))}
                    <Autocomplete
                        onLoad={onLoadAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            type='text'
                            placeholder='Search Location'
                            className='box-border border border-transparent w-[240px] h-[38px] px-3 rounded-full shadow-md text-sm outline-none overflow-ellipsis absolute right-[8%] top-[11px] -ml-[120px] bg-white'
                        />
                    </Autocomplete>

                    <FloatingDashboardFAB />

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

                {showPopup && (
                    <PopUp 
                        message={popupMessage} 
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </div>
            :
            null
    );
}

export default TechnicienMapComponent; 