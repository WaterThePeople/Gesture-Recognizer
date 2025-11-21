import React, { useEffect, useRef, useState } from "react";
import style from "./Camera.module.sass";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import DefaultButton from "components/DefaultButton/DefaultButton";
import SwitchButton from "components/SwitchButton/SwitchButton";
import HAND_POINTS from "utils/handPoints";

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(true);

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

        setIsReady(true);

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = mediaStream;

        video.onloadedmetadata = async () => {
          try {
            await video.play();

            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

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

        if (showLandmarks) {
          result.landmarks?.forEach((landmarks) => {
            HAND_POINTS.forEach(([start, end]) => {
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
        }

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
  }, [showLandmarks]);

  return (
    <div className={style.container}>
      <video ref={videoRef} className={style.video} />
      <canvas ref={canvasRef} className={style.canvas} />
      <div className={style.buttons_row}>
        <DefaultButton
          text="Start translating"
          onClick={() => console.log("start translating")}
          color="green"
        />
        <DefaultButton
          text="Stop translating"
          onClick={() => console.log("stop translating")}
          color="red"
        />
        {/* <SwitchButton color="red" onClick={() => setShowLandmarks((prev) => !prev)}/> */}
        <SwitchButton color="blue" onClick={() => console.log("switch")} />
        <SwitchButton color="none" onClick={() => console.log("switch")} />
      </div>
    </div>
  );
};

export default Camera;
