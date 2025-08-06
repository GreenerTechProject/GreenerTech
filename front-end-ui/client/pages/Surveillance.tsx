import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { missionService, type MissionRobot } from '@/services/missionService';

interface QRCode {
  [key: string]: any;
}

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  luminosite: number;
}

interface ControlCommand {
  control_mode: 'TOP' | 'DOWN' | 'NORMAL' | 'RIGHT' | 'LEFT' | 'STOP';
}

const Surveillance: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const qrWebSocketRef = useRef<WebSocket | null>(null);
  const controlWebSocketRef = useRef<WebSocket | null>(null);
  const sensorWebSocketRef = useRef<WebSocket | null>(null);
  
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [missionForm, setMissionForm] = useState({
    referance: '',
    id_serre: '',
    date_debut: '',
    date_fin: '',
    rep_jr: '0',
    rep_sem: '0'
  });
  
  const { toast } = useToast();

  // WebRTC Setup
  const startWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.ontrack = (event) => {
        if (videoRef.current && videoRef.current.srcObject !== event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch('/service/video_stream_service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: pc.localDescription })
      });

      const answer = await response.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      setIsConnected(true);
    } catch (error) {
      console.error('WebRTC setup failed:', error);
      toast({
        title: "Connection Error",
        description: "Failed to establish video connection",
        variant: "destructive"
      });
    }
  };

  // WebSocket Setup for QR Codes
  const setupQRWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/qr_data`);
    qrWebSocketRef.current = ws;

    ws.onopen = () => {
      console.log('QR WebSocket connected');
    };

    ws.onmessage = (event) => {
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
      } catch (error) {
        console.error('Failed to parse QR WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('QR WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('QR WebSocket error:', error);
    };
  };

  // WebSocket Setup for Control
  const setupControlWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/control`);
    controlWebSocketRef.current = ws;

    ws.onopen = () => {
      console.log('Control WebSocket connected');
    };

    ws.onerror = (error) => {
      console.error('Control WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Control WebSocket disconnected');
    };
  };

  // WebSocket Setup for Sensor Data
  const setupSensorWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8080/service/sensor_data`);
    sensorWebSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSensorData(data);
      } catch (error) {
        console.error('Failed to parse sensor data:', error);
      }
    };

    ws.onerror = () => {
      setSensorData(null);
    };
  };

  // Control Functions
  const sendControlCommand = (command: ControlCommand['control_mode']) => {
    if (controlWebSocketRef.current?.readyState === WebSocket.OPEN) {
      controlWebSocketRef.current.send(JSON.stringify({ control_mode: command }));
    } else {
      console.warn('Control WebSocket not open');
    }
  };

  const handleButtonMouseDown = (command: ControlCommand['control_mode']) => {
    sendControlCommand(command);
  };

  const handleButtonMouseUp = () => {
    sendControlCommand('STOP');
  };

  // Mission Form Handler
  const handleMissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const mission: Omit<MissionRobot, 'id'> = {
        id_robot: 1, // This should be dynamic based on your robot selection
        id_serre: parseInt(missionForm.id_serre),
        rep_jr: parseInt(missionForm.rep_jr),
        rep_sem: parseInt(missionForm.rep_sem),
        date_debut: missionForm.date_debut || undefined,
        date_fin: missionForm.date_fin || undefined,
      };

      await missionService.createMission(mission);
      
      toast({
        title: "Mission Created",
        description: "Mission has been successfully created",
      });

      setMissionForm({
        referance: '',
        id_serre: '',
        date_debut: '',
        date_fin: '',
        rep_jr: '0',
        rep_sem: '0'
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create mission",
        variant: "destructive"
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    [qrWebSocketRef, controlWebSocketRef, sensorWebSocketRef].forEach(wsRef => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    });
  };

  useEffect(() => {
    startWebRTC();
    setupQRWebSocket();
    setupControlWebSocket();
    setupSensorWebSocket();

    return cleanup;
  }, []);

  const renderQRData = (data: any, depth = 0): React.ReactNode => {
    if (typeof data === 'object' && data !== null) {
      return (
        <div className={`ml-${depth * 4}`}>
          {Array.isArray(data) ? (
            data.map((item, index) => (
              <div key={index} className="mb-1">
                <span className="font-medium">Item {index + 1}:</span>
                {renderQRData(item, depth + 1)}
              </div>
            ))
          ) : (
            Object.entries(data).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="font-medium">{key}:</span> {renderQRData(value, depth + 1)}
              </div>
            ))
          )}
        </div>
      );
    }
    return <span className="text-sm">{String(data)}</span>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-3rem)]">
        {/* Video Stream */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Live Video</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              muted
              className="w-full h-[300px] bg-black object-contain border rounded"
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </CardContent>
        </Card>

        {/* Sensor Data */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>🌿 Sensor Data</CardTitle>
          </CardHeader>
          <CardContent>
            {sensorData ? (
              <div className="space-y-2 font-mono text-sm">
                <div>🌡 Température: {sensorData.temperature}°C</div>
                <div>💧 Humidité: {sensorData.humidity}%</div>
                <div>🟢 CO₂: {sensorData.co2} ppm</div>
                <div>💡 Luminosité: {sensorData.luminosite} lux</div>
              </div>
            ) : (
              <div className="text-muted-foreground">Waiting for sensor data...</div>
            )}
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Detected QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {qrCodes.length > 0 ? (
                <div className="space-y-2">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="p-2 bg-muted rounded text-xs">
                      <div className="font-medium">QR Code {qr.id + 1}:</div>
                      {renderQRData(qr.data)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No QR codes detected</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Controls and Mission Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controls & Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Robot Controls */}
            <div>
              <h3 className="font-semibold mb-3">Robot Controls</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onMouseDown={() => handleButtonMouseDown('TOP')}
                  onMouseUp={handleButtonMouseUp}
                  variant="outline"
                  size="sm"
                >
                  Top 🔼
                </Button>
                <Button
                  onMouseDown={() => handleButtonMouseDown('DOWN')}
                  onMouseUp={handleButtonMouseUp}
                  variant="outline"
                  size="sm"
                >
                  Down 🔽
                </Button>
                <Button
                  onMouseDown={() => handleButtonMouseDown('LEFT')}
                  onMouseUp={handleButtonMouseUp}
                  variant="outline"
                  size="sm"
                >
                  Left ◀️
                </Button>
                <Button
                  onMouseDown={() => handleButtonMouseDown('RIGHT')}
                  onMouseUp={handleButtonMouseUp}
                  variant="outline"
                  size="sm"
                >
                  Right ▶️
                </Button>
                <Button
                  onMouseDown={() => handleButtonMouseDown('NORMAL')}
                  onMouseUp={handleButtonMouseUp}
                  variant="default"
                  size="sm"
                  className="col-span-2"
                >
                  Normal 🟢
                </Button>
              </div>
            </div>

            {/* Mission Form */}
            <div>
              <h3 className="font-semibold mb-3">Create Mission</h3>
              <form onSubmit={handleMissionSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="referance" className="text-xs">Robot Reference</Label>
                  <Input
                    id="referance"
                    value={missionForm.referance}
                    onChange={(e) => setMissionForm(prev => ({ ...prev, referance: e.target.value }))}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="id_serre" className="text-xs">Greenhouse ID</Label>
                  <Input
                    id="id_serre"
                    type="number"
                    value={missionForm.id_serre}
                    onChange={(e) => setMissionForm(prev => ({ ...prev, id_serre: e.target.value }))}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date_debut" className="text-xs">Start Date</Label>
                  <Input
                    id="date_debut"
                    type="datetime-local"
                    value={missionForm.date_debut}
                    onChange={(e) => setMissionForm(prev => ({ ...prev, date_debut: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="date_fin" className="text-xs">End Date</Label>
                  <Input
                    id="date_fin"
                    type="datetime-local"
                    value={missionForm.date_fin}
                    onChange={(e) => setMissionForm(prev => ({ ...prev, date_fin: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="rep_jr" className="text-xs">Repeat Daily</Label>
                    <Input
                      id="rep_jr"
                      type="number"
                      value={missionForm.rep_jr}
                      onChange={(e) => setMissionForm(prev => ({ ...prev, rep_jr: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rep_sem" className="text-xs">Repeat Weekly</Label>
                    <Input
                      id="rep_sem"
                      type="number"
                      value={missionForm.rep_sem}
                      onChange={(e) => setMissionForm(prev => ({ ...prev, rep_sem: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-8 text-xs">
                  Create Mission
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Surveillance;
