import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TechnicianSidebar from "../components/TechnicianSidebar";
import {
  Camera,
  Play,
  Pause,
  LogOut,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Thermometer,
  Droplets,
  Wind,
  Sun,
} from "lucide-react";

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  luminosite: number;
}

interface QRCodeData {
  [key: string]: any;
}

export default function RobotSurveillance() {
  const { user, logout } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    co2: 0,
    luminosite: 0,
  });
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [controlWs, setControlWs] = useState<WebSocket | null>(null);
  const [qrWs, setQrWs] = useState<WebSocket | null>(null);
  const [sensorWs, setSensorWs] = useState<WebSocket | null>(null);

  // WebRTC setup
  useEffect(() => {
    const startWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection();
        pc.addTransceiver("video", { direction: "recvonly" });
        
        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch("/service/video_stream_service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer: pc.localDescription }),
        });

        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("WebRTC connection failed:", error);
        setIsConnected(false);
      }
    };

    startWebRTC();
  }, []);

  // WebSocket connections
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const hostname = window.location.hostname;
    const port = "8080";

    // Control WebSocket
    const controlSocket = new WebSocket(`${protocol}://${hostname}:${port}/service/control`);
    controlSocket.onopen = () => console.log("Control WebSocket connected");
    controlSocket.onerror = (err) => console.error("Control WebSocket error:", err);
    setControlWs(controlSocket);

    // QR Code WebSocket
    const qrSocket = new WebSocket(`${protocol}://${hostname}:${port}/service/qr_data`);
    qrSocket.onopen = () => console.log("QR WebSocket connected");
    qrSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.qr_codes && Array.isArray(data.qr_codes)) {
          const parsedQRCodes = data.qr_codes.map((qrCodeStr: string, index: number) => {
            try {
              return { id: index, data: JSON.parse(qrCodeStr) };
            } catch {
              return { id: index, data: qrCodeStr };
            }
          });
          setQrCodes(parsedQRCodes);
        }
      } catch (error) {
        console.error("Failed to parse QR data:", error);
      }
    };
    setQrWs(qrSocket);

    // Sensor Data WebSocket
    const sensorSocket = new WebSocket(`${protocol}://${hostname}:${port}/service/sensor_data`);
    sensorSocket.onopen = () => console.log("Sensor WebSocket connected");
    sensorSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSensorData(data);
      } catch (error) {
        console.error("Failed to parse sensor data:", error);
      }
    };
    sensorSocket.onerror = () => {
      setSensorData({
        temperature: 0,
        humidity: 0,
        co2: 0,
        luminosite: 0,
      });
    };
    setSensorWs(sensorSocket);

    return () => {
      controlSocket.close();
      qrSocket.close();
      sensorSocket.close();
    };
  }, []);

  const sendControlCommand = (mode: string) => {
    if (controlWs && controlWs.readyState === WebSocket.OPEN) {
      controlWs.send(JSON.stringify({ control_mode: mode }));
    } else {
      console.warn("Control WebSocket not open");
    }
  };

  const handleButtonDown = (mode: string) => {
    sendControlCommand(mode);
  };

  const handleButtonUp = () => {
    sendControlCommand("STOP");
  };

  const renderQRData = (data: any, depth = 0): React.ReactNode => {
    if (typeof data === "object" && data !== null) {
      return (
        <div className={`ml-${depth * 4}`}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="font-medium text-gray-700">{key}:</span>{" "}
              {typeof value === "object" ? (
                renderQRData(value, depth + 1)
              ) : (
                <span className="text-gray-600">{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-600">{String(data)}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar userRole="technicien" />
              <div className="flex items-center space-x-2">
                <Camera className="h-6 w-6 text-blue-500" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Surveillance Robot
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-row gap-4 p-4 h-[calc(100vh-100px)]">
        {/* Video Stream Container */}
        <div className="flex-1 flex flex-col">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Flux Vidéo en Direct</span>
                {isConnected && (
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                    Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-full bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  controls
                  muted
                  className="w-full h-full object-contain"
                  style={{ maxHeight: "500px" }}
                />
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">En attente de connexion...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Data Container */}
        <div className="w-64">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-green-600" />
                <span>Capteurs IoT</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Température</span>
                  </div>
                  <span className="font-medium">{sensorData.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Humidité</span>
                  </div>
                  <span className="font-medium">{sensorData.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wind className="h-4 w-4 text-green-500" />
                    <span className="text-sm">CO₂</span>
                  </div>
                  <span className="font-medium">{sensorData.co2} ppm</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Luminosité</span>
                  </div>
                  <span className="font-medium">{sensorData.luminosite} lux</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Detection */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">QR Codes Détectés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {qrCodes.length > 0 ? (
                  qrCodes.map((qrCode) => (
                    <div key={qrCode.id} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="font-medium mb-1">QR Code {qrCode.id + 1}:</div>
                      {renderQRData(qrCode.data)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun QR code détecté</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Robot Controls */}
        <div className="w-64">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Contrôles Robot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mission Controls */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Mission</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onMouseDown={() => handleButtonDown("PLAY_MISSION")}
                    onMouseUp={handleButtonUp}
                    className="text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onMouseDown={() => handleButtonDown("PAUSE_MISSION")}
                    onMouseUp={handleButtonUp}
                    className="text-xs"
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                </div>
              </div>

              {/* Movement Controls */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Mouvement</h4>
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <Button
                    size="sm"
                    onMouseDown={() => handleButtonDown("TOP")}
                    onMouseUp={handleButtonUp}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <div></div>
                  <Button
                    size="sm"
                    onMouseDown={() => handleButtonDown("LEFT")}
                    onMouseUp={handleButtonUp}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div></div>
                  <Button
                    size="sm"
                    onMouseDown={() => handleButtonDown("RIGHT")}
                    onMouseUp={handleButtonUp}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div></div>
                  <Button
                    size="sm"
                    onMouseDown={() => handleButtonDown("DOWN")}
                    onMouseUp={handleButtonUp}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <div></div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Caméra</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onMouseDown={() => handleButtonDown("LEFT_CAM")}
                    onMouseUp={handleButtonUp}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Gauche
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onMouseDown={() => handleButtonDown("RIGHT_CAM")}
                    onMouseUp={handleButtonUp}
                    className="text-xs"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Droite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
