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
  GripVertical,
  Settings,
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
  
  // New UI states
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [isStickyPanel, setIsStickyPanel] = useState<boolean>(true);
  const [controlPosition, setControlPosition] = useState<ControlPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Drag and drop functionality for controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to screen bounds
      const maxX = window.innerWidth - 200; // Control panel width
      const maxY = window.innerHeight - 300; // Control panel height
      
      setControlPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Control button component with responsive sizing
  const ControlButton: React.FC<{ 
    mode: string; 
    children: React.ReactNode; 
    className?: string;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ mode, children, className = "", size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 p-1',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-3'
    };

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <Button
        onTouchStart={() => handleButtonDown(mode)}
        onTouchEnd={() => handleButtonUp()}
        onMouseDown={() => handleButtonDown(mode)}
        onMouseUp={() => handleButtonUp()}
        onMouseLeave={() => {
          if (pressedButton === mode) {
            handleButtonUp();
          }
        }}
        className={`${className} ${sizeClasses[size]} ${pressedButton === mode ? "ring-2 ring-white/50" : ""}`}
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

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (qrWsRef.current) qrWsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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

  // Responsive button sizes based on screen size
  const getButtonSize = () => {
    if (isCompactMode) return 'sm';
    if (window.innerWidth < 480) return 'sm';
    if (window.innerWidth < 768) return 'md';
    return 'lg';
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

        {/* QR Code Data Overlay - Top Right */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-4 border-2 border-white rounded-sm" />
            <span className="font-semibold text-sm">QR Codes ({qrCodes.length})</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
            {qrCodes.length > 0 ? (
              qrCodes.slice(0, 2).map((qr) => (
                <div key={qr.id} className="p-2 bg-white/10 rounded text-xs">
                  <div className="font-medium mb-1">QR {qr.id + 1}:</div>
                  <div className="truncate">{String(qr.data).substring(0, 50)}...</div>
                </div>
              ))
            ) : (
              <p className="text-gray-300 text-xs">Aucun QR code détecté</p>
            )}
          </div>
        </div>

        {/* Sensor Data Overlay - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-4 w-4" />
            <span className="font-semibold text-sm">Capteurs</span>
          </div>
          {sensorData ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-red-400" />
                <span>{sensorData.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span>{sensorData.humidity}%</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-xs">En attente...</p>
          )}
        </div>

        {/* Floating Robot Control Buttons - Draggable */}
        <div 
          className={`absolute pointer-events-none transition-transform ${isDragging ? 'scale-105' : ''}`}
          style={{ 
            left: controlPosition.x, 
            top: controlPosition.y,
            transform: `translate(${isDragging ? '0, 0' : '0, 0'})`
          }}
        >
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 pointer-events-auto border border-white/20">
            {/* Drag Handle */}
            <div 
              className="flex items-center justify-center mb-2 cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="h-4 w-4 text-white/60" />
            </div>

            <div className="space-y-2">
              {/* Mission Controls */}
              <div className="flex flex-col gap-1">
                <ControlButton 
                  mode="PAUSE_MISSION" 
                  size={buttonSize}
                  className="bg-amber-600/90 hover:bg-amber-700/90 border-amber-500 text-white"
                >
                  <Pause className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
                <ControlButton 
                  mode="PLAY_MISSION" 
                  size={buttonSize}
                  className="bg-emerald-600/90 hover:bg-emerald-700/90 border-emerald-500 text-white"
                >
                  <Play className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
              </div>

              {/* Movement Controls - Cross Pattern */}
              <div className="grid grid-cols-3 gap-1" style={{ width: buttonSize === 'sm' ? '72px' : buttonSize === 'md' ? '90px' : '108px' }}>
                <div></div>
                <ControlButton 
                  mode="TOP" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
                >
                  <ArrowUp className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
                <div></div>

                <ControlButton 
                  mode="LEFT" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
                >
                  <ArrowLeft className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
                <div className="flex items-center justify-center">
                  <div className={`rounded-full bg-white/20 border border-white/40 flex items-center justify-center ${
                    buttonSize === 'sm' ? 'w-4 h-4' : buttonSize === 'md' ? 'w-5 h-5' : 'w-6 h-6'
                  }`}>
                    <div className={`rounded-full bg-white ${
                      buttonSize === 'sm' ? 'w-1.5 h-1.5' : buttonSize === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'
                    }`}></div>
                  </div>
                </div>
                <ControlButton 
                  mode="RIGHT" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
                >
                  <ArrowRight className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>

                <div></div>
                <ControlButton 
                  mode="DOWN" 
                  size={buttonSize}
                  className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
                >
                  <ArrowDown className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
                <div></div>
              </div>

              {/* Camera Controls */}
              <div className="flex flex-col gap-1">
                <ControlButton 
                  mode="TOP_CAM" 
                  size={buttonSize}
                  className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white"
                >
                  <ArrowUp className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
                </ControlButton>
                <ControlButton 
                  mode="DOWN_CAM" 
                  size={buttonSize}
                  className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white"
                >
                  <ArrowDown className={buttonSize === 'sm' ? 'h-3 w-3' : buttonSize === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
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
      </div>

      {/* Bottom Control Panel - Sticky and Collapsible */}
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
