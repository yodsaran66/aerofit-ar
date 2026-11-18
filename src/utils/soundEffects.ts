// ==========================================
// Sound Effects using Web Audio API Synthesizer
// Clean, aesthetic, arcade-feel sci-fi sound effects
// Soft harmonics, warm sub-bass, no harsh/abrasive buzzers
// ==========================================

export type ExerciseType = 'squat' | 'sidelunge' | 'crosscrunch' | string;

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopChargingTone();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // -------------------------------------------------------------
  // Dynamic Charging Sounds (Customized & Pleasant per Exercise)
  // -------------------------------------------------------------
  private chargingOsc: OscillatorNode | null = null;
  private chargingOsc2: OscillatorNode | null = null;
  private chargingGain: GainNode | null = null;
  private currentExercise: string | null = null;

  public updateChargingTone(ratio: number, active: boolean, exercise: ExerciseType = 'squat') {
    if (this.muted) {
      this.stopChargingTone();
      return;
    }
    if (!active || ratio < 0.12) {
      this.stopChargingTone();
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const clampedRatio = Math.min(1, Math.max(0, ratio));

    // If exercise changed, restart oscillator for clean sound profile
    if (this.currentExercise !== exercise) {
      this.stopChargingTone();
      this.currentExercise = exercise;
    }

    if (!this.chargingOsc) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (exercise === 'squat') {
          // Rocket: Warm low-frequency engine hum (triangle + sub sine)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(90, now);

          const sub = this.ctx.createOscillator();
          sub.type = 'sine';
          sub.frequency.setValueAtTime(45, now);
          sub.connect(gain);
          sub.start(now);
          this.chargingOsc2 = sub;

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.08);
        } else if (exercise === 'sidelunge') {
          // Energy Pad: Silky harmonic chime
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, now);

          const osc2 = this.ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(390, now); // perfect fifth above
          osc2.connect(gain);
          osc2.start(now);
          this.chargingOsc2 = osc2;

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.03, now + 0.06);
        } else {
          // Cross Crunch: Smooth resonant flute-like sine
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.028, now + 0.06);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);

        this.chargingOsc = osc;
        this.chargingGain = gain;
      } catch {
        return;
      }
    }

    if (this.chargingOsc && this.chargingGain) {
      if (exercise === 'squat') {
        // Rocket: 90Hz -> 240Hz (gentle warm engine spool, never shrieking)
        const targetFreq = 90 + clampedRatio * 150;
        this.chargingOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        if (this.chargingOsc2) {
          this.chargingOsc2.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.05);
        }
        const targetGain = 0.02 + clampedRatio * 0.03;
        this.chargingGain.gain.setTargetAtTime(targetGain, now, 0.05);
      } else if (exercise === 'sidelunge') {
        // Energy Pad: 260Hz -> 440Hz (smooth pad resonance)
        const targetFreq = 260 + clampedRatio * 180;
        this.chargingOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        if (this.chargingOsc2) {
          this.chargingOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.05);
        }
        const targetGain = 0.02 + clampedRatio * 0.025;
        this.chargingGain.gain.setTargetAtTime(targetGain, now, 0.05);
      } else {
        // Cross Crunch: 320Hz -> 580Hz (soft ascending chime)
        const targetFreq = 320 + clampedRatio * 260;
        this.chargingOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        const targetGain = 0.018 + clampedRatio * 0.025;
        this.chargingGain.gain.setTargetAtTime(targetGain, now, 0.05);
      }
    }
  }

  public stopChargingTone() {
    if (this.chargingGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.chargingGain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
        const oldOsc = this.chargingOsc;
        const oldOsc2 = this.chargingOsc2;
        setTimeout(() => {
          try {
            oldOsc?.stop();
            oldOsc?.disconnect();
            oldOsc2?.stop();
            oldOsc2?.disconnect();
          } catch {}
        }, 80);
      } catch {}
      this.chargingOsc = null;
      this.chargingOsc2 = null;
      this.chargingGain = null;
      this.currentExercise = null;
    }
  }

  // -------------------------------------------------------------
  // Game 1: SQUAT — Rocket Strike (Punchy launch + Victory Star Chime)
  // -------------------------------------------------------------
  public playRocketLaunchSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const now = this.ctx.currentTime;

    // 1. Warm sub punch / kick (pop feel)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.22);

    // 2. Whoosh upward swoosh
    const swooshOsc = this.ctx.createOscillator();
    const swooshGain = this.ctx.createGain();
    swooshOsc.type = 'triangle';
    swooshOsc.frequency.setValueAtTime(220, now + 0.02);
    swooshOsc.frequency.exponentialRampToValueAtTime(750, now + 0.2);
    swooshGain.gain.setValueAtTime(0.12, now + 0.02);
    swooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    swooshOsc.connect(swooshGain);
    swooshGain.connect(this.ctx.destination);
    swooshOsc.start(now + 0.02);
    swooshOsc.stop(now + 0.25);

    // 3. Crisp triumphant bell arpeggio (D5 -> F#5 -> A5 -> D6)
    const bellNotes = [587.33, 739.99, 880.0, 1174.66];
    bellNotes.forEach((freq, idx) => {
      const bellTime = now + 0.12 + idx * 0.045;
      const bOsc = this.ctx!.createOscillator();
      const bGain = this.ctx!.createGain();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(freq, bellTime);
      bGain.gain.setValueAtTime(0.14, bellTime);
      bGain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 0.28);
      bOsc.connect(bGain);
      bGain.connect(this.ctx!.destination);
      bOsc.start(bellTime);
      bOsc.stop(bellTime + 0.28);
    });
  }

  // -------------------------------------------------------------
  // Game 2: SIDE LUNGE — Energy Dock / Pad Reflector (Silky Futuristic Warp)
  // -------------------------------------------------------------
  public playEnergyDockSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const now = this.ctx.currentTime;

    // 1. Resonant harmonic sweep (smooth warm pulse)
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(261.63, now); // C4
    sweepOsc.frequency.exponentialRampToValueAtTime(523.25, now + 0.12); // C5
    sweepGain.gain.setValueAtTime(0.16, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.32);

    // 2. Crystal chord dock (Eb5 + Bb5 + G6) shimmer
    const chord = [622.25, 932.33, 1567.98];
    chord.forEach((freq) => {
      const cOsc = this.ctx!.createOscillator();
      const cGain = this.ctx!.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(freq, now + 0.05);
      cGain.gain.setValueAtTime(0.08, now + 0.05);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      cOsc.connect(cGain);
      cGain.connect(this.ctx!.destination);
      cOsc.start(now + 0.05);
      cOsc.stop(now + 0.35);
    });
  }

  // -------------------------------------------------------------
  // Game 3: STANDING CROSS CRUNCH — Crystal / Prism Shatter (Crisp tactile pop)
  // -------------------------------------------------------------
  public playCrystalSmashSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const now = this.ctx.currentTime;

    // 1. Soft bass tap (satisfying thud)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(160, now);
    thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
    thudGain.gain.setValueAtTime(0.2, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.16);

    // 2. Crisp bubble glass pop (triangle high ping, not harsh sawtooth)
    const glassNotes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    glassNotes.forEach((freq, idx) => {
      const gTime = now + idx * 0.025;
      const gOsc = this.ctx!.createOscillator();
      const gGain = this.ctx!.createGain();
      gOsc.type = 'triangle';
      gOsc.frequency.setValueAtTime(freq, gTime);
      gGain.gain.setValueAtTime(0.12, gTime);
      gGain.gain.exponentialRampToValueAtTime(0.0001, gTime + 0.18);
      gOsc.connect(gGain);
      gGain.connect(this.ctx!.destination);
      gOsc.start(gTime);
      gOsc.stop(gTime + 0.18);
    });
  }

  // -------------------------------------------------------------
  // Rep / Coin / Combo sounds
  // -------------------------------------------------------------
  public playRepSound() {
    this.playRocketLaunchSound();
  }

  public playCoinSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playComboSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  // -------------------------------------------------------------
  // Backward compatibility aliases
  // -------------------------------------------------------------
  public playSuccessHit() {
    this.playRocketLaunchSound();
  }

  public playSuccessChime() {
    this.playRocketLaunchSound();
  }

  public playWarpGateSound() {
    this.playEnergyDockSound();
  }

  public playMeteorShatterSound() {
    this.playCrystalSmashSound();
  }

  public playSlashSound() {
    this.playCrystalSmashSound();
  }

  public playSwitchTarget() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playChargeTick(progress: number) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const freq = 280 + Math.min(1, Math.max(0, progress)) * 400;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Beep for countdown (soft marimba click)
  public playBeep(frequency = 523.25, duration = 0.12) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Distance / Frame warning tone: Gentle two-tone marimba chime
  private lastWarningPlay = 0;
  public playDistanceWarningSound() {
    if (this.muted) return;
    const currentTimeMs = Date.now();
    if (currentTimeMs - this.lastWarningPlay < 3000) return;
    this.lastWarningPlay = currentTimeMs;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(392.0, now); // G4
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(329.63, now + 0.1); // E4
    gain2.gain.setValueAtTime(0.06, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.32);
  }

  // Workout finished fanfare (gentle celebratory pentatonic chords)
  public playFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    });
  }
}

export const soundManager = new SoundManager();
