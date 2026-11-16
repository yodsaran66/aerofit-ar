// ==========================================
// Sound Effects using Web Audio API Synthesizer
// No external audio files needed!
// ==========================================

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Beep for countdown
  public playBeep(frequency = 440, duration = 0.15) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Continuous / Rising charging tone according to depth angle percentage
  private chargingOsc: OscillatorNode | null = null;
  private chargingGain: GainNode | null = null;
  private lastChargeTime = 0;

  public updateChargingTone(ratio: number, active: boolean) {
    if (this.muted) {
      this.stopChargingTone();
      return;
    }
    if (!active || ratio < 0.15) {
      this.stopChargingTone();
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (!this.chargingOsc) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);

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
      // Frequency ramps up smoothly from 240Hz to 680Hz
      const targetFreq = 240 + Math.min(1, Math.max(0, ratio)) * 440;
      this.chargingOsc.frequency.setTargetAtTime(targetFreq, now, 0.04);
      // Volume scales gently with depth
      const targetGain = 0.04 + Math.min(1, Math.max(0, ratio)) * 0.08;
      this.chargingGain.gain.setTargetAtTime(targetGain, now, 0.04);
      this.lastChargeTime = Date.now();
    }
  }

  public stopChargingTone() {
    if (this.chargingOsc && this.chargingGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.chargingGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
        const oldOsc = this.chargingOsc;
        setTimeout(() => {
          try {
            oldOsc.stop();
            oldOsc.disconnect();
          } catch {}
        }, 90);
      } catch {}
      this.chargingOsc = null;
      this.chargingGain = null;
    }
  }

  // Success / Score Chime: Bright, cheerful harmonic arpeggio (C5 -> E5 -> G5 -> C6)
  public playSuccessChime() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  // Space Warp Gate sound: Swept sci-fi resonance whoosh with shimmer
  public playWarpGateSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.28);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // Laser sparkle
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1200, now + 0.08);
    ping.frequency.exponentialRampToValueAtTime(1800, now + 0.22);
    pingGain.gain.setValueAtTime(0.15, now + 0.08);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    ping.connect(pingGain);
    pingGain.connect(this.ctx.destination);
    ping.start(now + 0.08);
    ping.stop(now + 0.3);
  }

  // Meteor Smash sound: Crunchy impact explosion with low-end punch
  public playMeteorShatterSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopChargingTone();

    const now = this.ctx.currentTime;

    // Low-end impact punch
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(260, now);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.25);

    // High shatter crack
    const shatterOsc = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatterOsc.type = 'sawtooth';
    shatterOsc.frequency.setValueAtTime(950, now);
    shatterOsc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    shatterGain.gain.setValueAtTime(0.25, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    shatterOsc.connect(shatterGain);
    shatterGain.connect(this.ctx.destination);
    shatterOsc.start(now);
    shatterOsc.stop(now + 0.22);
  }

  // Distance / Frame warning tone: Soft, pleasant informational chime
  private lastWarningPlay = 0;
  public playDistanceWarningSound() {
    if (this.muted) return;
    const currentTimeMs = Date.now();
    // Rate limit to once every 2.5 seconds to remain pleasant and gentle
    if (currentTimeMs - this.lastWarningPlay < 2500) return;
    this.lastWarningPlay = currentTimeMs;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(349.23, now); // F4
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(293.66, now + 0.12); // D4
    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.38);
  }

  // Rep count completed sound (pleasant ding)
  public playRepSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.35);
  }

  // Collect coin / star sound
  public playCoinSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  }

  // Slash / Cross Strike Sound (satisfying energetic whoosh + hit)
  public playSlashSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Swept oscillator for the whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    // High shimmer hit
    const hitOsc = this.ctx.createOscillator();
    const hitGain = this.ctx.createGain();
    hitOsc.type = 'sine';
    hitOsc.frequency.setValueAtTime(1200, now + 0.05);
    hitOsc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

    hitGain.gain.setValueAtTime(0.25, now + 0.05);
    hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    hitOsc.connect(hitGain);
    hitGain.connect(this.ctx.destination);
    hitOsc.start(now + 0.05);
    hitOsc.stop(now + 0.3);
  }

  // Combo celebration sound
  public playComboSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    });
  }

  // Game over sound
  public playFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq) => {
      const now = this.ctx!.currentTime;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    });
  }
}

export const soundManager = new SoundManager();
