// ==========================================
// Profile Screen Component
// Collects weight and height for BMI calculation
// ==========================================

import React, { useState } from 'react';
import type { UserProfile, BMICategory } from '../types';
import { calculateBMI, getBMICategory } from '../utils/angleCalculations';

interface ProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onComplete }) => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [preview, setPreview] = useState<{ bmi: number; category: BMICategory } | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const bmi = calculateBMI(w, h);
      const category = getBMICategory(bmi);
      setPreview({ bmi, category });
    }
  };

  const handleSubmit = () => {
    if (!preview) return;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    onComplete({
      weight: w,
      height: h,
      bmi: preview.bmi,
      bmiCategory: preview.category,
    });
  };

  const getCategoryLabel = (cat: BMICategory) => {
    switch (cat) {
      case 'normal':
        return { label: 'ปกติ (< 23.0)', color: '#4CAF50', emoji: '✅' };
      case 'overweight':
        return { label: 'น้ำหนักเกิน (23.0-29.9)', color: '#FF9800', emoji: '⚠️' };
      case 'obese':
        return { label: 'อ้วน (≥ 30.0)', color: '#f44336', emoji: '🔴' };
    }
  };

  return (
    <div className="screen profile-screen">
      <div className="profile-content">
        <h2>📋 กรอกข้อมูลส่วนตัว</h2>
        <p className="profile-desc">
          ระบบจะใช้ข้อมูลนี้คำนวณค่า BMI เพื่อปรับเกณฑ์ท่าออกกำลังกายให้เหมาะสม
        </p>

        <div className="input-group">
          <label>น้ำหนัก (กก.)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setPreview(null);
            }}
            placeholder="เช่น 65"
            min="30"
            max="200"
          />
        </div>

        <div className="input-group">
          <label>ส่วนสูง (ซม.)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              setPreview(null);
            }}
            placeholder="เช่น 170"
            min="100"
            max="250"
          />
        </div>

        {!preview ? (
          <button
            className="btn btn-secondary"
            onClick={handleCalculate}
            disabled={!weight || !height}
          >
            คำนวณ BMI
          </button>
        ) : (
          <div className="bmi-result">
            <div className="bmi-value" style={{ color: getCategoryLabel(preview.category).color }}>
              <span className="bmi-number">{preview.bmi.toFixed(1)}</span>
              <span className="bmi-unit">BMI</span>
            </div>
            <div className="bmi-category">
              {getCategoryLabel(preview.category).emoji}{' '}
              {getCategoryLabel(preview.category).label}
            </div>
            <p className="bmi-note">
              ระบบจะปรับเกณฑ์องศาข้อต่อให้เหมาะสมกับ BMI ของคุณ
            </p>
            <button className="btn btn-primary" onClick={handleSubmit}>
              เลือกท่าออกกำลังกาย →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
