import { loadFFmpeg, fetchFile } from './ffmpegEngine';

/**
 * Decodes an audio file (File, Blob, or ArrayBuffer) into an AudioBuffer using Web Audio API
 */
export async function decodeAudioFile(file: File | Blob | ArrayBuffer): Promise<AudioBuffer> {
  const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    return decoded;
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
}

/**
 * Draws audio waveform on canvas with start/end ratios and playhead indicator
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  startRatio: number = 0,
  endRatio: number = 1,
  playheadRatio?: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
  ctx.fillRect(0, 0, width, height);

  const rawData = audioBuffer.getChannelData(0);
  const totalSamples = rawData.length;
  const step = Math.ceil(totalSamples / width);
  const amp = height / 2;

  const activeStartPx = Math.floor(startRatio * width);
  const activeEndPx = Math.floor(endRatio * width);

  // Draw selection highlight background
  ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
  ctx.fillRect(activeStartPx, 0, activeEndPx - activeStartPx, height);

  // Draw waveform bars
  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    const sampleIdx = Math.floor(i * step);

    for (let j = 0; j < step; j += Math.max(1, Math.floor(step / 10))) {
      const val = rawData[sampleIdx + j];
      if (val !== undefined) {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }

    if (min > max) {
      min = 0;
      max = 0;
    }

    const yMin = (1 + min) * amp;
    const yMax = (1 + max) * amp;
    const barHeight = Math.max(2, yMax - yMin);

    const isSelected = i >= activeStartPx && i <= activeEndPx;

    if (isSelected) {
      const gradient = ctx.createLinearGradient(0, yMin, 0, yMax);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#ec4899');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    }

    ctx.fillRect(i, yMin, 1.5, barHeight);
  }

  // Draw selection handles
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(activeStartPx - 1, 0, 2, height);
  ctx.fillRect(activeEndPx - 1, 0, 2, height);

  // Handle top/bottom indicators
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(activeStartPx, 8, 5, 0, 2 * Math.PI);
  ctx.arc(activeEndPx, height - 8, 5, 0, 2 * Math.PI);
  ctx.fill();

  // Draw playhead if provided
  if (playheadRatio !== undefined && playheadRatio >= 0 && playheadRatio <= 1) {
    const playheadPx = Math.floor(playheadRatio * width);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPx, 0);
    ctx.lineTo(playheadPx, height);
    ctx.stroke();

    // Playhead cap
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(playheadPx, 4, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Slice an AudioBuffer from startSec to endSec, applying optional fade-in and fade-out
 */
export function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  startSec: number,
  endSec: number,
  fadeInSec: number = 0,
  fadeOutSec: number = 0
): AudioBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  const clampedStart = Math.max(0, startSec);
  const clampedEnd = Math.min(audioBuffer.duration, Math.max(clampedStart, endSec));

  const startSample = Math.floor(clampedStart * sampleRate);
  const endSample = Math.floor(clampedEnd * sampleRate);
  const frameCount = Math.max(1, endSample - startSample);

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sliced = audioCtx.createBuffer(numChannels, frameCount, sampleRate);

  const fadeInSamples = Math.floor(fadeInSec * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSec * sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const origData = audioBuffer.getChannelData(ch);
    const slicedData = sliced.getChannelData(ch);

    for (let i = 0; i < frameCount; i++) {
      let sample = origData[startSample + i] || 0;

      // Apply fade-in
      if (fadeInSamples > 0 && i < fadeInSamples) {
        const gain = i / fadeInSamples;
        sample *= gain;
      }

      // Apply fade-out
      if (fadeOutSamples > 0 && i >= frameCount - fadeOutSamples) {
        const gain = (frameCount - i) / fadeOutSamples;
        sample *= gain;
      }

      slicedData[i] = sample;
    }
  }

  return sliced;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const length = audioBuffer.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + audioBuffer.length * numChannels * 2, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, audioBuffer.length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Export AudioBuffer to target format (wav or mp3)
 */
export async function exportAudioBuffer(
  audioBuffer: AudioBuffer,
  format: 'wav' | 'mp3',
  onProgress?: (prog: number) => void
): Promise<Blob> {
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  if (format === 'wav') {
    if (onProgress) onProgress(100);
    return wavBlob;
  }

  // MP3 conversion using FFmpeg WASM if available, fallback to WAV Blob
  const ffmpeg = await loadFFmpeg(onProgress);
  if (ffmpeg) {
    try {
      const inputName = `input_${Date.now()}.wav`;
      const outputName = `output_${Date.now()}.mp3`;

      const wavFile = new File([wavBlob], inputName, { type: 'audio/wav' });
      await ffmpeg.writeFile(inputName, await fetchFile(wavFile));

      await ffmpeg.exec(['-i', inputName, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', outputName]);

      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([data as Uint8Array], { type: 'audio/mp3' });
    } catch (err) {
      console.warn('FFmpeg MP3 轉碼失敗，回傳 WAV 格式', err);
    }
  }

  return wavBlob;
}
