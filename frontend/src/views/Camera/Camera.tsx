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

interface CameraProps {
  setFrames: React.Dispatch<React.SetStateAction<string[]>>;
  setCleanFrames: React.Dispatch<React.SetStateAction<string[]>>;
  maxFrames: number;
  frameCaptureTimer: number;
}

const Camera: React.FC<CameraProps> = ({
  setFrames,
  setCleanFrames,
  maxFrames,
  frameCaptureTimer,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);

  const showLandmarksRef = useRef(showLandmarks);
  const isRecordingRef = useRef(isRecording);

  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureCounterRef = useRef(0);

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarksArr: HandLandmarkerResult["landmarks"],
    width: number,
    height: number
  ) => {
    landmarksArr?.forEach((landmarks) => {
      HAND_POINTS.forEach(([start, end]) => {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
        ctx.fill();
      }
    });
  };

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

          const w = video.videoWidth;
          const h = video.videoHeight;

          if (canvasRef.current) {
            canvasRef.current.width = w;
            canvasRef.current.height = h;
          }
          if (cleanCanvasRef.current) {
            cleanCanvasRef.current.width = w;
            cleanCanvasRef.current.height = h;
          }
          if (frameCanvasRef.current) {
            frameCanvasRef.current.width = w;
            frameCanvasRef.current.height = h;
          }

          predictLoop();
        };
      } catch (err) {
        console.error("Error initializing hand landmark detector:", err);
      }
    };

    const predictLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const cleanCanvas = cleanCanvasRef.current;
      const frameCanvas = frameCanvasRef.current;

      if (!video || !canvas || !cleanCanvas || !frameCanvas || !handLandmarker)
        return;

      const ctx = canvas.getContext("2d")!;
      const cleanCtx = cleanCanvas.getContext("2d")!;
      const frameCtx = frameCanvas.getContext("2d")!;

      let lastTime = 0;
      const interval = 1000 / 24;

      const processFrame = (timestamp: number) => {
        if (timestamp - lastTime < interval) {
          animationId = requestAnimationFrame(processFrame);
          return;
        }
        lastTime = timestamp;

        let result: HandLandmarkerResult;
        try {
          result = handLandmarker!.detectForVideo(video, performance.now());
        } catch {
          animationId = requestAnimationFrame(processFrame);
          return;
        }

        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(video, 0, 0, W, H);

        if (showLandmarksRef.current) {
          drawLandmarks(ctx, result.landmarks, W, H);
        }

        cleanCtx.fillStyle = "white";
        cleanCtx.fillRect(0, 0, W, H);
        drawLandmarks(cleanCtx, result.landmarks, W, H);

        frameCtx.clearRect(0, 0, W, H);
        frameCtx.drawImage(video, 0, 0, W, H);
        drawLandmarks(frameCtx, result.landmarks, W, H);

        if (isRecordingRef.current) {
          captureCounterRef.current += 1;
          if (captureCounterRef.current % frameCaptureTimer !== 0) {
            animationId = requestAnimationFrame(processFrame);
            return;
          }

          const normalFrame = frameCanvas.toDataURL("image/jpeg", 0.6);
          const cleanFrame = cleanCanvas.toDataURL("image/jpeg", 0.6);

          setFrames((prev) => {
            const arr = [...prev, normalFrame];
            if (arr.length > maxFrames) arr.shift();
            return arr;
          });

          setCleanFrames((prev) => {
            const arr = [...prev, cleanFrame];
            if (arr.length > maxFrames) arr.shift();
            return arr;
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

  useEffect(() => stopRecording, []);

  const startRecording = () => {
    if (intervalRef.current !== null) return;
    setIsRecording(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  };

  const cleanRecording = () => {
    stopRecording();
    setTime(0);
    setFrames([]);
    setCleanFrames([]);
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className={style.container}>
      {isReady ? (
        <>
          <video ref={videoRef} className={style.video} />
          <canvas ref={canvasRef} className={style.canvas} />
          <canvas ref={cleanCanvasRef} className={style.clean_canvas} />
          <canvas ref={frameCanvasRef} className={style.frame_canvas} />

          <div className={style.buttons_column}>
            <div className={style.buttons_row}>
              <DefaultButton
                text="Start translating"
                onClick={() => startRecording()}
                color="green"
                className={style.button}
              />
              <div className={style.time_row}>
                <div className={style.time}>
                  {String(minutes).padStart(2, "0")}
                </div>
                :
                <div className={style.time}>
                  {String(seconds).padStart(2, "0")}
                </div>
              </div>
              <DefaultButton
                text="Stop translating"
                onClick={() => stopRecording()}
                color="red"
                className={style.button}
              />
            </div>

            <div className={style.buttons_row}>
              <DefaultButton
                text="Clear translations"
                onClick={cleanRecording}
                className={style.button}
              />

              <div className={style.button}>
                <SwitchButton
                  color="none"
                  onClick={() => setShowLandmarks((prev) => !prev)}
                  text="Hand points"
                  isOn={showLandmarks}
                />
              </div>
            </div>
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
