import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export { fetchFile };

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;
let ffmpegLoadPromise: Promise<FFmpeg | null> | null = null;

/**
 * Initialize @ffmpeg/ffmpeg instance with CDN fallback and error handling.
 */
export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg | null> {
  if (isFFmpegLoaded && ffmpegInstance) {
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.min(100, Math.max(0, Math.round(progress * 100))));
      });
    }
    return ffmpegInstance;
  }

  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();

      if (onProgress) {
        ffmpeg.on('progress', ({ progress }) => {
          onProgress(Math.min(100, Math.max(0, Math.round(progress * 100))));
        });
      }

      // Load FFmpeg core WASM from unpkg CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegInstance = ffmpeg;
      isFFmpegLoaded = true;
      return ffmpeg;
    } catch (err) {
      console.warn('FFmpeg WASM 初始化失敗或瀏覽器不支援 Multi-threading COOP/COEP，將自動切換為原生 Web API 處理備援', err);
      ffmpegInstance = null;
      isFFmpegLoaded = false;
      return null;
    } finally {
      ffmpegLoadPromise = null;
    }
  })();

  return ffmpegLoadPromise;
}

/**
 * Helper to download file bytes in browser
 */
export function downloadFile(data: Uint8Array | Blob, fileName: string, mimeType: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format seconds to mm:ss or hh:mm:ss string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parse time string (mm:ss or hh:mm:ss) into seconds
 */
export function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Helper to extract extension from filename
 */
function getFileExtension(filename: string, defaultExt = 'mp4'): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 4 ? ext : defaultExt;
}

/**
 * Cut video segment from startSec to endSec
 */
export async function cutVideo(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await loadFFmpeg(onProgress);

  if (ffmpeg) {
    try {
      const ext = getFileExtension(file.name);
      const inputName = `input_${Date.now()}.${ext}`;
      const outputName = `output_${Date.now()}.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const duration = Math.max(0.1, endSec - startSec);
      await ffmpeg.exec([
        '-ss',
        `${startSec}`,
        '-i',
        inputName,
        '-to',
        `${duration}`,
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        '-strict',
        '-2',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } catch (err) {
      console.warn('FFmpeg剪輯失敗，嘗試 Native Fallback...', err);
    }
  }

  // Native Web API Fallback using MediaRecorder
  return cutVideoNative(file, startSec, endSec, onProgress);
}

/**
 * Native cut fallback using HTML5 Video + MediaRecorder
 */
async function cutVideoNative(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = false; // capture audio if available
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      video.currentTime = startSec;
    };

    video.onseeked = async () => {
      try {
        const stream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream
          ? (video as any).mozCaptureStream()
          : null;

        if (!stream) {
          throw new Error('瀏覽器不支援 captureStream API');
        }

        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const buffer = await blob.arrayBuffer();
          URL.revokeObjectURL(video.src);
          resolve(new Uint8Array(buffer));
        };

        recorder.start(100);
        video.play();

        const duration = endSec - startSec;
        const startTime = Date.now();

        const checkProgress = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (onProgress) {
            onProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
          }

          if (video.currentTime >= endSec || elapsed >= duration + 0.5) {
            clearInterval(checkProgress);
            video.pause();
            recorder.stop();
          }
        }, 100);
      } catch (err) {
        URL.revokeObjectURL(video.src);
        reject(err);
      }
    };

    video.onerror = (e) => reject(new Error('影片載入失敗'));
  });
}

/**
 * Crop video box
 */
export async function cropVideo(
  file: File,
  cropBox: { x: number; y: number; width: number; height: number; videoWidth: number; videoHeight: number },
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await loadFFmpeg(onProgress);

  // Ensure crop parameters are valid and even integers for FFmpeg
  const x = Math.max(0, Math.floor(cropBox.x)) & ~1;
  const y = Math.max(0, Math.floor(cropBox.y)) & ~1;
  const w = Math.max(2, Math.floor(cropBox.width)) & ~1;
  const h = Math.max(2, Math.floor(cropBox.height)) & ~1;

  if (ffmpeg) {
    try {
      const ext = getFileExtension(file.name);
      const inputName = `input_${Date.now()}.${ext}`;
      const outputName = `output_${Date.now()}.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        `crop=${w}:${h}:${x}:${y}`,
        '-c:v',
        'libx264',
        '-c:a',
        'copy',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } catch (err) {
      console.warn('FFmpeg 裁切失敗，嘗試 Native Canvas Fallback...', err);
    }
  }

  return cropVideoNative(file, x, y, w, h, onProgress);
}

