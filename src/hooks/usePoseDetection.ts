// ==========================================
// MediaPipe Pose Detection Hook
// Uses MediaPipe Pose Landmarker for real-time
// 33-point body landmark detection
// ==========================================

import { useRef, useCallback, useState, useEffect } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { LandmarkPoint } from '../types';

interface UsePoseDetectionOptions {
  onLandmarksDetected: (landmarks: LandmarkPoint[]) => void;
  enabled: boolean;
}

export function usePoseDetection({ onLandmarksDetected, enabled }: UsePoseDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Initialize MediaPipe
  const initializePose = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      poseLandmarkerRef.current = poseLandmarker;
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize MediaPipe:', err);
      setError('ไม่สามารถโหลด MediaPipe ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      setIsLoading(false);
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Detection loop
  const detect = useCallback(() => {
    if (
      !poseLandmarkerRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState < 2
    ) {
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const startTime = performance.now();
    const result = poseLandmarkerRef.current.detectForVideo(video, startTime);

    if (ctx) {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw camera feed (mirrored)
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw landmarks
      if (result.landmarks && result.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);

        // Mirror landmarks for display
        const mirroredLandmarks = result.landmarks[0].map((l) => ({
          ...l,
          x: 1 - l.x,
        }));

        drawingUtils.drawConnectors(
          mirroredLandmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          { color: '#00FF88', lineWidth: 3 }
        );
        drawingUtils.drawLandmarks(mirroredLandmarks, {
          color: '#FF4444',
          lineWidth: 1,
          radius: 4,
        });

        // Send original (non-mirrored) landmarks for calculation
        const landmarks: LandmarkPoint[] = result.landmarks[0].map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility,
        }));

        onLandmarksDetected(landmarks);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [onLandmarksDetected]);

  // Lifecycle
  useEffect(() => {
    if (enabled) {
      initializePose();
    }
    return () => {
      stopCamera();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, [enabled, initializePose, stopCamera]);

  useEffect(() => {
    if (enabled && !isLoading && !error) {
      startCamera();
    }
  }, [enabled, isLoading, error, startCamera]);

  useEffect(() => {
    if (cameraReady && enabled) {
      detect();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraReady, enabled, detect]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    error,
    cameraReady,
  };
}
