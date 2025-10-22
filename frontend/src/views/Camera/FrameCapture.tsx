import React, { useEffect, useRef, useState } from "react";

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const frameCounter = useRef(0);

  useEffect(() => {
    let stream: MediaStream;
    let animationId: number;

    const startCamera = async () => {
      try {
        // Request camera at ~12 FPS
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 24, max: 24 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          captureLoop();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    const captureLoop = () => {
      frameCounter.current += 1;

      const ctx = canvasRef.current?.getContext("2d");
      if (videoRef.current && ctx) {
        // Only capture every 12th frame
        if (frameCounter.current % 6 === 0) {
          ctx.drawImage(videoRef.current, 0, 0, 224, 224);
          const dataUrl = canvasRef.current?.toDataURL("image/jpeg")||"";

          setFrames((prev) => {
            const newFrames = [...prev, dataUrl];
            if (newFrames.length > 12) newFrames.shift(); // keep last 12
            return newFrames;
          });
        }
      }

      // Run at ~12 FPS using setTimeout instead of requestAnimationFrame
      animationId = window.setTimeout(captureLoop, 1000 / 12);
    };

    startCamera();

    return () => {
      if (animationId) clearTimeout(animationId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      {/* Live video */}
      <div style={{ textAlign: "center" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={320}
          height={240}
          style={{
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        />
        <p>Stored frames: {frames.length} (capturing every 12th)</p>
      </div>

      {/* Hidden canvas */}
      <canvas
        ref={canvasRef}
        width={224}
        height={224}
        style={{ display: "none" }}
      />

      {/* Display captured frames */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 70px)",
          gap: "0.5rem",
        }}
      >
        {frames.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`Frame ${idx}`}
            width={70}
            height={70}
            style={{ borderRadius: "6px", objectFit: "cover" }}
          />
        ))}
      </div>
    </div>
  );
};

export default FrameCapture;
