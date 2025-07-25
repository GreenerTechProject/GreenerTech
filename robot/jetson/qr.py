import cv2

detector = cv2.QRCodeDetector()
cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("❌ Cannot open camera")
    exit()

print("📷 Starting camera... Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to grab frame")
        break

    data, bbox, _ = detector.detectAndDecode(frame)

    if bbox is not None and data:
        # Draw bounding box (cast to int)
        for i in range(len(bbox[0])):
            point1 = tuple(map(int, bbox[0][i]))
            point2 = tuple(map(int, bbox[0][(i + 1) % len(bbox[0])]))
            cv2.line(frame, point1, point2, (0, 255, 0), 2)

        # Show decoded data
        cv2.putText(
            frame, data,
            (int(bbox[0][0][0]), int(bbox[0][0][1]) - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2
        )
        print("✅ QR Code:", data)

    cv2.imshow("🎥 QR Code Scanner", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
