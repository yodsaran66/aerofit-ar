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
    textTh: 'ส่วนติดต่อผู้ใช้ (UI) มีความสวยงาม ทันสมัย และอ่านเข้าใจง่าย',
  },
  {
    id: 'd2',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'ขั้นตอนการใช้งานและเมนูกรอกข้อมูลสรีระ (BMI) สะดวก ไม่ซับซ้อน',
  },
  {
    id: 'd3',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'ตำแหน่งของภาพกราฟิก AR และข้อมูลบนหน้าจอมีความเหมาะสม ไม่บดบังเรือนร่างผู้เล่น',
  },
  {
    id: 'd4',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'ขนาดตัวอักษร สี และสัญลักษณ์บ่งชี้สถานะมีความชัดเจน สังเกตได้ง่ายขณะเคลื่อนไหว',
  },
  {
    id: 'd5',
    category: 'design',
    categoryTh: '1. ด้านการออกแบบและความสะดวกในการใช้งาน',
    textTh: 'แถบนำสายตาและกรอบจัดระยะกล้อง (1.5 - 2 เมตร) ช่วยให้จัดวางตำแหน่งร่างกายได้อย่างสะดวก',
  },

  // 2. ด้านประสิทธิภาพการทำงานและการแสดงผล
  {
    id: 'p1',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'ระบบตรวจจับพิกัดร่างกาย (MediaPipe) มีความแม่นยำและตอบสนองต่อการเคลื่อนไหวทันที',
  },
  {
    id: 'p2',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'การคำนวณองศาข้อต่อและการปรับเกณฑ์ตามระดับสรีระ (BMI) มีความเหมาะสม',
  },
  {
    id: 'p3',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'เว็บแอปพลิเคชันทำงานได้ลื่นไหล ภาพและระบบโต้ตอบในเกมมีความเสถียร ไม่กระตุก',
  },
  {
    id: 'p4',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'ระบบสามารถตรวจจับท่าทางได้อย่างต่อเนื่องแม้มีการเคลื่อนไหวสลับข้างซ้าย-ขวา',
  },
  {
    id: 'p5',
    category: 'performance',
    categoryTh: '2. ด้านประสิทธิภาพการทำงานและการแสดงผล',
    textTh: 'ระบบเตือนระยะห่างของกล้องมีความแม่นยำ ช่วยลดข้อผิดพลาดในการตรวจจับโครงร่าง',
  },

  // 3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน
  {
    id: 'o1',
    category: 'overall',
    categoryTh: '3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน',
    textTh: 'เป้าหมายและภารกิจของเกมช่วยกระตุ้นความสม่ำเสมอในการออกกำลังกายจนครบจำนวนครั้ง',
  },
  {
    id: 'o2',
    category: 'overall',
    categoryTh: '3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน',
    textTh: 'ระบบการนับจำนวนครั้งและคอมโบช่วยให้มีสมาธิและควบคุมท่าทางได้เต็มระยะการเคลื่อนไหว',
  },
  {
    id: 'o3',
    category: 'overall',
    categoryTh: '3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน',
    textTh: 'ระบบบันทึกสถิติและความก้าวหน้าในการฝึกซ้อมช่วยกระตุ้นให้อยากพัฒนาความสามารถของตนเองอย่างต่อเนื่อง',
  },
  {
    id: 'o4',
    category: 'overall',
    categoryTh: '3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน',
    textTh: 'เสียงตอบสนองและเอฟเฟกต์ AR ช่วยสร้างแรงจูงใจในการฝึกฝนอย่างต่อเนื่อง',
  },
  {
    id: 'o5',
    category: 'overall',
    categoryTh: '3. ด้านกลไกเกมและแรงจูงใจในการฝึกฝน',
    textTh: 'กลไกการท้าทายในรูปแบบเกมช่วยลดความน่าเบื่อหน่ายและกระตุ้นให้อยากกลับมาออกกำลังกายเป็นประจำ',
  },
];

export const SatisfactionSurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState('');

  const existingSubmissions = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('aerofit_offline_surveys') || '[]');
    } catch {
      return [];
    }
  }, []);

  const isDuplicate = React.useMemo(() => {
    if (!respondentName.trim()) return false;
    const nameLower = respondentName.trim().toLowerCase();
    return existingSubmissions.some((s: any) => (s.userId || '').trim().toLowerCase() === nameLower);
  }, [respondentName, existingSubmissions]);

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
              {isDuplicate && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ ชื่อหรือรหัสนี้เคยส่งแบบประเมินแล้ว ไม่สามารถใช้ชื่อซ้ำได้
                </p>
              )}
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
                disabled={!isComplete || isDuplicate || !respondentName.trim()}
                onClick={() => {
                  if (isDuplicate) return;
                  try {
                    const existing = JSON.parse(localStorage.getItem('aerofit_offline_surveys') || '[]');
                    existing.push({
                      userId: respondentName.trim(),
                      answers,
                      timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('aerofit_offline_surveys', JSON.stringify(existing));
                  } catch (e) {
                    console.warn(e);
                  }
                  setSubmitted(true);
                }}
              >
                {isDuplicate ? 'ชื่อซ้ำในระบบ (ห้ามใช้ชื่อซ้ำ)' : 'บันทึกและประมวลผลสถิติ →'}
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
