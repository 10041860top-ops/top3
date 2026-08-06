import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  UploadCloud,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Film,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { videoToGif, downloadFile, formatTime } from '../../utils/ffmpegEngine';

export function VideoToGif() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [fps, setFps] = useState<number>(15);

  const [gifResult, setGifResult] = useState<{ url: string; bytes: Uint8Array } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (gifResult?.url) URL.revokeObjectURL(gifResult.url);
    };
  }, [videoUrl, gifResult]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !selectedFile.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setError('請選擇有效的影片檔案 (MP4, WebM, MOV, AVI, MKV)');
      return;
    }

    setError(null);
    setSuccess(null);
    setGifResult(null);

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
    setStartTime(0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      // default 5s max segment for smooth GIF default
      setEndTime(Math.min(dur, 5));
    }
  };

  const handleConvert = async () => {
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
      if (gifResult?.url) URL.revokeObjectURL(gifResult.url);
      setGifResult(null);

      const bytes = await videoToGif(file, startTime, endTime, fps, (prog) => setProgress(prog));

      const blob = new Blob([bytes], { type: 'image/gif' });
      const gifUrl = URL.createObjectURL(blob);
      setGifResult({ url: gifUrl, bytes });

      setSuccess('GIF 動圖轉換成功！您可以在下方預覽並下載。');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '轉換 GIF 時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadGif = () => {
    if (!gifResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadFile(gifResult.bytes, `${baseName}_anim.gif`, 'image/gif');
  };

  const resetAll = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (gifResult?.url) URL.revokeObjectURL(gifResult.url);
    setVideoUrl(null);
    setGifResult(null);
    setDuration(0);
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
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>影片轉 GIF 動圖 (Video to GIF)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              將短影片或特定時間片段轉換為高畫質動態 GIF 圖檔。
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
            {/* Top file summary */}
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

            {/* Video preview */}
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxHeight: '400px',
                marginBottom: '1.5rem',
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                controls
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>

            {/* Options Panel: Start/End time & FPS */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem' }}>轉換設定</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {/* Time Range */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    開始時間: {formatTime(startTime)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setStartTime(v);
                      if (v >= endTime) setEndTime(Math.min(duration, v + 1));
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    結束時間: {formatTime(endTime)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setEndTime(v);
                      if (v <= startTime) setStartTime(Math.max(0, v - 1));
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                {/* FPS Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    幀率 (FPS 選擇)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[10, 15, 24, 30].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFps(f)}
                        className="glass-button"
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontSize: '0.85rem',
                          borderColor: fps === f ? 'var(--accent-primary)' : undefined,
                          background: fps === f ? 'rgba(139, 92, 246, 0.25)' : undefined,
                        }}
                      >
                        {f} FPS
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Convert action button */}
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
                onClick={handleConvert}
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
                    正在轉換成 GIF ({progress}%)...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> 轉換為 GIF
                  </>
                )}
              </button>
            </div>

            {/* Progress bar */}
            {isProcessing && (
              <div style={{ marginTop: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.4rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>動圖生成處理中...</span>
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

            {/* Generated GIF Preview */}
            {gifResult && (
              <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Image size={20} style={{ color: 'var(--accent-primary)' }} /> 生成結果預覽
                </h3>

                <div
                  style={{
                    display: 'inline-block',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <img src={gifResult.url} alt="Animated GIF Preview" style={{ maxWidth: '100%', maxHeight: '360px', display: 'block' }} />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleDownloadGif}
                    className="glass-button glass-button-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
                  >
                    <Download size={18} /> 下載 GIF 檔案
                  </button>
                </div>
              </div>
            )}
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
