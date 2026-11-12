// ==========================================
// Game Logic Hook
// Manages AR game state, collectibles,
// scoring, and combo system
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Collectible, Effect, ExerciseType, BMICategory, PoseAngles } from '../types';
import { EXERCISE_CONFIGS, GAME_DURATION, COLLECTIBLE_SPAWN_INTERVAL, MAX_COLLECTIBLES, COMBO_MULTIPLIER } from '../config/exercises';
import { isAngleInRange, getAngleAccuracy } from '../utils/angleCalculations';
import { soundManager } from '../utils/soundEffects';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    currentExercise: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    reps: 0,
    timeRemaining: GAME_DURATION,
    formAccuracy: 0,
    targetCrunchSide: 'left',
    lastHitSide: null,
    slashTrigger: null,
    activeHipAngle: 0,
    activeTorsoAngle: 0,
    collectibles: [],
    effects: [],
  });

  const timerRef = useRef<number>(0);
  const spawnRef = useRef<number>(0);
  const repStateRef = useRef<'up' | 'down'>('up');
  const crunchReadyRef = useRef<boolean>(true);
  const targetSideRef = useRef<'left' | 'right'>('left');
  const lastAccuracyRef = useRef(0);

  // Spawn collectibles
  const spawnCollectible = useCallback(() => {
    setGameState((prev) => {
      if (prev.collectibles.filter((c) => !c.collected).length >= MAX_COLLECTIBLES) {
        return prev;
      }

      const types: Collectible['type'][] = ['star', 'gem', 'heart'];
      const type = types[Math.floor(Math.random() * types.length)];
      const points = type === 'star' ? 10 : type === 'gem' ? 25 : 15;

      let x: number;
      let y: number;

      if (prev.currentExercise === 'standingCrunch') {
        // Place in side action lanes so the center player frame is NEVER obscured!
        const isLeft = Math.random() > 0.5;
        x = isLeft ? 0.08 + Math.random() * 0.08 : 0.84 + Math.random() * 0.08;
        y = 0.35 + Math.random() * 0.30;
      } else {
        // For Squat / Side Lunge, keep in outer wings or overhead
        const useFlanks = Math.random() > 0.3;
        if (useFlanks) {
          x = Math.random() > 0.5 ? 0.08 + Math.random() * 0.12 : 0.80 + Math.random() * 0.12;
          y = 0.25 + Math.random() * 0.45;
        } else {
          x = 0.25 + Math.random() * 0.5;
          y = 0.10 + Math.random() * 0.10; // overhead
        }
      }

      const newCollectible: Collectible = {
        id: generateId(),
        x,
        y,
        type,
        points,
        collected: false,
        scale: 1,
        rotation: 0,
      };

      return {
        ...prev,
        collectibles: [...prev.collectibles.filter((c) => !c.collected), newCollectible],
      };
    });
  }, []);

  // Add floating score effect
  const addEffect = useCallback((x: number, y: number, text: string, color: string) => {
    const effect: Effect = {
      id: generateId(),
      x,
      y,
      text,
      color,
      opacity: 1,
      createdAt: Date.now(),
    };

    setGameState((prev) => ({
      ...prev,
      effects: [...prev.effects.slice(-10), effect],
    }));

    // Remove after animation
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        effects: prev.effects.filter((e) => e.id !== effect.id),
      }));
    }, 1500);
  }, []);

  // Start game
  const startGame = useCallback((exerciseType: ExerciseType) => {
    targetSideRef.current = 'left';
    crunchReadyRef.current = true;
    setGameState({
      isPlaying: true,
      currentExercise: exerciseType,
      score: 0,
      combo: 0,
      maxCombo: 0,
      reps: 0,
      timeRemaining: GAME_DURATION,
      formAccuracy: 0,
      targetCrunchSide: 'left',
      lastHitSide: null,
      slashTrigger: null,
      activeHipAngle: 0,
      activeTorsoAngle: 0,
      collectibles: [],
      effects: [],
    });
    repStateRef.current = 'up';
    lastAccuracyRef.current = 0;
  }, []);

      // Timer countdown
  useEffect(() => {
    if (gameState.isPlaying && gameState.timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setGameState((prev) => {
          if (prev.timeRemaining <= 1) {
            soundManager.playFanfare();
            return { ...prev, timeRemaining: 0, isPlaying: false, feedbackMessage: 'จบเซ็ตแล้ว! เก่งมาก' };
          }
          if (prev.timeRemaining <= 4) {
            soundManager.playBeep(330, 0.1);
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isPlaying, gameState.timeRemaining]);

  // Collectible spawning
  useEffect(() => {
    if (gameState.isPlaying) {
      spawnRef.current = window.setInterval(spawnCollectible, COLLECTIBLE_SPAWN_INTERVAL);
    }

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameState.isPlaying, spawnCollectible]);

  // Process pose data
  const processPose = useCallback(
    (angles: PoseAngles, bmiCategory: BMICategory) => {
      if (!gameState.isPlaying || !gameState.currentExercise) return;

      const config = EXERCISE_CONFIGS[gameState.currentExercise];
      const criteria = config.criteria[bmiCategory];

      let accuracy = 0;
      let inPosition = false;
      let feedback = 'จัดท่าทางให้เข้าเกณฑ์';
      let angleText = '';
      let activeHip = 0;
      let activeTorso = Math.round(angles.torsoAngle);

      if (gameState.currentExercise === 'squat') {
        const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
        if (criteria.kneeAngle) {
          accuracy = getAngleAccuracy(kneeAngle, criteria.kneeAngle.min, criteria.kneeAngle.max);
          inPosition = isAngleInRange(kneeAngle, criteria.kneeAngle.min, criteria.kneeAngle.max);
          angleText = `มุมเข่า: ${Math.round(kneeAngle)}° (เป้าหมาย: ${criteria.kneeAngle.min}°-${criteria.kneeAngle.max}°)`;
          if (inPosition) {
            feedback = '✨ ยอดเยี่ยม! ค้างไว้แล้วดันตัวขึ้น';
          } else if (kneeAngle > criteria.kneeAngle.max) {
            feedback = '⬇️ ย่อตัวงอเข่าลงอีกนิด';
          } else {
            feedback = '⬆️ ย่อลึกเกินไป ดันตัวขึ้นเล็กน้อย';
          }
        }
      } else if (gameState.currentExercise === 'sideLunge') {
        const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
        if (criteria.kneeAngle) {
          accuracy = getAngleAccuracy(kneeAngle, criteria.kneeAngle.min, criteria.kneeAngle.max);
          inPosition = isAngleInRange(kneeAngle, criteria.kneeAngle.min, criteria.kneeAngle.max);
          angleText = `มุมเข่าข้างรับน้ำหนัก: ${Math.round(kneeAngle)}° (เป้าหมาย: ${criteria.kneeAngle.min}°-${criteria.kneeAngle.max}°)`;
          if (inPosition) {
            feedback = '✨ สมบูรณ์แบบ! ถ่ายน้ำหนักดีมาก';
          } else if (kneeAngle > criteria.kneeAngle.max) {
            feedback = '➡️ ก้าวข้างแล้วย่อเข่าลงอีก';
          } else {
            feedback = '⬆️ ยกตัวขึ้นเล็กน้อย รักษาแนวหลัง';
          }
        }
      } else if (gameState.currentExercise === 'standingCrunch') {
        const currentTargetSide = targetSideRef.current;
        const rawHipAngle = currentTargetSide === 'left' ? angles.leftHip : angles.rightHip;
        // In standing, hip angle vertex is ~175°. Flexion is (180 - rawHip) or raw acute angle.
        const hipFlexion = rawHipAngle < 120 ? rawHipAngle : Math.max(0, 180 - rawHipAngle);
        activeHip = Math.round(hipFlexion);

        let hipAcc = 75;
        let torsoAcc = 75;
        if (criteria.hipAngle) {
          hipAcc = getAngleAccuracy(hipFlexion, criteria.hipAngle.min, criteria.hipAngle.max);
        }
        if (criteria.torsoRotation) {
          torsoAcc = getAngleAccuracy(
            angles.torsoAngle,
            criteria.torsoRotation.min,
            criteria.torsoRotation.max
          );
        }

        accuracy = Math.round((hipAcc * 0.6) + (torsoAcc * 0.4));
        inPosition = accuracy >= 65;

        if (currentTargetSide === 'left') {
          angleText = `[เป้าหมายซ้าย] เข่าซ้าย: ${activeHip}° (เกณฑ์: ${criteria.hipAngle?.min}°-${criteria.hipAngle?.max}°) | บิดตัว: ${activeTorso}°`;
          if (inPosition) {
            feedback = '⚡ ฟันเป้าหมายสำเร็จ! (CRUNCH ฝั่งซ้ายสมบูรณ์แบบ)';
          } else {
            feedback = '👈 โจมตีฝั่งซ้าย: ยกเข่าซ้าย + บิดศอกขวาลงแตะ!';
          }
        } else {
          angleText = `[เป้าหมายขวา] เข่าขวา: ${activeHip}° (เกณฑ์: ${criteria.hipAngle?.min}°-${criteria.hipAngle?.max}°) | บิดตัว: ${activeTorso}°`;
          if (inPosition) {
            feedback = '⚡ ฟันเป้าหมายสำเร็จ! (CRUNCH ฝั่งขวาสมบูรณ์แบบ)';
          } else {
            feedback = '👉 โจมตีฝั่งขวา: ยกเข่าขวา + บิดศอกซ้ายลงแตะ!';
          }
        }
      }

      lastAccuracyRef.current = accuracy;

      // ==========================================
      // Rep counting & State Machine
      // ==========================================
      if (gameState.currentExercise === 'standingCrunch') {
        const currentTargetSide = targetSideRef.current;

        // When in target position and ready for strike
        if (inPosition && crunchReadyRef.current) {
          crunchReadyRef.current = false;
          const hitSide = currentTargetSide;
          const nextSide = hitSide === 'left' ? 'right' : 'left';
          targetSideRef.current = nextSide;

          soundManager.playSlashSound();

          // Float effect at the side wing (never in front of user's body!)
          const effectX = hitSide === 'left' ? 0.12 : 0.88;
          addEffect(
            effectX,
            0.45,
            `⚡ ${hitSide === 'left' ? 'LEFT' : 'RIGHT'} CRUNCH! +100`,
            hitSide === 'left' ? '#00E5FF' : '#FF1776'
          );

          setGameState((prev) => {
            const newCombo = prev.combo + 1;
            const comboBonus = Math.floor(newCombo * COMBO_MULTIPLIER * 20);
            const repScore = 100 + comboBonus;

            if (newCombo >= 3 && newCombo % 3 === 0) {
              soundManager.playComboSound();
            }

            // Collect collectibles on that side
            const updatedCollectibles = prev.collectibles.map((c) => {
              const onThisSide = hitSide === 'left' ? c.x < 0.35 : c.x > 0.65;
              if (onThisSide && !c.collected) {
                addEffect(c.x, c.y, `+${c.points}`, '#00FF88');
                return { ...c, collected: true };
              }
              return c;
            });

            return {
              ...prev,
              reps: prev.reps + 1,
              score: prev.score + repScore,
              combo: newCombo,
              maxCombo: Math.max(prev.maxCombo, newCombo),
              targetCrunchSide: nextSide,
              lastHitSide: hitSide,
              slashTrigger: { side: hitSide, timestamp: Date.now() },
              collectibles: updatedCollectibles,
              formAccuracy: accuracy,
              feedbackMessage: feedback,
              liveAngleText: angleText,
              activeHipAngle: activeHip,
              activeTorsoAngle: activeTorso,
            };
          });
        } else if (!inPosition && !crunchReadyRef.current) {
          // Reset when player returns to neutral stance (knee lowered)
          if (accuracy < 40) {
            crunchReadyRef.current = true;
          }
          setGameState((prev) => ({
            ...prev,
            formAccuracy: accuracy,
            feedbackMessage: feedback,
            liveAngleText: angleText,
            activeHipAngle: activeHip,
            activeTorsoAngle: activeTorso,
          }));
        } else {
          setGameState((prev) => ({
            ...prev,
            formAccuracy: accuracy,
            feedbackMessage: feedback,
            liveAngleText: angleText,
            activeHipAngle: activeHip,
            activeTorsoAngle: activeTorso,
          }));
        }
      } else {
        // Squat & Side Lunge standard state machine
        if (inPosition && repStateRef.current === 'up') {
          repStateRef.current = 'down';
        } else if (!inPosition && repStateRef.current === 'down') {
          repStateRef.current = 'up';

          soundManager.playRepSound();
          setGameState((prev) => {
            const newCombo = prev.combo + 1;
            const comboBonus = Math.floor(newCombo * COMBO_MULTIPLIER);
            const repScore = 50 + comboBonus;

            if (newCombo >= 3 && newCombo % 3 === 0) {
              soundManager.playComboSound();
            }

            return {
              ...prev,
              reps: prev.reps + 1,
              score: prev.score + repScore,
              combo: newCombo,
              maxCombo: Math.max(prev.maxCombo, newCombo),
            };
          });

          addEffect(0.5, 0.25, `+50 REP!`, '#FFD700');
        }

        // Collect nearby collectibles when in position
        if (inPosition) {
          setGameState((prev) => {
            let scoreBonus = 0;
            let collectedAny = false;
            const updatedCollectibles = prev.collectibles.map((c) => {
              if (!c.collected) {
                scoreBonus += c.points;
                collectedAny = true;
                addEffect(c.x, c.y, `+${c.points}`, '#00FF88');
                return { ...c, collected: true };
              }
              return c;
            });

            if (collectedAny) {
              soundManager.playCoinSound();
            }

            return {
              ...prev,
              collectibles: updatedCollectibles,
              score: prev.score + scoreBonus,
              formAccuracy: accuracy,
              feedbackMessage: feedback,
              liveAngleText: angleText,
            };
          });
        } else {
          setGameState((prev) => ({
            ...prev,
            formAccuracy: accuracy,
            feedbackMessage: feedback,
            liveAngleText: angleText,
            combo: accuracy < 30 ? 0 : prev.combo,
          }));
        }
      }
    },
    [gameState.isPlaying, gameState.currentExercise, addEffect]
  );

  const endGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  return {
    gameState,
    startGame,
    endGame,
    processPose,
  };
}