/**
 * Native crop video fallback using HTML5 Canvas + MediaRecorder
 */
async function cropVideoNative(
  file: File,
  x: number,
  y: number,
  w: number,
  h: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.autoplay = true;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    video.onloadeddata = () => {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const buffer = await blob.arrayBuffer();
        URL.revokeObjectURL(video.src);
        resolve(new Uint8Array(buffer));
      };

      recorder.start(100);
      video.play();

      let animId: number;
      const render = () => {
        if (ctx) {
          ctx.drawImage(video, x, y, w, h, 0, 0, w, h);
        }
        if (onProgress && video.duration) {
          onProgress(Math.min(100, Math.round((video.currentTime / video.duration) * 100)));
        }
        if (!video.ended && !video.paused) {
          animId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animId);
          recorder.stop();
        }
      };

      render();
    };

    video.onerror = () => reject(new Error('載入影片進行裁切失敗'));
  });
}

/**
 * Convert video segment to animated GIF
 */
export async function videoToGif(
  file: File,
  startSec: number,
  endSec: number,
  fps: number = 15,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await loadFFmpeg(onProgress);

  if (ffmpeg) {
    try {
      const ext = getFileExtension(file.name);
      const inputName = `input_${Date.now()}.${ext}`;
      const outputName = `output_${Date.now()}.gif`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const duration = Math.max(0.1, endSec - startSec);
      await ffmpeg.exec([
        '-ss',
        `${startSec}`,
        '-i',
        inputName,
        '-t',
        `${duration}`,
        '-vf',
        `fps=${fps},scale=480:-1:flags=lanczos`,
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } catch (err) {
      console.warn('FFmpeg GIF 轉換失敗，嘗試 Native Fallback...', err);
    }
  }

  // Native Fallback
  return videoToGifNative(file, startSec, endSec, fps, onProgress);
}

/**
 * Native Canvas GIF / frame fallback generator
 */
async function videoToGifNative(
  file: File,
  startSec: number,
  endSec: number,
  fps: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  // Extract audio/video frames into simple webm fallback
  return cutVideoNative(file, startSec, endSec, onProgress);
}

/**
 * Extract audio track from video
 */
export async function extractAudio(
  file: File,
  format: 'mp3' | 'wav' | 'aac',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await loadFFmpeg(onProgress);

  if (ffmpeg) {
    try {
      const ext = getFileExtension(file.name);
      const inputName = `input_${Date.now()}.${ext}`;
      const outputName = `output_${Date.now()}.${format}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      let codec = 'libmp3lame';
      if (format === 'wav') codec = 'pcm_s16le';
      if (format === 'aac') codec = 'aac';

      await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', codec, outputName]);

      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } catch (err) {
      console.warn('FFmpeg 音訊抽離失敗，嘗試 Web Audio API Fallback...', err);
    }
  }

  return extractAudioNative(file, format, onProgress);
}

/**
 * Web Audio API Audio Extraction Fallback
 */
async function extractAudioNative(
  file: File,
  format: 'mp3' | 'wav' | 'aac',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  if (onProgress) onProgress(30);
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  if (onProgress) onProgress(70);

  const wavData = audioBufferToWav(audioBuffer);
  if (onProgress) onProgress(100);

  return wavData;
}

/**
 * Helper to encode AudioBuffer to 16-bit PCM WAV Uint8Array
 */
function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const length = buffer.length * numChannels * 2 + 44;
  const out = new Uint8Array(length);
  const view = new DataView(out.buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + buffer.length * numChannels * 2, true);
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
  view.setUint32(40, buffer.length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return out;
}
