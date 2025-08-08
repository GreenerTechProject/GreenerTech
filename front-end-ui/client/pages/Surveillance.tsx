import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import TechnicianSidebar from "../components/TechnicianSidebar";

interface QRCodeData {
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

export default function Surveillance() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const qrWebSocketRef = useRef<WebSocket | null>(null);
  const controlWebSocketRef = useRef<WebSocket | null>(null);
  const sensorWebSocketRef = useRef<WebSocket | null>(null);

  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState({
    video: false,
    qr: false,
    control: false,
    sensor: false
  });

  // WebRTC setup for video stream
  const setupWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
      pc.addTransceiver("video", { direction: "recvonly" });
      
      pc.ontrack = (event) => {
        if (videoRef.current && videoRef.current.srcObject !== event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setIsConnected(prev => ({ ...prev, video: true }));
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
      console.error("WebRTC setup error:", error);
    }
  };

  // Setup WebSocket connections
  const setupWebSockets = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const hostname = window.location.hostname;
    const port = "8080";

    // QR Code WebSocket
    const qrWs = new WebSocket(`${protocol}://${hostname}:${port}/service/qr_data`);
    qrWebSocketRef.current = qrWs;

    qrWs.onopen = () => {
      console.log("QR WebSocket connected");
      setIsConnected(prev => ({ ...prev, qr: true }));
    };

    qrWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received QR data:", data);

