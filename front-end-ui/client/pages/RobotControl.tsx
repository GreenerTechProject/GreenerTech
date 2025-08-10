import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Sun
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

      const response = await fetch(`${protocol}://${hostname}:${port}/service/video_stream_service`, {
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

    // QR Code WebSocket
    const qrWs = new WebSocket(`${protocol}://${hostname}:${port}/service/qr_data`);
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
    const controlWs = new WebSocket(`${protocol}://${hostname}:${port}/service/control`);
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
    const sensorWs = new WebSocket(`${protocol}://${hostname}:${port}/service/sensor_data`);
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
      controlWsRef.current.send(JSON.stringify({ control_mode: mode }));
    } else {
      console.warn("Control WebSocket not open");
    }
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
      className={`w-full ${className}`}
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
    };
  }, []);

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
        
        {/* Connection Status */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(connectionStatus).map(([key, connected]) => (
            <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{key}: {connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Video Stream */}
          <Card className="lg:col-span-1 xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Video Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 bg-black rounded-lg object-contain border"
              />
            </CardContent>
          </Card>

          {/* Sensor Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Sensor Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sensorData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Temperature:</span>
                    <span>{sensorData.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Humidity:</span>
                    <span>{sensorData.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="font-medium">CO₂:</span>
                    <span>{sensorData.co2} ppm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Light:</span>
                    <span>{sensorData.luminosite} lux</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Waiting for sensor data...</p>
              )}
            </CardContent>
          </Card>

          {/* QR Code Data */}
          <Card>
            <CardHeader>
              <CardTitle>Detected QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {qrCodes.length > 0 ? (
                  qrCodes.map((qr) => (
                    <div key={qr.id} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="font-medium mb-2">QR Code {qr.id + 1}:</div>
                      {typeof qr.data === 'object' ? (
                        <div className="space-y-1">
                          {Object.entries(qr.data).map(([key, value]) => 
                            renderQRValue(key, value)
                          )}
                        </div>
                      ) : (
                        <div>{String(qr.data)}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No QR codes detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Robot Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <ControlButton mode="PAUSE_MISSION" className="col-span-2">
                <Pause className="mr-2 h-4 w-4" />
                Pause Mission
              </ControlButton>
              
              <ControlButton mode="PLAY_MISSION" className="col-span-2">
                <Play className="mr-2 h-4 w-4" />
                Play Mission
              </ControlButton>
              
              <ControlButton mode="RIGHT">
                <ArrowRight className="mr-2 h-4 w-4" />
                Right
              </ControlButton>
              
              <ControlButton mode="LEFT">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Left
              </ControlButton>
              
              <ControlButton mode="TOP">
                <ArrowUp className="mr-2 h-4 w-4" />
                Up
              </ControlButton>
              
              <ControlButton mode="DOWN">
                <ArrowDown className="mr-2 h-4 w-4" />
                Down
              </ControlButton>
              
              <ControlButton mode="RIGHT_CAM">
                <ArrowRight className="mr-2 h-4 w-4" />
                Cam Right
              </ControlButton>
              
              <ControlButton mode="LEFT_CAM">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cam Left
              </ControlButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
