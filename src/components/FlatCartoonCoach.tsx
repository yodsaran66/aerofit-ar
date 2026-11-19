import React, { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export type ExerciseType = "squat" | "side-lunge" | "cross-crunch";

interface FlatCartoonCoachProps {
  exerciseType?: ExerciseType;
  progress?: number;
  showControls?: boolean;
  width?: number;
}

type Pt = [number, number];

const VB_W = 300;
const VB_H = 380;
const GROUND = 360;
const THIGH = 86;
const SHIN = 80;
const UPPER = 72;
const FORE = 62;
const HIP_OFFSET = 18;
const SHOULDER_L: Pt = [-38, -100];
const SHOULDER_R: Pt = [38, -100];
const CYCLE_MS = 2600;

const INK = "#1E2A4A";
const WHITE = "#FFFFFF";
const ORANGE = "#FF7A1A";
const BLUE = "#2F80ED";
const SKIN = "#F7C9A0";
const HAIR = "#2B2D42";

interface Pose {
  px: number;
  py: number;
  torso: number;
  lfx: number;
  lfy: number;
  rfx: number;
  rfy: number;
  lhx: number;
  lhy: number;
  rhx: number;
  rhy: number;
}

interface Keyframe {
  t: number;
  p: Pose;
}

const STAND: Pose = {
  px: 150, py: 200, torso: 0,
  lfx: 126, lfy: GROUND, rfx: 174, rfy: GROUND,
  lhx: -50, lhy: 10, rhx: 50, rhy: 10,
};

const STAND_HEAD: Pose = { ...STAND, lhx: -28, lhy: -165, rhx: 28, rhy: -165 };

const SQUAT: Pose = {
  ...STAND,
  py: 268,
  lfx: 120, rfx: 180,
  lhx: -120, lhy: -100, rhx: 120, rhy: -100,
};

const LUNGE_R: Pose = {
  ...STAND,
  px: 180, py: 262, torso: -8,
  lfx: 40, lfy: GROUND, rfx: 196, rfy: GROUND,
  lhx: -120, lhy: -70, rhx: 120, rhy: -70,
};

const LUNGE_L: Pose = {
  ...STAND,
  px: 120, py: 262, torso: 8,
  lfx: 104, lfy: GROUND, rfx: 260, rfy: GROUND,
  lhx: -120, lhy: -70, rhx: 120, rhy: -70,
};

const CRUNCH_R: Pose = {
  ...STAND_HEAD,
  torso: 12,
  lfx: 126, lfy: GROUND, rfx: 186, rfy: 290,
  lhx: 30, lhy: 40, rhx: 28, rhy: -165,
};

const CRUNCH_L: Pose = {
  ...STAND_HEAD,
  torso: -12,
  lfx: 114, lfy: 290, rfx: 174, rfy: GROUND,
  lhx: -28, lhy: -165, rhx: -30, rhy: 40,
};

const KEYFRAMES: Record<ExerciseType, Keyframe[]> = {
  squat: [
    { t: 0, p: STAND },
    { t: 0.5, p: SQUAT },
    { t: 1, p: STAND },
  ],
  "side-lunge": [
    { t: 0, p: STAND },
    { t: 0.25, p: LUNGE_R },
    { t: 0.5, p: STAND },
    { t: 0.75, p: LUNGE_L },
    { t: 1, p: STAND },
  ],
  "cross-crunch": [
    { t: 0, p: STAND_HEAD },
    { t: 0.25, p: CRUNCH_R },
    { t: 0.5, p: STAND_HEAD },
    { t: 0.75, p: CRUNCH_L },
    { t: 1, p: STAND_HEAD },
  ],
};

const EXERCISES: { id: ExerciseType; label: string }[] = [
  { id: "squat", label: "สควอท" },
  { id: "side-lunge", label: "ก้าวข้างย่อเข่า" },
  { id: "cross-crunch", label: "ครันช์สลับข้าง" },
];

const smooth = (k: number) => k * k * (3 - 2 * k);
const toDeg = (r: number) => (r * 180) / Math.PI;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function samplePose(keys: Keyframe[], t: number): Pose {
  const x = ((t % 1) + 1) % 1;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (x >= a.t && x <= b.t) {
      const k = smooth((x - a.t) / (b.t - a.t));
      const out = { ...a.p } as Record<keyof Pose, number>;
      (Object.keys(a.p) as (keyof Pose)[]).forEach((f) => {
        out[f] = a.p[f] + (b.p[f] - a.p[f]) * k;
      });
      return out as Pose;
    }
  }
  return keys[keys.length - 1].p;
}

