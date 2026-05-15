/**
 * audioManager.ts
 *
 * Giải quyết vấn đề iOS Safari Autoplay Policy:
 * - iOS Safari chặn audio phát tự động trừ khi được kích hoạt bởi user gesture
 * - Giải pháp: dùng Web Audio API (AudioContext) + unlock ngay khi có user interaction đầu tiên
 * - File sos-final.mp3 đã bao gồm cả còi báo động + giọng nói tiếng Việt
 */

import { Platform } from 'react-native';

// Chỉ áp dụng trên web (iOS Safari, Chrome mobile)
const isWeb = Platform.OS === 'web';

// File âm thanh SOS: còi báo động + giọng nói tiếng Việt (host cùng app)
const SOS_ALARM_URL = '/assets/sos-final.mp3';

class WebAudioManager {
  private audioContext: AudioContext | null = null;
  private sosBuffer: AudioBuffer | null = null;
  private sosSourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isUnlocked = false;
  private isPlaying = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Gọi hàm này ngay khi user tap vào màn hình lần đầu.
   * Đây là bước QUAN TRỌNG NHẤT để unlock AudioContext trên iOS Safari.
   */
  async unlock(): Promise<void> {
    if (!isWeb) return;
    if (this.isUnlocked) return;

    try {
      const AudioContextClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass() as AudioContext;
      }

      const ctx = this.audioContext;

      // iOS Safari yêu cầu resume() sau khi tạo
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Phát 1 âm im lặng để "unlock" hoàn toàn
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      console.log('[AudioManager] iOS Audio unlocked ✅');

      // Preload file SOS ngay sau khi unlock để phát tức thì khi cần
      this.preloadSosSound();
    } catch (e) {
      console.warn('[AudioManager] Unlock failed:', e);
    }
  }

  /**
   * Fetch và decode file sos-final.mp3 vào buffer.
   * Chỉ tải 1 lần, các lần sau dùng lại buffer đã có.
   */
  private async preloadSosSound(): Promise<void> {
    if (!this.audioContext || !isWeb) return;
    if (this.loadPromise) return;

    const ctx = this.audioContext;
    this.loadPromise = (async () => {
      try {
        const response = await fetch(SOS_ALARM_URL);
        const arrayBuffer = await response.arrayBuffer();
        this.sosBuffer = await ctx.decodeAudioData(arrayBuffer);
        console.log('[AudioManager] sos-final.mp3 preloaded ✅');
      } catch (e) {
        console.error('[AudioManager] Không load được sos-final.mp3:', e);
        this.sosBuffer = null;
      }
    })();

    await this.loadPromise;
  }

  /**
   * Phát file sos-final.mp3 (lặp liên tục).
   * Gọi khi nhận được sự kiện SOS từ socket.
   */
  async playSosAlarm(): Promise<void> {
    if (!isWeb) return;
    if (this.isPlaying) return;

    // Nếu chưa unlock (SOS đến trước khi user tap), thử unlock
    if (!this.isUnlocked || !this.audioContext) {
      await this.unlock();
    }

    if (!this.audioContext) {
      console.warn('[AudioManager] Không có AudioContext — cần user tap trước');
      return;
    }

    const ctx = this.audioContext;

    // Resume nếu bị suspend (iOS đôi khi suspend sau idle)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('[AudioManager] Không resume được AudioContext:', e);
        return;
      }
    }

    // Tạo GainNode để kiểm soát volume
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(ctx.destination);

    // Load buffer nếu chưa có
    if (!this.sosBuffer) {
      await this.preloadSosSound();
    }

    if (this.sosBuffer) {
      // Phát từ buffer (không delay, lặp liên tục)
      const source = ctx.createBufferSource();
      source.buffer = this.sosBuffer;
      source.loop = true;
      source.connect(this.gainNode);
      source.start(0);
      this.sosSourceNode = source;
      this.isPlaying = true;
      console.log('[AudioManager] sos-final.mp3 đang phát 🔊');
    } else {
      console.error('[AudioManager] Không phát được SOS — buffer null');
    }
  }

  /**
   * Dừng âm thanh SOS với fade-out nhẹ để tránh tiếng click.
   */
  stopSosAlarm(): void {
    if (!isWeb) return;

    try {
      if (this.sosSourceNode) {
        this.sosSourceNode.stop();
        this.sosSourceNode.disconnect();
        this.sosSourceNode = null;
      }
      if (this.gainNode && this.audioContext) {
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + 0.1
        );
        this.gainNode = null;
      }
    } catch (e) {
      // Bỏ qua lỗi khi stop
    }

    this.isPlaying = false;
    console.log('[AudioManager] SOS dừng ⏹️');
  }

  get unlocked(): boolean {
    return this.isUnlocked;
  }
}

// Singleton — dùng chung toàn app
export const webAudioManager = new WebAudioManager();

