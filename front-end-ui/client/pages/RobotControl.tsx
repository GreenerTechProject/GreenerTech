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
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  EyeOff,
  Move,
  GripVertical,
  X
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
  const [isAIDetectionEnabled, setIsAIDetectionEnabled] = useState<boolean>(false);
  const [videoZoom, setVideoZoom] = useState<number>(1);
  const [videoPosition, setVideoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Control button states
  const [pressedButton, setPressedButton] = useState<string>('');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [buttonSize, setButtonSize] = useState<'sm' | 'default' | 'lg'>('default');

  // Panel states for draggable panels
  const [controlPanelPos, setControlPanelPos] = useState<PanelPosition>({ x: 50, y: 100, width: 300, height: 400 });
  const [sensorPanelPos, setSensorPanelPos] = useState<PanelPosition>({ x: 400, y: 100, width: 250, height: 200 });
  const [qrPanelPos, setQrPanelPos] = useState<PanelPosition>({ x: 700, y: 100, width: 300, height: 300 });
  const [settingsPanelPos, setSettingsPanelPos] = useState<PanelPosition>({ x: 50, y: 550, width: 300, height: 250 });

  const [panelSizes, setPanelSizes] = useState<{
    control: PanelPosition;
    sensor: PanelPosition;
    qr: PanelPosition;
    settings: PanelPosition;
  }>({
    control: { x: 0, y: 0, width: 300, height: 400 },
    sensor: { x: 0, y: 0, width: 250, height: 200 },
    qr: { x: 0, y: 0, width: 300, height: 300 },
    settings: { x: 0, y: 0, width: 300, height: 250 }
  });

  const [showControlPanel, setShowControlPanel] = useState<boolean>(true);
  const [showSensorPanel, setShowSensorPanel] = useState<boolean>(true);
  const [showQrPanel, setShowQrPanel] = useState<boolean>(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  // Dragging and resizing states
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panel refs
  const panelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // Dragging and resizing functions
  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', panelId: string) => {
    e.preventDefault();

    if (action === 'drag') {
      setIsDragging(panelId);
      const panel = panelRefs.current[panelId];
      if (panel) {
        const rect = panel.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    } else if (action === 'resize') {
      setIsResizing(panelId);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const panelId = isDragging;
      const panel = panelRefs.current[panelId];
      if (panel) {
        const container = panel.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newX = e.clientX - dragOffset.x - containerRect.left;
          const newY = e.clientY - dragOffset.y - containerRect.top;

          // Update panel position based on panelId
          if (panelId === 'control') {
            setControlPanelPos(prev => ({ ...prev, x: Math.max(0, newX), y: Math.max(0, newY) }));
          } else if (panelId === 'sensor') {
            setSensorPanelPos(prev => ({ ...prev, x: Math.max(0, newX), y: Math.max(0, newY) }));
          } else if (panelId === 'qr') {
            setQrPanelPos(prev => ({ ...prev, x: Math.max(0, newX), y: Math.max(0, newY) }));
          } else if (panelId === 'settings') {
            setSettingsPanelPos(prev => ({ ...prev, x: Math.max(0, newX), y: Math.max(0, newY) }));
          }
        }
      }
    } else if (isResizing) {
      const panelId = isResizing;
      const panel = panelRefs.current[panelId];
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;

        // Update panel size based on panelId
        if (panelId === 'control') {
          setPanelSizes(prev => ({
            ...prev,
            control: {
              ...prev.control,
              width: Math.max(200, newWidth),
              height: Math.max(150, newHeight)
            }
          }));
        } else if (panelId === 'sensor') {
          setPanelSizes(prev => ({
            ...prev,
            sensor: {
              ...prev.sensor,
              width: Math.max(200, newWidth),
              height: Math.max(150, newHeight)
            }
          }));
        } else if (panelId === 'qr') {
          setPanelSizes(prev => ({
            ...prev,
            qr: {
              ...prev.qr,
              width: Math.max(200, newWidth),
              height: Math.max(150, newHeight)
            }
          }));
        } else if (panelId === 'settings') {
          setPanelSizes(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              width: Math.max(200, newWidth),
              height: Math.max(150, newHeight)
            }
          }));
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsResizing(null);
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
    setPressedButton(mode);
    sendCommand(mode);
  };

  const handleButtonUp = (mode?: string) => {
    if (!mode || !["PAUSE_MISSION", "PLAY_MISSION"].includes(mode)) {
      console.log("Sending mode: STOP");
      sendCommand("STOP");
    }
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

  // DraggablePanel component
  const DraggablePanel: React.FC<{
    id: string;
    title: string;
    position: PanelPosition;
    onPositionChange: (pos: PanelPosition) => void;
    size: PanelPosition;
    onSizeChange?: (size: PanelPosition) => void;
    isVisible: boolean;
    onToggle: () => void;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
  }> = ({ id, title, position, onPositionChange, size, onSizeChange, isVisible, onToggle, onClose, children, className = "" }) => {
    if (!isVisible) return null;

    return (
      <div
        ref={(el) => {
          if (el) {
            panelRefs.current[id] = el;
          }
        }}
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
          onMouseDown={(e) => handleMouseDown(e, 'drag', id)}
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
            onMouseDown={(e) => handleMouseDown(e, 'resize', id)}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white/40"></div>
          </div>
        )}
      </div>
    );
  };

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

  // Handle mouse events for dragging and resizing
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseUpGlobal = () => handleMouseUp();

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal);
        document.removeEventListener('mouseup', handleMouseUpGlobal);
      };
    }
  }, [isDragging, isResizing]);



  return (
    <div className="flex h-screen bg-background">
      {/* Header removed: provided by TechnicianLayout */}

      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Left Sidebar - Controls */}
            <div className="w-64 bg-white shadow-lg p-3 overflow-y-auto space-y-3 border-r">
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

          {/* Video Controls */}
          <Card className="text-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contrôles Vidéo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-1">
                <Button
                  onClick={zoomOut}
                  className="flex-1 h-8 text-sm"
                  variant="outline"
                  disabled={videoZoom <= 0.5}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  onClick={resetZoom}
                  className="flex-1 h-8 text-sm"
                  variant="outline"
                >
                  {Math.round(videoZoom * 100)}%
                </Button>
                <Button
                  onClick={zoomIn}
                  className="flex-1 h-8 text-sm"
                  variant="outline"
                  disabled={videoZoom >= 3}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>

              <Button
                onClick={captureImage}
                className="w-full h-8 text-sm"
                variant="outline"
              >
                <Download className="h-3 w-3 mr-1" />
                Capturer Image
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

              <Button
                onClick={toggleAIDetection}
                className={`w-full h-8 text-sm ${
                  isAIDetectionEnabled
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                variant="outline"
              >
                {isAIDetectionEnabled ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    IA Activée
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    IA Désactivée
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
                  className="bg-amber-600/90 hover:bg-amber-700/90 border-amber-500 text-white flex-1"
                >
                  <Pause className="h-4 w-4" />
                </ControlButton>
                <ControlButton
                  mode="PLAY_MISSION"
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
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowUp className="h-4 w-4" />
              </ControlButton>
              <div></div>

              <ControlButton
                mode="LEFT"
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
                className="bg-slate-600/90 hover:bg-slate-700/90 border-slate-500 text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </ControlButton>

              <div></div>
              <ControlButton
                mode="DOWN"
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
                className="bg-indigo-600/90 hover:bg-indigo-700/90 border-indigo-500 text-white flex-1"
              >
                <ArrowUp className="h-4 w-4" />
              </ControlButton>
              <ControlButton
                mode="DOWN_CAM"
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
            <p className="text-gray-300 text-sm">Waiting for sensor data...</p>
          )}
        </DraggablePanel>

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
        </main>
      </div>
    </div>
  );
}