        if (data.qr_codes && Array.isArray(data.qr_codes)) {
          const parsedQRCodes = data.qr_codes.map((qrCodeStr: string, index: number) => {
            try {
              return { id: index, data: JSON.parse(qrCodeStr) };
            } catch (e) {
              console.error("Failed to parse individual QR code:", e);
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
      setIsConnected(prev => ({ ...prev, qr: false }));
    };

    qrWs.onerror = (err) => {
      console.error("QR WebSocket error:", err);
      setIsConnected(prev => ({ ...prev, qr: false }));
    };

    // Control WebSocket
    const controlWs = new WebSocket(`${protocol}://${hostname}:${port}/service/control`);
    controlWebSocketRef.current = controlWs;

    controlWs.onopen = () => {
      console.log("Control WebSocket connected");
      setIsConnected(prev => ({ ...prev, control: true }));
    };

    controlWs.onclose = () => {
      console.log("Control WebSocket disconnected");
      setIsConnected(prev => ({ ...prev, control: false }));
    };

    controlWs.onerror = (err) => {
      console.error("Control WebSocket error:", err);
      setIsConnected(prev => ({ ...prev, control: false }));
    };

    // Sensor Data WebSocket
    const sensorWs = new WebSocket(`${protocol}://${hostname}:${port}/service/sensor_data`);
    sensorWebSocketRef.current = sensorWs;

    sensorWs.onopen = () => {
      console.log("Sensor WebSocket connected");
      setIsConnected(prev => ({ ...prev, sensor: true }));
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
      setIsConnected(prev => ({ ...prev, sensor: false }));
    };

    sensorWs.onerror = (e) => {
      console.error("Sensor WebSocket error:", e);
      setIsConnected(prev => ({ ...prev, sensor: false }));
    };
  };

  // Send control command
  const sendControlCommand = (mode: string) => {
    if (controlWebSocketRef.current?.readyState === WebSocket.OPEN) {
      controlWebSocketRef.current.send(JSON.stringify({ control_mode: mode }));
      console.log("Sending control mode:", mode);
    } else {
      console.warn("Control WebSocket not open");
    }
  };

  // Handle button press and release
  const handleButtonPress = (mode: string) => {
    sendControlCommand(mode);
  };

  const handleButtonRelease = () => {
    sendControlCommand("STOP");
  };

  // Render QR Code data recursively
  const renderQRData = (data: any, key: string = "", level: number = 0): JSX.Element => {
    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        return (
          <div key={key} className={`ml-${level * 4}`}>
            <div className="font-semibold">{key}:</div>
            <ul className="ml-4">
              {data.map((item, index) => (
                <li key={index}>
                  {typeof item === "object" ? 
                    renderQRData(item, `Item ${index + 1}`, level + 1) :
                    <span>Item {index + 1}: {String(item)}</span>
                  }
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        return (
          <div key={key} className={`ml-${level * 4}`}>
            <div className="font-semibold">{key}:</div>
            <ul className="ml-4">
              {Object.entries(data).map(([k, v]) => (
                <li key={k}>
                  {renderQRData(v, k, level + 1)}
                </li>
              ))}
            </ul>
          </div>
        );
      }
    } else {
      return (
        <div key={key} className={`ml-${level * 4}`}>
          <span className="font-medium">{key}:</span> {String(data)}
        </div>
      );
    }
  };

  useEffect(() => {
    setupWebRTC();
    setupWebSockets();

    return () => {
      // Cleanup connections
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (qrWebSocketRef.current) {
        qrWebSocketRef.current.close();
      }
      if (controlWebSocketRef.current) {
        controlWebSocketRef.current.close();
      }
      if (sensorWebSocketRef.current) {
        sensorWebSocketRef.current.close();
      }
    };
  }, []);

  const controlButtons = [
    { mode: "PAUSE_MISSION", label: "Pause Mission ⏸️" },
    { mode: "PLAY_MISSION", label: "Play Mission ▶️" },
    { mode: "RIGHT", label: "Right ▶️" },
    { mode: "LEFT", label: "Left ◀️" },
    { mode: "TOP", label: "Top 🔼" },
    { mode: "DOWN", label: "Down 🔽" },
    { mode: "RIGHT_CAM", label: "Right Camera ▶️" },
    { mode: "LEFT_CAM", label: "Left Camera ◀️" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <TechnicianSidebar 
                userRole="technicien"
                onInterventionClick={() => {}}
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Surveillance Camera - Live Feed
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-5 flex flex-row gap-5 h-[calc(100vh-73px)] items-start bg-white">
        {/* Video Stream Container */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Live Video</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            muted
            className="h-[500px] border border-black bg-black object-contain w-full"
          />
          <div className="mt-2 text-sm">
            Status: <span className={isConnected.video ? "text-green-600" : "text-red-600"}>
              {isConnected.video ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Sensor Data Container */}
        <div className="flex-1 max-w-[250px] p-2.5 rounded-md">
          <h2 className="text-xl font-bold mb-4">🌿 Sensor Data (WebSocket)</h2>
          <div className="font-mono mt-2.5 bg-gray-100 p-2.5 rounded-md shadow-inner min-h-[100px]">
            {sensorData ? (
              <div className="space-y-1">
                <div>🌡 Température : {sensorData.temperature} °C</div>
                <div>💧 Humidité : {sensorData.humidity} %</div>
                <div>🟢 CO₂ : {sensorData.co2} ppm</div>
                <div>💡 Luminosité : {sensorData.luminosite} lux</div>
              </div>
            ) : (
              <div>Waiting for sensor data...</div>
            )}
          </div>
          <div className="mt-2 text-sm">
            Status: <span className={isConnected.sensor ? "text-green-600" : "text-red-600"}>
              {isConnected.sensor ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* QR Code Data Container */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Detected QR Codes:</h2>
            <div className="font-mono bg-gray-100 p-2.5 rounded-md list-none h-[300px] overflow-y-auto shadow-inner">
              {qrCodes.length > 0 ? (
                qrCodes.map((qrCode) => (
                  <div key={qrCode.id} className="py-1 border-b border-gray-300 last:border-b-0">
                    {renderQRData(qrCode.data, `QR Code ${qrCode.id + 1}`)}
                  </div>
                ))
              ) : (
                <div>No QR codes detected</div>
              )}
            </div>
            <div className="mt-2 text-sm">
              Status: <span className={isConnected.qr ? "text-green-600" : "text-red-600"}>
                {isConnected.qr ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons Container */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Controls</h2>
          <div className="space-y-2">
            {controlButtons.map((button) => (
              <button
                key={button.mode}
                onMouseDown={() => handleButtonPress(button.mode)}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                className="w-full py-2.5 px-4 text-base cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={!isConnected.control}
              >
                {button.label}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm">
            Status: <span className={isConnected.control ? "text-green-600" : "text-red-600"}>
              {isConnected.control ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
