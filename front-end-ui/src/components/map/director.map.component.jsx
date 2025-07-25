import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, DrawingManager, GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import deleteIcon from '../../assets/images/remove.png'; 
const libraries = ['places', 'drawing'];
const DirectorMapComponent = () => {

    const mapRef = useRef();
    const polygonRefs = useRef([]);
    const activePolygonIndex = useRef();
    const autocompleteRef = useRef();
    const drawingManagerRef = useRef();
    const [polygons, setPolygons] = useState([]);
    const [polygonMeta, setPolygonMeta] = useState({});
    const [activePolygon, setActivePolygon] = useState(null);
    const [currentPosition, setCurrentPosition] = useState( {
       
    });
    const [center, setCenter] = useState(currentPosition);
    // Loading Google Map API 
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        libraries
    });
   
    // Defining default position (Current position by default using geoLocation)
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

    //Getting billon positions from db
   

    // Styles
    const containerStyle = {
        width: '100%',
        height: '100vh',
    }

    const autocompleteStyle = {
        boxSizing: 'border-box',
        border: '1px solid transparent',
        width: '240px',
        height: '38px',
        padding: '0 12px',
        borderRadius: '20px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        fontSize: '14px',
        outline: 'none',
        textOverflow: 'ellipses',
        position: 'absolute',
        right: '8%',
        top: '11px',
        marginLeft: '-120px',
    }

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
        zIndex: 99999
    }

    // Options
    const polygonOptions = {
        fillOpacity: 0.3,
        fillColor: '#ff0000',
        strokeColor: '#ff0000',
        strokeWeight: 2,
        draggable: false,
        editable: true
    }

    const rectangleOptions = {
        fillColor: '#00ff00',
        fillOpacity: 0.3,
        strokeColor: '#00ff00',
        strokeWeight: 2,
        draggable: false,
        editable: true,
    }

    const drawingManagerOptions = {
        polygonOptions: polygonOptions,
        rectangleOptions: rectangleOptions,
        drawingControl: true,
        drawingMode: null,
        drawingControlOptions: {
            position: window.google?.maps?.ControlPosition?.TOP_CENTER,
            drawingModes: [
                window.google?.maps?.drawing?.OverlayType.RECTANGLE, 
                window.google?.maps?.drawing?.OverlayType?.POLYGON,
                window.google?.maps?.drawing?.OverlayType.MARKER,  
            ]
        }
    }
                     
    const onLoadMap = (map) => {
        mapRef.current = map;
    }

    const onLoadPolygon = (polygon, index) => {
        polygonRefs.current[index] = polygon;
    }

    const onClickPolygon = (index) => {
        activePolygonIndex.current = index; 
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

    const onOverlayComplete = ($overlayEvent) => {
        drawingManagerRef.current.setDrawingMode(null);
        if ($overlayEvent.type === window.google.maps.drawing.OverlayType.POLYGON) {
            const newPolygon = $overlayEvent.overlay.getPath()
                .getArray()
                .map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }))
            const startPoint = newPolygon[0];
            newPolygon.push(startPoint);
            newPolygon.creation_date = new Date();
            console.log(newPolygon);
            setPolygonMeta(newPolygon);
            setActivePolygon(newPolygon);

            $overlayEvent.overlay?.setMap(null);
            setPolygons([...polygons, newPolygon]);
        }
        // if ($overlayEvent.type === window.google.maps.drawing.OverlayType.RECTANGLE) {
        //     const bounds = $overlayEvent.overlay.getBounds();
        //     const ne = bounds.getNorthEast();
        //     const sw = bounds.getSouthWest();

        //     const rectangleData = {
        //     north: ne.lat(),
        //     east: ne.lng(),
        //     south: sw.lat(),
        //     west: sw.lng()
        //     };

        //     // Show Floating Form
            
        //     // Save rectangle data
        //     setRectangles(prev => [...prev, rectangleData]);

        //     // Optionally remove rectangle from map (if you don't want it shown)
        //     $overlayEvent.overlay?.setMap(null);
        // }
    }

    const onDeleteDrawing = () => {  
        const filtered = polygons.filter((polygon, index) => index !== activePolygonIndex.current) 
        setPolygons(filtered)
    }

    const onEditPolygon = (index) => {
        const polygonRef = polygonRefs.current[index];
        if (polygonRef) {
            const coordinates = polygonRef.getPath()
                .getArray()
                .map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));

            const allPolygons = [...polygons];
            allPolygons[index] = coordinates;
            setPolygons(allPolygons)
        }
    }

    const savePolygonMeta = (polygoneData)=>{
        console.log('Saving polygon data:', polygoneData);
        // MapService.saveMapsCoordinates(polygoneData)
        //     .then(response => {
        //         console.log('Polygon saved successfully:', response.data);
        //     })
        //     .catch(error => {
        //         console.error('Error saving polygon:', error);
        //     });
    }
  
   

    return (
        isLoaded
            ?
            <div className='map-container' style={{ position: 'relative' }}>
                {
                    drawingManagerRef.current
                    &&
                    <div
                        onClick={onDeleteDrawing}
                        title='Delete shape'
                        style={deleteIconStyle}>
                    </div>
                }

             {activePolygon !== null && (
                <div style={{
                    position: 'absolute',
                    top: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    padding: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 999
                }}>
                    <h4>Polygon Info</h4>
                    <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target;
                   const title = form.title.value;
                    const description = form.description.value;

                    const updatedMeta = {...polygonMeta, title:title, description: description};
                    savePolygonMeta(updatedMeta);
                    setActivePolygon(null);
                    }}>
                    <input type="text" name="title" placeholder="Title" required />
                    <br /><br />
                    <select>
                        <option value="domaine">Domaine</option>
                        <option value="serre">Serre</option>
                        <option value="billon">Billion</option>
                    </select>
                    <br /><br />
                    <textarea name="description" placeholder="Description" required></textarea>
                    <br /><br />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setActivePolygon(null)}>Cancel</button>
                    </form>
                </div>
                )}

                <GoogleMap
                    zoom={15}
                    center={center}
                    onLoad={onLoadMap}
                    mapContainerStyle={containerStyle}
                    
                >
                   
                    <DrawingManager
                        onLoad={onLoadDrawingManager}
                        onOverlayComplete={onOverlayComplete}
                        options={drawingManagerOptions}
                    />
                
                    {
                        polygons.map((iterator, index) => (
                            <Polygon
                                key={index}
                                onLoad={(event) => onLoadPolygon(event, index)}
                                onMouseDown={() => onClickPolygon(index)}
                                onMouseUp={() => onEditPolygon(index)}
                                onDragEnd={() => onEditPolygon(index)}
                                options={polygonOptions}
                                paths={iterator}
                                draggable
                                editable
                            />
                        ))
                    }
                    <Autocomplete
                        onLoad={onLoadAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            type='text'
                            placeholder='Search Location'
                            style={autocompleteStyle}
                        />
                    </Autocomplete>
                </GoogleMap>
            </div>
            :
            null
    );
}

export default DirectorMapComponent; 