interface Solved {
  knee: Pt;
  a1: number;
  a2: number;
}

function solveTwoBone(origin: Pt, target: Pt, l1: number, l2: number, outSign: number): Solved {
  const dx = target[0] - origin[0];
  const dy = target[1] - origin[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), 1), l1 + l2 - 0.5);
  const base = Math.atan2(dx, dy);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosA)));

  const candidates = [base + alpha, base - alpha].map((a) => ({
    a,
    knee: [origin[0] + l1 * Math.sin(a), origin[1] + l1 * Math.cos(a)] as Pt,
  }));
  const best = candidates.reduce((p, c) =>
    outSign * (c.knee[0] - origin[0]) > outSign * (p.knee[0] - origin[0]) ? c : p,
  );
  const a2 = Math.atan2(target[0] - best.knee[0], target[1] - best.knee[1]);
  return { knee: best.knee, a1: best.a, a2 };
}

function Bone({ len, width, color }: { len: number; width: number; color: string }) {
  return (
    <>
      <line x1={0} y1={0} x2={0} y2={len} stroke={INK} strokeWidth={width + 6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={len} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  );
}

interface LimbProps {
  origin: Pt;
  sol: Solved;
  l1: number;
  l2: number;
  width: number;
  color: string;
  end: React.ReactNode;
}

function Limb({ origin, sol, l1, l2, width, color, end }: LimbProps) {
  return (
    <g transform={`translate(${origin[0]} ${origin[1]}) rotate(${toDeg(-sol.a1)})`}>
      <Bone color={color} len={l1} width={width} />
      <g transform={`translate(0 ${l1}) rotate(${toDeg(sol.a1 - sol.a2)})`}>
        <Bone color={color} len={l2} width={width * 0.85} />
        <g transform={`translate(0 ${l2})`}>{end}</g>
      </g>
    </g>
  );
}

function FigureSvg({ exercise, t, width = VB_W }: { exercise: ExerciseType; t: number; width?: number }) {
  const p = samplePose(KEYFRAMES[exercise], t);

  const legL = solveTwoBone([p.px - HIP_OFFSET, p.py], [p.lfx, p.lfy], THIGH, SHIN, -1);
  const legR = solveTwoBone([p.px + HIP_OFFSET, p.py], [p.rfx, p.rfy], THIGH, SHIN, 1);
  const armL = solveTwoBone(SHOULDER_L, [p.lhx, p.lhy], UPPER, FORE, -1);
  const armR = solveTwoBone(SHOULDER_R, [p.rhx, p.rhy], UPPER, FORE, 1);

  const height = Math.round((width * VB_H) / VB_W);

  const shoe = (
    <ellipse cx={0} cy={4} rx={16} ry={9} fill={ORANGE} stroke={INK} strokeWidth={3} />
  );
  const hand = <circle cx={0} cy={0} r={9} fill={SKIN} stroke={INK} strokeWidth={3} />;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={height}
    >
      <ellipse cx={150} cy={GROUND + 6} rx={72} ry={8} fill={INK} opacity={0.12} />
      <rect
        x={p.px - 30}
        y={p.py - 12}
        width={60}
        height={26}
        rx={12}
        fill={WHITE}
        stroke={INK}
        strokeWidth={3}
      />
      <Limb origin={[p.px - HIP_OFFSET, p.py]} sol={legL} l1={THIGH} l2={SHIN} width={20} color={WHITE} end={shoe} />
      <Limb origin={[p.px + HIP_OFFSET, p.py]} sol={legR} l1={THIGH} l2={SHIN} width={20} color={WHITE} end={shoe} />

      <g transform={`translate(${p.px} ${p.py}) rotate(${p.torso})`}>
        <rect x={-36} y={-112} width={72} height={126} rx={24} fill={WHITE} stroke={INK} strokeWidth={3} />
        <rect x={-36} y={-50} width={72} height={9} fill={ORANGE} />
        <rect x={-36} y={-36} width={72} height={9} fill={BLUE} />
        <Limb origin={SHOULDER_L} sol={armL} l1={UPPER} l2={FORE} width={16} color={WHITE} end={hand} />
        <Limb origin={SHOULDER_R} sol={armR} l1={UPPER} l2={FORE} width={16} color={WHITE} end={hand} />
        <rect x={-9} y={-124} width={18} height={18} fill={SKIN} />
        <circle cx={0} cy={-152} r={30} fill={SKIN} stroke={INK} strokeWidth={3} />
        <path
          d="M -30 -155 Q -28 -186 0 -184 Q 30 -186 30 -155 Q 18 -170 0 -170 Q -18 -170 -30 -155 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle cx={-10} cy={-150} r={3} fill={INK} />
        <circle cx={10} cy={-150} r={3} fill={INK} />
        <path
          d="M -9 -138 Q 0 -130 9 -138"
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

const REC_FPS = 30;
const REC_CYCLES = 2;
const REC_SCALE = 2;

function pickWebmMime(): string {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const supported = candidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!supported) throw new Error("เบราว์เซอร์นี้ไม่รองรับการบันทึก WebM");
  return supported;
}

async function recordWebm(exercise: ExerciseType, outWidth: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = Math.round((outWidth * VB_H) / VB_W);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ไม่สามารถสร้าง Canvas ได้");

  const stream = canvas.captureStream(REC_FPS);
  const recorder = new MediaRecorder(stream, { mimeType: pickWebmMime() });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  recorder.start();
  const frames = Math.round(((CYCLE_MS * REC_CYCLES) / 1000) * REC_FPS);

  for (let i = 0; i < frames; i++) {
    const t = ((i / frames) * REC_CYCLES) % 1;
    const markup = renderToStaticMarkup(
      <FigureSvg exercise={exercise} t={t} width={canvas.width} />,
    );
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("แปลง SVG เป็นภาพไม่สำเร็จ"));
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    await new Promise((r) => setTimeout(r, 1000 / REC_FPS));
  }

  recorder.stop();
  return finished;
}

