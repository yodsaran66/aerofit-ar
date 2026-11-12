// ==========================================
// Exercise Selection Screen Component
// Choose between 3 bodyweight exercises
// ==========================================

import React from 'react';
import type { ExerciseType, BMICategory } from '../types';
import { EXERCISE_CONFIGS } from '../config/exercises';

interface ExerciseSelectProps {
  bmiCategory: BMICategory;
  onSelect: (exercise: ExerciseType) => void;
  onBack: () => void;
}

export const ExerciseSelect: React.FC<ExerciseSelectProps> = ({ bmiCategory, onSelect, onBack }) => {
  const exercises: { type: ExerciseType; icon: string; difficulty: string }[] = [
    { type: 'squat', icon: '🦵', difficulty: 'ง่าย-กลาง' },
    { type: 'sideLunge', icon: '🏃', difficulty: 'กลาง' },
    { type: 'standingCrunch', icon: '🔄', difficulty: 'กลาง-ยาก' },
  ];

  const getCriteriaText = (type: ExerciseType) => {
    const criteria = EXERCISE_CONFIGS[type].criteria[bmiCategory];
    const parts: string[] = [];
    if (criteria.kneeAngle) {
      parts.push(`งอเข่า ${criteria.kneeAngle.min}°-${criteria.kneeAngle.max}°`);
    }
    if (criteria.hipAngle) {
      parts.push(`งอสะโพก ${criteria.hipAngle.min}°-${criteria.hipAngle.max}°`);
    }
    if (criteria.torsoRotation) {
      parts.push(`หมุนลำตัว ${criteria.torsoRotation.min}°-${criteria.torsoRotation.max}°`);
    }
    return parts.join(' • ');
  };

  return (
    <div className="screen exercise-select-screen">
      <div className="exercise-select-content">
        <button className="btn-back" onClick={onBack}>
          ← กลับ
        </button>
        <h2>🎯 เลือกท่าออกกำลังกาย</h2>
        <p className="select-desc">
          เลือกท่าที่ต้องการฝึก ระบบจะปรับเกณฑ์ตาม BMI ของคุณอัตโนมัติ
        </p>

        <div className="exercise-cards">
          {exercises.map(({ type, icon, difficulty }) => (
            <div key={type} className="exercise-card" onClick={() => onSelect(type)}>
              <div className="exercise-card-icon">{icon}</div>
              <h3>
                {EXERCISE_CONFIGS[type].nameTh}
                <br />
                <small>({EXERCISE_CONFIGS[type].name})</small>
              </h3>
              <p className="exercise-desc">{EXERCISE_CONFIGS[type].description}</p>
              <div className="exercise-criteria">
                <span className="criteria-badge">📐 {getCriteriaText(type)}</span>
              </div>
              <div className="exercise-difficulty">
                <span>ระดับ: {difficulty}</span>
              </div>
              <button className="btn btn-primary btn-small">เลือก</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
