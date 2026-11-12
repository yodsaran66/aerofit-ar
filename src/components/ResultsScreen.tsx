// ==========================================
// Results Screen Component
// Shows exercise results and statistics
// ==========================================

import React, { useState } from 'react';
import type { ExerciseType } from '../types';
import { EXERCISE_CONFIGS } from '../config/exercises';
import { SatisfactionSurveyModal } from './SatisfactionSurveyModal';

interface ResultsScreenProps {
  exerciseType: ExerciseType;
  score: number;
  reps: number;
  maxCombo: number;
  bmi: number;
  onPlayAgain: () => void;
  onChangeExercise: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  exerciseType,
  score,
  reps,
  maxCombo,
  bmi,
  onPlayAgain,
  onChangeExercise,
}) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const config = EXERCISE_CONFIGS[exerciseType];

  const getRank = (score: number) => {
    if (score >= 1000) return { rank: 'S', color: '#FFD700', label: 'ยอดเยี่ยม!' };
    if (score >= 700) return { rank: 'A', color: '#4CAF50', label: 'เก่งมาก!' };
    if (score >= 400) return { rank: 'B', color: '#2196F3', label: 'ดีเลย!' };
    if (score >= 200) return { rank: 'C', color: '#FF9800', label: 'พอใช้' };
    return { rank: 'D', color: '#f44336', label: 'ลองอีกครั้ง!' };
  };

  const { rank, color, label } = getRank(score);

  return (
    <div className="screen results-screen">
      <div className="results-content">
        <h2>🏆 ผลการออกกำลังกาย</h2>

        <div className="exercise-completed">
          {config.nameTh} ({config.name})
        </div>

        <div className="rank-display" style={{ color }}>
          <div className="rank-letter">{rank}</div>
          <div className="rank-label">{label}</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{score}</span>
            <span className="stat-label">คะแนนรวม</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔄</span>
            <span className="stat-value">{reps}</span>
            <span className="stat-label">จำนวนครั้ง</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">x{maxCombo}</span>
            <span className="stat-label">Max Combo</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{bmi.toFixed(1)}</span>
            <span className="stat-label">BMI</span>
          </div>
        </div>

        <div className="results-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            🔄 เล่นอีกครั้ง
          </button>
          <button className="btn btn-secondary" onClick={onChangeExercise}>
            🎯 เปลี่ยนท่า
          </button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            className="btn btn-survey"
            onClick={() => setShowSurvey(true)}
          >
            📝 ทำแบบประเมินความพึงพอใจ (แบบสอบถามวิจัย 30 คน)
          </button>
        </div>

        <SatisfactionSurveyModal
          isOpen={showSurvey}
          onClose={() => setShowSurvey(false)}
        />
      </div>
    </div>
  );
};