export default function FlatCartoonCoach({
  exerciseType = "squat",
  progress,
  showControls = true,
  width = VB_W,
}: FlatCartoonCoachProps) {
  const [exercise, setExercise] = useState<ExerciseType>(exerciseType);
  const [playing, setPlaying] = useState(true);
  const [autoT, setAutoT] = useState(0);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setExercise(exerciseType);
  }, [exerciseType]);

  useEffect(() => {
    if (!playing || progress !== undefined) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setAutoT(((now - start) % CYCLE_MS) / CYCLE_MS);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, progress, exercise]);

  const t = progress !== undefined ? clamp01(progress) : autoT;

  const handleRecord = async () => {
    if (recording) return;
    setRecording(true);
    setStatus("กำลังบันทึก...");
    try {
      const blob = await recordWebm(exercise, width * REC_SCALE);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exercise}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("บันทึกเสร็จแล้ว");
    } catch (err) {
      setStatus("บันทึกไม่สำเร็จ: " + String(err));
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <FigureSvg exercise={exercise} t={t} width={width} />

      {showControls && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXERCISES.map((e) => (
            <button
              key={e.id}
              onClick={() => setExercise(e.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                exercise === e.id
                  ? "bg-orange-500 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {e.label}
            </button>
          ))}

          <button
            onClick={() => setPlaying((v) => !v)}
            disabled={progress !== undefined}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            {playing ? "หยุด" : "เล่น"}
          </button>

          <button
            onClick={handleRecord}
            disabled={recording}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {recording ? "กำลังบันทึก..." : "บันทึก .webm"}
          </button>
        </div>
      )}

      {status && <p className="text-xs text-slate-500">{status}</p>}
    </div>
  );
}
