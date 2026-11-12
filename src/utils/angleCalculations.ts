// ==========================================
// Angle Calculation Utilities
// Using trigonometry to calculate joint angles
// from MediaPipe 33 landmark points
// ==========================================

import type { LandmarkPoint } from '../types';

/**
 * Calculate angle between three points (in degrees)
 * Point B is the vertex of the angle
 */
export function calculateAngle(
  a: LandmarkPoint,
  b: LandmarkPoint,
  c: LandmarkPoint
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * MediaPipe Pose Landmark indices
 * Based on 33-point model
 */
export const LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Calculate all relevant joint angles from landmarks
 */
export function calculateJointAngles(landmarks: LandmarkPoint[]) {
  const L = LANDMARKS;

  const leftKnee = calculateAngle(
    landmarks[L.LEFT_HIP],
    landmarks[L.LEFT_KNEE],
    landmarks[L.LEFT_ANKLE]
  );

  const rightKnee = calculateAngle(
    landmarks[L.RIGHT_HIP],
    landmarks[L.RIGHT_KNEE],
    landmarks[L.RIGHT_ANKLE]
  );

  const leftHip = calculateAngle(
    landmarks[L.LEFT_SHOULDER],
    landmarks[L.LEFT_HIP],
    landmarks[L.LEFT_KNEE]
  );

  const rightHip = calculateAngle(
    landmarks[L.RIGHT_SHOULDER],
    landmarks[L.RIGHT_HIP],
    landmarks[L.RIGHT_KNEE]
  );

  const leftElbow = calculateAngle(
    landmarks[L.LEFT_SHOULDER],
    landmarks[L.LEFT_ELBOW],
    landmarks[L.LEFT_WRIST]
  );

  const rightElbow = calculateAngle(
    landmarks[L.RIGHT_SHOULDER],
    landmarks[L.RIGHT_ELBOW],
    landmarks[L.RIGHT_WRIST]
  );

  // Torso angle: angle between shoulders relative to hips
  const midShoulder: LandmarkPoint = {
    x: (landmarks[L.LEFT_SHOULDER].x + landmarks[L.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[L.LEFT_SHOULDER].y + landmarks[L.RIGHT_SHOULDER].y) / 2,
    z: (landmarks[L.LEFT_SHOULDER].z + landmarks[L.RIGHT_SHOULDER].z) / 2,
  };
  const midHip: LandmarkPoint = {
    x: (landmarks[L.LEFT_HIP].x + landmarks[L.RIGHT_HIP].x) / 2,
    y: (landmarks[L.LEFT_HIP].y + landmarks[L.RIGHT_HIP].y) / 2,
    z: (landmarks[L.LEFT_HIP].z + landmarks[L.RIGHT_HIP].z) / 2,
  };
  const vertical: LandmarkPoint = {
    x: midHip.x,
    y: midHip.y - 1,
    z: midHip.z,
  };
  const torsoAngle = calculateAngle(midShoulder, midHip, vertical);

  return {
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    leftElbow,
    rightElbow,
    torsoAngle,
  };
}

/**
 * Calculate BMI from weight (kg) and height (cm)
 */
export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

/**
 * Determine BMI category based on Asian criteria (from document)
 */
export function getBMICategory(bmi: number): 'normal' | 'overweight' | 'obese' {
  if (bmi < 23.0) return 'normal';
  if (bmi < 30.0) return 'overweight';
  return 'obese';
}

/**
 * Check if angle is within criteria range
 */
export function isAngleInRange(angle: number, min: number, max: number): boolean {
  return angle >= min && angle <= max;
}

/**
 * Calculate how accurate the angle is (0-100%)
 */
export function getAngleAccuracy(angle: number, min: number, max: number): number {
  if (angle >= min && angle <= max) return 100;
  const midpoint = (min + max) / 2;
  const range = (max - min) / 2;
  const distance = Math.abs(angle - midpoint);
  const accuracy = Math.max(0, 100 - ((distance - range) / range) * 100);
  return Math.round(accuracy);
}
