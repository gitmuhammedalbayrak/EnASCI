/**
 * EnASCI - 8-Bit Chiptune Audio Synthesizer
 * Zero external audio files. Generates retro music and sound effects
 * directly via the browser's native Web Audio API.
 */

export class RetroAudio {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentStep = 0;
        this.timerId = null;
        this.tempo = 128; // BPM
        this.masterVolume = 0.22;

        // 8-bit adventure chiptune note pattern
        // Melody notes (frequencies in Hz)
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.00;
        const C3 = 130.81, G3 = 196.00, A3 = 220.00, F3 = 174.61;

        this.melody = [
            E4, G4, A4, B4, C5, B4, A4, G4,
            E4, D4, E4, G4, A4, 0,  G4, E4,
            F4, A4, C5, D5, E5, D5, C5, A4,
            G4, B4, D5, B4, G4, E4, D4, 0
        ];

        this.bassLine = [
            C3, C3, G3, G3, A3, A3, F3, F3,
            C3, C3, G3, G3, A3, A3, E3 || 164.81, E3 || 164.81,
            F3, F3, A3, A3, D4, D4, F3, F3,
            G3, G3, B4 * 0.5, B4 * 0.5, G3, G3, C3, C3
        ];
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startMusic() {
        if (this.isPlaying) return;
        this.initContext();
        this.isPlaying = true;

        const stepDuration = (60 / this.tempo) * 0.5 * 1000; // 16th note timing
        this.timerId = setInterval(() => {
            if (!this.isMuted) {
                this.tick();
            }
        }, stepDuration);
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.isPlaying && !this.isMuted) {
            this.startMusic();
        }
        return this.isMuted;
    }

    tick() {
        if (!this.ctx) return;
        const step = this.currentStep % this.melody.length;
        const now = this.ctx.currentTime;

        // 1. Lead Melody (Square Wave)
        const note = this.melody[step];
        if (note > 0) {
            this.playTone(note, 'square', 0.15, 0.18, now);
        }

        // 2. Bass Line (Triangle Wave)
        const bass = this.bassLine[step];
        if (bass > 0) {
            this.playTone(bass, 'triangle', 0.22, 0.22, now);
        }

        // 3. 8-Bit Noise Drum (Every other beat)
        if (step % 2 === 0) {
            this.playHiHat(now);
        }
        if (step % 4 === 2) {
            this.playSnare(now);
        }

        this.currentStep++;
    }

    playTone(freq, type, duration, vol, time) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(vol * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
    }

    playHiHat(time) {
        if (!this.ctx || this.isMuted) return;
        // High frequency chirp as hi-hat
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.04);

        gain.gain.setValueAtTime(0.06 * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    playSnare(time) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, time);
        osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);

        gain.gain.setValueAtTime(0.12 * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
    }

    // Sound FX: Dialogue typewriter beep
    playDialogueBlip(pitch = 480) {
        if (!this.ctx || this.isMuted) return;
        this.initContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const randomizedPitch = pitch + (Math.random() * 40 - 20);
        osc.frequency.setValueAtTime(randomizedPitch, now);

        gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Sound FX: Menu select / move
    playMenuBeep(confirm = false) {
        if (!this.ctx || this.isMuted) return;
        this.initContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const freq = confirm ? 720 : 380;
        osc.frequency.setValueAtTime(freq, now);
        if (confirm) {
            osc.frequency.exponentialRampToValueAtTime(960, now + 0.12);
        }

        gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }
}
