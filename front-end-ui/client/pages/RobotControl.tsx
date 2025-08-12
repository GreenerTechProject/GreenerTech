import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
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
  Bot
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

interface ControlCommand {
  control_mode: string;
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
  const [selectedCamera, setSelectedCamera] = useState<string>('left');
  const [selectedRobot, setSelectedRobot] = useState<string>('1');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // WebSocket references
  const qrWsRef = useRef<WebSocket | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const sensorWsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Initialize WebRTC for video streaming
  const startWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const rob = selectedRobot || "1";
      const cam = selectedCamera || "right";

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
  const initializeWebSockets = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const hostname = window.location.hostname;
    const port = "8080";
    
	const rob = selectedRobot || "1";
    const cam = selectedCamera || "right";

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
      startWebRTC();
      initializeWebSockets();
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
    // Restart video stream with new camera
    if (pcRef.current) {
      pcRef.current.close();
    }
    setTimeout(() => {
      startWebRTC();
    }, 500);
  };

  // Handle robot selection change
  const handleRobotChange = (robot: string) => {
    setSelectedRobot(robot);
    // Send robot selection command
    sendCommand('SELECT_ROBOT');
  };

  // Handle button press/release
  const handleButtonDown = (mode: string) => {
    console.log("Sending mode:", mode);
    sendCommand(mode);
  };

  const handleButtonUp = () => {
    console.log("Sending mode: STOP");
    sendCommand("STOP");
  };

  // Control button component
  const ControlButton: React.FC<{ 
    mode: string; 
    children: React.ReactNode; 
    className?: string;
  }> = ({ mode, children, className = "" }) => (
    <Button
  	onMouseDown={() => handleButtonDown(mode)}
  	onMouseUp={handleButtonUp}
  	onMouseLeave={handleButtonUp}
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
    startWebRTC();
    initializeWebSockets();

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
  
    initializeWebSockets();
    
    if (pcRef.current) pcRef.current.close();
    startWebRTC();
  
    return () => {
      if (qrWsRef.current) qrWsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, [selectedRobot, selectedCamera]);



  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Contrôle Robot"
        subtitle="Interface de contrôle du robot autonome"
        userRole="technicien"
        badge={{
          text: "En Ligne",
          variant: "outline",
          className: "bg-green-50 border-green-200 text-green-700"
        }}
      />

      <div className="container mx-auto p-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Controls */}
          <div className="w-80 space-y-4">
            {/* Camera Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Sélection Caméra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCamera} onValueChange={handleCameraChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une caméra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Caméra Gauche</SelectItem>
                    <SelectItem value="right">Caméra Droite</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Robot Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Sélection Robot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRobot} onValueChange={handleRobotChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un robot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="robot1">Robot #1</SelectItem>
                    <SelectItem value="robot2">Robot #2</SelectItem>
                    <SelectItem value="robot3">Robot #3</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Control Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actions de Contrôle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={refreshConnections}
                  disabled={isRefreshing}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>

                <Button
                  onClick={toggleFullScreen}
                  className="w-full"
                  variant="outline"
                >
                  {isFullScreen ? (
                    <>
                      <Minimize className="h-4 w-4 mr-2" />
                      Quitter Plein Écran
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Plein Écran
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">État des Connexions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(connectionStatus).map(([key, connected]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key}</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <Wifi className="h-3 w-3" />
                        <span>{connected ? 'Connecté' : 'Déconnecté'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Video Area */}
          <div className="flex-1">
          {/* Video Stream with Overlays */}
          <Card className="w-full">
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[450px] bg-black rounded-lg object-contain border"
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
                        <div key={qr.id} className="p-2 bg-white/10 rounded text-xs">
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
                        <ControlButton mode="LEFT_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          <span className="text-xs">Cam</span>
                        </ControlButton>
                        <ControlButton mode="RIGHT_CAM" className="bg-purple-500/90 hover:bg-purple-600/90 border-purple-400 text-white px-3 py-2">
                          <ArrowRight className="mr-1 h-4 w-4" />
                          <span className="text-xs">Cam</span>
                        </ControlButton>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Current Robot/Camera Info Overlay - Bottom Left */}
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/20">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3 w-3 text-blue-400" />
                      <span>Robot: {selectedRobot.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-3 w-3 text-green-400" />
                      <span>Caméra: {selectedCamera === 'left' ? 'Gauche' : 'Droite'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
