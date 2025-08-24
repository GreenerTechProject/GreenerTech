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
  EyeOff,
  GripVertical,
  Settings,
  Move
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

interface PanelPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
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
  
  // Enhanced UI states for flexible layout
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [showControlPanel, setShowControlPanel] = useState<boolean>(true);
  const [showSensorPanel, setShowSensorPanel] = useState<boolean>(true);
  const [showQRPanel, setShowQRPanel] = useState<boolean>(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  
  // Draggable panel positions
  const [controlPanelPos, setControlPanelPos] = useState<PanelPosition>({ x: 20, y: 100 });
  const [sensorPanelPos, setSensorPanelPos] = useState<PanelPosition>({ x: 20, y: 300 });
  const [qrPanelPos, setQrPanelPos] = useState<PanelPosition>({ x: window.innerWidth - 320, y: 100 });
  const [settingsPanelPos, setSettingsPanelPos] = useState<PanelPosition>({ x: window.innerWidth - 320, y: 400 });
  
  // Panel states
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelSizes, setPanelSizes] = useState({
    control: { width: 280, height: 200 },
    sensor: { width: 280, height: 150 },
    qr: { width: 300, height: 200 },
    settings: { width: 300, height: 250 }
  });

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
      sm: 'w-10 h-10 p-1.5',
      md: 'w-12 h-12 p-2',
      lg: 'w-14 h-14 p-2.5'
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
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
        className={`${className} ${sizeClasses[size]} ${pressedButton === mode ? "ring-2 ring-white/70 scale-95" : ""} transition-all duration-150 touch-manipulation select-none text-xs shadow-lg`}
        variant="outline"
      >
        {children}
      </Button>
    );
  };

  // Draggable panel component
  const DraggablePanel: React.FC<{
    id: string;
    title: string;
    children: React.ReactNode;
    position: PanelPosition;
    onPositionChange: (pos: PanelPosition) => void;
    size: { width: number; height: number };
    onSizeChange?: (size: { width: number; height: number }) => void;
    isVisible: boolean;
    onToggle: () => void;
    onClose: () => void;
    className?: string;
  }> = ({ 
    id, 
    title, 
    children, 
    position, 
    onPositionChange, 
    size, 
    onSizeChange,
    isVisible, 
    onToggle, 
    onClose, 
    className = "" 
  }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
      e.preventDefault();
      if (action === 'drag') {
        setIsDragging(id);
        setDragOffset({
          x: e.clientX - position.x,
          y: e.clientY - position.y
        });
      } else if (action === 'resize' && onSizeChange) {
        setIsResizing(true);
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: size.width,
          height: size.height
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging === id) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep panel within viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        onPositionChange({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          width: size.width,
          height: size.height
        });
      } else if (isResizing && onSizeChange) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(200, resizeStart.width + deltaX);
        const newHeight = Math.max(150, resizeStart.height + deltaY);
        
        onSizeChange({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      setIsResizing(false);
    };

    useEffect(() => {
      if (isDragging === id || isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, isResizing, id]);

    if (!isVisible) return null;

    return (
      <div
        ref={panelRef}
        className={`absolute bg-black/90 backdrop-blur-sm text-white rounded-lg border border-white/30 shadow-2xl ${className}`}
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: isDragging === id ? 1000 : 100
        }}
      >
        {/* Panel Header */}
        <div 
          className="flex items-center justify-between p-3 border-b border-white/20 cursor-move select-none"
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-white/60" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Minimize className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-3 h-full overflow-y-auto">
          {children}
        </div>

        {/* Resize Handle */}
        {onSizeChange && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white/40"></div>
          </div>
        )}
      </div>
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
      // Reposition panels on screen resize
      setQrPanelPos(prev => ({ ...prev, x: window.innerWidth - 320 }));
      setSettingsPanelPos(prev => ({ ...prev, x: window.innerWidth - 320 }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

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

  const buttonSize = isCompactMode ? 'sm' : 'md';

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

        {/* Date/Time Display - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-sm border border-white/10 font-mono">
          {getCurrentDateTime()}
        </div>

        {/* Floating Control Panel */}
        <DraggablePanel
          id="control"
          title="Contrôles Robot"
          position={controlPanelPos}
          onPositionChange={setControlPanelPos}
          size={panelSizes.control}
          onSizeChange={(size) => setPanelSizes(prev => ({ ...prev, control: size }))}
          isVisible={showControlPanel}
          onToggle={() => setShowControlPanel(!showControlPanel)}
          onClose={() => setShowControlPanel(false)}
        >
          <div className="space-y-4">
            {/* Mission Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <ControlButton 
                  mode="PAUSE_MISSION" 
                  size={buttonSize}
                  className="bg-amber-600/90 hover:bg-amber-700/90 border-amber-500 text-white flex-1"
                >
                  <Pause className="h-4 w-4" />
                </ControlButton>
                <ControlButton 
                  mode="PLAY_MISSION" 
                  size={buttonSize}
                  className="bg-emerald-600/90 hover:bg-emerald-700/90 border-emerald-500 text-white flex-1"
                >
                  <Play className="h-4 w-4" />
                </ControlButton>
              </div>
            </div>

            {/* Movement Controls - Cross Pattern */}
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              <div></div>
              <ControlButton 
                mode="TOP" 
                size={buttonSize}
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowUp className="h-4 w-4" />
              </ControlButton>
              <div></div>

              <ControlButton 
                mode="LEFT" 
                size={buttonSize}
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </ControlButton>
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              <ControlButton 
                mode="RIGHT" 
                size={buttonSize}
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </ControlButton>

              <div></div>
              <ControlButton 
                mode="DOWN" 
                size={buttonSize}
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowDown className="h-4 w-4" />
              </ControlButton>
              <div></div>
            </div>

            {/* Camera Controls */}
            <div className="flex gap-2">
              <ControlButton 
                mode="TOP_CAM" 
                size={buttonSize}
                className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white flex-1"
              >
                <ArrowUp className="h-4 w-4" />
              </ControlButton>
              <ControlButton 
                mode="DOWN_CAM" 
                size={buttonSize}
                className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white flex-1"
              >
                <ArrowDown className="h-4 w-4" />
              </ControlButton>
            </div>
          </div>
        </DraggablePanel>

        {/* Floating Sensor Panel */}
        <DraggablePanel
          id="sensor"
          title="Capteurs"
          position={sensorPanelPos}
          onPositionChange={setSensorPanelPos}
          size={panelSizes.sensor}
          onSizeChange={(size) => setPanelSizes(prev => ({ ...prev, sensor: size }))}
          isVisible={showSensorPanel}
          onToggle={() => setShowSensorPanel(!showSensorPanel)}
          onClose={() => setShowSensorPanel(false)}
        >
          {sensorData ? (
            <div className="grid grid-cols-2 gap-3">
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
        </DraggablePanel>

        {/* Floating QR Panel */}
        <DraggablePanel
          id="qr"
          title="QR Codes"
          position={qrPanelPos}
          onPositionChange={setQrPanelPos}
          size={panelSizes.qr}
          onSizeChange={(size) => setPanelSizes(prev => ({ ...prev, qr: size }))}
          isVisible={showQRPanel}
          onToggle={() => setShowQRPanel(!showQRPanel)}
          onClose={() => setShowQRPanel(false)}
        >
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {qrCodes.length > 0 ? (
              qrCodes.slice(0, 3).map((qr) => (
                <div key={qr.id} className="p-2 bg-white/10 rounded border border-white/20">
                  <div className="font-medium mb-1 text-green-300 text-xs">QR {qr.id + 1}</div>
                  <div className="text-xs">
                    <div className="font-semibold text-white truncate">
                      {getBilanName(qr.data)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-gray-400">
                <QrCode className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Aucun QR code détecté</p>
              </div>
            )}
          </div>
        </DraggablePanel>

        {/* Floating Settings Panel */}
        <DraggablePanel
          id="settings"
          title="Paramètres"
          position={settingsPanelPos}
          onPositionChange={setSettingsPanelPos}
          size={panelSizes.settings}
          onSizeChange={(size) => setPanelSizes(prev => ({ ...prev, settings: size }))}
          isVisible={showSettingsPanel}
          onToggle={() => setShowSettingsPanel(!showSettingsPanel)}
          onClose={() => setShowSettingsPanel(false)}
        >
          <div className="space-y-4">
            {/* Camera and Robot Selection */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  Caméra
                </label>
                <Select value={selectedCamera} onValueChange={handleCameraChange}>
                  <SelectTrigger className="h-8 text-sm bg-white/10 border-white/20 text-white">
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
                  <SelectTrigger className="h-8 text-sm bg-white/10 border-white/20 text-white">
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
                  <div key={key} className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <span className="text-xs capitalize text-gray-300">{key}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      <Wifi className="h-3 w-3" />
                      <span>{connected ? 'OK' : 'KO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-2">
              <Button
                onClick={fetchRobots}
                disabled={isLoadingRobots}
                className="w-full h-8 text-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRobots ? 'animate-spin' : ''}`} />
                Actualiser les robots
              </Button>
              <Button
                onClick={refreshConnections}
                disabled={isRefreshing}
                className="w-full h-8 text-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser les connexions
              </Button>
            </div>
          </div>
        </DraggablePanel>

        {/* Current Robot/Camera Info - Bottom Left */}
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
          {!showControlPanel && (
            <Button
              onClick={() => setShowControlPanel(true)}
              variant="outline"
              size="sm"
              className="bg-black/80 text-white border-white/20 hover:bg-white/10"
            >
              <Move className="h-4 w-4 mr-2" />
              Contrôles
            </Button>
          )}
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
          {!showSettingsPanel && (
            <Button
              onClick={() => setShowSettingsPanel(true)}
              variant="outline"
              size="sm"
              className="bg-black/80 text-white border-white/20 hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          )}
        </div>

        {/* Fullscreen Toggle - Top Right */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={toggleFullScreen}
            variant="outline"
            size="sm"
            className="bg-black/80 text-white border-white/20 hover:bg-white/10"
          >
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
