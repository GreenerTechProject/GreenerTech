# WebRTC Robot Surveillance Integration

This document describes the WebRTC integration for robot surveillance that has been added to the Surveillance page.

## Features

### Robot Live View Tab
The surveillance page now includes a "Robot Live View" tab with the following features:

1. **Live Video Stream**: WebRTC-based real-time video streaming from the robot camera
2. **QR Code Detection**: Real-time QR code detection and display with parsed data
3. **Sensor Data**: Live environmental sensor data (temperature, humidity, CO2, luminosity)
4. **Robot Controls**: 
   - Mission controls (Play/Pause)
   - Movement controls (Left, Right, Up, Down)
   - Camera controls (Left Cam, Right Cam)

### Components Created

#### WebRTCViewer Component (`client/components/WebRTCViewer.tsx`)
A comprehensive React component that handles:
- WebRTC peer connection for video streaming
- Multiple WebSocket connections for data feeds
- Robot control interface
- Real-time data display

### Required Backend Services

For the WebRTC integration to work, the following backend services must be running:

1. **Video Stream Service** (`/service/video_stream_service`)
   - Handles WebRTC offer/answer exchange
   - Provides video stream via POST endpoint

2. **QR Data WebSocket** (`ws://localhost:8080/service/qr_data`)
   - Provides real-time QR code detection data
   - Expected format: `{qr_codes: ["json_string1", "json_string2"]}`

3. **Sensor Data WebSocket** (`ws://localhost:8080/service/sensor_data`)
   - Provides environmental sensor readings
   - Expected format: `{temperature: number, humidity: number, co2: number, luminosite: number}`

4. **Control WebSocket** (`ws://localhost:8080/service/control`)
   - Accepts robot control commands
   - Expected format: `{control_mode: string}`
   - Supported modes: PAUSE_MISSION, PLAY_MISSION, LEFT, RIGHT, TOP, DOWN, LEFT_CAM, RIGHT_CAM, STOP

### Usage

1. Navigate to the Surveillance page (`/surveillance`)
2. Click on the "Robot Live View" tab
3. The component will automatically attempt to connect to all required services
4. Use the control buttons to operate the robot
5. View live sensor data and QR code detections in real-time

### Connection Status

The component displays connection status indicators:
- **Video**: Shows "Connected" badge when WebRTC is established
- **Controls**: Shows "Connected" badge when control WebSocket is active
- **Sensor Data**: Shows actual readings when connected, "Waiting for sensor data..." when disconnected

### Error Handling

- WebRTC connection failures are logged to console
- WebSocket disconnections are handled gracefully with automatic reconnection attempts
- Control commands are only sent when WebSocket is connected

## Integration Notes

- The original camera surveillance functionality remains unchanged in the "Caméras Statiques" tab
- The new robot view is completely separate and doesn't interfere with existing features
- All WebSocket connections are properly cleaned up when the component unmounts
- The component is responsive and works on different screen sizes
