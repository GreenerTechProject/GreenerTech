import React, { useEffect, useRef, useState } from "react";
import TechHeader from "../components/TechHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Thermometer,
  Droplets,
  Leaf,
  Sun
} from "lucide-react";

export default function Surveillance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sensorDataRef = useRef<HTMLDivElement>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const sensorWsRef = useRef<WebSocket | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sensorData, setSensorData] = useState({
    temperature: 25,
    humidity: 65,
    co2: 450,
    luminosite: 800
  });

  useEffect(() => {
    // WebRTC connection for receiving live video stream
    const startWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection();
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

        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("WebRTC error:", error);
      }
    };

    startWebRTC();

    // Control WebSocket for sending commands
    const controlWs = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8080/service/control`);
    controlWsRef.current = controlWs;

    controlWs.onopen = () => console.log("Control WebSocket connected");
    controlWs.onerror = (err) => console.error("Control WebSocket error:", err);
    controlWs.onclose = () => console.log("Control WebSocket disconnected");

    // WebSocket for sensor data
    const sensorWs = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8080/service/sensor_data`);
    sensorWsRef.current = sensorWs;

    sensorWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSensorData({
          temperature: data.temperature || 25,
          humidity: data.humidity || 65,
          co2: data.co2 || 450,
          luminosite: data.luminosite || 800
        });
      } catch (error) {
        console.error("Sensor data parse error:", error);
      }
    };

    sensorWs.onerror = (e) => {
      console.error("Sensor WebSocket error:", e);
    };

    // Cleanup function
    return () => {
      controlWs.close();
      sensorWs.close();
    };
  }, []);

  const sendControlCommand = (mode: string) => {
    if (controlWsRef.current && controlWsRef.current.readyState === WebSocket.OPEN) {
      controlWsRef.current.send(JSON.stringify({ control_mode: mode }));
    } else {
      console.warn("Control WebSocket not open");
    }
  };

  const handleMouseDown = (mode: string) => {
    sendControlCommand(mode);
  };

  const handleMouseUp = () => {
    sendControlCommand("STOP");
  };

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <TechHeader role="technicien" />
      
      {/* Main Content */}
      <div className="flex h-screen">
        {/* Left Panel - Collapsible, Stretches to Header */}
        <div className={`transition-all duration-300 ease-in-out ${
          isPanelExpanded ? 'w-80' : 'w-16'
        } bg-white border-r border-gray-200 relative flex flex-col`}>
          
          {/* Panel Toggle Button */}
          <button
            onClick={togglePanel}
            className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-10"
          >
            {isPanelExpanded ? (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>

          <div className={`flex-1 p-6 ${!isPanelExpanded ? 'hidden' : ''}`}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Surveillance
              </h1>
              <p className="text-gray-600">
                Contrôle des robots et surveillance des serres
              </p>
            </div>

            {/* Mission Control */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Contrôle Mission</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onMouseDown={() => handleMouseDown("PAUSE_MISSION")}
                  onMouseUp={handleMouseUp}
                  className="w-full flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause Mission
                </Button>
                <Button
                  variant="outline"
                  onMouseDown={() => handleMouseDown("PLAY_MISSION")}
                  onMouseUp={handleMouseUp}
                  className="w-full flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play Mission
                </Button>
              </div>
            </div>

            {/* Camera Control */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Contrôle Caméra</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onMouseDown={() => handleMouseDown("RIGHT_CAM")}
                  onMouseUp={handleMouseUp}
                  className="w-full flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Caméra Droite
                </Button>
                <Button
                  variant="outline"
                  onMouseDown={() => handleMouseDown("LEFT_CAM")}
                  onMouseUp={handleMouseUp}
                  className="w-full flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Caméra Gauche
                </Button>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Statut Système</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>🟢 Caméra: Connectée</div>
                <div>🟢 Robot: En ligne</div>
                <div>🟢 Capteurs: Actifs</div>
              </div>
            </div>
          </div>

          {/* Collapsed Panel Icons */}
          {!isPanelExpanded && (
            <div className="flex flex-col items-center pt-6 space-y-4 flex-1">
              <button
                onClick={() => handleMouseDown("PAUSE_MISSION")}
                onMouseUp={handleMouseUp}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Pause Mission"
              >
                <Pause className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleMouseDown("PLAY_MISSION")}
                onMouseUp={handleMouseUp}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Play Mission"
              >
                <Play className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleMouseDown("RIGHT_CAM")}
                onMouseUp={handleMouseUp}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Caméra Droite"
              >
                <Camera className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleMouseDown("LEFT_CAM")}
                onMouseUp={handleMouseUp}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Caméra Gauche"
              >
                <Camera className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Main Camera Area - Full Screen */}
        <div className="flex-1 relative bg-black">
          {/* Video Stream */}
          <video 
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay 
            playsInline 
            muted
          />

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white z-20"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5 text-gray-700" />
            ) : (
              <Maximize2 className="h-5 w-5 text-gray-700" />
            )}
          </button>

          {/* Individual Sensor Data Overlays - Top Right */}
          <div className="absolute top-4 right-4 space-y-3">
            {/* Temperature Sensor */}
            <div className="bg-red-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-red-200">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-600" />
                <div className="text-sm font-medium text-red-800">
                  {sensorData.temperature}°C
                </div>
              </div>
            </div>

            {/* Humidity Sensor */}
            <div className="bg-blue-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <div className="text-sm font-medium text-blue-800">
                  {sensorData.humidity}%
                </div>
              </div>
            </div>

            {/* CO2 Sensor */}
            <div className="bg-green-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <div className="text-sm font-medium text-green-800">
                  {sensorData.co2} ppm
                </div>
              </div>
            </div>

            {/* Light Sensor */}
            <div className="bg-yellow-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-600" />
                <div className="text-sm font-medium text-yellow-800">
                  {sensorData.luminosite} lux
                </div>
              </div>
            </div>
          </div>

          {/* Control Tools Overlay - Bottom Right */}
          <div className="absolute bottom-4 right-4 space-y-2">
            {/* Top Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("TOP")}
                onMouseUp={handleMouseUp}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 shadow-lg"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Left, Center, Right Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("LEFT")}
                onMouseUp={handleMouseUp}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("STOP")}
                onMouseUp={handleMouseUp}
                className="w-10 h-10 rounded-full bg-red-100/90 backdrop-blur-sm border-2 border-red-300 hover:border-red-500 hover:bg-red-50 shadow-lg"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("RIGHT")}
                onMouseUp={handleMouseUp}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 shadow-lg"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Bottom Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onMouseDown={() => handleMouseDown("DOWN")}
                onMouseUp={handleMouseUp}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 shadow-lg"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Camera Info Overlay - Bottom Left */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-sm text-gray-700">
              <div className="font-medium">Caméra Live</div>
              <div className="text-xs text-gray-500">Serre A1 - Domaine Nord</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
