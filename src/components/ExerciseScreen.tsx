// ==========================================
// Exercise Screen Component
// Main exercise screen with camera, pose
// detection, and AR game overlay
// ==========================================

import React, { useCallback, useState, useEffect, useRef } from 'react';
import type { ExerciseType, UserProfile, LandmarkPoint, PoseAngles } from '../types';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useGameLogic } from '../hooks/useGameLogic';
import { calculateJointAngles } from '../utils/angleCalculations';
import { EXERCISE_CONFIGS } from '../config/exercises';
import { AROverlay } from './AROverlay';
import { ARScene3D } from './ARScene3D';
import { soundManager } from '../utils/soundEffects';

interface ExerciseScreenProps {
  exerciseType: ExerciseType;
  userProfile: UserProfile;
  onFinish: (result: { score: number; reps: number; maxCombo: number }) => void;
  onBack: () => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({
  exerciseType,
  userProfile,
  onFinish,
  onBack,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const simTimerRef = useRef<number>(0);
  const { gameState, startGame, endGame, processPose } = useGameLogic();

  const config = EXERCISE_CONFIGS[exerciseType];

  // Track camera-container size for ARScene3D
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Process detected landmarks
  const handleLandmarks = useCallback(
    (landmarks: LandmarkPoint[]) => {
      if (!started || !gameState.isPlaying || isDemoMode) return;

      const angles = calculateJointAngles(landmarks);
      processPose(angles, userProfile.bmiCategory);
    },
    [started, gameState.isPlaying, isDemoMode, processPose, userProfile.bmiCategory]
  );

  const { canvasRef, videoRef, isLoading, error } = usePoseDetection({
    onLandmarksDetected: handleLandmarks,
    enabled: !isDemoMode,
  });

  // Demo / Simulation mode pose generator
  useEffect(() => {
    if (isDemoMode && started && gameState.isPlaying) {
      let simPhase = 0;
      simTimerRef.current = window.setInterval(() => {
        simPhase += 0.08;
        const cycle = (Math.sin(simPhase) + 1) / 2; // 0 to 1
        let mockAngles: PoseAngles;

        if (exerciseType === 'squat' || exerciseType === 'sideLunge') {
          const knee = 170 - cycle * 105;
          mockAngles = {
            leftKnee: knee,
            rightKnee: knee,
            leftHip: 160 - cycle * 80,
            rightHip: 160 - cycle * 80,
            leftElbow: 90,
            rightElbow: 90,
            torsoAngle: 10 + cycle * 10,
          };
        } else {
          const isLeftPhase = Math.sin(simPhase / 2) >= 0;
          const liftIntensity = Math.max(0, Math.sin(simPhase));
          const activeHipFlex = 170 - liftIntensity * 105;
          const twist = 5 + liftIntensity * 22;

          mockAngles = {
            leftKnee: 150,
            rightKnee: 150,
            leftHip: isLeftPhase ? activeHipFlex : 170,
            rightHip: isLeftPhase ? 170 : activeHipFlex,
            leftElbow: 90,
            rightElbow: 90,
            torsoAngle: twist,
          };
        }

        processPose(mockAngles, userProfile.bmiCategory);
      }, 100);
    }

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isDemoMode, started, gameState.isPlaying, exerciseType, userProfile.bmiCategory, processPose]);

  // Countdown before game starts with audio
  useEffect(() => {
    if (countdown > 0) {
      soundManager.playBeep(440, 0.15);
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !started) {
      soundManager.playBeep(880, 0.35);
      setStarted(true);
      startGame(exerciseType);
    }
  }, [countdown, started, startGame, exerciseType]);

  // Check if game ended
  useEffect(() => {
    if (started && !gameState.isPlaying && gameState.timeRemaining === 0) {
      setTimeout(() => {
        onFinish({
          score: gameState.score,
          reps: gameState.reps,
          maxCombo: gameState.maxCombo,
        });
      }, 1500);
    }
  }, [started, gameState.isPlaying, gameState.timeRemaining, gameState.score, gameState.reps, gameState.maxCombo, onFinish]);

  return (
    <div className="screen exercise-screen">
      {/* Camera + Canvas container */}
      <div className="camera-container" ref={containerRef}>
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="pose-canvas" />

        {/* Three.js AR 3D Scene — rendered on its own WebGL canvas above the pose canvas */}
        {started && gameState.isPlaying && (
          <ARScene3D
            gameState={gameState}
            width={containerSize.width}
            height={containerSize.height}
          />
        )}

        {/* Loading state */}
        {isLoading && !isDemoMode && (
          <div className="camera-loading">
            <div className="spinner" />
            <p>กำลังโหลด MediaPipe AI & กล้อง...</p>
            <button
              className="btn btn-secondary btn-small"
              style={{ marginTop: '14px' }}
              onClick={() => setIsDemoMode(true)}
            >
              🎮 ลองเล่นด้วยโหมดจำลอง (Demo Mode)
            </button>
          </div>
        )}

        {/* Error state */}
        {error && !isDemoMode && (
          <div className="camera-error">
            <p>❌ {error}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                className="btn btn-primary btn-small"
                onClick={() => setIsDemoMode(true)}
              >
                🎮 เข้าโหมดจำลองท่าทาง (Demo)
              </button>
              <button className="btn btn-secondary btn-small" onClick={onBack}>
                กลับ
              </button>
            </div>
          </div>
        )}

        {/* Demo banner */}
        {isDemoMode && (
          <div className="demo-mode-tag">
            🕹️ กำลังเล่นในโหมดจำลองท่าทางอัตโนมัติ (Simulation)
          </div>
        )}

        {/* Countdown overlay */}
        {countdown > 0 && !isLoading && (
          <div className="countdown-overlay">
            <div className="countdown-exercise-name">
              {config.nameTh} ({config.name})
            </div>
            <div className="countdown-number">{countdown}</div>
            <p>เตรียมตัวให้พร้อม!</p>
            <div style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px',
              border: '1px solid #14B8A6',
              fontSize: '14px',
              fontWeight: 600,
              color: '#5EEAD4'
            }}>
              📏 กรุณายืนห่างจากกล้องประมาณ 1.5 – 2 เมตร เพื่อให้เห็นร่างกายเต็มตัว
            </div>
          </div>
        )}

        {/* AR HUD Overlay (CSS-based, still active alongside 3D scene) */}
        {started && gameState.isPlaying && <AROverlay gameState={gameState} />}

        {/* Time's up */}
        {started && !gameState.isPlaying && gameState.timeRemaining === 0 && (
          <div className="times-up-overlay">
            <h2>⏰ หมดเวลา!</h2>
            <p>คะแนนรวม: {gameState.score}</p>
          </div>
        )}
      </div>

      {/* Exercise info bar */}
      <div className="exercise-info-bar">
        <span className="exercise-name">
          {config.nameTh} ({config.name})
        </span>
        <span className="bmi-badge">BMI: {userProfile.bmi.toFixed(1)}</span>
        <button
          className="btn btn-danger btn-small"
          onClick={() => {
            endGame();
            onBack();
          }}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
};
