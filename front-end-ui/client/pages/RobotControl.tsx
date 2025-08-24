import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { robotService } from '@/services/robotService';
import {
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
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
  ChevronUp,
  ChevronDown,
  X,
  QrCode,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

interface QRData {
  [key: string]: any;
}

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  luminosite: number;
}

interface Robot {
  id: number;
  nom: string;
  referance: string;
}

interface ControlPosition {
  x: number;
  y: number;
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

  const [selectedCamera, setSelectedCamera] = useState<string>('right');
  const [selectedRobot, setSelectedRobot] = useState<string>('1');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoadingRobots, setIsLoadingRobots] = useState<boolean>(false);
  const [robotsError, setRobotsError] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [isBottomPanelExpanded, setIsBottomPanelExpanded] = useState<boolean>(false);
  
  // Enhanced UI states
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [isStickyPanel, setIsStickyPanel] = useState<boolean>(true);
  const [controlPosition, setControlPosition] = useState<ControlPosition>({ x: 20, y: 100 });
  const [showSensorPanel, setShowSensorPanel] = useState<boolean>(true);
  const [showQRPanel, setShowQRPanel] = useState<boolean>(true);

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
      
      if (fetchedRobots.length > 0 && !selectedRobot) {
        setSelectedRobot(fetchedRobots[0].id.toString());
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

    if (pcRef.current) pcRef.current.close();
    if (qrWsRef.current) qrWsRef.current.close();
    if (controlWsRef.current) controlWsRef.current.close();
    if (sensorWsRef.current) sensorWsRef.current.close();

    setConnectionStatus({
      video: false,
      qr: false,
      control: false,
      sensor: false
    });

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
  };

  // Handle button press/release
  const handleButtonDown = (mode: string) => {
    console.log("Sending mode:", mode);
    setPressedButton(mode);
    sendCommand(mode);
  };

  const handleButtonUp = () => {
    console.log("Sending mode: STOP");
    setPressedButton(null);
    sendCommand("STOP");
  };

  // Enhanced QR data display - extract and show bilan name
  const getBilanName = (qrData: any): string => {
    if (!qrData) return 'N/A';
    
    // Try to find bilan name in various possible locations
    if (qrData.bilan_name) return qrData.bilan_name;
    if (qrData.name) return qrData.name;
    if (qrData.title) return qrData.title;
    if (qrData.nom) return qrData.nom;
    if (qrData.bilan) return qrData.bilan;
    
    // If it's a string, try to parse it
    if (typeof qrData === 'string') {
      try {
        const parsed = JSON.parse(qrData);
        return getBilanName(parsed);
      } catch {
        return qrData.substring(0, 30) + (qrData.length > 30 ? '...' : '');
      }
    }
    
    // If it's an object, look for any string value that might be a name
    if (typeof qrData === 'object') {
      for (const [key, value] of Object.entries(qrData)) {
        if (typeof value === 'string' && value.length > 0 && value.length < 100) {
          if (key.toLowerCase().includes('name') || key.toLowerCase().includes('nom') || key.toLowerCase().includes('title')) {
            return value;
          }
        }
      }
      // Return first string value if no obvious name found
      for (const [key, value] of Object.entries(qrData)) {
        if (typeof value === 'string' && value.length > 0 && value.length < 100) {
          return value;
        }
      }
    }
    
    return 'QR Code détecté';
  };

  // Enhanced control button component with responsive sizing and touch optimization
  const ControlButton: React.FC<{ 
    mode: string; 
    children: React.ReactNode; 
    className?: string;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ mode, children, className = "", size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 p-1', // Very small for mobile
      md: 'w-10 h-10 p-1.5', // Small for tablet
      lg: 'w-12 h-12 p-2'  // Medium for desktop
    };

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <Button
        onTouchStart={(e) => {
          e.preventDefault();
          handleButtonDown(mode);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleButtonUp();
        }}
        onMouseDown={() => handleButtonDown(mode)}
        onMouseUp={() => handleButtonUp()}
        onMouseLeave={() => {
          if (pressedButton === mode) {
            handleButtonUp();
          }
        }}
        className={`${className} ${sizeClasses[size]} ${pressedButton === mode ? "ring-1 ring-white/50 scale-95" : ""} transition-all duration-150 touch-manipulation select-none text-xs`}
        variant="outline"
      >
        {children}
      </Button>
    );
  };

  // Initialize connections on component mount
  useEffect(() => {
    updateSelectedFromUrl();
    fetchRobots();
    startWebRTC(selectedRobot, selectedCamera);
    initializeWebSockets(selectedRobot, selectedCamera);

    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    const handleResize = () => {
      // Reposition controls on screen resize for better mobile/tablet experience
      const optimalPos = getOptimalControlPosition();
      setControlPosition(optimalPos);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

    // Set initial optimal position
    const optimalPos = getOptimalControlPosition();
    setControlPosition(optimalPos);

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (qrWsRef.current) qrWsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update connections when robot/camera changes
  useEffect(() => {
    if (qrWsRef.current) qrWsRef.current.close();
    if (controlWsRef.current) controlWsRef.current.close();
    if (sensorWsRef.current) sensorWsRef.current.close();
    if (pcRef.current) pcRef.current.close();

    initializeWebSockets(selectedRobot, selectedCamera);
    startWebRTC(selectedRobot, selectedCamera);

    return () => {
      if (qrWsRef.current) qrWsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, [selectedRobot, selectedCamera]);

  // Enhanced responsive button sizes and positioning for mobile/tablet/desktop
  const getButtonSize = () => {
    if (isCompactMode) return 'sm';
    if (window.innerWidth < 480) return 'sm'; // Mobile: very small
    if (window.innerWidth < 768) return 'sm'; // Mobile: very small
    if (window.innerWidth < 1024) return 'md'; // Tablet: small
    return 'lg'; // Desktop: medium
  };

  // Get optimal control position based on screen size - Fixed positions
  const getOptimalControlPosition = () => {
    if (window.innerWidth < 768) {
      // Mobile: Fixed position on the right side, very small
      return { x: window.innerWidth - 140, y: 100 };
    } else if (window.innerWidth < 1024) {
      // Small desktop: Fixed position on the right side
      return { x: window.innerWidth - 160, y: 120 };
    } else {
      // Large desktop: Fixed position on the right side
      return { x: window.innerWidth - 180, y: 140 };
    }
  };

  // Get current date and time for display
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const buttonSize = getButtonSize();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fullscreen Camera View */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full bg-black object-contain"
        />
        
        {/* Connection Status Overlay - Top Left */}
        {!connectionStatus.video && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="text-sm">Connexion vidéo en cours...</span>
            </div>
          </div>
        )}

        {/* Small Date/Time Display - Top Center */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] border border-white/10 font-mono">
          {getCurrentDateTime()}
        </div>

        {/* Enhanced QR Code Data Overlay - Responsive Positioning */}
        {showQRPanel && (
          <div className={`absolute bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20 ${
            window.innerWidth < 768 
              ? 'top-4 left-4 right-4 max-w-none' 
              : 'top-4 right-4 max-w-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-green-400" />
                <span className="font-semibold text-sm">QR Codes ({qrCodes.length})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRPanel(false)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
              {qrCodes.length > 0 ? (
                qrCodes.slice(0, 3).map((qr) => (
                  <div key={qr.id} className="p-3 bg-white/10 rounded border border-white/20">
                    <div className="font-medium mb-2 text-green-300">QR {qr.id + 1}</div>
                    <div className="space-y-1">
                      <div className="font-semibold text-white">
                        {getBilanName(qr.data)}
                      </div>
                      {typeof qr.data === 'object' && qr.data !== null && (
                        <div className="text-gray-300 space-y-1">
                          {Object.entries(qr.data).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400">{key}:</span>
                              <span className="truncate ml-2 max-w-24">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Aucun QR code détecté</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Sensor Data Overlay - Top Center */}
        {showSensorPanel && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-sm">Capteurs</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensorPanel(false)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {sensorData ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                  <Thermometer className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-xs text-gray-300">Température</div>
                    <div className="font-semibold">{sensorData.temperature}°C</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                  <Droplets className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="text-xs text-gray-300">Humidité</div>
                    <div className="font-semibold">{sensorData.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                  <Zap className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="text-xs text-gray-300">CO₂</div>
                    <div className="font-semibold">{sensorData.co2} ppm</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <div>
                    <div className="text-xs text-gray-300">Luminosité</div>
                    <div className="font-semibold">{sensorData.luminosite} lux</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">En attente des données...</p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Floating Robot Control Buttons - Fixed Position and Very Small */}
        <div 
          className="absolute pointer-events-none transition-all duration-200"
          style={{ 
            left: controlPosition.x, 
            top: controlPosition.y
          }}
        >
          <div className="bg-black/90 backdrop-blur-sm rounded-lg p-1.5 pointer-events-auto border border-white/30 shadow-xl">
            <div className="space-y-0.5">
              {/* Mission Controls */}
              <div className="flex flex-col gap-0.5">
                <ControlButton 
                  mode="PAUSE_MISSION" 
                  size={buttonSize}
                  className="bg-amber-600/90 hover:bg-amber-700/90 border-amber-500 text-white shadow-lg"
                >
                  <Pause className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
                <ControlButton 
                  mode="PLAY_MISSION" 
                  size={buttonSize}
                  className="bg-emerald-600/90 hover:bg-emerald-700/90 border-emerald-500 text-white shadow-lg"
                >
                  <Play className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
              </div>

              {/* Movement Controls - Cross Pattern */}
              <div className="grid grid-cols-3 gap-0.5" style={{ width: buttonSize === 'sm' ? '48px' : buttonSize === 'md' ? '60px' : '72px' }}>
                <div></div>
                <ControlButton 
                  mode="TOP" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white shadow-lg"
                >
                  <ArrowUp className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
                <div></div>

                <ControlButton 
                  mode="LEFT" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white shadow-lg"
                >
                  <ArrowLeft className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
                <div className="flex items-center justify-center">
                  <div className={`rounded-full bg-white/20 border border-white/40 flex items-center justify-center ${
                    buttonSize === 'sm' ? 'w-3 h-3' : buttonSize === 'md' ? 'w-4 h-4' : 'w-5 h-5'
                  }`}>
                    <div className={`rounded-full bg-white ${
                      buttonSize === 'sm' ? 'w-1 h-1' : buttonSize === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2'
                    }`}></div>
                  </div>
                </div>
                <ControlButton 
                  mode="RIGHT" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white shadow-lg"
                >
                  <ArrowRight className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>

                <div></div>
                <ControlButton 
                  mode="DOWN" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white shadow-lg"
                >
                  <ArrowDown className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
                <div></div>
              </div>

              {/* Camera Controls */}
              <div className="flex flex-col gap-0.5">
                <ControlButton 
                  mode="TOP_CAM" 
                  size={buttonSize}
                  className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white shadow-lg"
                >
                  <ArrowUp className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
                </ControlButton>
                <ControlButton 
                  mode="DOWN_CAM" 
                  size={buttonSize}
                  className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white shadow-lg"
                >
                  <ArrowDown className={buttonSize === 'sm' ? 'h-2.5 w-2.5' : buttonSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'} />
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
              <span>Robot: {robots.find(r => r.id.toString() === selectedRobot)?.nom || 'Chargement...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-3 w-3 text-green-400" />
              <span>Caméra: {selectedCamera === 'left' ? 'Gauche' : 'Droite'}</span>
            </div>
          </div>
        </div>

        {/* Panel Toggle Buttons - Bottom Right */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {!showSensorPanel && (
            <Button
              onClick={() => setShowSensorPanel(true)}
              variant="outline"
              size="sm"
              className="bg-black/80 text-white border-white/20 hover:bg-white/10"
            >
              <Activity className="h-4 w-4 mr-2" />
              Capteurs
            </Button>
          )}
          {!showQRPanel && (
            <Button
              onClick={() => setShowQRPanel(true)}
              variant="outline"
              size="sm"
              className="bg-black/80 text-white border-white/20 hover:bg-white/10"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Codes
            </Button>
          )}
        </div>

      </div>

      {/* Enhanced Bottom Control Panel - Sticky and Collapsible */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isBottomPanelExpanded ? 'h-80' : 'h-16'
      } ${isStickyPanel ? 'sticky' : ''}`}>
        {/* Panel Header - Always Visible */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsBottomPanelExpanded(!isBottomPanelExpanded)}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              {isBottomPanelExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
            <span className="font-medium text-sm">Contrôles</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Compact Mode Toggle */}
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="compact-mode"
                checked={isCompactMode}
                onCheckedChange={setIsCompactMode}
              />
              <Label htmlFor="compact-mode" className="text-xs">
                {isCompactMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Label>
            </div>

            {/* Sticky Panel Toggle */}
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="sticky-panel"
                checked={isStickyPanel}
                onCheckedChange={setIsStickyPanel}
              />
              <Label htmlFor="sticky-panel" className="text-xs">
                📌
              </Label>
            </div>

            <Button
              onClick={refreshConnections}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={toggleFullScreen}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Panel Content - Only Visible When Expanded */}
        {isBottomPanelExpanded && (
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {/* Camera and Robot Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  Caméra
                </label>
                <Select value={selectedCamera} onValueChange={handleCameraChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Bot className="h-4 w-4" />
                  Robot
                </label>
                <Select value={selectedRobot} onValueChange={handleRobotChange} disabled={isLoadingRobots || !!robotsError}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={isLoadingRobots ? "Chargement..." : robotsError ? "Erreur" : "Choisir"} />
                  </SelectTrigger>
                  <SelectContent>
                    {robots.map((robot) => (
                      <SelectItem key={robot.id} value={robot.id.toString()}>
                        {robot.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Connexions</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(connectionStatus).map(([key, connected]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs capitalize">{key}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <Wifi className="h-3 w-3" />
                      <span>{connected ? 'OK' : 'KO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Robots Button */}
            <Button
              onClick={fetchRobots}
              disabled={isLoadingRobots}
              className="w-full h-9 text-sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRobots ? 'animate-spin' : ''}`} />
              Actualiser les robots
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
