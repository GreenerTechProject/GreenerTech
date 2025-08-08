import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  Camera,
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  QrCode
} from 'lucide-react';

interface QRCodeData {
  [key: string]: any;
}

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  luminosite: number;
}

interface WebRTCViewerProps {
  className?: string;
}

export default function WebRTCViewer({ className }: WebRTCViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [controlWsConnected, setControlWsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const sensorWsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // WebRTC Video Stream Setup
  const startWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.ontrack = (event) => {
        if (videoRef.current && videoRef.current.srcObject !== event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch("/service/video_stream_service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: pc.localDescription })
      });

      if (response.ok) {
        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setIsConnected(true);
      }
    } catch (error) {
      console.error("WebRTC connection failed:", error);
    }
  };

  // WebSocket for QR Code data
  const setupQRCodeWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/qr_data`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("QR WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received QR data:", data);

        if (data.qr_codes && Array.isArray(data.qr_codes)) {
          const parsedQRCodes = data.qr_codes.map((qrCodeStr: string, index: number) => {
            try {
              return { id: index, ...JSON.parse(qrCodeStr) };
            } catch (e) {
              return { id: index, raw: qrCodeStr };
            }
          });
          setQrCodes(parsedQRCodes);
        }
      } catch (e) {
        console.error("Failed to parse QR WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      console.log("QR WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.error("QR WebSocket error:", err);
    };
  };

  // WebSocket for Sensor data
  const setupSensorWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/sensor_data`);
    sensorWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSensorData(data);
      } catch (e) {
        console.error("Failed to parse sensor data:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("Sensor WebSocket error:", e);
      setSensorData(null);
    };
  };

  // Control WebSocket
  const setupControlWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/control`);
    controlWsRef.current = ws;

    ws.onopen = () => {
      console.log("Control WebSocket connected");
      setControlWsConnected(true);
    };

    ws.onclose = () => {
      console.log("Control WebSocket disconnected");
      setControlWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("Control WebSocket error:", err);
      setControlWsConnected(false);
    };
  };

  // Send control commands
  const sendControlCommand = (mode: string) => {
    if (controlWsRef.current && controlWsRef.current.readyState === WebSocket.OPEN) {
      controlWsRef.current.send(JSON.stringify({ control_mode: mode }));
    } else {
      console.warn("Control WebSocket not open");
    }
  };

  // Control button handlers
  const handleMouseDown = (mode: string) => {
    sendControlCommand(mode);
  };

  const handleMouseUp = () => {
    sendControlCommand("STOP");
  };

  useEffect(() => {
    startWebRTC();
    setupQRCodeWebSocket();
    setupSensorWebSocket();
    setupControlWebSocket();

    return () => {
      // Cleanup
      if (wsRef.current) wsRef.current.close();
      if (controlWsRef.current) controlWsRef.current.close();
      if (sensorWsRef.current) sensorWsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const renderQRCodeData = (data: any, level = 0): React.ReactNode => {
    if (typeof data === 'object' && data !== null) {
      return (
        <div className={`ml-${level * 4}`}>
          {Object.entries(data).map(([key, value], index) => (
            <div key={index} className="mb-1">
              <span className="font-semibold text-xs">{key}:</span>{' '}
              {typeof value === 'object' && value !== null ? (
                <div className="ml-2">{renderQRCodeData(value, level + 1)}</div>
              ) : (
                <span className="text-xs">{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-xs">{String(data)}</span>;
  };

  return (
    <div className={`flex flex-row gap-4 h-full ${className}`}>
      {/* Video Stream Container */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Video
              {isConnected && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              muted
              className="w-full h-96 bg-black object-contain border rounded"
            />
          </CardContent>
        </Card>
      </div>

      {/* Sensor Data Container */}
      <div className="w-64">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              🌿 Sensor Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sensorData ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span>Température: {sensorData.temperature}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span>Humidité: {sensorData.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-green-500" />
                  <span>CO₂: {sensorData.co2} ppm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span>Luminosité: {sensorData.luminosite} lux</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Waiting for sensor data...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Data Container */}
      <div className="w-80">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <QrCode className="h-4 w-4" />
              Detected QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {qrCodes.length > 0 ? (
                <div className="space-y-2">
                  {qrCodes.map((qrCode, index) => (
                    <div key={qrCode.id || index} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="font-semibold mb-1">QR Code {index + 1}:</div>
                      {renderQRCodeData(qrCode)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No QR codes detected</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Control Buttons Container */}
      <div className="w-48">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Controls</CardTitle>
            {controlWsConnected && (
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 w-fit">
                Connected
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("PAUSE_MISSION")}
                onMouseUp={handleMouseUp}
                className="w-full"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Mission
              </Button>
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("PLAY_MISSION")}
                onMouseUp={handleMouseUp}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Play Mission
              </Button>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("LEFT")}
                  onMouseUp={handleMouseUp}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("RIGHT")}
                  onMouseUp={handleMouseUp}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("TOP")}
                  onMouseUp={handleMouseUp}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("DOWN")}
                  onMouseUp={handleMouseUp}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("LEFT_CAM")}
                  onMouseUp={handleMouseUp}
                  className="text-xs"
                >
                  ◀️ Cam
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("RIGHT_CAM")}
                  onMouseUp={handleMouseUp}
                  className="text-xs"
                >
                  Cam ▶️
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
