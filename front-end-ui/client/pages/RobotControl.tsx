import React, { useState, useEffect, useRef } from 'react';
import TechHeader from "../components/TechHeader";
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
  Move
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
  // WebSocket references
  const qrWsRef = useRef<WebSocket | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const sensorWsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

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

  // Control button component
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
	className={`w-full ${className} ${pressedButton === mode ? "ring-4 ring-yellow-300" : ""}`}
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
                  <div>• {item}</div>
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



  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role="technicien" />

      <div className="flex h-[calc(100vh-85px)]">
        {/* Minimized Left Sidebar - Controls */}
        <div className="w-64 bg-white shadow-lg p-3 overflow-y-auto space-y-3">
          {/* Camera Selection */}
          <Card className="text-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Caméra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCamera} onValueChange={handleCameraChange}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Robot Selection */}
          <Card className="text-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Bot className="h-3 w-3" />
                Robot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedRobot} onValueChange={handleRobotChange} disabled={isLoadingRobots || !!robotsError}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={isLoadingRobots ? "Chargement..." : robotsError ? "Erreur" : "Choisir un robot"} />
                </SelectTrigger>
                <SelectContent>
                  {robots.map((robot) => (
                    <SelectItem key={robot.referance} value={robot.referance.toString()}>
                      {robot.nom} ({robot.referance})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {robotsError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {robotsError}
                </div>
              )}
              
              <Button
                onClick={fetchRobots}
                disabled={isLoadingRobots}
                className="w-full h-6 text-xs"
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingRobots ? 'animate-spin' : ''}`} />
                Actualiser les robots
              </Button>
            </CardContent>
          </Card>

          {/* Control Actions */}
          <Card className="text-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={refreshConnections}
                disabled={isRefreshing}
                className="w-full h-8 text-sm"
                variant="outline"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualise...' : 'Actualiser'}
              </Button>

              <Button
                onClick={toggleFullScreen}
                className="w-full h-8 text-sm"
                variant="outline"
              >
                {isFullScreen ? (
                  <>
                    <Minimize className="h-3 w-3 mr-1" />
                    Quitter
                  </>
                ) : (
                  <>
                    <Maximize className="h-3 w-3 mr-1" />
                    Plein Écran
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="text-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Connexions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(connectionStatus).map(([key, connected]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key}</span>
                    <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-sm ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <Wifi className="h-2 w-2" />
                      <span className="text-sm">{connected ? 'OK' : 'KO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Screen Video Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full bg-black object-contain"
            />

            {/* Sensor Data Overlay - Top Left */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-4 w-4" />
                <span className="font-semibold text-sm">Sensor Data</span>
              </div>
              {sensorData ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-3 w-3 text-red-400" />
                    <span>Température {sensorData.temperature} °C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-3 w-3 text-blue-400" />
                    <span>Humidité {sensorData.humidity} %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-green-400" />
                    <span>CO₂ {sensorData.co2} ppm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-3 w-3 text-yellow-400" />
                    <span>Luminosité {sensorData.luminosite} lux</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 text-sm">Waiting for sensor data...</p>
              )}
            </div>

            {/* QR Code Data Overlay - Top Right */}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20 max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 border-2 border-white rounded-sm" />
                <span className="font-semibold text-sm">QR Codes</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {qrCodes.length > 0 ? (
                  qrCodes.map((qr) => (
                    <div key={qr.id} className="p-2 bg-white/10 rounded text-sm">
                      <div className="font-medium mb-1">QR {qr.id + 1}:</div>
                      {typeof qr.data === 'object' ? (
                        <div className="space-y-1">
                          {Object.entries(qr.data).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="text-gray-300">{key}:</span> {String(value)}
                            </div>
                          ))}
                          {Object.entries(qr.data).length > 3 && (
                            <div className="text-gray-400">...{Object.entries(qr.data).length - 3} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="truncate">{String(qr.data)}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300">No QR codes detected</p>
                )}
              </div>
            </div>

            {/* Robot Control Buttons Overlay - Bottom Right */}
            <div className="absolute bottom-4 right-4 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 pointer-events-auto">
                <div className="space-y-4">
                  {/* Mission Controls */}
                  <div className="flex gap-2 justify-center">
                    <ControlButton mode="PAUSE_MISSION" className="bg-yellow-500/90 hover:bg-yellow-600/90 border-yellow-400 text-white px-4 py-2">
                      <Pause className="h-4 w-4" />
                    </ControlButton>
                    <ControlButton mode="PLAY_MISSION" className="bg-green-500/90 hover:bg-green-600/90 border-green-400 text-white px-4 py-2">
                      <Play className="h-4 w-4" />
                    </ControlButton>
                  </div>

                  {/* Movement Controls - Cross Pattern */}
                  <div className="grid grid-cols-3 gap-2 w-40">
                    <div></div>
                    <ControlButton mode="TOP" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowUp className="h-5 w-5" />
                    </ControlButton>
                    <div></div>

                    <ControlButton mode="LEFT" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowLeft className="h-5 w-5" />
                    </ControlButton>
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                    <ControlButton mode="RIGHT" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowRight className="h-5 w-5" />
                    </ControlButton>

                    <div></div>
                    <ControlButton mode="DOWN" className="bg-blue-500/90 hover:bg-blue-600/90 border-blue-400 text-white p-3">
                      <ArrowDown className="h-5 w-5" />
                    </ControlButton>
                    <div></div>
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-2 justify-center">
                    <ControlButton mode="TOP_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                      <ArrowUp className="mr-1 h-4 w-4" />
                      <span className="text-sm">Cam</span>
                    </ControlButton>
                    <ControlButton mode="DOWN_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                      <ArrowDown className="mr-1 h-4 w-4" />
                      <span className="text-sm">Cam</span>
                    </ControlButton>
                  </div>

                </div>
              </div>
            </div>

            {/* Current Robot/Camera Info Overlay - Bottom Left */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3 text-blue-400" />
                  <span>Robot: {robots.find(r => r.referance.toString() === selectedRobot)?.nom || 'Chargement...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-3 w-3 text-green-400" />
                  <span>Caméra: {selectedCamera === 'left' ? 'Gauche' : 'Droite'}</span>
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
      </div>
    </div>
  );
}
