// ==========================================
// AeroFit AR - Type Definitions
// ==========================================

export type BMICategory = 'normal' | 'overweight' | 'obese';

export type ExerciseType = 'squat' | 'sideLunge' | 'standingCrunch';

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  bmi: number;
  bmiCategory: BMICategory;
}

export interface AngleCriteria {
  min: number;
  max: number;
}

export interface ExerciseCriteria {
  kneeAngle?: AngleCriteria;
  hipAngle?: AngleCriteria;
  torsoRotation?: AngleCriteria;
}

export interface ExerciseConfig {
  name: string;
  nameTh: string;
  description: string;
  criteria: Record<BMICategory, ExerciseCriteria>;
}

export interface PoseAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftElbow: number;
  rightElbow: number;
  torsoAngle: number;
}

export interface ExerciseResult {
  exerciseType: ExerciseType;
  score: number;
  reps: number;
  accuracy: number;
  duration: number;
}

export interface GameState {
  isPlaying: boolean;
  currentExercise: ExerciseType | null;
  score: number;
  combo: number;
  maxCombo: number;
  reps: number;
  timeRemaining: number;
  formAccuracy: number;
  feedbackMessage?: string;
  liveAngleText?: string;
  targetCrunchSide?: 'left' | 'right';
  lastHitSide?: 'left' | 'right' | null;
  slashTrigger?: { side: 'left' | 'right'; timestamp: number } | null;
  activeHipAngle?: number;
  activeTorsoAngle?: number;
  collectibles: Collectible[];
  effects: Effect[];
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'star' | 'gem' | 'heart';
  points: number;
  collected: boolean;
  scale: number;
  rotation: number;
}

export interface Effect {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  createdAt: number;
}

export type AppScreen = 'welcome' | 'profile' | 'exercise-select' | 'exercise' | 'results';

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
