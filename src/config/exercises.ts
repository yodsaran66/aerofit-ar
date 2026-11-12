// ==========================================
// Exercise Configuration - BMI-based criteria
// From Table 5.1 of the research document
// ==========================================

import type { ExerciseConfig, ExerciseType } from '../types';

export const EXERCISE_CONFIGS: Record<ExerciseType, ExerciseConfig> = {
  squat: {
    name: 'Squat',
    nameTh: 'สควอท',
    description: 'งอเข่าลงในท่านั่งยอง รักษาแนวเข่าให้สอดคล้องกับปลายเท้า',
    criteria: {
      normal: {
        kneeAngle: { min: 80, max: 100 },
      },
      overweight: {
        kneeAngle: { min: 50, max: 70 },
      },
      obese: {
        kneeAngle: { min: 35, max: 50 },
      },
    },
  },
  sideLunge: {
    name: 'Side Lunge',
    nameTh: 'ก้าวข้างย่อเข่า',
    description: 'ก้าวเท้าออกไปด้านข้าง งอเข่าข้างที่รับน้ำหนัก',
    criteria: {
      normal: {
        kneeAngle: { min: 70, max: 90 },
      },
      overweight: {
        kneeAngle: { min: 50, max: 70 },
      },
      obese: {
        kneeAngle: { min: 30, max: 50 },
      },
    },
  },
  standingCrunch: {
    name: 'Standing Cross Crunch',
    nameTh: 'ยืนครันช์สลับ',
    description: 'ยกเข่าสลับข้างพร้อมหมุนลำตัวเข้าหากัน',
    criteria: {
      normal: {
        hipAngle: { min: 60, max: 80 },
        torsoRotation: { min: 20, max: 30 },
      },
      overweight: {
        hipAngle: { min: 45, max: 65 },
        torsoRotation: { min: 15, max: 25 },
      },
      obese: {
        hipAngle: { min: 30, max: 50 },
        torsoRotation: { min: 10, max: 20 },
      },
    },
  },
};

export const BMI_THRESHOLDS = {
  normal: { max: 23.0 },
  overweight: { min: 23.0, max: 30.0 },
  obese: { min: 30.0 },
};

export const GAME_DURATION = 60; // seconds per exercise round
export const COLLECTIBLE_SPAWN_INTERVAL = 2000; // ms
export const MAX_COLLECTIBLES = 5;
export const COMBO_MULTIPLIER = 0.5;
