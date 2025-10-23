import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

const HandLandmarkDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [frames, setFrames] = useState<string[]>([]);

  const HAND_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [0, 17], // Palm base
  ];

  useEffect(() => {
    let animationId: number | null = null;
    let mediaStream: MediaStream | null = null;

    const initialize = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("/mediapipe");

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/mediapipe/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        setLandmarker(handLandmarker);
        setIsReady(true);

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 24, max: 24 } },
        });

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = mediaStream;

        video.onloadedmetadata = async () => {
          try {
            await video.play();
            predictLoop(handLandmarker);
          } catch (err) {
            console.warn("Autoplay was prevented:", err);
          }
        };
      } catch (error) {
        console.error("Error initializing hand landmark detector:", error);
      }
    };

    const predictLoop = (handLandmarker: HandLandmarker) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let lastFrameTime = 0;
      const frameInterval = 1000 / 24;

      const processFrame = (timestamp: number) => {
        if (timestamp - lastFrameTime < frameInterval) {
          animationId = requestAnimationFrame(processFrame);
          return;
        }
        lastFrameTime = timestamp;

        const result: HandLandmarkerResult = handLandmarker.detectForVideo(
          video,
          performance.now()
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        result.landmarks?.forEach((landmarks) => {
          HAND_CONNECTIONS.forEach(([start, end]) => {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          for (const landmark of landmarks) {
            ctx.beginPath();
            ctx.arc(
              landmark.x * canvas.width,
              landmark.y * canvas.height,
              4,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
            ctx.fill();
          }
        });

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setFrames((prev) => {
          const updated = [...prev, dataUrl];
          if (updated.length > 24) updated.shift();
          return updated;
        });

        animationId = requestAnimationFrame(processFrame);
      };

      animationId = requestAnimationFrame(processFrame);
    };

    initialize();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        {!isReady && <p>Loading hand detector...</p>}
        <video
          ref={videoRef}
          width={640}
          height={480}
          style={{ display: "none" }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "4px",
          width: "320px",
          alignContent: "start",
          overflowY: "auto",
          maxHeight: "480px",
        }}
      >
        {frames.map((f, i) => (
          <img
            key={i}
            src={f}
            alt={`frame-${i}`}
            width={80}
            height={60}
            style={{
              objectFit: "cover",
              borderRadius: "6px",
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HandLandmarkDetector;
