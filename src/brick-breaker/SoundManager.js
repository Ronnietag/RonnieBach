/**
 * Sound Manager - Holographic Brick Breaker Game
 *
 * Uses Web Audio API to generate synthesized sound effects.
 * No external audio files needed - all sounds are programmatically generated.
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.soundEnabled = true;
    this.initialized = false;
  }

  // Initialize audio context (must be called after user interaction)
  initialize() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Toggle sound on/off
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.5 : 0;
    }
  }

  // Set master volume (0-1)
  setMasterVolume(volume) {
    this.masterGain.gain.value = volume;
  }

  // Resume audio context (needed for browsers that suspend audio)
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Create oscillator with envelope
  createSound(config) {
    if (!this.soundEnabled || !this.audioContext) return;

    const {
      frequency,
      duration = 0.1,
      type = 'sine',
      gain = 0.5,
      fadeIn = 0.01,
      fadeOut = 0.1
    } = config;

    const now = this.audioContext.currentTime;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + fadeIn);
    gainNode.gain.linearRampToValueAtTime(0, now + duration - fadeOut);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Create noise for explosion sounds
  createNoise(config) {
    if (!this.soundEnabled || !this.audioContext) return;

    const {
      duration = 0.3,
      gain = 0.3,
      fadeIn = 0.01,
      fadeOut = 0.2
    } = config;

    const now = this.audioContext.currentTime;

    // Create buffer for noise
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Create source and gain
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + fadeIn);
    gainNode.gain.linearRampToValueAtTime(0, now + duration - fadeOut);

    noise.connect(gainNode);
    gainNode.connect(this.masterGain);
    noise.start(now);
  }

  // Sound: Brick hit (short, crisp ping)
  playBrickHit(tier = 1) {
    const baseFreq = 880 + (tier * 100);
    this.createSound({
      frequency: baseFreq,
      duration: 0.08,
      type: 'sine',
      gain: 0.3,
      fadeIn: 0.005,
      fadeOut: 0.06
    });
  }

  // Sound: Paddle hit (lower, satisfying thump)
  playPaddleHit() {
    this.createSound({
      frequency: 440,
      duration: 0.1,
      type: 'triangle',
      gain: 0.4,
      fadeIn: 0.01,
      fadeOut: 0.08
    });
  }

  // Sound: Ball lost (descending tone)
  playBallLost() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Sound: Powerup collected (ascending arpeggio)
  playPowerup() {
    if (!this.soundEnabled || !this.audioContext) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.audioContext.currentTime;

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);

      const startTime = now + index * 0.08;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.12);
    });
  }

  // Sound: Special brick hit (more intense)
  playSpecialBrickHit() {
    this.createNoise({
      duration: 0.1,
      gain: 0.2,
      fadeIn: 0.01,
      fadeOut: 0.08
    });
  }

  // Sound: Explosive brick
  playExplosion() {
    this.createNoise({
      duration: 0.4,
      gain: 0.4,
      fadeIn: 0.01,
      fadeOut: 0.3
    });
  }

  // Sound: Frozen brick
  playFrozenHit() {
    this.createSound({
      frequency: 1200,
      duration: 0.15,
      type: 'sine',
      gain: 0.2,
      fadeIn: 0.02,
      fadeOut: 0.12
    });
  }

  // Sound: Level complete (victory fanfare)
  playLevelComplete() {
    if (!this.soundEnabled || !this.audioContext) return;

    const melody = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.4 }   // C6 (longer)
    ];

    const now = this.audioContext.currentTime;

    melody.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(note.freq, now + index * 0.12);

      const startTime = now + index * 0.12;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + note.duration);

      // Add lowpass filter for warmer sound
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration + 0.02);
    });
  }

  // Sound: Game Over (descending sad tones)
  playGameOver() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const notes = [392, 349.23, 329.63, 261.63]; // G4, F4, E4, C4

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.25);

      const startTime = now + index * 0.25;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.28);
    });
  }

  // Sound: Victory (epic fanfare)
  playVictory() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // fanfare-style melody
    const melody = [
      { freq: 523.25, duration: 0.12 }, // C5
      { freq: 523.25, duration: 0.12 }, // C5
      { freq: 523.25, duration: 0.12 }, // C5
      { freq: 523.25, duration: 0.24 }, // C5 (longer)
      { freq: 659.25, duration: 0.24 }, // E5
      { freq: 783.99, duration: 0.24 }, // G5
      { freq: 1046.50, duration: 0.6 }  // C6 (long finale)
    ];

    melody.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(note.freq, now + index * 0.1);

      const startTime = now + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + note.duration * 0.7);
      gainNode.gain.linearRampToValueAtTime(0, startTime + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration + 0.01);
    });

    // Add harmonic shimmer
    setTimeout(() => {
      this.createChord([1046.50, 1318.51, 1567.98], 0.4); // C6, E6, G6
    }, melody.length * 0.1 + 200);
  }

  // Play a chord
  createChord(frequencies, duration) {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    frequencies.forEach(freq => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(now);
      oscillator.stop(now + duration);
    });
  }

  // Sound: Menu selection
  playMenuSelect() {
    this.createSound({
      frequency: 800,
      duration: 0.05,
      type: 'sine',
      gain: 0.2,
      fadeIn: 0.005,
      fadeOut: 0.04
    });
  }

  // Sound: Menu hover
  playMenuHover() {
    this.createSound({
      frequency: 600,
      duration: 0.03,
      type: 'sine',
      gain: 0.1,
      fadeIn: 0.005,
      fadeOut: 0.02
    });
  }

  // Sound: Weapon fire - Missile
  playMissileFire() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Whoosh sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Sound: Weapon fire - Laser
  playLaserFire() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // High-pitched zing
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1500, now);
    oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.15);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    // Add high-pass filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Sound: Boss hit
  playBossHit() {
    this.createSound({
      frequency: 150,
      duration: 0.15,
      type: 'square',
      gain: 0.3,
      fadeIn: 0.01,
      fadeOut: 0.12
    });
  }

  // Sound: Critical hit
  playCriticalHit() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Sparkle sound
    const notes = [2000, 2500, 3000, 3500];

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.03);

      const startTime = now + index * 0.03;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    });
  }

  // Sound: Enhancement selected (roguelike)
  playEnhancementSelect() {
    if (!this.soundEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Magical chime
    const notes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);

      const startTime = now + index * 0.08;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.22);
    });
  }

  // Clean up resources
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
const soundManager = new SoundManager();
export default soundManager;
