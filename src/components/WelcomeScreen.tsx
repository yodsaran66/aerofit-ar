// ==========================================
// Welcome Screen Component
// Landing page with health disclaimer
// ==========================================

import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="screen welcome-screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="logo-icon">🏋️‍♂️</div>
          <h1 className="app-title">
            <span className="title-aero">Aero</span>
            <span className="title-fit">Fit</span>
            <span className="title-ar"> AR</span>
          </h1>
          <p className="app-subtitle">
            แอปพลิเคชันเกมความเป็นจริงเสริม
            <br />
            เพื่อยกระดับคุณภาพการออกกำลังกายแบบบอดี้เวท
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📷</span>
            <h3>MediaPipe AI</h3>
            <p>ตรวจจับท่าทาง 33 จุดแบบเรียลไทม์</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎮</span>
            <h3>AR Game</h3>
            <p>สะสมคะแนนผ่านเกมความเป็นจริงเสริม</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>BMI Adaptive</h3>
            <p>ปรับเกณฑ์ตามดัชนีมวลกายอัตโนมัติ</p>
          </div>
        </div>

        {!showDisclaimer ? (
          <button className="btn btn-primary btn-large" onClick={() => setShowDisclaimer(true)}>
            เริ่มต้นใช้งาน 🚀
          </button>
        ) : (
          <div className="disclaimer-modal">
            <h3>⚠️ คำเตือนด้านสุขภาพ</h3>
            <div className="disclaimer-content">
              <p>
                แอปพลิเคชันนี้ออกแบบมาสำหรับบุคคลทั่วไปที่สุขภาพแข็งแรง อายุระหว่าง 15-50 ปี
                ที่สามารถออกกำลังกายแบบบอดี้เวทได้
              </p>
              <p>
                <strong>กรุณาปรึกษาแพทย์ก่อนใช้งาน</strong>
                หากคุณมีอาการบาดเจ็บ โรคประจำตัว หรือข้อจำกัดทางกายภาพ
              </p>
              <p className="pdpa-notice">
                📋 ข้อมูลส่วนบุคคลของท่านจะถูกเก็บรักษาตามหลักเกณฑ์ของ พ.ร.บ.
                คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                และจะใช้เฉพาะภายในแอปพลิเคชันเท่านั้น
              </p>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              />
              <span>ข้าพเจ้ารับทราบและยอมรับข้อตกลงข้างต้น</span>
            </label>
            <button
              className="btn btn-primary"
              disabled={!disclaimerAccepted}
              onClick={onStart}
            >
              ดำเนินการต่อ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
