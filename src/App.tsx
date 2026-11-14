import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Trophy,
  Play,
  Square,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Video,
  MoveHorizontal,
  Infinity as InfinityIcon,
  Sliders,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
  Zap,
  Sparkles,
  Info,
  Maximize2,
  Flame,
  User
} from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// ==========================================
// 1. CUSTOM SVG GAME ASSETS
// ==========================================

const ExerciseIllustration = ({ type }: { type: string }) => {
  if (type === 'squat') {
    return (
      <svg viewBox="0 0 80 80" className="w-14 h-14 text-teal-600">
        <rect width="80" height="80" rx="18" fill="#F0FDFA" />
        <circle cx="40" cy="20" r="6" fill="#0D9488" />
        <path d="M40 28 L34 44 L50 52 L48 66" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M36 33 L54 33" stroke="#14B8A6" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M22 44 L22 58 M18 54 L22 58 L26 54" stroke="#99F6E4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (type === 'sidelunge') {
    return (
      <svg viewBox="0 0 80 80" className="w-14 h-14 text-sky-600">
        <rect width="80" height="80" rx="18" fill="#F0F9FF" />
        <circle cx="36" cy="20" r="6" fill="#0284C7" />
        <path d="M36 28 L36 44 L22 52 L22 65" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M36 44 L58 64" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M26 34 L46 34" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className="w-14 h-14 text-indigo-600">
      <rect width="80" height="80" rx="18" fill="#EEF2FF" />
      <circle cx="40" cy="19" r="6" fill="#4F46E5" />
      <path d="M40 27 L40 45 L32 65" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M40 45 L54 38 L50 54" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M28 32 L46 38" stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};

const RocketSprite = ({ chargePercent, isFlying }: { chargePercent: number; isFlying: boolean }) => (
  <svg viewBox="0 0 90 130" className="w-16 h-24 sm:w-20 sm:h-28 drop-shadow-md">
    {(chargePercent > 15 || isFlying) && (
      <g className="origin-top animate-pulse">
        <path d="M33 92 Q45 128 57 92 Z" fill="#FB923C" opacity="0.85" />
        <path d="M38 92 Q45 116 52 92 Z" fill="#FDE047" />
      </g>
    )}
    <path d="M26 62 L10 86 L28 84 Z" fill="#0F766E" />
    <path d="M64 62 L80 86 L62 84 Z" fill="#0F766E" />
    <path d="M45 10 C60 28 64 52 64 84 L26 84 C26 52 30 28 45 10 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    <path d="M45 10 C53 20 57 30 59 38 L31 38 C33 30 37 20 45 10 Z" fill="#14B8A6" />
    <circle cx="45" cy="54" r="9" fill="#E0F2FE" stroke="#0D9488" strokeWidth="3" />
    <circle cx="42" cy="51" r="2.5" fill="#FFFFFF" />
    <rect x="33" y="84" width="24" height="7" rx="3" fill="#334155" />
  </svg>
);

const TargetUfoSprite = ({ hp, isExploding, isDemo }: { hp: number; isExploding: boolean; isDemo: boolean }) => (
  <div className={`relative flex flex-col items-center transition-transform duration-300 ease-out ${isExploding ? 'scale-125' : ''}`}>
    <svg viewBox="0 0 140 70" className="w-24 h-12 sm:w-28 sm:h-14 drop-shadow-lg">
      <path d="M42 32 C42 12 98 12 98 32 Z" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="2" />
      <ellipse cx="70" cy="36" rx="58" ry="14" fill="#1E293B" stroke="#475569" strokeWidth="2" />
      <ellipse cx="70" cy="34" rx="44" ry="7" fill="#334155" />
      <circle cx="34" cy="36" r="4" fill="#2DD4BF" />
      <circle cx="58" cy="40" r="4" fill="#FBBF24" />
      <circle cx="82" cy="40" r="4" fill="#FBBF24" />
      <circle cx="106" cy="36" r="4" fill="#2DD4BF" />
      <path d="M54 48 L86 48 L78 56 L62 56 Z" fill="#0D9488" />
    </svg>
    {!isDemo && (
      <div className="w-24 sm:w-28 h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/20 mt-1.5">
        <div
          className="h-full bg-teal-400 transition-all duration-300 ease-out"
          style={{ width: `${hp}%` }}
        />
      </div>
    )}
  </div>
);

const EnergyPodSprite = ({ active, hit }: { active: boolean; hit: boolean }) => (
  <svg viewBox="0 0 70 70" className={`w-14 h-14 sm:w-16 sm:h-16 transition-all duration-300 ${hit ? 'scale-125 opacity-100 rotate-6' : active ? 'scale-105 opacity-100' : 'opacity-40 scale-95'}`}>
    <circle cx="35" cy="35" r="30" fill={hit ? '#FEF3C7' : '#E0F2FE'} stroke={hit ? '#F59E0B' : '#0284C7'} strokeWidth="3" strokeDasharray={hit ? 'none' : '6 4'} />
    <rect x="23" y="17" width="24" height="36" rx="12" fill={hit ? '#F59E0B' : '#0EA5E9'} />
    <path d="M36 24 L29 36 L35 36 L33 46 L41 33 L35 33 Z" fill="#FFFFFF" />
  </svg>
);

const PrismCrystalSprite = ({ isHit }: { isHit: boolean }) => (
  <svg viewBox="0 0 100 100" className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 ${isHit ? 'scale-125 rotate-12 drop-shadow-[0_0_25px_rgba(45,212,191,0.9)]' : 'drop-shadow-lg animate-pulse'}`}>
    <polygon points="50,6 88,32 74,88 26,88 12,32" fill={isHit ? '#2DD4BF' : '#6366F1'} stroke="#FFFFFF" strokeWidth="2.5" />
    <polygon points="50,6 88,32 50,52 12,32" fill={isHit ? '#5EEAD4' : '#818CF8'} opacity="0.9" />
    <polygon points="50,22 70,36 62,72 38,72 30,36" fill="#FFFFFF" opacity="0.35" />
  </svg>
);

// ==========================================
// 2. ข้อมูลเกณฑ์มาตรฐานองศาข้อต่อ + ข้อมูลเกม AR
// ==========================================
const EXERCISE_CONFIG: Record<string, any> = {
  squat: {
    id: 'squat',
    name: 'ท่าสควอท (Squat)',
    engName: 'Bodyweight Squat',
    gameTitle: 'Rocket Launch',
    gameDesc: 'ย่อเข่าลงเพื่อเติมเชื้อเพลิงจรวด เมื่อถึงองศาเป้าหมายจรวดจะทะยานขึ้นฟ้า',
    shortDesc: 'ฝึกกล้ามเนื้อต้นขาและสะโพก รักษาแนวเข่าให้ตรงกับปลายเท้า',
    jointLabel: 'มุมการงอเข่า (Knee Flexion)',
    secondaryLabel: 'ความสมดุลลำตัว',
    targets: {
      normal: { min: 80, max: 100, secondary: [0, 25], advice: 'งอเข่า 80–100° รักษาแนวเข่าให้สอดคล้องกับปลายเท้าและควบคุมลำตัว' },
      overweight: { min: 50, max: 70, secondary: [0, 30], advice: 'ลดความลึกเป็น 50–70° ปรับระยะห่างเท้าให้เหมาะสมและเน้นการทรงตัว' },
      obese: { min: 35, max: 50, secondary: [0, 35], advice: 'ย่อตื้นในช่วง 35–50° อย่างควบคุม และหยุดเมื่อรู้สึกไม่มั่นคง' }
    }
  },
  sidelunge: {
    id: 'sidelunge',
    name: 'ท่าก้าวข้างย่อเข่า (Side Lunge)',
    engName: 'Alternating Side Lunge',
    gameTitle: 'Energy Glider',
    gameDesc: 'ก้าวย่อเข่าไปทางซ้ายหรือขวาเพื่อชาร์จแคปซูลพลังงานที่แท่นรับด้านข้าง',
    shortDesc: 'ฝึกกล้ามเนื้อขาด้านข้างและการถ่ายน้ำหนักรักษาสมดุลซ้าย-ขวา',
    jointLabel: 'มุมงอเข่าข้างที่ก้าวรับน้ำหนัก',
    secondaryLabel: 'แนวแกนลำตัว',
    targets: {
      normal: { min: 70, max: 90, secondary: [0, 25], advice: 'ก้าวงอเข่า 70–90° เหยียดขาอีกข้างตามความเหมาะสมและรักษาแนวลำตัว' },
      overweight: { min: 50, max: 70, secondary: [0, 30], advice: 'ลดระยะก้าวและงอเข่า 50–70° ควบคุมการถ่ายน้ำหนักอย่างช้าๆ' },
      obese: { min: 30, max: 50, secondary: [0, 35], advice: 'ก้าวสั้นและงอเข่า 30–50° เน้นความมั่นคงมากกว่าความลึกของท่า' }
    }
  },
  crosscrunch: {
    id: 'crosscrunch',
    name: 'ท่ายืนครันช์สลับ (Standing Cross Crunch)',
    engName: 'Standing Cross Crunch',
    gameTitle: 'Prism Breaker',
    gameDesc: 'ตรวจจับ 2 จุดข้อต่อ (สะโพก และ เข่า) ของแต่ละข้าง พร้อมบิดศอกทำลายคริสตัลพลังงาน',
    shortDesc: 'ฝึกกล้ามเนื้อแกนกลางลำตัวด้วยการยกเข่า-สะโพกสลับข้างและหมุนลำตัว',
    jointLabel: 'มุมยกสะโพก (Hip) & มุมงอเข่า (Knee)',
    secondaryLabel: 'มุมการหมุนลำตัว (Torso Rotation)',
    targets: {
      normal: { min: 60, max: 80, secondary: [20, 30], advice: 'ยกเข่าให้สะโพกงอ 60–80° และเข่างอตามเกณฑ์ พร้อมหมุนลำตัวเข้าหากัน 20–30°' },
      overweight: { min: 45, max: 65, secondary: [15, 25], advice: 'ยกเข่าประมาณ 45–65° และลดการหมุนลำตัวเป็น 15–25°' },
      obese: { min: 30, max: 50, secondary: [10, 20], advice: 'ยกเข่า 30–50° และหมุนลำตัวเพียงเล็กน้อย 10–20° โดยคงสมดุล' }
    }
  }
};

// ==========================================
// 1.1 แบบสอบถามความพึงพอใจ 3 ด้าน
// ==========================================
const SURVEY_QUESTIONS = [
  {
    dimension: 'ด้านที่ 1: การออกแบบส่วนติดต่อผู้ใช้และความสะดวกในการใช้งาน (UI & Usability)',
    items: [
      { id: 'd1_1', text: 'หน้าจอแสดงผลและเมนูจัดวางเป็นระเบียบ อ่านเข้าใจง่าย' },
      { id: 'd1_2', text: 'ขั้นตอนการกรอกข้อมูลสรีระ (BMI) และการเริ่มต้นใช้งานสะดวก ไม่ยุ่งยาก' },
      { id: 'd1_3', text: 'ตำแหน่งของภาพกราฟิกจำลอง AR มีความเหมาะสม ไม่บดบังเรือนร่างผู้เล่น' },
      { id: 'd1_4', text: 'ขนาดตัวอักษร สี และสัญลักษณ์บ่งชี้สถานะบนหน้าจอมีความชัดเจน มองเห็นได้ง่ายขณะเคลื่อนไหว' },
      { id: 'd1_5', text: 'แถบนำสายตาและกรอบจัดระยะกล้อง (1.5 - 2 เมตร) ช่วยให้จัดวางตำแหน่งร่างกายได้อย่างสะดวก' }
    ]
  },
  {
    dimension: 'ด้านที่ 2: ประสิทธิภาพการตรวจจับข้อต่อร่างกาย (MediaPipe Tracking & Performance)',
    items: [
      { id: 'd2_1', text: 'ระบบตรวจจับจุดข้อต่อร่างกายได้ตรงตำแหน่งและตอบสนองต่อการเคลื่อนไหวทันที' },
      { id: 'd2_2', text: 'การคำนวณองศาและเกณฑ์ความลึกของท่ามีความเหมาะสมกับระดับสรีระ (BMI) ของผู้ใช้' },
      { id: 'd2_3', text: 'เว็บแอปพลิเคชันทำงานลื่นไหลและภาพแสดงผลไม่กระตุกระหว่างใช้งาน' },
      { id: 'd2_4', text: 'ระบบสามารถตรวจจับท่าทางได้อย่างต่อเนื่องแม้มีการเคลื่อนไหวสลับข้างซ้าย-ขวา' },
      { id: 'd2_5', text: 'ระบบเตือนระยะห่างของกล้องมีความแม่นยำ ช่วยลดข้อผิดพลาดในการตรวจจับโครงร่าง' }
    ]
  },
  {
    dimension: 'ด้านที่ 3: กลไกเกมและแรงจูงใจในการฝึกฝน (Gamification & Motivation)',
    items: [
      { id: 'd3_1', text: 'เป้าหมายและภารกิจของเกมช่วยกระตุ้นความสม่ำเสมอในการออกกำลังกายจนครบจำนวนครั้ง' },
      { id: 'd3_2', text: 'ระบบการนับจำนวนครั้งและคอมโบช่วยให้มีสมาธิและควบคุมท่าทางได้เต็มระยะการเคลื่อนไหว' },
      { id: 'd3_3', text: 'ระบบบันทึกสถิติและความก้าวหน้าในการฝึกซ้อมช่วยกระตุ้นให้อยากพัฒนาความสามารถของตนเองอย่างต่อเนื่อง' },
      { id: 'd3_4', text: 'เสียงตอบสนองและเอฟเฟกต์ AR ช่วยสร้างแรงจูงใจในการฝึกฝนอย่างต่อเนื่อง' },
      { id: 'd3_5', text: 'กลไกการท้าทายในรูปแบบเกมช่วยลดความน่าเบื่อหน่ายและกระตุ้นให้อยากกลับมาออกกำลังกายเป็นประจำ' }
    ]
  }
];

// ==========================================
// 3. ฟังก์ชันตรีโกณมิติและคำนวณเวกเตอร์ข้อต่อชีวกลศาสตร์ (ISB Standard Vector Dot Product)
// ==========================================
function calcInteriorAngle(a: any, b: any, c: any, aspectRatio = 1.0) {
  if (!a || !b || !c) return 180;
  if (!Number.isFinite(a.x) || !Number.isFinite(a.y) ||
      !Number.isFinite(b.x) || !Number.isFinite(b.y) ||
      !Number.isFinite(c.x) || !Number.isFinite(c.y)) {
    return 180;
  }

  const v1x = (a.x - b.x) * aspectRatio;
  const v1y = a.y - b.y;
  const v2x = (c.x - b.x) * aspectRatio;
  const v2y = c.y - b.y;

  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  if (mag1 < 1e-7 || mag2 < 1e-7) return 180;

  const dot = v1x * v2x + v1y * v2y;
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180.0) / Math.PI;
}

function calcKneeFlexion(hip: any, knee: any, ankle: any, aspectRatio = 1.0) {
  const interior = calcInteriorAngle(hip, knee, ankle, aspectRatio);
  return Math.max(0, Math.min(145, 180.0 - interior));
}

function calcThighElevation(hip: any, knee: any, aspectRatio = 1.0) {
  if (!hip || !knee) return 0;
  if (!Number.isFinite(hip.x) || !Number.isFinite(hip.y) ||
      !Number.isFinite(knee.x) || !Number.isFinite(knee.y)) {
    return 0;
  }
  const dx = (knee.x - hip.x) * aspectRatio;
  const dy = knee.y - hip.y; 
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-7) return 0;

  const cosTheta = Math.max(-1.0, Math.min(1.0, dy / mag));
  const elevation = (Math.acos(cosTheta) * 180.0) / Math.PI;
  return Math.max(0, Math.min(135, elevation));
}

function playCleanSound(type = 'success', enabled = true) {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'slash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'complete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {
    // ข้ามหากเบราว์เซอร์ปิดเสียงอัตโนมัติ
  }
}

export default function AeroFitApp() {
  const [screen, setScreen] = useState('landing');

  const [heroHighlightIdx, setHeroHighlightIdx] = useState(0);
  const heroHighlights = [
    'แอปพลิเคชันเกมความเป็นจริงเสริมเพื่อยกระดับคุณภาพการออกกำลังกายแบบบอดี้เวท ด้วยเทคโนโลยี MediaPipe Pose และการปรับเกณฑ์องศาข้อต่อตามระดับดัชนีมวลกาย (BMI) แบบเฉพาะบุคคล',
    'ระบบตรวจจับชีวกลศาสตร์แบบ Real-time พร้อมแสดงผลกราฟิก AR รอบตัวโดยเว้นพื้นที่กลางจอ 100% ไม่บดบังเรือนร่างผู้เล่น',
    'ปลอดภัยด้วยเกณฑ์ Range of Motion (ROM) เฉพาะบุคคล และระบบตรวจนับจำนวนครั้งอัตโนมัติแม่นยำทุก Repetition'
  ];

  useEffect(() => {
    try {
      localStorage.removeItem('aerofit_clean_hi');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroHighlightIdx(prev => (prev + 1) % heroHighlights.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroHighlights.length]);

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'สวัสดีตอนเช้า';
    if (hr < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  };

  // Consent & Profile States
  const [pdpaAccepted, setPdpaAccepted] = useState(true);
  const [healthConfirmed, setHealthConfirmed] = useState(true);
  const [userName, setUserName] = useState('ผู้เข้าร่วมวิจัย #01');
  const [age, setAge] = useState('22');
  const [weight, setWeight] = useState('65');
  const [height, setHeight] = useState('172');
  const [romModifier, setRomModifier] = useState(0);
  const [userData, setUserData] = useState({
    name: 'ผู้เข้าร่วมวิจัย #01',
    age: 22,
    weight: 65,
    height: 172,
    bmi: 22.0,
    category: 'สมส่วน (BMI < 23.0)',
    categoryKey: 'normal',
    romModifier: 0,
    badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200'
  });

  // Game Mode & Exercise States
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [isChallengeMode, setIsChallengeMode] = useState(true);
  const [targetReps, setTargetReps] = useState(10);
  const [reps, setReps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Angle & Feedback States
  const [currentAngle, setCurrentAngle] = useState(15);
  const [secondaryAngle, setSecondaryAngle] = useState(12);
  const [crossKneeAngle, setCrossKneeAngle] = useState(85);
  const [poseVisible, setPoseVisible] = useState(true);
  const [feedbackText, setFeedbackText] = useState('กำลังแสดงตัวอย่างท่าทางและการทำงานของเกม AR (โหมดสาธิต)');
  const [feedbackStatus, setFeedbackStatus] = useState('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera Distance & Framing States
  const [distanceStatus, setDistanceStatus] = useState<'optimal' | 'too-close' | 'too-far'>('optimal');
  const [distanceText, setDistanceText] = useState('✅ ระยะห่างเหมาะสม 1.5 – 2 เมตร (ตรวจจับได้เต็มตัว)');

  // AR Game Animation States
  const [rocketFlying, setRocketFlying] = useState(false);
  const [hitEffect, setHitEffect] = useState(false);
  const [floatingPopup, setFloatingPopup] = useState('');
  const [targetSide, setTargetSide] = useState<'left' | 'right'>('left');
  const [detectedSide, setDetectedSide] = useState<'left' | 'right'>('left');
  const [manualControl, setManualControl] = useState(false);

  // System Mode
  const [mode, setMode] = useState<'simulation' | 'camera'>('simulation');
  const [isRunning, setIsRunning] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // History & Survey States
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [lastSummary, setLastSummary] = useState<any>(null);
  const [angleSamples, setAngleSamples] = useState<number[]>([]);
  const [surveyScores, setSurveyScores] = useState<Record<string, number>>({
    d1_1: 5, d1_2: 5, d1_3: 5, d1_4: 5, d1_5: 5,
    d2_1: 5, d2_2: 5, d2_3: 5, d2_4: 5, d2_5: 5,
    d3_1: 5, d3_2: 5, d3_3: 5, d3_4: 5, d3_5: 5
  });
  
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [surveySubmissions, setSurveySubmissions] = useState<any[]>(() => {
    const defaultData = [
      { id: 1, userId: 'ผู้ทดสอบคนที่ 1 (S-01)', bmiGroup: 'สมส่วน (BMI < 23.0)', d1: 4.67, d2: 4.67, d3: 5.00, total: 4.78 },
      { id: 2, userId: 'ผู้ทดสอบคนที่ 2 (S-02)', bmiGroup: 'น้ำหนักเกิน (BMI 23.0-29.9)', d1: 4.33, d2: 4.67, d3: 4.67, total: 4.56 }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('aerofit_offline_surveys') || '[]');
      if (Array.isArray(saved) && saved.length > 0) {
        const savedSubmissions = saved.map((item: any, idx: number) => ({
          id: defaultData.length + idx + 1,
          userId: item.userId || `ผู้ประเมินคนที่ ${defaultData.length + idx + 1}`,
          bmiGroup: item.bmiGroup || 'สมส่วน (BMI < 23.0)',
          d1: Number(item.d1) || 5,
          d2: Number(item.d2) || 5,
          d3: Number(item.d3) || 5,
          total: Number(item.total) || 5
        }));
        return [...defaultData, ...savedSubmissions];
      }
    } catch (e) {
      console.warn('Failed to parse aerofit_offline_surveys:', e);
    }
    return defaultData;
  });



  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCameraActiveRef = useRef<boolean>(false);
  const hasScoredRepRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const targetSideRef = useRef<'left' | 'right'>('left');
  const modeRef = useRef(mode);
  
  const lastUiDispatchRef = useRef<number>(0);
  const lastDistanceStatusRef = useRef<string>('optimal');
  const feedbackTextRef = useRef<string>('กำลังแสดงตัวอย่างท่าทางและการทำงานของเกม AR (โหมดสาธิต)');
  const feedbackStatusRef = useRef<string>('normal');

  const adaptiveFilterRef = useRef<{
    lastTime: number;
    primaryRaw: number;
    primarySmoothed: number | null;
  }>({
    lastTime: 0,
    primaryRaw: 0,
    primarySmoothed: null
  });

  const smoothedAnglesRef = useRef<{ primary: number | null; secondary: number | null; knee: number | null }>({ primary: null, secondary: null, knee: null });

  useEffect(() => { targetSideRef.current = targetSide; }, [targetSide]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (screen !== 'ar-view' || mode !== 'camera' || !isRunning) return;
    const timer = setInterval(() => setElapsedSec(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [screen, mode, isRunning]);

  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdpaAccepted || !healthConfirmed) return;

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 50) {
      alert('กรุณาระบุอายุระหว่าง 15 ถึง 50 ปี (ตามขอบเขตกลุ่มประชากรและกลุ่มตัวอย่างการวิจัย)');
      return;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return;

    const bmiValue = +(w / (h * h)).toFixed(1);
    let category = '';
    let categoryKey = '';
    let badgeStyle = '';

    if (bmiValue < 23.0) {
      category = 'สมส่วน (BMI < 23.0)';
      categoryKey = 'normal';
      badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (bmiValue <= 29.9) {
      category = 'น้ำหนักเกิน (BMI 23.0 - 29.9)';
      categoryKey = 'overweight';
      badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
    } else {
      category = 'อ้วน (BMI ≥ 30.0)';
      categoryKey = 'obese';
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    setUserData({
      name: userName.trim() || 'ผู้เข้าร่วมวิจัย #01',
      age: parseInt(age, 10) || 22,
      weight: w,
      height: parseFloat(height),
      bmi: bmiValue,
      category,
      categoryKey,
      romModifier: Number(romModifier),
      badgeStyle
    });
    setScreen('dashboard');
  };

  const getActiveTarget = useCallback((exerciseId = selectedExercise) => {
    const config = EXERCISE_CONFIG[exerciseId] || EXERCISE_CONFIG.squat;
    const key = (userData?.categoryKey && config.targets[userData.categoryKey])
      ? userData.categoryKey
      : 'normal';
    const rawMod = Number(userData?.romModifier) || 0;
    const clampedMod = Math.max(-15, Math.min(15, rawMod));
    const base = config.targets[key];

    const minAngle = Math.max(15, base.min + clampedMod);
    const maxAngle = Math.min(135, Math.max(minAngle + 12, base.max + clampedMod));

    return {
      min: minAngle,
      max: maxAngle,
      secondary: base.secondary || [0, 25],
      advice: base.advice || ''
    };
  }, [selectedExercise, userData]);

  const evaluatePosture = useCallback((
    primaryDeg: number,
    secondaryDeg: number,
    isVisible = true,
    activeSide = targetSideRef.current,
    auxKneeDeg = 85
  ) => {
    const isDemoMode = modeRef.current === 'simulation';
    setPoseVisible(isVisible);
    if (!isVisible) {
      if (feedbackTextRef.current !== 'มองเห็นร่างกายไม่ครบจุดสำคัญ กรุณาขยับให้อยู่ในกรอบกล้อง') {
        feedbackTextRef.current = 'มองเห็นร่างกายไม่ครบจุดสำคัญ กรุณาขยับให้อยู่ในกรอบกล้อง';
        setFeedbackText('มองเห็นร่างกายไม่ครบจุดสำคัญ กรุณาขยับให้อยู่ในกรอบกล้อง');
      }
      if (feedbackStatusRef.current !== 'warn') {
        feedbackStatusRef.current = 'warn';
        setFeedbackStatus('warn');
      }
      setCurrentAngle(0); 
      setRocketFlying(false);
      return;
    }

    const clampedPrimary = Math.max(0, Math.min(135, Math.round(primaryDeg)));
    const clampedSecondary = Math.max(0, Math.min(60, Math.round(secondaryDeg)));
    const clampedAuxKnee = Math.max(0, Math.min(160, Math.round(auxKneeDeg)));

    if (isDemoMode) {
      setCurrentAngle(clampedPrimary);
      setSecondaryAngle(clampedSecondary);
      setCrossKneeAngle(clampedAuxKnee);
      setDetectedSide(activeSide);
    }

    const { min, max } = getActiveTarget();
    const isPrimaryHit = clampedPrimary >= min && clampedPrimary <= max;
    const isCorrectSide = selectedExercise === 'squat' ? true : (activeSide === targetSideRef.current);

    if (isPrimaryHit && isCorrectSide) {
      if (!hasScoredRepRef.current) {
        hasScoredRepRef.current = true;
        setRocketFlying(true);

        const targetMid = (min + max) / 2;
        const accuracyPct = Math.max(70, Math.min(100, Math.round(100 - Math.abs(clampedPrimary - targetMid) * 1.5)));
        const accuracyLabel = accuracyPct >= 90 ? 'ท่าเป๊ะมาก' : accuracyPct >= 80 ? 'ฟอร์มดี' : 'ผ่านเกณฑ์';

        if (isDemoMode) {
          setTimeout(() => {
            setHitEffect(true);
            setFloatingPopup(
              selectedExercise === 'crosscrunch'
                ? '⚡ PRISM SHATTER! (โหมดสาธิต)'
                : selectedExercise === 'sidelunge'
                ? '⚡ ENERGY DOCKED! (โหมดสาธิต)'
                : '🚀 ROCKET LAUNCH! (โหมดสาธิต)'
            );
          }, 160);
          setTimeout(() => {
            setRocketFlying(false);
            setHitEffect(false);
            setFloatingPopup('');
          }, 720);

          const demoMsg = `สาธิตท่าทางถึงเกณฑ์เป้าหมาย (${clampedPrimary}°) • ตัวอย่างการทำงาน`;
          feedbackTextRef.current = demoMsg;
          setFeedbackText(demoMsg);
          feedbackStatusRef.current = 'hit';
          setFeedbackStatus('hit');
          return;
        }

        playCleanSound(selectedExercise === 'crosscrunch' ? 'slash' : 'success', soundEnabled);

        let currentRepCount = 0;
        setReps(prev => {
          const nextReps = prev + 1;
          currentRepCount = nextReps;
          if (!isChallengeMode && nextReps >= targetReps) {
            setTimeout(() => finishWorkoutSession(nextReps), 650);
          }
          return nextReps;
        });

        const repFeedbackPopup = `+1 ครั้ง สำเร็จ! (${accuracyLabel})`;

        setTimeout(() => {
          setHitEffect(true);
          setFloatingPopup(repFeedbackPopup);
        }, 160);
        setTimeout(() => {
          setRocketFlying(false);
          setHitEffect(false);
          setFloatingPopup('');
        }, 850);

        const hitMsg = `ยอดเยี่ยม! องศาอยู่ในเกณฑ์ (${clampedPrimary}°) ทำสำเร็จแล้ว ${currentRepCount || reps + 1} ครั้ง (${accuracyLabel})`;
        feedbackTextRef.current = hitMsg;
        setFeedbackText(hitMsg);
        feedbackStatusRef.current = 'hit';
        setFeedbackStatus('hit');

        setAngleSamples(prev => [...prev, clampedPrimary]);
        setCombo(prev => prev + 1);

        setBossHp(prevHp => {
          if (prevHp <= 20) {
            playCleanSound('complete', soundEnabled);
            setWave(w => w + 1);
            return 100;
          }
          return prevHp - 20;
        });
      }
    } else if (!isCorrectSide && clampedPrimary >= min - 10) {
      const warnMsg = `สลับฝั่ง! เป้าหมายอยู่ที่ฝั่ง "${targetSideRef.current === 'left' ? 'ซ้าย' : 'ขวา'}"`;
      if (feedbackTextRef.current !== warnMsg) {
        feedbackTextRef.current = warnMsg;
        setFeedbackText(warnMsg);
      }
      if (feedbackStatusRef.current !== 'warn') {
        feedbackStatusRef.current = 'warn';
        setFeedbackStatus('warn');
      }
    } else if (clampedPrimary > max) {
      const overMsg = `งอข้อต่อลึกเกินเกณฑ์ (${clampedPrimary}° > ${max}°) ยืดตัวขึ้นเล็กน้อย`;
      if (feedbackTextRef.current !== overMsg) {
        feedbackTextRef.current = overMsg;
        setFeedbackText(overMsg);
      }
      if (feedbackStatusRef.current !== 'warn') {
        feedbackStatusRef.current = 'warn';
        setFeedbackStatus('warn');
      }
    } else {
      const resetThreshold = Math.max(18, min - 15);
      if (clampedPrimary < resetThreshold) {
        if (hasScoredRepRef.current) {
          hasScoredRepRef.current = false;
          if (selectedExercise !== 'squat') {
            setTargetSide(prev => (prev === 'left' ? 'right' : 'left'));
          }
        }
        const normMsg = isDemoMode
          ? `สาธิตการเคลื่อนไหวเข้าสู่ช่วงเป้าหมาย ${min}°–${max}° (โหมดสาธิต)`
          : `ค่อยๆ เคลื่อนไหวเข้าสู่ช่วงเป้าหมาย ${min}°–${max}°`;
        if (feedbackTextRef.current !== normMsg) {
          feedbackTextRef.current = normMsg;
          setFeedbackText(normMsg);
        }
        if (feedbackStatusRef.current !== 'normal') {
          feedbackStatusRef.current = 'normal';
          setFeedbackStatus('normal');
        }
      } else {
        const pct = Math.min(99, Math.max(10, Math.round(((clampedPrimary - 10) / Math.max(1, min - 10)) * 100)));
        const chgMsg = isDemoMode
          ? `สาธิตชาร์จพลังงาน ${pct}% (เป้าหมาย ${min}°–${max}°)`
          : `กำลังชาร์จพลังงาน ${pct}% (เป้าหมาย ${min}°–${max}°)`;
        if (feedbackTextRef.current !== chgMsg) {
          feedbackTextRef.current = chgMsg;
          setFeedbackText(chgMsg);
        }
        if (feedbackStatusRef.current !== 'normal') {
          feedbackStatusRef.current = 'normal';
          setFeedbackStatus('normal');
        }
      }
    }
  }, [combo, getActiveTarget, isChallengeMode, selectedExercise, soundEnabled, targetReps, wave]);

  useEffect(() => {
    if (screen !== 'ar-view' || mode !== 'simulation' || !isRunning || manualControl) return;

    let tick = -Math.PI / 2;
    const { min, max, secondary } = getActiveTarget();
    const peakAngle = Math.round((min + max) / 2);

    const interval = setInterval(() => {
      tick += 0.15;
      const waveVal = (Math.sin(tick) + 1) / 2;
      const simPrimary = Math.round(10 + waveVal * (peakAngle - 4));
      const simSecondary = Math.round(secondary[0] + waveVal * (secondary[1] - secondary[0]));
      const simKnee = Math.round(90 - waveVal * 30);
      evaluatePosture(simPrimary, simSecondary, true, targetSideRef.current, simKnee);
    }, 100);

    return () => clearInterval(interval);
  }, [screen, mode, isRunning, manualControl, getActiveTarget, evaluatePosture]);

  const stopCamera = useCallback(() => {
    isCameraActiveRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraAndMediaPipe = async () => {
    setCameraError('');
    setCameraLoading(true);
    setReps(0);
    setCombo(0);
    setWave(1);
    setBossHp(100);
    setElapsedSec(0);
    setAngleSamples([]);
    
    setCurrentAngle(0); 
    setSecondaryAngle(0);
    setCrossKneeAngle(0);
    smoothedAnglesRef.current = { primary: null, secondary: null, knee: null };
    adaptiveFilterRef.current = { lastTime: 0, primaryRaw: 0, primarySmoothed: null };
    lastUiDispatchRef.current = 0;
    setRocketFlying(false);
    setHitEffect(false);

    hasScoredRepRef.current = false;
    startTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!poseLandmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
      }

      setCameraLoading(false);
      setIsRunning(true);
      isCameraActiveRef.current = true;
      detectPoseLoop();
    } catch {
      setCameraLoading(false);
      setCameraError('ไม่พบกล้องเว็บแคม ระบบยังคงแสดงผลในโหมดสาธิต');
      setMode('simulation');
      setIsRunning(true);
    }
  };

  const detectPoseLoop = () => {
    if (!isCameraActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      if (isCameraActiveRef.current) {
        animFrameRef.current = requestAnimationFrame(detectPoseLoop);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nowInMs = performance.now();
    const result = landmarker.detectForVideo(video, nowInMs);
    const aspectRatio = canvas.width / Math.max(1, canvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];
      
      let isClearlyVisible = false;
      if (selectedExercise === 'crosscrunch') {
        const leftVis = (lm[23]?.visibility ?? 0) > 0.45 && (lm[25]?.visibility ?? 0) > 0.45;
        const rightVis = (lm[24]?.visibility ?? 0) > 0.45 && (lm[26]?.visibility ?? 0) > 0.45;
        isClearlyVisible = leftVis || rightVis;
      } else if (selectedExercise === 'sidelunge') {
        const leftLegVis = (lm[23]?.visibility ?? 0) > 0.45 && (lm[25]?.visibility ?? 0) > 0.45 && (lm[27]?.visibility ?? 0) > 0.4;
        const rightLegVis = (lm[24]?.visibility ?? 0) > 0.45 && (lm[26]?.visibility ?? 0) > 0.45 && (lm[28]?.visibility ?? 0) > 0.4;
        isClearlyVisible = leftLegVis || rightLegVis;
      } else {
        const leftLegVis = (lm[23]?.visibility ?? 0) > 0.45 && (lm[25]?.visibility ?? 0) > 0.45 && (lm[27]?.visibility ?? 0) > 0.4;
        const rightLegVis = (lm[24]?.visibility ?? 0) > 0.45 && (lm[26]?.visibility ?? 0) > 0.45 && (lm[28]?.visibility ?? 0) > 0.4;
        isClearlyVisible = leftLegVis || rightLegVis;
      }

      const headLm = lm[0];
      const leftAnkle = lm[27];
      const rightAnkle = lm[28];
      const hasHead = headLm && (headLm.visibility ?? 1) > 0.4;
      const hasAnkles = leftAnkle && rightAnkle && (leftAnkle.visibility ?? 1) > 0.35 && (rightAnkle.visibility ?? 1) > 0.35;
      
      const headY = headLm ? headLm.y : 0.08;
      const avgAnkleY = (leftAnkle && rightAnkle) ? (leftAnkle.y + rightAnkle.y) / 2 : 0.95;
      const bodySpan = avgAnkleY - headY;
      const shoulderWidth = Math.abs(lm[11].x - lm[12].x);

      let distStatus: 'optimal' | 'too-close' | 'too-far' = 'optimal';
      let distMsg = '✅ ระยะห่างเหมาะสม 1.5 – 2 เมตร (ตรวจพบศีรษะและข้อเท้าครบทั้งตัว)';

      if (!hasHead || !hasAnkles || headY < 0.04 || avgAnkleY > 0.96 || bodySpan > 0.86 || shoulderWidth > 0.36) {
        distStatus = 'too-close';
        distMsg = '⚠️ ใกล้เกินไป: กรุณาถอยห่างจากกล้องประมาณ 1.5 – 2 เมตร เพื่อให้เห็นเต็มตัว';
      } else if (bodySpan < 0.38 || shoulderWidth < 0.10) {
        distStatus = 'too-far';
        distMsg = '⚠️ ไกลเกินไป: กรุณาขยับเข้ามาอยู่ในระยะประมาณ 1.5 – 2 เมตร';
      }

      let activeConnections: number[][] = [];
      if (selectedExercise === 'squat' || selectedExercise === 'sidelunge') {
        activeConnections = [
          [23, 24],
          [23, 25], [25, 27],
          [24, 26], [26, 28]
        ];
      } else if (selectedExercise === 'crosscrunch') {
        activeConnections = [
          [23, 24],
          [23, 25],
          [24, 26]
        ];
      }

      const activePointsSet = new Set<number>();
      activeConnections.forEach(([i, j]) => {
        activePointsSet.add(i);
        activePointsSet.add(j);
      });

      activeConnections.forEach(([i, j]) => {
        if (lm[i] && lm[j]) {
          ctx.beginPath();
          ctx.moveTo(lm[i].x * canvas.width, lm[i].y * canvas.height);
          ctx.lineTo(lm[j].x * canvas.width, lm[j].y * canvas.height);
          ctx.lineWidth = 5;
          ctx.strokeStyle = isClearlyVisible ? '#14B8A6' : '#F59E0B'; 
          ctx.stroke();
        }
      });

      activePointsSet.forEach(idx => {
        const pt = lm[idx];
        if (pt) {
          const isKeyFocusPoint = selectedExercise === 'crosscrunch' && (idx === 23 || idx === 24 || idx === 25 || idx === 26);
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, isKeyFocusPoint ? 9 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = isKeyFocusPoint ? '#F59E0B' : '#FFFFFF';
          ctx.strokeStyle = isKeyFocusPoint ? '#FFFFFF' : '#0D9488';
          ctx.lineWidth = 3;
          ctx.fill();
          ctx.stroke();
        }
      });

      const leftKneeFlex = calcKneeFlexion(lm[23], lm[25], lm[27], aspectRatio);
      const rightKneeFlex = calcKneeFlexion(lm[24], lm[26], lm[28], aspectRatio);
      const kneeActiveSide = leftKneeFlex >= rightKneeFlex ? 'left' : 'right';
      const kneeFlexion = Math.max(leftKneeFlex, rightKneeFlex);

      const leftThighLift = calcThighElevation(lm[23], lm[25], aspectRatio);
      const rightThighLift = calcThighElevation(lm[24], lm[26], aspectRatio);
      const hipActiveSide = leftThighLift >= rightThighLift ? 'left' : 'right';
      const activeThighLift = Math.max(leftThighLift, rightThighLift);

      const rawPrimary = selectedExercise === 'crosscrunch' ? activeThighLift : kneeFlexion;
      const activeSide = selectedExercise === 'crosscrunch' ? hipActiveSide : kneeActiveSide;

      const filter = adaptiveFilterRef.current;
      let smoothedPrimaryVal: number;

      if (filter.primarySmoothed === null || !Number.isFinite(filter.primarySmoothed) || Math.abs(rawPrimary - filter.primarySmoothed) > 50) {
        filter.lastTime = nowInMs;
        filter.primaryRaw = rawPrimary;
        filter.primarySmoothed = rawPrimary;
        smoothedPrimaryVal = rawPrimary;
      } else {
        const dt = Math.max(0.005, (nowInMs - filter.lastTime) / 1000);
        filter.lastTime = nowInMs;
        const angularVelocity = Math.abs(rawPrimary - filter.primaryRaw) / dt;
        filter.primaryRaw = rawPrimary;

        const diffFromSmoothed = Math.abs(rawPrimary - filter.primarySmoothed);
        if (diffFromSmoothed < 0.7) {
          smoothedPrimaryVal = filter.primarySmoothed;
        } else {
          const minAlpha = 0.18;
          const maxAlpha = 0.82;
          const dynamicAlpha = minAlpha + (maxAlpha - minAlpha) * (angularVelocity / (angularVelocity + 45.0));
          
          const maxStep = 450 * dt;
          const clampedStep = Math.max(-maxStep, Math.min(maxStep, rawPrimary - filter.primarySmoothed));
          filter.primarySmoothed += dynamicAlpha * clampedStep;
          smoothedPrimaryVal = filter.primarySmoothed;
        }
      }

      const smoothedPrimary = Math.round(smoothedPrimaryVal);

      const drawBadgeText = (title: string, angle: number, landmark: any, color = '#14B8A6') => {
        if (!landmark) return;
        const text = `${title}: ${angle}°`;
        const x = landmark.x * canvas.width; 
        const y = landmark.y * canvas.height;
        
        ctx.save(); 
        ctx.scale(-1, 1); 
        
        const isLeftOfCenter = landmark.x < 0.5;
        const offset = isLeftOfCenter ? -55 : 55;
        const mirroredX = -(x + offset);
        
        ctx.font = 'bold 14px "Prompt", sans-serif'; 
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(mirroredX - 8, y - 18, textWidth + 16, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, mirroredX, y);
        
        ctx.restore(); 
      };

      if (selectedExercise === 'crosscrunch') {
        const activeHipLm = hipActiveSide === 'left' ? lm[23] : lm[24];
        drawBadgeText('สะโพก-เข่า', smoothedPrimary, activeHipLm, '#2DD4BF');
      } else if (selectedExercise === 'sidelunge') {
        drawBadgeText('เข่าก้าว', smoothedPrimary, kneeActiveSide === 'left' ? lm[25] : lm[26], '#0284C7');
      } else { 
        drawBadgeText('เข่า', smoothedPrimary, kneeActiveSide === 'left' ? lm[25] : lm[26], '#0D9488');
      }

      const shouldUpdateUI = (nowInMs - lastUiDispatchRef.current) >= 66;
      if (shouldUpdateUI) {
        lastUiDispatchRef.current = nowInMs;
        setCurrentAngle(smoothedPrimary);
        setSecondaryAngle(0);
        setCrossKneeAngle(0);
        setDetectedSide(activeSide);

        if (distStatus !== lastDistanceStatusRef.current) {
          lastDistanceStatusRef.current = distStatus;
          setDistanceStatus(distStatus);
          setDistanceText(distMsg);
        }
      }

      evaluatePosture(smoothedPrimary, 0, isClearlyVisible, activeSide, 0);

    } else {
      adaptiveFilterRef.current = { lastTime: 0, primaryRaw: 0, primarySmoothed: null };
      setCurrentAngle(0);
      evaluatePosture(0, 0, false, targetSideRef.current);
    }

    if (isCameraActiveRef.current) {
      animFrameRef.current = requestAnimationFrame(detectPoseLoop);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startExerciseSession = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setMode('simulation');
    setReps(0);
    setCombo(0);
    setWave(1);
    setBossHp(100);
    setElapsedSec(0);
    setCurrentAngle(0);
    setSecondaryAngle(0);
    setCrossKneeAngle(0);
    setTargetSide('left');
    setDetectedSide('left');
    setAngleSamples([]);
    setIsRunning(true);
    setManualControl(false);
    setRocketFlying(false);
    setHitEffect(false);
    setCameraError('');
    hasScoredRepRef.current = false;
    startTimeRef.current = Date.now();
    setFeedbackText(`สาธิตท่าทางและเกม ${EXERCISE_CONFIG[exerciseId].gameTitle}`);
    setFeedbackStatus('normal');
    setScreen('ar-view');
  };

  const finishWorkoutSession = (finalReps = reps) => {
    stopCamera();
    setIsRunning(false);

    if (mode === 'simulation') {
      setScreen('dashboard');
      return;
    }

    playCleanSound('complete', soundEnabled);

    const durationSec = Math.max(5, elapsedSec || Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));
    const avgAngle = angleSamples.length > 0
      ? Math.round(angleSamples.reduce((a, b) => a + b, 0) / angleSamples.length)
      : currentAngle;
    const accuracy = finalReps > 0 ? Math.min(100, Math.round(88 + Math.min(12, combo * 2))) : 0;

    const summaryItem = {
      id: Date.now(),
      exerciseId: selectedExercise,
      exerciseName: EXERCISE_CONFIG[selectedExercise].name,
      gameTitle: EXERCISE_CONFIG[selectedExercise].gameTitle,
      modeLabel: isChallengeMode ? 'โหมดท้าทาย (∞)' : `โหมดมาตรฐาน (${targetReps} ครั้ง)`,
      reps: finalReps,
      targetReps: isChallengeMode ? '∞' : targetReps,
      wave,
      avgAngle,
      accuracy,
      durationSec,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setLastSummary(summaryItem);
    setSessionHistory(prev => [summaryItem, ...prev]);
    setScreen('summary');
  };

  // ==========================================
  // 9. Survey Submit & Stats (บันทึกเข้า Google Sheets แบบลื่นไหล ไร้ Alert)
  // ==========================================
  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameToSubmit = (userData?.name || '').trim();
    if (!nameToSubmit) {
      alert('กรุณากรอกชื่อหรือรหัสผู้ทดสอบในหน้าตั้งค่าข้อมูลก่อนทำแบบประเมิน');
      return;
    }

    const isDup = surveySubmissions.some(
      s => (s.userId || '').trim().toLowerCase() === nameToSubmit.toLowerCase()
    );
    if (isDup) {
      alert(`ชื่อหรือรหัส "${nameToSubmit}" ได้ทำแบบประเมินความพึงพอใจไปแล้วในระบบ ไม่สามารถส่งซ้ำได้ (ห้ามใช้ชื่อซ้ำ)`);
      return;
    }

    setSubmitStatus('loading');

    const d1 = +((surveyScores.d1_1 + surveyScores.d1_2 + surveyScores.d1_3 + surveyScores.d1_4 + surveyScores.d1_5) / 5).toFixed(2);
    const d2 = +((surveyScores.d2_1 + surveyScores.d2_2 + surveyScores.d2_3 + surveyScores.d2_4 + surveyScores.d2_5) / 5).toFixed(2);
    const d3 = +((surveyScores.d3_1 + surveyScores.d3_2 + surveyScores.d3_3 + surveyScores.d3_4 + surveyScores.d3_5) / 5).toFixed(2);
    const total = +((d1 + d2 + d3) / 3).toFixed(2);

    const payload = {
      userId: nameToSubmit,
      bmiGroup: userData?.category || 'สมส่วน (BMI < 23.0)',
      d1,
      d2,
      d3,
      total,
      timestamp: new Date().toISOString()
    };

    try {
      const existingOffline = JSON.parse(localStorage.getItem('aerofit_offline_surveys') || '[]');
      existingOffline.push(payload);
      localStorage.setItem('aerofit_offline_surveys', JSON.stringify(existingOffline));
    } catch (storageErr) {
      console.warn('Could not cache survey to localStorage:', storageErr);
    }

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZYkjFhrESoR0bgHos96TCFT2ukU2JoKyuU7A9O35L_wKu2JLB3MGYEAtwQ52ihVHbNw/exec';

    if (GOOGLE_SCRIPT_URL.includes('YOUR_URL_HERE')) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 4000);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      clearTimeout(timeoutId);

      setSurveySubmissions(prev => [
        ...prev,
        { id: prev.length + 1, userId: payload.userId, bmiGroup: payload.bmiGroup, d1, d2, d3, total }
      ]);

      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error saving survey:", error);
      
      setSurveySubmissions(prev => [
        ...prev,
        { id: prev.length + 1, userId: payload.userId, bmiGroup: payload.bmiGroup, d1, d2, d3, total }
      ]);

      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 4000);
    }
  };

  const calcStats = (key: string) => {
    const arr = surveySubmissions.map(s => s[key]);
    if (arr.length === 0) return { mean: '0.00', sd: '0.00', level: '-' };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    const sd = Math.sqrt(variance);
    let level = 'ปานกลาง';
    if (mean >= 4.51) level = 'มากที่สุด';
    else if (mean >= 3.51) level = 'มาก';
    else if (mean >= 2.51) level = 'ปานกลาง';
    else if (mean >= 1.51) level = 'น้อย';
    else level = 'น้อยที่สุด';
    return { mean: mean.toFixed(2), sd: sd.toFixed(2), level };
  };

  // ==========================================
  // 10. AR Scene Overlay
  // ==========================================
  const renderARGameScene = (target: any, isHit: boolean) => {
    const targetMid = (target.min + target.max) / 2;
    const chargeRatio = Math.min(1, Math.max(0, currentAngle / Math.max(1, targetMid)));
    const chargePercent = Math.round(chargeRatio * 100);
    const isDemo = mode === 'simulation';

    if (selectedExercise === 'squat') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full border flex flex-col items-center justify-center transition-all duration-300 ease-out backdrop-blur-md shadow-lg ${
                isHit
                  ? 'bg-teal-500/90 text-white border-teal-400 scale-105 shadow-[0_0_30px_rgba(45,212,191,0.5)]'
                  : 'bg-slate-900/85 text-slate-200 border-white/20'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wide opacity-80 uppercase">ความลึกของท่า</span>
              <span className="text-3xl font-black font-mono mt-0.5">{chargePercent}%</span>
              <span className="text-[10px] mt-1 font-semibold opacity-75">
                เป้า: {target.min}°–{target.max}°
              </span>
            </div>
          </div>

          <div className="absolute top-0 bottom-0 right-3 sm:right-6 w-28 sm:w-32 flex flex-col items-center">
            <div className="absolute top-6 flex flex-col items-center z-20">
              <TargetUfoSprite hp={bossHp} isExploding={hitEffect} isDemo={isDemo} />
              {floatingPopup && (
                <span className="mt-2 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-full shadow-xl animate-bounce whitespace-nowrap border border-white">
                  {floatingPopup}
                </span>
              )}
            </div>

            <div
              className={`absolute w-2 rounded-full origin-bottom transition-all duration-150 ease-out z-10 ${
                rocketFlying ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
              }`}
              style={{
                background: 'linear-gradient(to top, #14B8A6, #99F6E4, #FFFFFF)',
                boxShadow: '0 0 20px 4px rgba(45,212,191,0.6)',
                bottom: `calc(${5 + chargeRatio * 15}% + 80px)`, 
                top: '12%', 
              }}
            />

            <div
              className="absolute transition-all duration-150 ease-out z-30"
              style={{
                bottom: `${5 + chargeRatio * 15}%`,
                transform: `${rocketFlying ? 'translateY(15px) scale(0.95)' : 'translateY(0) scale(1)'}`
              }}
            >
              <RocketSprite chargePercent={chargePercent} isFlying={rocketFlying} />
            </div>
          </div>
        </div>
      );
    }

    if (selectedExercise === 'sidelunge') {
      const isLeft = targetSide === 'left';
      const railPositionPercent = isLeft ? 20 + (1 - chargeRatio) * 25 : 80 - (1 - chargeRatio) * 25;

      return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/15 px-6 py-2 rounded-full text-xs font-bold text-slate-200 tracking-wide shadow-xl whitespace-nowrap z-30">
            <MoveHorizontal className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>
              {isLeft ? '🎯 เป้าหมาย: ก้าวย่อเข่าซ้าย (LEFT DOCK)' : '🎯 เป้าหมาย: ก้าวย่อเข่าขวา (RIGHT DOCK)'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 font-mono text-sky-300">
              {currentAngle}° / {target.min}°
            </span>
          </div>

          {floatingPopup && (
            <div className={`absolute top-1/4 z-30 transition-all duration-200 ${isLeft ? 'left-8 sm:left-16' : 'right-8 sm:right-16'}`}>
              <span className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl animate-bounce whitespace-nowrap border-2 border-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-current" /> {floatingPopup}
              </span>
            </div>
          )}

          <div className={`absolute left-4 sm:left-6 top-4 sm:top-6 flex flex-col items-center gap-1.5 transition-all duration-300 z-30 ${
            isLeft ? 'scale-105 opacity-100' : 'scale-90 opacity-40'
          }`}>
            <span className={`text-[10px] sm:text-xs font-black tracking-wider px-3 py-1 rounded-full shadow-md transition-colors ${
              isLeft ? 'bg-sky-500 text-white shadow-sky-500/50' : 'bg-slate-900/80 text-slate-400 border border-white/10'
            }`}>
              LEFT DOCK
            </span>
            <EnergyPodSprite active={isLeft} hit={hitEffect && isLeft} />
            <span className="text-[10px] font-bold text-slate-300">
              {isLeft ? `${chargePercent}% CHARGED` : 'STANDBY'}
            </span>
          </div>

          <div className={`absolute right-4 sm:right-6 top-4 sm:top-6 flex flex-col items-center gap-1.5 transition-all duration-300 z-30 ${
            !isLeft ? 'scale-105 opacity-100' : 'scale-90 opacity-40'
          }`}>
            <span className={`text-[10px] sm:text-xs font-black tracking-wider px-3 py-1 rounded-full shadow-md transition-colors ${
              !isLeft ? 'bg-sky-500 text-white shadow-sky-500/50' : 'bg-slate-900/80 text-slate-400 border border-white/10'
            }`}>
              RIGHT DOCK
            </span>
            <EnergyPodSprite active={!isLeft} hit={hitEffect && !isLeft} />
            <span className="text-[10px] font-bold text-slate-300">
              {!isLeft ? `${chargePercent}% CHARGED` : 'STANDBY'}
            </span>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-80 sm:w-96 flex flex-col items-center gap-2 z-30">
            <div className="relative w-full h-2.5 bg-slate-900/85 rounded-full border border-white/20 overflow-visible backdrop-blur-md">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2" />
              <div
                className="absolute -top-3.5 -translate-x-1/2 transition-all duration-150 ease-out flex flex-col items-center"
                style={{ left: `${railPositionPercent}%` }}
              >
                <div className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-black shadow-xl backdrop-blur-md transition-all ${
                  isHit && detectedSide === targetSide
                    ? 'bg-teal-500 text-white border-teal-300 scale-105 shadow-teal-500/50'
                    : 'bg-slate-900/95 text-sky-300 border-sky-400/40'
                }`}>
                  <Zap className="w-3.5 h-3.5 text-sky-400 fill-current" />
                  <span>GLIDER {currentAngle}°</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 px-1">
              <span>◀ ท่าก้าวซ้าย</span>
              <span className="text-sky-300 font-mono tracking-wider">GLIDER POSITION TRACKER</span>
              <span>ท่าก้าวขวา ▶</span>
            </div>
          </div>
        </div>
      );
    }

    const isLeftTarget = targetSide === 'left';

    return (
      <div className={`absolute inset-0 pointer-events-none z-20 overflow-hidden transition-all duration-300 ${
        isHit ? 'border-4 border-teal-400/50 bg-teal-500/10' : ''
      }`}>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md border border-white/15 px-6 py-2 rounded-full text-xs font-bold text-slate-200 tracking-wide shadow-xl whitespace-nowrap z-30">
          <Zap className={`w-4 h-4 ${isLeftTarget ? 'text-indigo-400 animate-pulse' : 'text-teal-400 animate-pulse'}`} />
          <span>
            {isLeftTarget
              ? 'เป้าหมายฝั่งซ้าย: ยกสะโพก & เข่าซ้ายเข้าสู่ช่วงเป้าหมาย'
              : 'เป้าหมายฝั่งขวา: ยกสะโพก & เข่าขวาเข้าสู่ช่วงเป้าหมาย'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 font-mono text-teal-300">
            {currentAngle}° / {target.min}°
          </span>
        </div>

        <div className="absolute inset-8 sm:inset-12 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400/40 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400/40 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400/40 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400/40 rounded-br-lg" />
        </div>

        {floatingPopup && (
          <div className={`absolute top-1/4 z-30 transition-all duration-200 ${
            isLeftTarget ? 'left-8 sm:left-20' : 'right-8 sm:right-20'
          }`}>
            <div className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl animate-bounce whitespace-nowrap border-2 border-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
              <span>{floatingPopup}</span>
            </div>
          </div>
        )}

        <div className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 transition-all duration-300 ${
          isLeftTarget ? 'scale-105 opacity-100' : 'scale-90 opacity-40'
        }`}>
          <div className="relative my-1">
            <div className={`relative transition-transform duration-300 ${isLeftTarget ? 'scale-110' : 'scale-90'}`}>
              <PrismCrystalSprite isHit={hitEffect && isLeftTarget} />
              {isLeftTarget && (
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-ping opacity-60 pointer-events-none" />
              )}
            </div>
            {isLeftTarget && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow tracking-wider uppercase whitespace-nowrap">
                TARGET
              </span>
            )}
          </div>

          <div className={`w-16 h-14 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl backdrop-blur-md border ${
            isLeftTarget
              ? 'bg-teal-600/90 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]'
              : 'bg-slate-900/60 border-white/10'
          }`}>
            <span className="text-[9px] font-mono text-teal-200 uppercase">Hip & Knee</span>
            <span className="text-xs font-black">สะโพก-เข่าซ้าย</span>
          </div>
        </div>

        <div className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 transition-all duration-300 ${
          !isLeftTarget ? 'scale-105 opacity-100' : 'scale-90 opacity-40'
        }`}>
          <div className="relative my-1">
            <div className={`relative transition-transform duration-300 ${!isLeftTarget ? 'scale-110' : 'scale-90'}`}>
              <PrismCrystalSprite isHit={hitEffect && !isLeftTarget} />
              {!isLeftTarget && (
                <div className="absolute inset-0 rounded-full border-2 border-teal-400/50 animate-ping opacity-60 pointer-events-none" />
              )}
            </div>
            {!isLeftTarget && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow tracking-wider uppercase whitespace-nowrap">
                TARGET
              </span>
            )}
          </div>

          <div className={`w-16 h-14 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl backdrop-blur-md border ${
            !isLeftTarget
              ? 'bg-teal-600/90 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]'
              : 'bg-slate-900/60 border-white/10'
          }`}>
            <span className="text-[9px] font-mono text-teal-200 uppercase">Hip & Knee</span>
            <span className="text-xs font-black">สะโพก-เข่าขวา</span>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-30">
          <div className="flex items-center justify-between w-64 sm:w-80 text-[11px] font-bold text-slate-300 px-1">
            <span className="flex items-center gap-1 text-teal-300">
              <Zap className="w-3 h-3" /> ยกสะโพก-เข่า: {currentAngle}°
            </span>
            <span className="text-indigo-300">
              เป้าหมาย: {target.min}°–{target.max}°
            </span>
          </div>
          <div className="w-64 sm:w-80 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border border-white/20 p-0.5 shadow-2xl backdrop-blur-md">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
              style={{ width: `${chargePercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTopNavbar = () => (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => {
            stopCamera();
            setIsRunning(false);
            setScreen('landing');
          }}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none">AeroFit AR</span>
              <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-bold">PSRU CS</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Augmented Reality Bodyweight Exercise Game
            </span>
          </div>
        </button>

        <nav className="flex items-center gap-2 bg-slate-100/60 p-1 rounded-xl border border-slate-200/50">
          {[
            { id: 'landing', label: 'หน้าแรก' },
            { id: 'onboarding', label: '1. ข้อมูลสรีระ' },
            { id: 'dashboard', label: '2. เลือกเกม AR' },
            { id: 'survey', label: '3. แบบประเมิน' }
          ].map(tab => {
            const isActive = screen === tab.id || (tab.id === 'dashboard' && screen === 'ar-view');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  stopCamera();
                  setIsRunning(false);
                  setScreen(tab.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  );

  const renderLandingPage = () => (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-14 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-8 sm:p-14 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" /> มหาวิทยาลัยราชภัฏพิบูลสงคราม • วิทยาการคอมพิวเตอร์ • {getTimeGreeting()}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            AeroFit <span className="text-teal-400">AR</span>
            <span className="block text-xl sm:text-3xl font-extrabold text-slate-200 mt-3 font-sans tracking-normal">
              เกมความเป็นจริงเสริมเพื่อยกระดับคุณภาพการออกกำลังกายบอดี้เวท
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-medium min-h-[48px] transition-all duration-500">
            {heroHighlights[heroHighlightIdx]}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => setScreen('onboarding')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-teal-500/25 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:scale-95 group"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>เริ่มต้นออกกำลังกาย (Start Workout)</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                setSelectedExercise('squat');
                startExerciseSession('squat');
              }}
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2.5"
            >
              <Video className="w-4 h-4 text-teal-300" />
              <span>ทดลองเล่นโหมดจำลอง (Demo)</span>
            </button>
          </div>

          {/* Highlight Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 font-bold shrink-0">33</div>
              <div className="text-xs">
                <div className="font-bold text-white">MediaPipe AI 33 จุด</div>
                <div className="text-slate-400 text-[11px] mt-0.5">ตรวจจับข้อต่อแบบเรียลไทม์</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 font-bold shrink-0">BMI</div>
              <div className="text-xs">
                <div className="font-bold text-white">BMI Adaptive ROM</div>
                <div className="text-slate-400 text-[11px] mt-0.5">ปรับเกณฑ์องศาเฉพาะบุคคล</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">AR</div>
              <div className="text-xs">
                <div className="font-bold text-white">Peripheral AR Layout</div>
                <div className="text-slate-400 text-[11px] mt-0.5">เว้นกลางจอ 100% ไม่บังตัว</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Exercise Modes Showcase */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            โหมดการออกกำลังกาย 3 ท่าทาง
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            เกมความเป็นจริงเสริมเฉพาะท่าทาง (AR Exercise Modes)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ออกแบบตามหลักชีวกลศาสตร์ (ISB Standard) ปลอดภัยต่อข้อต่อ พร้อมระบบแจกแจงคะแนนโปร่งใส
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(EXERCISE_CONFIG).map(ex => (
            <div
              key={ex.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <ExerciseIllustration type={ex.id} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                    {ex.gameTitle}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{ex.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">{ex.gameDesc}</p>
                
                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">จุดตรวจจับหลัก: </span>
                  {ex.jointLabel}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedExercise(ex.id);
                  setScreen('onboarding');
                }}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <span>เลือกฝึกท่านี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Standards & PDPA Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">มาตรฐานความปลอดภัยและการคุ้มครองข้อมูล (PDPA)</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              ภาพจากกล้องเว็บแคมจะถูกประมวลผลภายในเบราว์เซอร์ของผู้ใช้เท่านั้น ไม่มีการส่งภาพหรือบันทึกวิดีโอไปยังเซิร์ฟเวอร์ภายนอก
            </p>
          </div>
        </div>
        <button
          onClick={() => setScreen('onboarding')}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs whitespace-nowrap shadow-sm transition-all active:scale-95"
        >
          เข้าสู่ขั้นตอนคำนวณ BMI →
        </button>
      </div>
    </div>
  );

  const renderOnboardingScreen = () => {
    const w = parseFloat(weight) || 65;
    const h = (parseFloat(height) || 170) / 100;
    const previewBmi = +(w / (h * h)).toFixed(1);
    const previewCategory = previewBmi < 23.0 ? 'สมส่วน' : previewBmi <= 29.9 ? 'น้ำหนักเกิน' : 'อ้วน';
    const previewColor = previewBmi < 23.0 ? 'text-teal-600 bg-teal-50 border-teal-200' : previewBmi <= 29.9 ? 'text-sky-600 bg-sky-50 border-sky-200' : 'text-amber-600 bg-amber-50 border-amber-200';

    const parsedAge = parseInt(age, 10);
    const isAgeInvalid = age !== '' && (!parsedAge || parsedAge < 15 || parsedAge > 50);

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <button
            onClick={() => setScreen('landing')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>ย้อนกลับหน้าแรก</span>
          </button>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-sm">
            ขั้นตอนที่ 1 จาก 3 • คำนวณ BMI
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="mb-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              ตั้งค่าสรีระผู้ใช้งาน (Biomechanical Setup)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              กรอกข้อมูลเพื่อคำนวณ BMI และเกณฑ์องศาข้อต่อ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              ระบบจะนำส่วนสูงและน้ำหนักไปคำนวณดัชนีมวลกาย (BMI) เพื่อปรับช่วงองศาการเคลื่อนไหว (ROM) ที่ปลอดภัยและเหมาะสมกับร่างกายของคุณโดยอัตโนมัติ
            </p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">ชื่อหรือรหัสผู้ทดสอบ</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                  required
                />
                {surveySubmissions.some(s => (s.userId || '').trim().toLowerCase() === userName.trim().toLowerCase()) && (
                  <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ชื่อหรือรหัสนี้เคยส่งแบบประเมินความพึงพอใจแล้ว (หากต้องการทำแบบประเมินใหม่ กรุณาใช้ชื่ออื่น)
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">อายุ (ปี)</label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                    isAgeInvalid 
                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                      : 'bg-teal-50 text-teal-700 border-teal-200/60'
                  }`}>
                    จำกัด 15 – 50 ปี
                  </span>
                </div>
                <input
                  type="number"
                  min="15"
                  max="50"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="เช่น 22"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                    isAgeInvalid
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200/80 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'
                  }`}
                  required
                />
                {isAgeInvalid ? (
                  <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    อายุต้องอยู่ระหว่าง 15 ถึง 50 ปีเท่านั้น (ตามขอบเขตกลุ่มประชากรและกลุ่มตัวอย่างการวิจัย)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    กลุ่มตัวอย่างการทดลอง: บุคคลทั่วไปอายุ 15 – 50 ปี
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">น้ำหนัก (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">ส่วนสูง (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="120"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">ดัชนีมวลกายที่คำนวณได้:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">{previewBmi}</span>
                  <span className="text-xs text-slate-400 font-semibold">kg/m²</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${previewColor}`}>
                กลุ่ม: {previewCategory}
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-700">ปรับความยืดหยุ่นของมุมข้อต่อ (ROM Modifier)</span>
                <span className="text-sm font-mono font-bold text-teal-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/60">
                  {romModifier > 0 ? `+${romModifier}°` : `${romModifier}°`}
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="1"
                value={romModifier}
                onChange={(e) => setRomModifier(Number(e.target.value))}
                className="w-full accent-teal-600 mb-1"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
                <span>ย่อตื้นขึ้น (-5°)</span>
                <span>มาตรฐาน (0°)</span>
                <span>ย่อลึกขึ้น (+5°)</span>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={healthConfirmed}
                  onChange={(e) => setHealthConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-teal-600"
                />
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  ข้าพเจ้ามีสุขภาพแข็งแรง ไม่มีอาการบาดเจ็บข้อเข่าหรือหลัง และรับทราบว่าแอปพลิเคชันนี้ใช้เพื่อส่งเสริมการออกกำลังกาย ไม่ใช่เพื่อบำบัดรักษาโรค
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={pdpaAccepted}
                  onChange={(e) => setPdpaAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-teal-600"
                />
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  ยินยอมให้ประมวลผลข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) โดยภาพจากกล้องจะประมวลผลแบบเรียลไทม์บนเบราว์เซอร์เท่านั้น ไม่มีกาารบันทึกวิดีโอ
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!pdpaAccepted || !healthConfirmed || isAgeInvalid || !age}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
            >
              บันทึกข้อมูลและเข้าสู่เกม AR <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderDashboardScreen = () => {
    const totalReps = sessionHistory.reduce((acc, s) => acc + s.reps, 0);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ดัชนีมวลกายของคุณ</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">{userData.bmi}</span>
                <span className="text-sm font-semibold text-slate-400">kg/m²</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${userData.badgeStyle}`}>
                  {userData.category}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                  อายุ {userData.age} ปี
                </span>
              </div>
            </div>
            <button
              onClick={() => setScreen('onboarding')}
              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="แก้ไขข้อมูล"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Trophy className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">จำนวนครั้งสะสมทั้งหมด</span>
              <div className="text-4xl font-black text-slate-900 mt-2 tracking-tight">
                {totalReps} <span className="text-xl font-bold text-slate-400">ครั้ง</span>
              </div>
              <div className="text-xs font-medium text-slate-500 mt-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                ฝึกสะสมรอบนี้: {totalReps} ครั้ง ({sessionHistory.length} เซสชัน)
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex flex-col justify-between text-white">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">รูปแบบการเล่น (Workout Mode)</span>
            
            <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-1 rounded-xl">
              <button
                onClick={() => setIsChallengeMode(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isChallengeMode
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <InfinityIcon className="w-4 h-4" /> โหมดท้าทาย
              </button>
              <button
                onClick={() => setIsChallengeMode(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  !isChallengeMode
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-4 h-4" /> กำหนดครั้ง
              </button>
            </div>

            {!isChallengeMode ? (
              <div className="flex gap-2 mt-4">
                {[5, 10, 15].map(num => (
                  <button
                    key={num}
                    onClick={() => setTargetReps(num)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      targetReps === num
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-transparent text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {num} ครั้ง
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-[11px] font-medium text-slate-400 leading-relaxed">
                เล่นต่อเนื่องเพื่อฝึกนับจำนวนครั้งให้ได้มากที่สุด พร้อมระบบประเมินความแม่นยำของท่าทาง
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">เลือกเกมออกกำลังกาย AR (3 ท่าบอดี้เวท)</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              ทุกเกมถูกจัดวางให้ไม่บังตัวผู้เล่น และสามารถดูตัวอย่างโหมดสาธิต (Demo) ก่อนเปิดกล้องได้
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(EXERCISE_CONFIG).map(ex => {
              const target = getActiveTarget(ex.id);
              return (
                <div
                  key={ex.id}
                  className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="transform group-hover:scale-105 transition-transform duration-300 origin-top-left">
                        <ExerciseIllustration type={ex.id} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/50 px-2.5 py-1 rounded-lg">
                        {ex.gameTitle}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight">{ex.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">{ex.gameDesc}</p>

                    <div className="mt-5 bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">{ex.jointLabel}</span>
                        <span className="font-mono font-bold text-teal-600 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                          {target.min}°–{target.max}°
                        </span>
                      </div>
                      <div className="h-px bg-slate-200/60 my-2" />
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                        {target.advice}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => startExerciseSession(ex.id)}
                    className="mt-6 w-full py-3.5 px-4 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    เข้าสู่โหมดฝึก AR
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {sessionHistory.length > 0 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <BarChart3 className="w-4 h-4 text-teal-500" /> ประวัติการฝึกและสถิติจำนวนครั้ง
            </h3>
            <div className="divide-y divide-slate-100">
              {sessionHistory.slice(0, 5).map(item => (
                <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{item.exerciseName}</span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5">{item.modeLabel} • {item.timestamp}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs">
                    <span className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 text-teal-700 font-bold">สำเร็จ {item.reps} ครั้ง</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700 font-semibold">แม่นยำ {item.accuracy}%</span>
                    <span className="bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 text-sky-700 font-medium">องศาเฉลี่ย {item.avgAngle}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderARViewScreen = () => {
    const ex = EXERCISE_CONFIG[selectedExercise];
    const target = getActiveTarget();
    const isHit =
      currentAngle >= target.min &&
      currentAngle <= target.max &&
      (selectedExercise === 'squat' || detectedSide === targetSide);
    const progressPercent = Math.min(100, Math.round((currentAngle / target.max) * 100));
    const isDemo = mode === 'simulation';

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-in zoom-in-95 duration-300">
        <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
          
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  stopCamera();
                  setIsRunning(false);
                  setScreen('dashboard');
                }}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-slate-900 text-base tracking-tight">{ex.name}</h2>
                  {isDemo ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide border border-amber-200">
                      Demo Mode
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  {isDemo
                    ? 'สาธิตการทำงานและองศาข้อต่อก่อนเล่นจริง'
                    : `${isChallengeMode ? 'โหมดท้าทาย' : `เป้าหมาย ${targetReps} ครั้ง`} • เวลา ${formatTime(elapsedSec)}`}
                </p>
              </div>
            </div>

            {!isDemo && (
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                distanceStatus === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : distanceStatus === 'too-close'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{distanceText}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isDemo ? (
                <button
                  onClick={() => {
                    setMode('camera');
                    startCameraAndMediaPipe();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all"
                >
                  <Video className="w-4 h-4" /> เปิดกล้องเริ่มเล่น
                </button>
              ) : (
                <button
                  onClick={() => {
                    stopCamera();
                    setMode('simulation');
                    setIsRunning(true);
                    setReps(0);
                    setCombo(0);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-95 transition-all"
                >
                  <Square className="w-4 h-4" /> สลับสู่โหมดสาธิต
                </button>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[520px]">
            <div className="lg:col-span-2 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
              />

              {cameraError && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-amber-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {cameraError}
                </div>
              )}

              {!poseVisible && !isDemo && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-rose-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>⚠️ กรุณายืนห่างจากกล้องประมาณ 1.5 – 2 เมตร เพื่อให้เห็นร่างกายเต็มตัว</span>
                </div>
              )}

              {!isDemo && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {cameraLoading && (
                    <div className="absolute z-40 bg-slate-900/80 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-sm font-semibold flex flex-col items-center gap-3 border border-white/10 shadow-2xl">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                      กำลังเริ่มต้น AI Pose Detection & เทียบระยะกล้อง (1.5 – 2 ม.)...
                    </div>
                  )}
                  <video ref={videoRef} className="max-h-full max-w-full object-contain scale-x-[-1]" playsInline muted />
                  <canvas ref={canvasRef} className="absolute max-h-full max-w-full object-contain scale-x-[-1] pointer-events-none" />

                  {/* Visual Full-Body Calibration Bounding Box Guide */}
                  <div className="absolute inset-4 sm:inset-6 pointer-events-none flex items-center justify-center z-15">
                    <div
                      className={`relative w-48 sm:w-60 h-[84%] rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-between p-3.5 ${
                        distanceStatus === 'optimal'
                          ? 'border-teal-400/50 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                          : distanceStatus === 'too-close'
                          ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse'
                          : 'border-sky-400/70 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.25)] animate-pulse'
                      }`}
                      style={{ borderStyle: distanceStatus === 'optimal' ? 'solid' : 'dashed' }}
                    >
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border shadow-md ${
                        distanceStatus === 'optimal'
                          ? 'bg-teal-500/90 text-white border-teal-300'
                          : distanceStatus === 'too-close'
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-sky-500 text-white border-white'
                      }`}>
                        {distanceStatus === 'optimal'
                          ? '✅ ระยะ 1.5 - 2 ม. พร้อมฝึก'
                          : distanceStatus === 'too-close'
                          ? '⚠️ กรุณาถอยห่าง 1.5 - 2 ม.'
                          : '⚠️ กรุณาขยับเข้าใกล้ 1.5 - 2 ม.'}
                      </span>

                      <div className="w-full flex justify-between items-center px-2 opacity-35">
                        <div className="w-3 h-0.5 bg-white" />
                        <span className="text-[9px] font-mono tracking-widest text-white uppercase">กรอบระยะเทียบสรีระ (1.5 - 2m)</span>
                        <div className="w-3 h-0.5 bg-white" />
                      </div>

                      <div className="w-36 border-b border-white/40 pb-1 flex justify-center">
                        <span className="text-[9px] text-white/70 font-semibold tracking-wide">ระดับข้อเท้าและพื้นยืน</span>
                      </div>
                    </div>
                  </div>

                  {renderARGameScene(target, isHit)}
                </div>
              )}

              {isDemo && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {renderARGameScene(target, isHit)}

                  <svg viewBox="0 0 240 380" className="w-56 h-full relative z-10 opacity-75 drop-shadow-xl">
                    <g
                      stroke={isHit ? '#2DD4BF' : '#94A3B8'}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle
                        cx={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 95 : 145) : 120}
                        cy={selectedExercise === 'squat' ? 65 + currentAngle * 0.35 : 65}
                        r="16"
                        fill={isHit ? '#0F766E' : 'none'}
                        strokeWidth="4"
                      />
                      <line x1={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 95 : 145) : 120} y1={selectedExercise === 'squat' ? 82 + currentAngle * 0.35 : 82} x2={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 95 : 145) : 120} y2={selectedExercise === 'squat' ? 175 + currentAngle * 0.35 : 175} />
                      <line x1={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 65 : 115) : 85} y1={selectedExercise === 'squat' ? 100 + currentAngle * 0.35 : 100} x2={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 125 : 175) : 155} y2={selectedExercise === 'squat' ? 100 + currentAngle * 0.35 : 100} />
                      <line x1={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 75 : 125) : 95} y1={selectedExercise === 'squat' ? 175 + currentAngle * 0.35 : 175} x2={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 115 : 165) : 145} y2={selectedExercise === 'squat' ? 175 + currentAngle * 0.35 : 175} />
                      <line x1={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 75 : 125) : 95} y1={selectedExercise === 'squat' ? 175 + currentAngle * 0.35 : 175} x2={selectedExercise === 'sidelunge' && detectedSide === 'left' ? 50 : 75} y2={selectedExercise === 'crosscrunch' && detectedSide === 'left' ? 245 - currentAngle * 0.65 : 245} />
                      <line x1={selectedExercise === 'sidelunge' && detectedSide === 'left' ? 50 : 75} y1={selectedExercise === 'crosscrunch' && detectedSide === 'left' ? 245 - currentAngle * 0.65 : 245} x2="85" y2={selectedExercise === 'crosscrunch' && detectedSide === 'left' ? 305 - currentAngle * 0.45 : 325} />
                      <line x1={selectedExercise === 'sidelunge' ? (detectedSide === 'left' ? 115 : 165) : 145} y1={selectedExercise === 'squat' ? 175 + currentAngle * 0.35 : 175} x2={selectedExercise === 'sidelunge' && detectedSide === 'right' ? 190 : 165} y2={selectedExercise === 'crosscrunch' && detectedSide === 'right' ? 245 - currentAngle * 0.65 : 245} />
                      <line x1={selectedExercise === 'sidelunge' && detectedSide === 'right' ? 190 : 165} y1={selectedExercise === 'crosscrunch' && detectedSide === 'right' ? 245 - currentAngle * 0.65 : 245} x2="155" y2={selectedExercise === 'crosscrunch' && detectedSide === 'right' ? 305 - currentAngle * 0.45 : 325} />
                    </g>
                  </svg>
                </div>
              )}

              <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-center">
                <div
                  className={`px-5 py-3 rounded-2xl text-xs font-bold tracking-wide backdrop-blur-md border shadow-lg transition-all duration-300 transform ${
                    feedbackStatus === 'hit'
                      ? 'bg-teal-500/90 text-white border-teal-400 scale-105'
                      : feedbackStatus === 'warn'
                      ? 'bg-amber-400/90 text-slate-900 border-amber-300'
                      : 'bg-slate-900/80 text-slate-200 border-white/10'
                  }`}
                >
                  {feedbackText}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 lg:border-l border-slate-200/80 flex flex-col p-6 space-y-5">
              
              {!isDemo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">จำนวนครั้ง</span>
                      <span className="text-3xl font-black text-teal-600 tracking-tight mt-1 block">
                        {reps} <span className="text-sm font-semibold text-slate-400">{isChallengeMode ? 'ครั้ง' : `/ ${targetReps}`}</span>
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        คอมโบต่อเนื่อง <Flame className="w-3 h-3 text-amber-500" />
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block">
                        {combo > 0 ? `x${combo}` : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="font-bold text-teal-900 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-600" /> เกณฑ์การนับจำนวนครั้ง (Rep Count):
                    </div>
                    <div className="text-[11px] text-teal-800/90 space-y-1 leading-relaxed">
                      <div>• เคลื่อนไหวข้อต่อให้เข้าสู่ช่วงเป้าหมาย ({target.min}°–{target.max}°)</div>
                      <div>• ระบบ AI จะนับ 1 ครั้งเมื่อทำมุมองศาถึงเกณฑ์อย่างสมบูรณ์</div>
                      <div>• คืนตัวสู่ท่าเริ่มต้นเพื่อเตรียมเริ่มนับครั้งถัดไป</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-600">{ex.jointLabel}</span>
                  <span className={`text-3xl font-black font-mono tracking-tighter ${isHit ? 'text-teal-500' : 'text-slate-900'}`}>
                    {currentAngle}°
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-150 ease-out ${isHit ? 'bg-teal-500' : 'bg-slate-400'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>0°</span>
                  <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">เป้า: {target.min}° – {target.max}°</span>
                </div>

                {selectedExercise === 'crosscrunch' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>จุดเข่า (Knee Joint):</span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {crossKneeAngle}°
                    </span>
                  </div>
                )}
              </div>

              {isDemo && (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm flex-1">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-400" /> ทดสอบปรับองศาจำลอง
                    </span>
                    <input
                      type="checkbox"
                      checked={manualControl}
                      onChange={(e) => {
                        setManualControl(e.target.checked);
                        if (e.target.checked) setIsRunning(false);
                        else setIsRunning(true);
                      }}
                      className="w-4 h-4 rounded accent-teal-500"
                    />
                  </label>
                  
                  <div className={`space-y-4 pt-2 transition-opacity ${manualControl ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <input
                      type="range"
                      min="10"
                      max="115"
                      value={currentAngle}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const secVal = Math.round((target.secondary[0] + target.secondary[1]) / 2);
                        evaluatePosture(val, secVal, true, detectedSide, 85);
                      }}
                      className="w-full accent-teal-500"
                    />
                    {selectedExercise !== 'squat' && (
                      <button
                        onClick={() => {
                          const nextSide = detectedSide === 'left' ? 'right' : 'left';
                          setDetectedSide(nextSide);
                          evaluatePosture(currentAngle, secondaryAngle, true, nextSide, crossKneeAngle);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <MoveHorizontal className="w-4 h-4" /> สลับฝั่งเป้าหมาย ({detectedSide === 'left' ? 'ซ้าย' : 'ขวา'})
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 space-y-3">
                {isDemo && !manualControl && (
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    {isRunning ? 'หยุดสาธิตชั่วคราว' : 'เล่นสาธิตต่อ'}
                  </button>
                )}
                {!isDemo && (
                  <button
                    onClick={() => finishWorkoutSession(reps)}
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                  >
                    จบการฝึกและดูสรุปสถิติ
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderSummaryScreen = () => {
    if (!lastSummary) return null;
    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-in zoom-in-95 duration-500">
        <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4 text-teal-600 shadow-inner">
            <Award className="w-9 h-9" />
          </div>
          
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {lastSummary.modeLabel}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">{lastSummary.exerciseName}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">สรุปผลสถิติการออกกำลังกาย</p>

          <div className="grid grid-cols-2 gap-3.5 my-6">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">จำนวนครั้งที่สำเร็จ</span>
              <span className="text-3xl font-black font-mono text-teal-500 mt-1 block">{lastSummary.reps} ครั้ง</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">เป้าหมายที่ตั้งไว้</span>
              <span className="text-3xl font-black font-mono text-slate-900 mt-1 block">{lastSummary.targetReps} {lastSummary.targetReps === '∞' ? '' : 'ครั้ง'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ความแม่นยำเฉลี่ย</span>
              <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">{lastSummary.accuracy}%</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">องศาเฉลี่ย</span>
              <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">{lastSummary.avgAngle}°</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-left mb-6 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> สรุปผลการฝึกออกกำลังกาย (Session Summary):
            </div>
            <div className="text-xs text-slate-600 space-y-2 pt-1">
              <div className="flex justify-between">
                <span>ท่าทางที่ฝึก:</span>
                <span className="font-bold text-slate-900">{lastSummary.exerciseName}</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนครั้งที่ทำสำเร็จ:</span>
                <span className="font-mono font-bold text-teal-600 text-sm">{lastSummary.reps} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span>รูปแบบการฝึก:</span>
                <span className="font-semibold text-slate-800">{lastSummary.modeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>เวลาที่ใช้:</span>
                <span className="font-mono text-slate-800">{formatTime(lastSummary.durationSec)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>สถานะการฝึก:</span>
                <span className="text-teal-600 font-bold">✓ เสร็จสิ้นสมบูรณ์</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setScreen('survey')}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <ClipboardCheck className="w-5 h-5" /> ทำแบบประเมินความพึงพอใจ 3 ด้าน
            </button>
            <button
              onClick={() => setScreen('dashboard')}
              className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors"
            >
              กลับหน้าเลือกเกม AR
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSurveyScreen = () => {
    const statD1 = calcStats('d1');
    const statD2 = calcStats('d2');
    const statD3 = calcStats('d3');
    const statTotal = calcStats('total');

    const currentUserName = (userData?.name || '').trim();
    const isSurveyNameDuplicate = !!currentUserName && surveySubmissions.some(
      s => (s.userId || '').trim().toLowerCase() === currentUserName.toLowerCase()
    );

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-500">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              แบบสอบถามประเมินความพึงพอใจ 
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 font-bold">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                Cloud Sync (Google Sheets)
              </span>
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              ประเมินตามโครงร่างปัญหาพิเศษ 3 ด้านหลัก (กลุ่มตัวอย่าง N = {surveySubmissions.length})
            </p>
          </div>

          {/* แสดงชื่อผู้ทำแบบประเมิน (read-only จากหน้า Profile) */}
          <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl border ${isSurveyNameDuplicate ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
            <User className={`w-5 h-5 shrink-0 ${isSurveyNameDuplicate ? 'text-rose-500' : 'text-teal-600'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ผู้ทำแบบประเมิน (จากหน้าตั้งค่า)</p>
              <p className={`text-sm font-bold truncate ${isSurveyNameDuplicate ? 'text-rose-700' : 'text-slate-900'}`}>
                {currentUserName || 'ไม่ระบุชื่อ'}
              </p>
            </div>
            {isSurveyNameDuplicate ? (
              <span className="text-[11px] bg-rose-100 text-rose-700 border border-rose-300 px-2.5 py-1 rounded-full font-bold shrink-0 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> ชื่อซ้ำในระบบ
              </span>
            ) : (
              <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-bold shrink-0">
                ✓ พร้อมส่ง
              </span>
            )}
          </div>

          {isSurveyNameDuplicate && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                ชื่อ "{currentUserName}" ได้ทำแบบประเมินไปแล้วในระบบ ไม่สามารถส่งซ้ำได้
                <p className="font-normal text-rose-600 mt-0.5">หากต้องการส่งในนามของท่านอื่น กรุณากลับไปเปลี่ยนชื่อที่หน้าตั้งค่าข้อมูล (ปุ่ม "แก้ไขข้อมูล" ด้านบน)</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="py-4 px-6 font-bold tracking-wide">ด้านที่ประเมิน (ตามระเบียบวิธีวิจัย)</th>
                  <th className="py-4 px-6 text-center font-bold tracking-wide">Mean (ค่าเฉลี่ย)</th>
                  <th className="py-4 px-6 text-center font-bold tracking-wide">S.D.</th>
                  <th className="py-4 px-6 text-center font-bold tracking-wide">ระดับความพึงพอใจ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold">1. ด้านการออกแบบและความสะดวกในการใช้งาน (UI/UX Design)</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-teal-600">{statD1.mean}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-400">{statD1.sd}</td>
                  <td className="py-4 px-6 text-center font-semibold">{statD1.level}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold">2. ด้านประสิทธิภาพการตรวจจับและการประมวลผล (MediaPipe Tracking)</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-teal-600">{statD2.mean}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-400">{statD2.sd}</td>
                  <td className="py-4 px-6 text-center font-semibold">{statD2.level}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold">3. ด้านกลไกเกมและความจูงใจในการออกกำลังกาย (Gamification)</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-teal-600">{statD3.mean}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-400">{statD3.sd}</td>
                  <td className="py-4 px-6 text-center font-semibold">{statD3.level}</td>
                </tr>
                <tr className="bg-teal-50/50 font-bold text-slate-900 border-t-2 border-teal-100">
                  <td className="py-4 px-6">สรุปภาพรวมทุกด้าน (เกณฑ์วิจัย ≥ 3.51 ระดับ "มาก")</td>
                  <td className="py-4 px-6 text-center font-mono text-teal-700 text-base">{statTotal.mean}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-500">{statTotal.sd}</td>
                  <td className="py-4 px-6 text-center text-teal-700 font-bold">{statTotal.level}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleSurveySubmit} className="space-y-5">
          {SURVEY_QUESTIONS.map((group, gIdx) => (
            <div key={gIdx} className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h4 className="font-extrabold text-base text-slate-900 mb-5">{group.dimension}</h4>
              <div className="space-y-6">
                {group.items.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-600 flex-1 leading-relaxed">{item.text}</span>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setSurveyScores(prev => ({ ...prev, [item.id]: val }))}
                          className={`w-12 h-12 sm:w-10 sm:h-10 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 ${
                            surveyScores[item.id] === val
                              ? 'bg-teal-500 text-white shadow-md'
                              : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={
              isSurveyNameDuplicate ||
              !currentUserName ||
              submitStatus === 'loading' ||
              submitStatus === 'success'
            }
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.99] mt-4 flex items-center justify-center gap-2 ${
              isSurveyNameDuplicate
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : submitStatus === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-500/40' 
                : submitStatus === 'error'
                ? 'bg-rose-500 text-white'
                : submitStatus === 'loading'
                ? 'bg-slate-400 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isSurveyNameDuplicate && (
              <>
                <AlertCircle className="w-5 h-5 text-rose-500" />
                ชื่อหรือรหัสนี้ทำแบบประเมินแล้ว (ไม่สามารถใช้ชื่อซ้ำได้)
              </>
            )}
            {!isSurveyNameDuplicate && submitStatus === 'loading' && <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังซิงค์ข้อมูลไปที่ Google Sheets...</>}
            {!isSurveyNameDuplicate && submitStatus === 'success' && <><CheckCircle2 className="w-5 h-5" /> บันทึกผลสำเร็จ ขอบคุณที่ช่วยทดสอบนะงับ</>}
            {!isSurveyNameDuplicate && submitStatus === 'error' && <><AlertCircle className="w-5 h-5" /> เกิดข้อผิดพลาดทางเครือข่าย (ระบบบันทึกออฟไลน์แล้ว)</>}
            {!isSurveyNameDuplicate && submitStatus === 'idle' && 'ส่งผลประเมินไปยัง Google Sheets (+1 ผู้เข้าร่วม)'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-200 selection:text-teal-900">
      {renderTopNavbar()}
      <main>
        {screen === 'landing' && renderLandingPage()}
        {screen === 'onboarding' && renderOnboardingScreen()}
        {screen === 'dashboard' && renderDashboardScreen()}
        {screen === 'ar-view' && renderARViewScreen()}
        {screen === 'summary' && renderSummaryScreen()}
        {screen === 'survey' && renderSurveyScreen()}
      </main>
    </div>
  );
}