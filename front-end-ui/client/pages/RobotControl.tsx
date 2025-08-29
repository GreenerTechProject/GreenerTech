import React, { useState, useEffect, useRef } from 'react';
//import TechHeader from "../components/TechHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import { robotService } from '@/services/robotService';
import {
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Video,
  Wifi,
  Thermometer,
  Droplets,
  Zap,
  Sun,
  RefreshCw,
  Maximize,
  Minimize,
  Camera,
  Bot,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  EyeOff,
  Move,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { tokenManager } from "../services/authService";

interface QRData {
  [key: string]: any;
}

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  luminosite: number;
}

interface ControlCommand {
  control_mode: string;
}

interface Robot {
  id: number;
  nom: string;
  referance: string;
}

export default function RobotControl() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrCodes, setQrCodes] = useState<QRData[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    video: false,
    qr: false,
    control: false,
    sensor: false
  });

  // New state for controls
  const [selectedCamera, setSelectedCamera] = useState<string>('right');
  const [selectedRobot, setSelectedRobot] = useState<string>('1');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAIDetectionEnabled, setIsAIDetectionEnabled] = useState<boolean>(false);
  const [videoZoom, setVideoZoom] = useState<number>(1);
  const [videoPosition, setVideoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // New state for robots
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoadingRobots, setIsLoadingRobots] = useState<boolean>(false);
  const [robotsError, setRobotsError] = useState<string | null>(null);
  
  // New state for mobile responsiveness
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(false);
   const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(320); // Default height in pixels
   const [isResizing, setIsResizing] = useState<boolean>(false);
  
  // WebSocket references
  const qrWsRef = useRef<WebSocket | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const sensorWsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Check device type and screen size
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
      
      // Auto-hide bottom panel on larger screens
      if (width >= 1024) {
        setShowBottomPanel(false);
      }
      
      // Debug logging
      console.log('Device type check:', { width, isMobile: newIsMobile, isTablet: newIsTablet });
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Fetch robots from the service
  const fetchRobots = async () => {
    try {
      setIsLoadingRobots(true);
      setRobotsError(null);
      const fetchedRobots = await robotService.getAllRobots();
      setRobots(fetchedRobots);
      
      // Set the first robot as selected if no robot is currently selected
      if (fetchedRobots.length > 0 && !selectedRobot) {
        setSelectedRobot(fetchedRobots[0].referance.toString());
      }
    } catch (error: any) {
      console.error('Failed to fetch robots:', error);
      setRobotsError(error.message || 'Erreur lors de la récupération des robots');
    } finally {
      setIsLoadingRobots(false);
    }
  };

  const updateSelectedFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const idrobot = params.get('robot') || "1";
    const idcamera = params.get('camera') || "right";
    if (idrobot) setSelectedRobot(idrobot);
    if (idcamera) setSelectedCamera(idcamera);
  };

  // Initialize WebRTC for video streaming
  const startWebRTC = async (robot?: string, camera?: string) => {
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
	  
      const rob = robot || "1";
      const cam = camera || "right";

      pc.addTransceiver("video", { direction: "recvonly" });
      
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus(prev => ({ ...prev, video: true }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus(prev => ({ ...prev, video: false }));
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
	  
      const protocol = window.location.protocol === "https:" ? "https" : "http";
      const hostname = window.location.hostname;
      const port = "8080";

      const response = await fetch(`${protocol}://${hostname}:${port}/service/video_stream_service?robot=${encodeURIComponent(rob)}&camera=${encodeURIComponent(cam)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: pc.localDescription })
      });

      if (response.ok) {
        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error("WebRTC error:", error);
      setConnectionStatus(prev => ({ ...prev, video: false }));
    }
  };

  // Initialize WebSocket connections
  const initializeWebSockets = (robot?: string, camera?: string) => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const hostname = window.location.hostname;
    const port = "8080";
    
	const rob = robot || "1";
    const cam = camera || "right";

    // QR Code WebSocket
    const qrWs = new WebSocket(`${protocol}://${hostname}:${port}/service/qr_data?robot=${encodeURIComponent(rob)}&camera=${encodeURIComponent(cam)}`);
    qrWsRef.current = qrWs;

    qrWs.onopen = () => {
      console.log("QR WebSocket connected");
      setConnectionStatus(prev => ({ ...prev, qr: true }));
    };

    qrWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.qr_codes && Array.isArray(data.qr_codes)) {
          const parsedQRCodes = data.qr_codes.map((qrCodeStr: string, index: number) => {
            try {
              return { id: index, data: JSON.parse(qrCodeStr) };
            } catch (e) {
              return { id: index, data: qrCodeStr };
            }
          });
          setQrCodes(parsedQRCodes);
        }
      } catch (e) {
        console.error("Failed to parse QR WebSocket message:", e);
      }
    };

    qrWs.onclose = () => {
      console.log("QR WebSocket disconnected");
      setConnectionStatus(prev => ({ ...prev, qr: false }));
    };

    qrWs.onerror = (err) => {
      console.error("QR WebSocket error:", err);
      setConnectionStatus(prev => ({ ...prev, qr: false }));
    };

    // Control WebSocket
    const controlWs = new WebSocket(`${protocol}://${hostname}:${port}/service/control?robot=${encodeURIComponent(rob)}&camera=${encodeURIComponent(cam)}`);
    controlWsRef.current = controlWs;

    controlWs.onopen = () => {
      console.log("Control WebSocket connected");
      setConnectionStatus(prev => ({ ...prev, control: true }));
    };

    controlWs.onclose = () => {
      console.log("Control WebSocket disconnected");
      setConnectionStatus(prev => ({ ...prev, control: false }));
    };

    controlWs.onerror = (err) => {
      console.error("Control WebSocket error:", err);
      setConnectionStatus(prev => ({ ...prev, control: false }));
    };

    // Sensor WebSocket
    const sensorWs = new WebSocket(`${protocol}://${hostname}:${port}/service/sensor_data?robot=${encodeURIComponent(rob)}`);
    sensorWsRef.current = sensorWs;

    sensorWs.onopen = () => {
      console.log("Sensor WebSocket connected");
      setConnectionStatus(prev => ({ ...prev, sensor: true }));
    };

    sensorWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSensorData(data);
      } catch (e) {
        console.error("Failed to parse sensor data:", e);
      }
    };

    sensorWs.onclose = () => {
      console.log("Sensor WebSocket disconnected");
      setConnectionStatus(prev => ({ ...prev, sensor: false }));
    };

    sensorWs.onerror = (err) => {
      console.error("Sensor WebSocket error:", err);
      setConnectionStatus(prev => ({ ...prev, sensor: false }));
    };
  };

  // Send control command
  const sendCommand = (mode: string) => {
    if (controlWsRef.current && controlWsRef.current.readyState === WebSocket.OPEN) {
      controlWsRef.current.send(JSON.stringify({
        control_mode: mode,
        camera: selectedCamera,
        robot: selectedRobot
      }));
    } else {
      console.warn("Control WebSocket not open");
    }
  };

  // Toggle AI detection
  const toggleAIDetection = () => {
    const newState = !isAIDetectionEnabled;
    setIsAIDetectionEnabled(newState);
    sendCommand(newState ? 'ENABLE_AI' : 'DISABLE_AI');
  };

  // Zoom controls
  const zoomIn = () => {
    setVideoZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setVideoZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setVideoZoom(1);
    setVideoPosition({ x: 0, y: 0 });
  };

  // Capture image from video
  const captureImage = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Create download link
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `robot-${selectedRobot}-camera-${selectedCamera}-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Refresh connections
  const refreshConnections = async () => {
    setIsRefreshing(true);

    // Close existing connections
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (qrWsRef.current) {
      qrWsRef.current.close();
    }
    if (controlWsRef.current) {
      controlWsRef.current.close();
    }
    if (sensorWsRef.current) {
      sensorWsRef.current.close();
    }

    // Reset connection status
    setConnectionStatus({
      video: false,
      qr: false,
      control: false,
      sensor: false
    });

    // Wait a moment then reinitialize
    setTimeout(() => {
      startWebRTC(selectedRobot, selectedCamera);
      initializeWebSockets(selectedRobot, selectedCamera);
      setIsRefreshing(false);
    }, 1000);
  };

  // Toggle full screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

   // Handle bottom panel resize
   const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
     e.preventDefault();
     setIsResizing(true);
   };

   const handleResizeMove = (e: MouseEvent | TouchEvent) => {
     if (!isResizing) return;
     
     let clientY: number;
     if (e instanceof MouseEvent) {
       clientY = e.clientY;
     } else {
       clientY = e.touches[0].clientY;
     }
     
     const windowHeight = window.innerHeight;
     const newHeight = windowHeight - clientY;
     
     // Constrain height between 200px and 80% of screen height
     const minHeight = 200;
     const maxHeight = windowHeight * 0.8;
     const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
     
     setBottomPanelHeight(constrainedHeight);
   };

   const handleResizeEnd = () => {
     setIsResizing(false);
  };

  // Handle camera selection change
  const handleCameraChange = (camera: string) => {
    setSelectedCamera(camera);
  };

  // Handle robot selection change
  const handleRobotChange = (robot: string) => {
    setSelectedRobot(robot);
    // Send robot selection command
    //sendCommand('SELECT_ROBOT');
  };

  // Update selected robot when robots are loaded
  useEffect(() => {
    if (robots.length > 0 && !robots.find(r => r.referance.toString() === selectedRobot)) {
      setSelectedRobot(robots[0].referance.toString());
    }
  }, [robots, selectedRobot]);

  // Handle button press/release
  const handleButtonDown = (mode: string) => {
    console.log("Sending mode:", mode);
    sendCommand(mode);
  };

  const handleButtonUp = (mode?: string) => {
    if (!mode || !["PAUSE_MISSION", "PLAY_MISSION"].includes(mode)) {
      console.log("Sending mode: STOP");
      sendCommand("STOP");
    }
  };
  
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Control button component with responsive sizing
  const ControlButton: React.FC<{ 
    mode: string; 
    children: React.ReactNode; 
    className?: string;
  }> = ({ mode, children, className = "" }) => (
    <Button
      onMouseDown={() => {
        setIsMouseDown(true);
        handleButtonDown(mode);
      }}
      onMouseUp={() => {
        setIsMouseDown(false);
        handleButtonUp(mode);
      }}
      onMouseLeave={() => {
        if (isMouseDown) {
          setIsMouseDown(false);
          handleButtonUp(mode);
        }
      }}
      onTouchStart={() => {
        handleButtonDown(mode);
      }}
      onTouchEnd={() => {
        handleButtonUp(mode);
      }}
      className={`${isMobile ? 'min-h-12 text-base' : 'min-h-10 text-sm'} ${className} ${pressedButton === mode ? "ring-4 ring-yellow-300" : ""}`}
      variant="outline"
    >
      {children}
    </Button>
  );

  // Render QR data recursively
  const renderQRValue = (key: string, value: any, depth = 0): React.ReactNode => {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div className={`ml-${depth * 2}`} key={key}>
            <div className="font-medium">{key}:</div>
            {value.map((item, index) => (
              <div key={index} className="ml-4">
                {typeof item === "object" ? 
                  renderQRValue(`Item ${index + 1}`, item, depth + 1) : 
                  <div>�� {item}</div>
                }
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <div className={`ml-${depth * 2}`} key={key}>
            <div className="font-medium">{key}:</div>
            <div className="ml-4">
              {Object.entries(value).map(([k, v]) => renderQRValue(k, v, depth + 1))}
            </div>
          </div>
        );
      }
    }
    return (
      <div className={`ml-${depth * 2}`} key={key}>
        <span className="font-medium">{key}:</span> {String(value)}
      </div>
    );
  };

  // Initialize connections on component mount
  useEffect(() => {
	
	
	updateSelectedFromUrl();
	
    fetchRobots(); // Add this line
	
    startWebRTC(selectedRobot, selectedCamera);
    initializeWebSockets(selectedRobot, selectedCamera);

    // Add fullscreen event listener
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      // Cleanup on unmount
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (qrWsRef.current) {
        qrWsRef.current.close();
      }
      if (controlWsRef.current) {
        controlWsRef.current.close();
      }
      if (sensorWsRef.current) {
        sensorWsRef.current.close();
      }

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fetch robots on component mount
  useEffect(() => {
    fetchRobots();
  }, []);

   // Add resize event listeners
   useEffect(() => {
     if (isResizing) {
       const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
       const handleTouchMove = (e: TouchEvent) => handleResizeMove(e);
       const handleMouseUp = () => handleResizeEnd();
       const handleTouchEnd = () => handleResizeEnd();

       document.addEventListener('mousemove', handleMouseMove);
       document.addEventListener('touchmove', handleTouchMove);
       document.addEventListener('mouseup', handleMouseUp);
       document.addEventListener('touchend', handleTouchEnd);

       return () => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('touchmove', handleTouchMove);
         document.removeEventListener('mouseup', handleMouseUp);
         document.removeEventListener('touchend', handleTouchEnd);
       };
     }
   }, [isResizing]);
  
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
	const keyMap: Record<string, string> = {
	  ArrowUp: "TOP",
	  ArrowDown: "DOWN",
	  ArrowLeft: "LEFT",
	  ArrowRight: "RIGHT",
	};

	if (keyMap[e.key] && !pressedKeys.current.has(e.key)) {
	  pressedKeys.current.add(e.key);
	  setPressedButton(keyMap[e.key]);
	  handleButtonDown(keyMap[e.key]);
	}
    };

    const handleKeyUp = (e: KeyboardEvent) => {
	const keyMap: Record<string, string> = {
	  ArrowUp: "TOP",
	  ArrowDown: "DOWN",
	  ArrowLeft: "LEFT",
	  ArrowRight: "RIGHT",
	};

	if (keyMap[e.key]) {
	  pressedKeys.current.delete(e.key);
	  setPressedButton(null);
	  handleButtonUp();
	}
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
	window.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  
  
  useEffect(() => {
    if (qrWsRef.current) qrWsRef.current.close();
    if (controlWsRef.current) controlWsRef.current.close();
    if (sensorWsRef.current) sensorWsRef.current.close();

    initializeWebSockets(selectedRobot, selectedCamera);

    // Reset sensor data
    setSensorData(null);
    
    if (pcRef.current) pcRef.current.close();
    startWebRTC(selectedRobot, selectedCamera);

    return () => {
      if (qrWsRef.current) qrWsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, [selectedRobot, selectedCamera]);


//      <TechHeader role="technicien" />

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      
             <div className={`${isMobile || isTablet ? 'flex flex-col w-full' : 'flex'} h-full ${isResizing ? 'select-none' : ''}`}>
        {/* Left Sidebar - Desktop Only */}
        {!isMobile && !isTablet && (
           <div className="w-60 bg-white shadow-lg p-1 overflow-hidden space-y-0.5 flex-shrink-0">
                         {/* Camera & Robot Selection - Combined */}
             <Card className="text-xs">
               <CardHeader className="pb-1">
                 <CardTitle className="text-xs flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                   Caméra & Robot
                </CardTitle>
              </CardHeader>
               <CardContent className="space-y-1">
                 <div className="grid grid-cols-2 gap-1">
                <Select value={selectedCamera} onValueChange={handleCameraChange}>
                     <SelectTrigger className="h-6 text-xs">
                       <SelectValue placeholder="Caméra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
                   
                <Select value={selectedRobot} onValueChange={handleRobotChange} disabled={isLoadingRobots || !!robotsError}>
                     <SelectTrigger className="h-6 text-xs">
                       <SelectValue placeholder={isLoadingRobots ? "..." : robotsError ? "Erreur" : "Robot"} />
                  </SelectTrigger>
                  <SelectContent>
                    {robots.map((robot) => (
                      <SelectItem key={robot.referance} value={robot.referance.toString()}>
                        {robot.nom} ({robot.referance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 </div>
                
                {robotsError && (
                   <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
                    {robotsError}
                  </div>
                )}
                
                <Button
                  onClick={fetchRobots}
                  disabled={isLoadingRobots}
                   className="w-full h-5 text-xs"
                  variant="outline"
                  size="sm"
                >
                   <RefreshCw className={`h-2 w-2 mr-1 ${isLoadingRobots ? 'animate-spin' : ''}`} />
                   Actualiser
                </Button>
              </CardContent>
            </Card>

                         {/* Sensor Data & QR Codes - Combined */}
             <Card className="text-xs">
               <CardHeader className="pb-1">
                 <CardTitle className="text-xs flex items-center gap-1">
                   <Thermometer className="h-3 w-3" />
                   Capteurs & QR
                 </CardTitle>
              </CardHeader>
               <CardContent className="space-y-1">
                 {sensorData ? (
                   <div className="grid grid-cols-2 gap-1">
                     <div className="flex items-center gap-1 p-0.5 bg-gray-50 rounded text-xs">
                       <Thermometer className="h-2 w-2 text-red-400" />
                       <span>{sensorData.temperature}°C</span>
                     </div>
                     <div className="flex items-center gap-1 p-0.5 bg-gray-50 rounded text-xs">
                       <Droplets className="h-2 w-2 text-blue-400" />
                       <span>{sensorData.humidity}%</span>
                     </div>
                     <div className="flex items-center gap-1 p-0.5 bg-gray-50 rounded text-xs">
                       <Zap className="h-2 w-2 text-green-400" />
                       <span>{sensorData.co2} ppm</span>
                     </div>
                     <div className="flex items-center gap-1 p-0.5 bg-gray-50 rounded text-xs">
                       <Sun className="h-2 w-2 text-yellow-400" />
                       <span>{sensorData.luminosite} lux</span>
                     </div>
                   </div>
                 ) : (
                   <div className="text-xs text-gray-500 p-1 bg-gray-50 rounded">
                     En attente...
                   </div>
                 )}
                 
                 {/* QR Codes - Compact */}
                 <div className="border-t pt-1">
                   <div className="text-xs font-medium mb-1">QR:</div>
                   <div className="max-h-16 overflow-y-auto space-y-0.5">
                     {qrCodes.length > 0 ? (
                       qrCodes.slice(0, 1).map((qr) => (
                         <div key={qr.id} className="p-1 bg-gray-50 rounded text-xs">
                           {typeof qr.data === 'object' ? (
                             <div className="truncate text-gray-600">
                               {Object.entries(qr.data).slice(0, 1).map(([key, value]) => (
                                 <span key={key}><span className="font-medium">{key}:</span> {String(value)}</span>
                               ))}
                             </div>
                           ) : (
                             <div className="truncate text-gray-600">{String(qr.data)}</div>
                           )}
                         </div>
                       ))
                     ) : (
                       <div className="text-xs text-gray-500">Aucun QR</div>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>

                         {/* Video Controls & Actions - Combined */}
             <Card className="text-xs">
               <CardHeader className="pb-1">
                 <CardTitle className="text-xs">Vidéo & Actions</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 {/* Zoom Controls */}
                <div className="flex gap-1">
                  <Button
                    onClick={zoomOut}
                     className="flex-1 h-5 text-xs"
                    variant="outline"
                    disabled={videoZoom <= 0.5}
                  >
                     <ZoomOut className="h-2 w-2" />
                  </Button>
                  <Button
                    onClick={resetZoom}
                     className="flex-1 h-5 text-xs"
                    variant="outline"
                  >
                    {Math.round(videoZoom * 100)}%
                  </Button>
                  <Button
                    onClick={zoomIn}
                     className="flex-1 h-5 text-xs"
                    variant="outline"
                    disabled={videoZoom >= 3}
                  >
                     <ZoomIn className="h-2 w-2" />
                  </Button>
                </div>

                 {/* Action Buttons - 2x2 Grid */}
                 <div className="grid grid-cols-2 gap-1">
                <Button
                  onClick={captureImage}
                     className="h-5 text-xs"
                  variant="outline"
                >
                     <Download className="h-2 w-2 mr-1" />
                     Capture
                </Button>

                <Button
                  onClick={toggleFullScreen}
                     className="h-5 text-xs"
                  variant="outline"
                >
                  {isFullScreen ? (
                    <>
                         <Minimize className="h-2 w-2 mr-1" />
                      Quitter
                    </>
                  ) : (
                    <>
                         <Maximize className="h-2 w-2 mr-1" />
                      Plein Écran
                    </>
                  )}
                </Button>
                   
                   <Button
                     onClick={refreshConnections}
                     disabled={isRefreshing}
                     className="h-5 text-xs"
                     variant="outline"
                   >
                     <RefreshCw className={`h-2 w-2 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                     {isRefreshing ? '...' : 'Actualiser'}
                </Button>

                <Button
                  onClick={toggleAIDetection}
                     className={`h-5 text-xs ${
                    isAIDetectionEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  variant="outline"
                >
                  {isAIDetectionEnabled ? (
                    <>
                         <Eye className="h-2 w-2 mr-1" />
                         IA ON
                    </>
                  ) : (
                    <>
                         <EyeOff className="h-2 w-2 mr-1" />
                         IA OFF
                    </>
                  )}
                </Button>
                 </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
             <Card className="text-xs">
               <CardHeader className="pb-1">
                 <CardTitle className="text-xs">Connexions</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 gap-1">
                  {Object.entries(connectionStatus).map(([key, connected]) => (
                     <div key={key} className="flex items-center justify-between p-0.5 bg-gray-50 rounded">
                       <span className="text-xs capitalize">{key}</span>
                       <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-xs ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <Wifi className="h-2 w-2" />
                         <span>{connected ? 'OK' : 'KO'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Screen Video Area */}
        <div className={`${isMobile || isTablet ? 'w-full flex-1 relative' : 'flex-1 relative'}`}>
          <div className="absolute inset-0 bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full bg-black object-contain transition-transform duration-200"
              style={{
                transform: `scale(${videoZoom}) translate(${videoPosition.x}px, ${videoPosition.y}px)`,
                transformOrigin: 'center center'
              }}
            />

            {/* Mobile/Tablet Top Controls Bar */}
            {(isMobile || isTablet) && (
              <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white p-3 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select value={selectedCamera} onValueChange={handleCameraChange}>
                      <SelectTrigger className="h-8 text-sm bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Caméra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedRobot} onValueChange={handleRobotChange} disabled={isLoadingRobots || !!robotsError}>
                      <SelectTrigger className="h-8 text-sm bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder={isLoadingRobots ? "Chargement..." : robotsError ? "Erreur" : "Robot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {robots.map((robot) => (
                          <SelectItem key={robot.referance} value={robot.referance.toString()}>
                            {robot.nom} ({robot.referance})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={refreshConnections}
                      disabled={isRefreshing}
                      className="h-8 w-8 p-0 bg-white/20 border-white/30 text-white hover:bg-white/30"
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    <Button
                      onClick={() => setShowBottomPanel(!showBottomPanel)}
                      className="h-8 w-8 p-0 bg-white/20 border-white/30 text-white hover:bg-white/30"
                      variant="outline"
                      size="sm"
                    >
                      {showBottomPanel ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}



            {/* Robot Control Buttons Overlay - Responsive positioning */}
            <div className={`absolute ${isMobile ? 'bottom-20 right-2' : isTablet ? 'bottom-4 right-4' : 'bottom-4 right-4'} pointer-events-none`}>
              <div className={`bg-black/40 backdrop-blur-sm rounded-xl p-3 pointer-events-auto ${isMobile ? 'scale-90' : ''}`}>
                <div className="space-y-3">
                  {/* Mission Controls */}
                  <div className="flex gap-2 justify-center">
                    <ControlButton mode="PAUSE_MISSION" className="bg-yellow-500/90 hover:bg-yellow-600/90 border-yellow-400 text-white px-3 py-2">
                      <Pause className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    </ControlButton>
                    <ControlButton mode="PLAY_MISSION" className="bg-green-500/90 hover:bg-green-600/90 border-green-400 text-white px-3 py-2">
                      <Play className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    </ControlButton>
                  </div>

                  {/* Movement Controls - Cross Pattern */}
                  <div className={`grid grid-cols-3 gap-2 ${isMobile ? 'w-36' : 'w-40'}`}>
                    <div></div>
                    <ControlButton mode="TOP" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowUp className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    </ControlButton>
                    <div></div>

                    <ControlButton mode="LEFT" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowLeft className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    </ControlButton>
                    <div className="flex items-center justify-center">
                      <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-white/20 border border-white/40 flex items-center justify-center`}>
                        <div className={`${isMobile ? 'w-3 h-3' : 'w-2 h-2'} rounded-full bg-white`}></div>
                      </div>
                    </div>
                    <ControlButton mode="RIGHT" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowRight className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    </ControlButton>

                    <div></div>
                    <ControlButton mode="DOWN" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowDown className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    </ControlButton>
                    <div></div>
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-2 justify-center">
                    <ControlButton mode="TOP_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                      <ArrowUp className={`mr-1 ${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                      <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>Cam</span>
                    </ControlButton>
                    <ControlButton mode="DOWN_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                      <ArrowDown className={`mr-1 ${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                      <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>Cam</span>
                    </ControlButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Robot/Camera Info Overlay - Bottom Left (adjusted for mobile) */}
            <div className={`absolute ${isMobile ? 'bottom-20 left-2' : 'bottom-4 left-4'} bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20`}>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1`}>
                <div className="flex items-center gap-2">
                  <Bot className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'} text-blue-400`} />
                  <span className={isMobile ? 'truncate max-w-20' : ''}>
                    {robots.find(r => r.referance.toString() === selectedRobot)?.nom || 'Chargement...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'} text-green-400`} />
                  <span>{selectedCamera === 'left' ? 'Gauche' : 'Droite'}</span>
                </div>
                {robots.find(r => r.referance.toString() === selectedRobot)?.referance && (
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>Ref: {robots.find(r => r.referance.toString() === selectedRobot)?.referance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Mobile/Tablet Only */}
        {(isMobile || isTablet) && showBottomPanel && (
           <div 
             className="bg-white shadow-lg border-t border-gray-200 overflow-hidden relative"
             style={{ height: `${bottomPanelHeight}px` }}
           >
             {/* Resize Handle */}
             <div 
               className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center select-none transition-colors ${
                 isResizing ? 'bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
               }`}
               onMouseDown={handleResizeStart}
               onTouchStart={handleResizeStart}
             >
               <div className={`w-8 h-1 rounded-full transition-colors ${
                 isResizing ? 'bg-blue-500' : 'bg-gray-400'
               }`}></div>
             </div>
             
             {/* Panel Content */}
             <div className="p-3 h-full overflow-y-auto" style={{ paddingTop: '1rem' }}>
            <div className="grid grid-cols-1 gap-3">
              {/* Robot and Camera Selection */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Sélection Robot & Caméra</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={selectedCamera} onValueChange={handleCameraChange}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Caméra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Gauche</SelectItem>
                      <SelectItem value="right">Droite</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedRobot} onValueChange={handleRobotChange} disabled={isLoadingRobots || !!robotsError}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={isLoadingRobots ? "..." : robotsError ? "Erreur" : "Robot"} />
                    </SelectTrigger>
                    <SelectContent>
                      {robots.map((robot) => (
                        <SelectItem key={robot.referance} value={robot.referance.toString()}>
                          {robot.nom} ({robot.referance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {robotsError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {robotsError}
                  </div>
                )}
              </div>

              {/* Sensor Data & QR Codes - Combined */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Capteurs & QR Codes
                </h3>
                
                {/* Sensor Data */}
                {sensorData ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Thermometer className="h-4 w-4 text-red-400" />
                      <span className="text-sm">{sensorData.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{sensorData.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-sm">{sensorData.co2} ppm</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Sun className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">{sensorData.luminosite} lux</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                    En attente des données...
                  </div>
                )}
                
                {/* QR Codes */}
                <div className="border-t pt-2">
                  <div className="text-sm font-medium mb-2">Codes QR Détectés:</div>
                  <div className="max-h-24 overflow-y-auto space-y-2">
                    {qrCodes.length > 0 ? (
                      qrCodes.slice(0, 2).map((qr) => (
                        <div key={qr.id} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium mb-1 text-gray-700">QR {qr.id + 1}:</div>
                          {typeof qr.data === 'object' ? (
                            <div className="space-y-1">
                              {Object.entries(qr.data).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="truncate text-gray-600">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="truncate text-gray-600">{String(qr.data)}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                        Aucun code QR détecté
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Controls & Actions - Combined */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Contrôles & Actions</h3>
                
              {/* Video Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={zoomOut}
                    className="flex-1 h-9 text-sm"
                    variant="outline"
                    disabled={videoZoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={resetZoom}
                    className="flex-1 h-9 text-sm"
                    variant="outline"
                  >
                    {Math.round(videoZoom * 100)}%
                  </Button>
                  <Button
                    onClick={zoomIn}
                    className="flex-1 h-9 text-sm"
                    variant="outline"
                    disabled={videoZoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={captureImage}
                    className="h-9 text-sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                    Capture
                </Button>

                <Button
                  onClick={toggleFullScreen}
                    className="h-9 text-sm"
                  variant="outline"
                >
                  {isFullScreen ? (
                    <>
                      <Minimize className="h-4 w-4 mr-2" />
                      Quitter
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Plein Écran
                    </>
                  )}
                </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={refreshConnections}
                    disabled={isRefreshing}
                    className="h-9 text-sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? '...' : 'Actualiser'}
                  </Button>
                  
                <Button
                  onClick={toggleAIDetection}
                    className={`h-9 text-sm ${
                    isAIDetectionEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  variant="outline"
                >
                  {isAIDetectionEnabled ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                        IA ON
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                        IA OFF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Connection Status */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Connexions</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(connectionStatus).map(([key, connected]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm capitalize text-gray-600">{key}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <Wifi className="h-3 w-3" />
                      <span>{connected ? 'OK' : 'KO'}</span>
                    </div>
                  </div>
                ))}
                </div>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
