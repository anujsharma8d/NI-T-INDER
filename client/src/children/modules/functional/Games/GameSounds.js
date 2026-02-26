/**
 * GameSounds - Optional sound effects for game interactions
 * Uses Web Audio API to generate simple sound effects
 */

class GameSounds {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Sound effects
  click() {
    this.playTone(800, 0.1, 'square');
  }

  submit() {
    this.playTone(523.25, 0.15, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine'), 200); // G5
  }

  success() {
    this.playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.1, 'sine'), 200); // G5
    setTimeout(() => this.playTone(1046.50, 0.3, 'sine'), 300); // C6
  }

  wrong() {
    this.playTone(200, 0.3, 'sawtooth');
  }

  hover() {
    this.playTone(600, 0.05, 'sine');
  }

  enable() {
    if (!this.audioContext) {
      this.init();
    }
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled && !this.audioContext) {
      this.init();
    }
    return this.enabled;
  }
}

export const gameSounds = new GameSounds();
