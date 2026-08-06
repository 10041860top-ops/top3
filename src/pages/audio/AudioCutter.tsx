import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  UploadCloud,
  Play,
  Pause,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Music,
  RotateCcw,
  Volume2,
  Sliders,
} from 'lucide-react';
import {
  decodeAudioFile,
  drawWaveform,
  sliceAudioBuffer,
  exportAudioBuffer,
} from '../../utils/audioEngine';
import { formatTime, parseTime, downloadFile } from '../../utils/ffmpegEngine';

export function AudioCutter() {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [startTimeInput, setStartTimeInput] = useState<string>('00:00');
  const [endTimeInput, setEndTimeInput] = useState<string>('00:00');

  const [fadeInSec, setFadeInSec] = useState<number>(0);
  const [fadeOutSec, setFadeOutSec] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playStartAudioTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const [isCanvasDragging, setIsCanvasDragging] = useState<'start' | 'end' | 'create' | null>(null);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Stop playback audio
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (_) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Redraw canvas whenever buffer or times change
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !audioBuffer) return;
    const canvas = canvasRef.current;
    const startRatio = duration > 0 ? startTime / duration : 0;
    const endRatio = duration > 0 ? endTime / duration : 1;
    const playheadRatio = duration > 0 && isPlaying ? currentTime / duration : undefined;

    drawWaveform(canvas, audioBuffer, startRatio, endRatio, playheadRatio);
  }, [audioBuffer, duration, startTime, endTime, isPlaying, currentTime]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle file select
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/') && !selectedFile.name.match(/\.(mp3|wav|aac|m4a|ogg|flac|wma)$/i)) {
      setError('請選擇有效的音訊檔案 (MP3, WAV, AAC, M4A, OGG)');
      return;
    }

    stopPlayback();
    setError(null);
    setSuccess(null);
    setFile(selectedFile);
    setIsDecoding(true);

    try {
      const buffer = await decodeAudioFile(selectedFile);
      setAudioBuffer(buffer);
      const dur = buffer.duration;
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);
      setStartTimeInput('00:00');
      setEndTimeInput(formatTime(dur));
      setCurrentTime(0);
    } catch (err: any) {
      console.error(err);
      setError('音訊解碼失敗，請確認檔案格式是否受支援');
      setFile(null);
      setAudioBuffer(null);
    } finally {
      setIsDecoding(false);
    }
  };

  // Play preview of selected segment
  const startPlayback = () => {
    if (!audioBuffer) return;
    stopPlayback();

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    const sliced = sliceAudioBuffer(audioBuffer, startTime, endTime, fadeInSec, fadeOutSec);
    const source = ctx.createBufferSource();
    source.buffer = sliced;
    source.connect(ctx.destination);

    playStartTimeRef.current = ctx.currentTime;
    playStartAudioTimeRef.current = startTime;
    sourceNodeRef.current = source;

    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(startTime);
    };

    source.start(0);
    setIsPlaying(true);

    const updatePlayhead = () => {
      if (!audioCtxRef.current) return;
      const elapsed = audioCtxRef.current.currentTime - playStartTimeRef.current;
      const currentPos = playStartAudioTimeRef.current + elapsed;

      if (currentPos >= endTime) {
        stopPlayback();
        setCurrentTime(startTime);
      } else {
        setCurrentTime(currentPos);
        animFrameRef.current = requestAnimationFrame(updatePlayhead);
      }
    };

    animFrameRef.current = requestAnimationFrame(updatePlayhead);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Time slider changes
  const handleSeekStartTime = (sec: number) => {
    const validStart = Math.max(0, Math.min(sec, endTime - 0.1));
    setStartTime(validStart);
    setStartTimeInput(formatTime(validStart));
    if (isPlaying) stopPlayback();
  };

  const handleSeekEndTime = (sec: number) => {
    const validEnd = Math.min(duration, Math.max(sec, startTime + 0.1));
    setEndTime(validEnd);
    setEndTimeInput(formatTime(validEnd));
    if (isPlaying) stopPlayback();
  };

  // Time text input changes
  const handleStartTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setStartTimeInput(valStr);
    const parsed = parseTime(valStr);
    if (!isNaN(parsed) && parsed >= 0 && parsed < endTime) {
      setStartTime(parsed);
      if (isPlaying) stopPlayback();
    }
  };

  const handleEndTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setEndTimeInput(valStr);
    const parsed = parseTime(valStr);
    if (!isNaN(parsed) && parsed > startTime && parsed <= duration) {
      setEndTime(parsed);
      if (isPlaying) stopPlayback();
    }
  };

  // Canvas Mouse Interactions for Drag Trimming
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const clickTime = ratio * duration;

    const startDist = Math.abs(clickTime - startTime);
    const endDist = Math.abs(clickTime - endTime);

    const threshold = (15 / rect.width) * duration;

    if (startDist < threshold) {
      setIsCanvasDragging('start');
    } else if (endDist < threshold) {
      setIsCanvasDragging('end');
    } else {
      setIsCanvasDragging('create');
      setStartTime(clickTime);
      setStartTimeInput(formatTime(clickTime));
    }
    if (isPlaying) stopPlayback();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCanvasDragging || !canvasRef.current || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, moveX / rect.width));
    const moveTime = ratio * duration;

    if (isCanvasDragging === 'start') {
      const valid = Math.max(0, Math.min(moveTime, endTime - 0.1));
      setStartTime(valid);
      setStartTimeInput(formatTime(valid));
    } else if (isCanvasDragging === 'end' || isCanvasDragging === 'create') {
      const valid = Math.min(duration, Math.max(moveTime, startTime + 0.1));
      setEndTime(valid);
      setEndTimeInput(formatTime(valid));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsCanvasDragging(null);
  };

  // Export & Download
  const handleCutAudio = async () => {
    if (!audioBuffer || !file) return;

    if (startTime >= endTime) {
      setError('結束時間必須大於開始時間');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setError(null);
      setSuccess(null);

      const slicedBuffer = sliceAudioBuffer(audioBuffer, startTime, endTime, fadeInSec, fadeOutSec);
      setProgress(40);

      const blob = await exportAudioBuffer(slicedBuffer, exportFormat, (prog) => {
        setProgress(40 + Math.round(prog * 0.5));
      });

      setProgress(100);
      const mimeType = exportFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const downloadName = `${baseName}_cut_${Math.round(startTime)}s-${Math.round(endTime)}s.${exportFormat}`;

      downloadFile(blob, downloadName, mimeType);
      setSuccess(`音訊剪輯成功！檔案 (${downloadName}) 已開始下載。`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '音訊剪輯過程中發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    stopPlayback();
    setFile(null);
    setAudioBuffer(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setFadeInSec(0);
    setFadeOutSec(0);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Navigation & Header */}
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
              background: 'var(--gradient-audio)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
            }}
          >
            <Scissors size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>音訊剪輯 (Audio Cutter)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              可視化波形選擇段落，支援淡入淡出特效，快速將音訊剪輯並匯出為 MP3 / WAV 檔。
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac"
          style={{ display: 'none' }}
        />

        {!file || isDecoding ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => !isDecoding && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDraggingOver ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              cursor: isDecoding ? 'wait' : 'pointer',
              background: isDraggingOver ? 'rgba(236, 72, 153, 0.08)' : 'rgba(0, 0, 0, 0.1)',
              transition: 'all var(--transition-normal)',
            }}
          >
            {isDecoding ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#ec4899', animation: 'spin 1s linear infinite' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>正在解碼音訊波形數據...</h3>
              </div>
            ) : (
              <>
                <UploadCloud
                  size={56}
                  style={{
                    color: isDraggingOver ? 'var(--accent-primary)' : 'var(--text-muted)',
                    marginBottom: '1rem',
                  }}
                />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  拖曳音訊檔案至此處，或點擊選擇檔案
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  支援 MP3, WAV, AAC, M4A, OGG, FLAC 等音樂格式
                </p>
              </>
            )}
          </div>
        ) : (
          <div>
            {/* File info summary bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Music size={22} style={{ color: '#ec4899' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{file.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • 總時長 {formatTime(duration)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="glass-button"
                style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}
              >
                <RotateCcw size={16} /> 更換音訊
              </button>
            </div>

            {/* Interactive Waveform Canvas */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  直接在下方波形圖上拖拽選擇剪輯範圍：
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ec4899' }}>
                  選擇範圍: {formatTime(Math.max(0, endTime - startTime))}
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={800}
                height={140}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: 'var(--radius-md)',
                  cursor: isCanvasDragging ? 'ew-resize' : 'pointer',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
                }}
              />
            </div>

            {/* Trimming controls & sliders */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="glass-button glass-button-primary"
                    style={{ padding: '0.5rem 1.25rem' }}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? '暫停預覽' : '播放剪輯片段預覽'}
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    播放進度: {formatTime(currentTime)}
                  </span>
                </div>
              </div>

              {/* Sliders layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: '0.4rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>開始時間點:</span>
                    <span>{formatTime(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => handleSeekStartTime(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#a855f7' }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: '0.4rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>結束時間點:</span>
                    <span>{formatTime(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => handleSeekEndTime(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#ec4899' }}
                  />
                </div>

                {/* Direct time inputs mm:ss */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                    paddingTop: '0.5rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      開始時間 (mm:ss)
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={startTimeInput}
                      onChange={handleStartTimeInputChange}
                      placeholder="00:00"
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      結束時間 (mm:ss)
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={endTimeInput}
                      onChange={handleEndTimeInputChange}
                      placeholder="00:00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Fade Controls & Export Options */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Volume2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  淡入時間 (Fade-In)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={fadeInSec}
                    onChange={(e) => setFadeInSec(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', width: '36px' }}>
                    {fadeInSec} 秒
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Volume2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  淡出時間 (Fade-Out)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={fadeOutSec}
                    onChange={(e) => setFadeOutSec(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', width: '36px' }}>
                    {fadeOutSec} 秒
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Sliders size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  匯出格式 (Format)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setExportFormat('mp3')}
                    className={`glass-button ${exportFormat === 'mp3' ? 'glass-button-primary' : ''}`}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    MP3
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('wav')}
                    className={`glass-button ${exportFormat === 'wav' ? 'glass-button-primary' : ''}`}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    WAV
                  </button>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {isProcessing && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.4rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>正在剪輯並匯出音訊...</span>
                  <span>{progress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'var(--gradient-brand)',
                      transition: 'width 0.2s linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Download button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={handleCutAudio}
                disabled={isProcessing || startTime >= endTime}
                className="glass-button glass-button-primary"
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  opacity: isProcessing || startTime >= endTime ? 0.6 : 1,
                  cursor: isProcessing || startTime >= endTime ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    音訊處理中 ({progress}%)...
                  </>
                ) : (
                  <>
                    <Download size={18} /> 開始剪輯音訊 ({exportFormat.toUpperCase()})
                  </>
                )}
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
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
