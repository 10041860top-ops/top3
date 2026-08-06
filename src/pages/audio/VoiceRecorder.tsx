import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Square,
  Pause,
  Play,
  Download,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Clock,
  Radio,
} from 'lucide-react';
import { formatTime, downloadFile } from '../../utils/ffmpegEngine';
import { decodeAudioFile, audioBufferToWavBlob } from '../../utils/audioEngine';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export function VoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'webm' | 'wav'>('webm');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      stopStreamAndVisualizer();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  // Stop media stream & animation frame
  const stopStreamAndVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  // Draw real-time spectrum/waveform visualizer
  const startVisualizer = (stream: MediaStream) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Dark glass background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight: number;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  // Start recording
  const startRecording = async () => {
    setError(null);
    setSuccess(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Detect supported mimeTypes
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);

        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordingState('stopped');
        setSuccess('錄音完成！您現在可以預覽或下載錄音檔。');
      };

      recorder.start(100);
      startVisualizer(stream);

      setRecordingState('recording');
      setRecordingTime(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('錄音存取錯誤:', err);
      setError('無法存取麥克風。請確認瀏覽器授權或麥克風裝置是否正常連接。');
      stopStreamAndVisualizer();
      setRecordingState('idle');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
      setRecordingState('paused');
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingState('recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      stopStreamAndVisualizer();
    }
  };

  // Reset to record new
  const resetRecording = () => {
    stopStreamAndVisualizer();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setError(null);
    setSuccess(null);
  };

  // Download recorded audio
  const handleDownload = async () => {
    if (!recordedBlob) return;

    try {
      if (exportFormat === 'wav') {
        // Convert webm blob to WAV buffer via Web Audio API
        const buffer = await decodeAudioFile(recordedBlob);
        const wavBlob = audioBufferToWavBlob(buffer);
        downloadFile(wavBlob, `recording_${Date.now()}.wav`, 'audio/wav');
      } else {
        downloadFile(recordedBlob, `recording_${Date.now()}.webm`, recordedBlob.type || 'audio/webm');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback direct blob download
      downloadFile(recordedBlob, `recording_${Date.now()}.webm`, 'audio/webm');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header & Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/"
          className="glass-button"
          style={{ display: 'inline-flex', marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> 返回工具列表
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Mic size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>錄音機 (Voice Recorder)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              直接使用瀏覽器麥克風進行線上高音質錄音，即時頻譜視覺化 display，完全於本地儲存。
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        {/* Real-time Spectrum Canvas Visualizer */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '2rem',
            background: 'rgba(15, 23, 42, 0.6)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={160}
            style={{ width: '100%', height: '160px', display: 'block' }}
          />

          {recordingState === 'idle' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--text-muted)',
                gap: '0.5rem',
              }}
            >
              <Volume2 size={32} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '0.95rem' }}>點擊下方「開始錄音」按鈕啟用麥克風</span>
            </div>
          )}

          {recordingState === 'paused' && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.3rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                color: '#facc15',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Pause size={14} /> 錄音已暫停
            </div>
          )}

          {recordingState === 'recording' && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.3rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Radio size={14} className="animate-pulse" style={{ color: '#ef4444' }} /> 正在錄音中...
            </div>
          )}
        </div>

        {/* Timer display */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              fontFamily: 'monospace',
              letterSpacing: '2px',
              color: recordingState === 'recording' ? '#ef4444' : 'var(--text-primary)',
              transition: 'color var(--transition-normal)',
            }}
          >
            {formatTime(recordingTime)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
            錄音時間 (時 : 分 : 秒)
          </p>
        </div>

        {/* Control Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              className="glass-button"
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
              }}
            >
              <Mic size={22} /> 開始錄音
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                type="button"
                onClick={pauseRecording}
                className="glass-button"
                style={{ padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-full)' }}
              >
                <Pause size={18} /> 暫停
              </button>

              <button
                type="button"
                onClick={stopRecording}
                className="glass-button"
                style={{
                  padding: '0.8rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                }}
              >
                <Square size={18} /> 停止錄音
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                type="button"
                onClick={resumeRecording}
                className="glass-button glass-button-primary"
                style={{ padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-full)' }}
              >
                <Play size={18} /> 繼續錄音
              </button>

              <button
                type="button"
                onClick={stopRecording}
                className="glass-button"
                style={{
                  padding: '0.8rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                }}
              >
                <Square size={18} /> 停止錄音
              </button>
            </>
          )}

          {recordingState === 'stopped' && (
            <button
              type="button"
              onClick={resetRecording}
              className="glass-button"
              style={{ padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-full)' }}
            >
              <RotateCcw size={18} /> 重新錄音
            </button>
          )}
        </div>

        {/* Recorded preview & download section */}
        {recordingState === 'stopped' && recordedUrl && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', maxWidth: '640px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={20} style={{ color: '#ec4899' }} /> 錄音檔預覽與下載
            </h3>

            {/* Native Audio Player */}
            <audio src={recordedUrl} controls style={{ width: '100%', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '1.25rem',
              }}
            >
              {/* Format Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>下載格式:</span>
                <button
                  type="button"
                  onClick={() => setExportFormat('webm')}
                  className={`glass-button ${exportFormat === 'webm' ? 'glass-button-primary' : ''}`}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                >
                  WEBM
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('wav')}
                  className={`glass-button ${exportFormat === 'wav' ? 'glass-button-primary' : ''}`}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                >
                  WAV
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="glass-button glass-button-primary"
                style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem' }}
              >
                <Download size={18} /> 下載錄音檔 ({exportFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
