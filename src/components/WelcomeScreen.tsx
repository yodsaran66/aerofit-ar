// ==========================================
// Welcome Screen Component
// Landing page with health disclaimer using Tailwind CSS
// ==========================================

import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full text-center relative z-10 py-10 px-4 space-y-8">
        <div className="space-y-4">
          <div className="text-6xl animate-bounce">🏋️‍♂️</div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            <span className="text-teal-400">Aero</span>
            <span className="text-sky-400">Fit</span>
            <span className="text-amber-400"> AR</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            แอปพลิเคชันเกมความเป็นจริงเสริม
            <br />
            เพื่อยกระดับคุณภาพการออกกำลังกายแบบบอดี้เวท
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-all hover:-translate-y-1">
            <span className="text-3xl block mb-2">📷</span>
            <h3 className="font-bold text-base text-white">MediaPipe AI</h3>
            <p className="text-xs text-slate-400 mt-1">ตรวจจับท่าทาง 33 จุดแบบเรียลไทม์</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-all hover:-translate-y-1">
            <span className="text-3xl block mb-2">🎮</span>
            <h3 className="font-bold text-base text-white">AR Game</h3>
            <p className="text-xs text-slate-400 mt-1">สะสมคะแนนผ่านเกมความเป็นจริงเสริม</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-all hover:-translate-y-1">
            <span className="text-3xl block mb-2">📊</span>
            <h3 className="font-bold text-base text-white">BMI Adaptive</h3>
            <p className="text-xs text-slate-400 mt-1">ปรับเกณฑ์ตามดัชนีมวลกายอัตโนมัติ</p>
          </div>
        </div>

        {!showDisclaimer ? (
          <button
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-black text-base shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
            onClick={() => setShowDisclaimer(true)}
          >
            เริ่มต้นใช้งาน 🚀 (Start Workout)
          </button>
        ) : (
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-left space-y-4 max-w-xl mx-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">⚠️ คำเตือนด้านสุขภาพ</h3>
            <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
              <p>
                แอปพลิเคชันนี้ออกแบบมาสำหรับบุคคลทั่วไปที่สุขภาพแข็งแรง อายุระหว่าง 15-50 ปี
                ที่สามารถออกกำลังกายแบบบอดี้เวทได้
              </p>
              <p>
                <strong className="text-white">กรุณาปรึกษาแพทย์ก่อนใช้งาน</strong>{' '}
                หากคุณมีอาการบาดเจ็บ โรคประจำตัว หรือข้อจำกัดทางกายภาพ
              </p>
              <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                📋 ข้อมูลส่วนบุคคลของท่านจะถูกเก็บรักษาตามหลักเกณฑ์ของ พ.ร.บ.
                คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                และจะใช้เฉพาะภายในแอปพลิเคชันเท่านั้น
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer pt-2 group">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-teal-500"
              />
              <span className="text-xs text-slate-300 font-medium">ข้าพเจ้ารับทราบและยอมรับข้อตกลงข้างต้น</span>
            </label>
            <button
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 mt-2"
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
