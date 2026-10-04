import { Task, ReminderTone } from '../types';

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Pleasant cheerful chime on task completion (C5 -> E5 -> G5)
  playCompletionChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  }

  // 1. Classic Chime: Soft dual-tone bell (A5 -> D6)
  playReminderChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [880, 1174.66]; // A5, D6

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.15);

      gain.gain.setValueAtTime(0.2, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.61);
    });
  }

  // 2. Bell: Resonant brass chime (G5, C6, E6 with rich shimmer)
  playBell() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [783.99, 1046.5, 1318.5]; // G5, C6, E6

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.09);

      gain.gain.setValueAtTime(0.01, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.92);
    });
  }

  // 3. Marimba: Warm acoustic wooden tri-tone (C5, G5, C6)
  playMarimba() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 783.99, 1046.5];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.42);
    });
  }

  // 4. Cosmic: Futuristic synth glow sweep (F5 -> A5 -> C6 -> F6)
  playCosmic() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [698.46, 880, 1046.5, 1396.9];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.07);

      gain.gain.setValueAtTime(0.01, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.72);
    });
  }

  // 5. Digital: Crisp modern digital watch double-beep
  playDigital() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const beeps = [1046.5, 1318.5]; // C6, E6

    beeps.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.12);

      gain.gain.setValueAtTime(0.1, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.09);
    });
  }

  // 6. Zen: Relaxing meditation singing bowl harmonic (432Hz)
  playZen() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now); // A = 432Hz healing bowl

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(864, now); // Octave overtone

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.25);
    osc2.stop(now + 1.25);
  }

  // Dispatch selected reminder tone
  playReminderTone(tone: ReminderTone = 'chime') {
    switch (tone) {
      case 'bell':
        this.playBell();
        break;
      case 'marimba':
        this.playMarimba();
        break;
      case 'cosmic':
        this.playCosmic();
        break;
      case 'digital':
        this.playDigital();
        break;
      case 'zen':
        this.playZen();
        break;
      case 'chime':
      default:
        this.playReminderChime();
        break;
    }
  }

  playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const sounds = new SoundEffects();

export class NotificationService {
  static isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  static getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) return 'denied';
    return Notification.permission;
  }

  static async requestPermission(): Promise<boolean> {
    if (!this.isNotificationSupported()) return false;
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  static vibrate(pattern: number | number[] = [200, 100, 200, 100, 400]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if unsupported
      }
    }
  }

  /**
   * Dispatches system notification using Service Worker showNotification if available
   * (critical for iOS 16.4+ PWA and Android Chrome background notifications), falling
   * back to window Notification constructor on desktop.
   */
  static async sendNotification(task: Task) {
    if (!this.isNotificationSupported()) return;

    if (Notification.permission !== 'granted') {
      try {
        const res = await Notification.requestPermission();
        if (res !== 'granted') return;
      } catch {
        return;
      }
    }

    const title = `⏰ ${task.title}`;
    const options: NotificationOptions & { renotify?: boolean } = {
      body: task.notes || 'Donezy reminder for your task',
      icon: '/apple-touch-icon.png',
      badge: '/favicon.png',
      tag: `task-${task.id}`,
      renotify: true,
      requireInteraction: true,
      data: { taskId: task.id, url: '/' },
    };

    // 1. Try ServiceWorkerRegistration (supports background alerts and mobile PWAs)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      } catch (err) {
        console.warn('ServiceWorker showNotification failed, attempting desktop Notification fallback:', err);
      }
    }

    // 2. Fallback to Window Notification API for desktop browsers
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('Browser notification constructor failed:', err);
    }
  }
}
