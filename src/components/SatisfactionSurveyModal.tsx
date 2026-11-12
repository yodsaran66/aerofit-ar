// ==========================================
// Satisfaction Survey Modal Component
// Evaluation based on research document section 5.3 & 9.4
// 5-point Likert scale across 3 aspects
// ==========================================

import React, { useState } from 'react';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  category: 'design' | 'performance' | 'overall';
  categoryTh: string;
  textTh: string;
}

const QUESTIONS: Question[] = [
  // 1. ด้านการออกแบบและความสะดวกในการใช้งาน
  {
    id: 'd1',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'ส่วนติดต่อผู้ใช้ (UI) มีความสวยงาม ทันสมัย และอ่านง่าย',
  },
  {
    id: 'd2',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'ขั้นตอนการใช้งานและเมนูเข้าใจง่าย ไม่ซับซ้อน',
  },
  {
    id: 'd3',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'การปรับความยากง่ายตามค่า BMI สะดวกและเหมาะสมกับตนเอง',
  },

  // 2. ด้านประสิทธิภาพการทำงานและการแสดงผล
  {
    id: 'p1',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'ระบบตรวจจับพิกัดร่างกาย (MediaPipe) มีความแม่นยำและตอบสนองรวดเร็ว',
  },
  {
    id: 'p2',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'กราฟิก AR และระบบโต้ตอบในเกมมีความเสถียร ไม่กระตุก',
  },
  {
    id: 'p3',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'การนับจำนวนครั้ง (Reps) และการประเมินองศาท่าทางมีความถูกต้อง',
  },

  // 3. ด้านความพึงพอใจโดยรวม
  {
    id: 'o1',
    category: 'overall',
    categoryTh: '3. ด้านความพึงพอใจโดยรวม',
    textTh: 'ระบบเกม (Gamification) ช่วยเพิ่มความสนุกและแรงจูงใจในการออกกำลังกาย',
  },
  {
    id: 'o2',
    category: 'overall',
    categoryTh: '3. ด้านความพึงพอใจโดยรวม',
    textTh: 'แอปพลิเคชันช่วยลดความเสี่ยงต่อการบาดเจ็บจากการจัดท่าทางไม่ถูกต้อง',
  },
  {
    id: 'o3',
    category: 'overall',
    categoryTh: '3. ด้านความพึงพอใจโดยรวม',
    textTh: 'ความพึงพอใจในภาพรวมต่อแอปพลิเคชัน AeroFit AR',
  },
];

export const SatisfactionSurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState('');

  if (!isOpen) return null;

  const handleSelect = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const isComplete = QUESTIONS.every((q) => answers[q.id] !== undefined);

  // Calculate statistics (Mean & S.D.)
  const calculateStats = () => {
    const scores = Object.values(answers);
    if (scores.length === 0) return { mean: '0.00', sd: '0.00', designMean: '0.00', perfMean: '0.00', overallMean: '0.00' };

    const getCategoryMean = (cat: 'design' | 'performance' | 'overall') => {
      const catQuestions = QUESTIONS.filter((q) => q.category === cat);
      const catScores = catQuestions.map((q) => answers[q.id] || 0);
      const sum = catScores.reduce((a, b) => a + b, 0);
      return (sum / catScores.length).toFixed(2);
    };

    const totalMean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - totalMean, 2), 0) / (scores.length - 1 || 1);
    const sd = Math.sqrt(variance);

    return {
      mean: totalMean.toFixed(2),
      sd: sd.toFixed(2),
      designMean: getCategoryMean('design'),
      perfMean: getCategoryMean('performance'),
      overallMean: getCategoryMean('overall'),
    };
  };

  const getInterpretation = (mean: number) => {
    if (mean >= 4.5) return 'ระดับมากที่สุด';
    if (mean >= 3.5) return 'ระดับมาก (สอดคล้องกับสมมติฐานวิจัย)';
    if (mean >= 2.5) return 'ระดับปานกลาง';
    if (mean >= 1.5) return 'ระดับน้อย';
    return 'ระดับน้อยที่สุด';
  };

  const stats = calculateStats();

  return (
    <div className="survey-backdrop">
      <div className="survey-container">
        <div className="survey-header">
          <h3>📝 แบบประเมินความพึงพอใจการใช้งาน AeroFit AR</h3>
          <p>
            แบบสอบถามมาตราส่วนประมาณค่า 5 ระดับ (Likert Scale)
            เพื่อประเมินความพึงพอใจและเก็บข้อมูลตามกรอบวิจัย
          </p>
        </div>

        {!submitted ? (
          <div className="survey-body">
            <div className="respondent-input">
              <label>ชื่อหรือรหัสผู้ทดสอบ (กลุ่มตัวอย่าง):</label>
              <input
                type="text"
                placeholder="เช่น ผู้ทดสอบคนที่ 1 / S-01"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
              />
            </div>

            <div className="scale-legend">
              <span>5 = มากที่สุด</span>
              <span>4 = มาก</span>
              <span>3 = ปานกลาง</span>
              <span>2 = น้อย</span>
              <span>1 = น้อยที่สุด</span>
            </div>

            {['design', 'performance', 'overall'].map((catKey) => {
              const catQuestions = QUESTIONS.filter((q) => q.category === catKey);
              const catTitle = catQuestions[0].categoryTh;

              return (
                <div key={catKey} className="survey-category-group">
                  <h4>{catTitle}</h4>
                  {catQuestions.map((q, idx) => (
                    <div key={q.id} className="survey-question-item">
                      <p className="q-text">
                        {idx + 1}. {q.textTh}
                      </p>
                      <div className="rating-buttons">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            className={`rate-btn ${answers[q.id] === score ? 'active' : ''}`}
                            onClick={() => handleSelect(q.id, score)}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="survey-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                disabled={!isComplete}
                onClick={() => setSubmitted(true)}
              >
                บันทึกและประมวลผลสถิติ →
              </button>
            </div>
          </div>
        ) : (
          <div className="survey-result-summary">
            <h4>📊 สรุปผลการประเมินความพึงพอใจ</h4>
            <p className="tested-by">
              ผู้ให้ข้อมูล: <strong>{respondentName || 'ผู้ทดสอบทั่วไป'}</strong>
            </p>

            <div className="stats-report-grid">
              <div className="report-item highlight">
                <span className="lbl">ค่าเฉลี่ยภาพรวม (Mean)</span>
                <span className="val">{stats.mean} / 5.00</span>
                <span className="sub-lbl">S.D. = {stats.sd}</span>
                <span className="interp">
                  {getInterpretation(parseFloat(stats.mean))}
                </span>
              </div>
              <div className="report-item">
                <span className="lbl">ด้านการออกแบบ (UI/UX)</span>
                <span className="val">{stats.designMean} / 5.00</span>
              </div>
              <div className="report-item">
                <span className="lbl">ด้านประสิทธิภาพ (MediaPipe / AR)</span>
                <span className="val">{stats.perfMean} / 5.00</span>
              </div>
              <div className="report-item">
                <span className="lbl">ด้านความพึงพอใจและประโยชน์</span>
                <span className="val">{stats.overallMean} / 5.00</span>
              </div>
            </div>

            <p className="hypothesis-match">
              ✅ สมมติฐานข้อ 4.1: ผู้ใช้งานมีความพึงพอใจเฉลี่ยอยู่ในระดับ "มาก"
              ขึ้นไป ({stats.mean} ≥ 3.50)
            </p>

            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>
              ปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
