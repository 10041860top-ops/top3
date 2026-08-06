import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  UploadCloud,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Film,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { extractAudio, downloadFile, formatTime } from '../../utils/ffmpegEngine';

type AudioFormat = 'mp3' | 'wav' | 'aac';

export function AudioExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [format, setFormat] = useState<AudioFormat>('mp3');

  const [extractedAudio, setExtractedAudio] = useState<{ url: string; bytes: Uint8Array; format: AudioFormat } | null>(
    null
  );
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
      if (extractedAudio?.url) URL.revokeObjectURL(extractedAudio.url);
    };
  }, [videoUrl, extractedAudio]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !selectedFile.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setError('請選擇有效的影片檔案 (MP4, WebM, MOV, AVI, MKV)');
      return;
    }

    setError(null);
    setSuccess(null);
    setExtractedAudio(null);

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setSuccess(null);

      if (extractedAudio?.url) URL.revokeObjectURL(extractedAudio.url);
      setExtractedAudio(null);

      const bytes = await extractAudio(file, format, (prog) => setProgress(prog));

      const mimeType = format === 'mp3' ? 'audio/mpeg' : format === 'wav' ? 'audio/wav' : 'audio/aac';
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);

      setExtractedAudio({ url: audioUrl, bytes, format });
      setSuccess(`成功抽離 ${format.toUpperCase()} 音訊檔！您可以在下方播放預覽或下載。`);

      // Trigger auto download
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadFile(bytes, `${baseName}.${format}`, mimeType);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '抽離音訊時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAgain = () => {
    if (!extractedAudio || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const mimeType =
      extractedAudio.format === 'mp3' ? 'audio/mpeg' : extractedAudio.format === 'wav' ? 'audio/wav' : 'audio/aac';
    downloadFile(extractedAudio.bytes, `${baseName}.${extractedAudio.format}`, mimeType);
  };

  const resetAll = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (extractedAudio?.url) URL.revokeObjectURL(extractedAudio.url);
    setVideoUrl(null);
    setExtractedAudio(null);
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
              background: 'var(--gradient-audio)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Music size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>一鍵抽出音訊 (Audio Extractor)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              輕鬆將影片中的背景音樂或口播聲音抽離，儲存為 MP3, WAV 或 AAC 檔案。
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
              background: isDraggingOver ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.1)',
              transition: 'all var(--transition-normal)',
            }}
          >
            <UploadCloud
              size={56}
              style={{
                color: isDraggingOver ? '#10b981' : 'var(--text-muted)',
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
                <Film size={22} style={{ color: '#10b981' }} />
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
                maxHeight: '360px',
                marginBottom: '1.5rem',
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                controls
                style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }}
              />
            </div>

            {/* Format selection */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem' }}>選擇輸出音訊格式</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {(['mp3', 'wav', 'aac'] as AudioFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className="glass-button"
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderColor: format === fmt ? '#10b981' : undefined,
                      background: format === fmt ? 'rgba(16, 185, 129, 0.15)' : undefined,
                    }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: format === fmt ? '#10b981' : 'inherit' }}>
                      {fmt.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {fmt === 'mp3' ? '高相容性壓縮檔' : fmt === 'wav' ? '無損高清品質' : '高效能進階音訊'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
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
                onClick={handleExtract}
                disabled={isProcessing}
                className="glass-button glass-button-primary"
                style={{
                  background: 'var(--gradient-audio)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    正在抽出音訊 ({progress}%)...
                  </>
                ) : (
                  <>
                    <Music size={18} /> 一鍵抽出音訊
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
                  <span>音訊提取中...</span>
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
                      background: 'var(--gradient-audio)',
                      transition: 'width 0.2s linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Audio Preview & Re-download */}
            {extractedAudio && (
              <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Volume2 size={20} style={{ color: '#10b981' }} />
                  抽出音訊預覽 ({extractedAudio.format.toUpperCase()})
                </h3>

                <div style={{ marginBottom: '1.25rem' }}>
                  <audio controls src={extractedAudio.url} style={{ width: '100%', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleDownloadAgain}
                    className="glass-button"
                    style={{
                      borderColor: '#10b981',
                      color: '#10b981',
                      fontSize: '0.9rem',
                    }}
                  >
                    <Download size={16} /> 再次下載音訊檔案
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
