import React, { useState, useRef, useEffect } from 'react';
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
  Film,
  RotateCcw,
} from 'lucide-react';
import { cutVideo, downloadFile, formatTime, parseTime } from '../../utils/ffmpegEngine';

export function VideoCutter() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [startTimeInput, setStartTimeInput] = useState<string>('00:00');
  const [endTimeInput, setEndTimeInput] = useState<string>('00:00');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !selectedFile.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setError('請選擇有效的影片檔案 (MP4, WebM, MOV, AVI, MKV)');
      return;
    }

    setError(null);
    setSuccess(null);

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
    setStartTime(0);
    setStartTimeInput('00:00');
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
      setEndTimeInput(formatTime(dur));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Stop if playing preview beyond endTime
      if (isPlaying && cur >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeekStartTime = (sec: number) => {
    const validStart = Math.max(0, Math.min(sec, endTime - 0.1));
    setStartTime(validStart);
    setStartTimeInput(formatTime(validStart));
    if (videoRef.current) {
      videoRef.current.currentTime = validStart;
    }
  };

  const handleSeekEndTime = (sec: number) => {
    const validEnd = Math.min(duration, Math.max(sec, startTime + 0.1));
    setEndTime(validEnd);
    setEndTimeInput(formatTime(validEnd));
    if (videoRef.current) {
      videoRef.current.currentTime = validEnd;
    }
  };

  const handleStartTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setStartTimeInput(valStr);
    const parsed = parseTime(valStr);
    if (!isNaN(parsed) && parsed >= 0 && parsed < endTime) {
      setStartTime(parsed);
      if (videoRef.current) videoRef.current.currentTime = parsed;
    }
  };

  const handleEndTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setEndTimeInput(valStr);
    const parsed = parseTime(valStr);
    if (!isNaN(parsed) && parsed > startTime && parsed <= duration) {
      setEndTime(parsed);
      if (videoRef.current) videoRef.current.currentTime = parsed;
    }
  };

  const handleCut = async () => {
    if (!file) return;

    if (startTime >= endTime) {
      setError('結束時間必須大於開始時間');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setSuccess(null);

      const resultBytes = await cutVideo(file, startTime, endTime, (prog) => {
        setProgress(prog);
      });

      const fileName = file.name.replace(/\.[^/.]+$/, '');
      downloadFile(resultBytes, `${fileName}_cut_${Math.round(startTime)}s-${Math.round(endTime)}s.mp4`, 'video/mp4');
      setSuccess('影片剪輯成功！檔案已自動開始下載。');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '影片剪輯過程中發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header breadcrumb & title */}
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
              background: 'var(--gradient-video)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Scissors size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>影片剪輯 (Video Cutter)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              精準設定開始與結束時間，快速剪下所需影片片段，完全在瀏覽器端處理。
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
          style={{ display: 'none' }}
        />

        {!file || !videoUrl ? (
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
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDraggingOver ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDraggingOver ? 'rgba(139, 92, 246, 0.08)' : 'rgba(0, 0, 0, 0.1)',
              transition: 'all var(--transition-normal)',
            }}
          >
            <UploadCloud
              size={56}
              style={{
                color: isDraggingOver ? 'var(--accent-primary)' : 'var(--text-muted)',
                marginBottom: '1rem',
              }}
            />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              拖曳影片檔案至此處，或點擊選擇檔案
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>支援 MP4, WebM, MOV, AVI, MKV 等影片格式</p>
          </div>
        ) : (
          <div>
            {/* Top file summary bar */}
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
                <Film size={22} style={{ color: 'var(--accent-primary)' }} />
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
                <RotateCcw size={16} /> 更換影片
              </button>
            </div>

            {/* Video preview player */}
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxHeight: '480px',
                marginBottom: '1.5rem',
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                style={{ width: '100%', maxHeight: '480px', objectFit: 'contain' }}
              />
            </div>

            {/* Trimming controls & Dual sliders */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="glass-button"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? '暫停預覽' : '播放片段預覽'}
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    目前時間: {formatTime(currentTime)}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                  剪輯時長: {formatTime(Math.max(0, endTime - startTime))}
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
                    <span>開始時間:</span>
                    <span>{formatTime(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => handleSeekStartTime(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
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
                    <span>結束時間:</span>
                    <span>{formatTime(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => handleSeekEndTime(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
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

            {/* Action & Progress */}
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
                  <span>正在處理剪輯影片...</span>
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
                onClick={handleCut}
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
                    剪輯處理中 ({progress}%)...
                  </>
                ) : (
                  <>
                    <Download size={18} /> 開始剪輯影片
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
