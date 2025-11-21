import React, { useEffect, useRef, useState } from "react";
import style from "./Camera.module.sass";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import DefaultButton from "components/DefaultButton/DefaultButton";
import SwitchButton from "components/SwitchButton/SwitchButton";
import LoadingSpinner from "components/LoadingSpinner";
import HAND_POINTS from "utils/handPoints";

const maxFrames = 24;

interface CameraProps {
  setFrames: React.Dispatch<React.SetStateAction<string[]>>;
  setCleanFrames: React.Dispatch<React.SetStateAction<string[]>>;
}

const Camera: React.FC<CameraProps> = ({ setFrames, setCleanFrames }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const showLandmarksRef = useRef(showLandmarks);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    let animationId: number | null = null;
    let mediaStream: MediaStream | null = null;
    let handLandmarker: HandLandmarker | null = null;

    const initialize = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("/mediapipe");

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
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
          await video.play();

          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          predictLoop();
        };
      } catch (error) {
        console.error("Error initializing hand landmark detector:", error);
      }
    };

    const predictLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const cleanCanvas = cleanCanvasRef.current;
      if (!video || !canvas || !cleanCanvas || !handLandmarker) return;

      const ctx = canvas.getContext("2d");
      const cleanCtx = cleanCanvas.getContext("2d");
      if (!ctx || !cleanCtx) return;

      let lastFrameTime = 0;
      const frameInterval = 1000 / 24;

      const processFrame = (timestamp: number) => {
        if (timestamp - lastFrameTime < frameInterval) {
          animationId = requestAnimationFrame(processFrame);
          return;
        }
        lastFrameTime = timestamp;

        if (
          video.videoWidth <= 0 ||
          video.videoHeight <= 0 ||
          canvas.width <= 0 ||
          canvas.height <= 0
        ) {
          animationId = requestAnimationFrame(processFrame);
          return;
        }

        let result: HandLandmarkerResult;
        try {
          result = handLandmarker!.detectForVideo(video, performance.now());
        } catch (err) {
          console.warn("HandLandmarker failed, skipping frame:", err);
          animationId = requestAnimationFrame(processFrame);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (showLandmarksRef.current) {
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

        cleanCtx.fillStyle = "white";
        cleanCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);

        result.landmarks?.forEach((landmarks) => {
          HAND_POINTS.forEach(([start, end]) => {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            cleanCtx.beginPath();
            cleanCtx.moveTo(
              p1.x * cleanCanvas.width,
              p1.y * cleanCanvas.height
            );
            cleanCtx.lineTo(
              p2.x * cleanCanvas.width,
              p2.y * cleanCanvas.height
            );
            cleanCtx.strokeStyle = "green";
            cleanCtx.lineWidth = 2;
            cleanCtx.stroke();
          });

          for (const landmark of landmarks) {
            cleanCtx.beginPath();
            cleanCtx.arc(
              landmark.x * cleanCanvas.width,
              landmark.y * cleanCanvas.height,
              4,
              0,
              2 * Math.PI
            );
            cleanCtx.fillStyle = "red";
            cleanCtx.fill();
          }
        });

        if (isRecordingRef.current) {
          const normalFrame = canvas.toDataURL("image/jpeg", 0.6);
          const cleanFrame = cleanCanvas.toDataURL("image/jpeg", 0.9);

          setFrames((prev) => {
            const updated = [...prev, normalFrame];
            if (updated.length > maxFrames) updated.shift();
            return updated;
          });

          setCleanFrames((prev) => {
            const updated = [...prev, cleanFrame];
            if (updated.length > maxFrames) updated.shift();
            return updated;
          });
        }

        animationId = requestAnimationFrame(processFrame);
      };

      animationId = requestAnimationFrame(processFrame);
    };

    initialize();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      handLandmarker?.close();
    };
  }, []);

  return (
    <div className={style.container}>
      {isReady ? (
        <>
          <video ref={videoRef} className={style.video} />
          <canvas ref={canvasRef} className={style.canvas} />
          <canvas ref={cleanCanvasRef} className={style.clean_canvas} />
          <div className={style.buttons_row}>
            <DefaultButton
              text="Start translating"
              onClick={() => setIsRecording(true)}
              color="green"
            />
            <DefaultButton
              text="Stop translating"
              onClick={() => setIsRecording(false)}
              color="red"
            />
            <SwitchButton
              color="none"
              onClick={() => setShowLandmarks((prev) => !prev)}
              text="Hand points"
              isOn={showLandmarks}
            />
          </div>
        </>
      ) : (
        <div className={style.loading}>
          <LoadingSpinner size={100} />
        </div>
      )}
    </div>
  );
};

export default Camera;
