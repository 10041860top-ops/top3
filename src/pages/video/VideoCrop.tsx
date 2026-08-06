import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Crop,
  UploadCloud,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Film,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { cropVideo, downloadFile } from '../../utils/ffmpegEngine';

type PresetRatio = '16:9' | '4:3' | '1:1' | '9:16' | 'free';

interface CropBoxState {
  x: number; // in display px relative to container
  y: number;
  w: number;
  h: number;
}

export function VideoCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [preset, setPreset] = useState<PresetRatio>('free');
  const [cropBox, setCropBox] = useState<CropBoxState>({ x: 0, y: 0, w: 200, h: 200 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropBoxState>({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !selectedFile.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setError('請選擇有效的影片檔案 (MP4, WebM, MOV, AVI, MKV)');
      return;
    }

    setError(null);
    setSuccess(null);

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
  };

  const updateCropBoxForPreset = useCallback(
    (ratioType: PresetRatio, containerW: number, containerH: number) => {
      let w = containerW * 0.8;
      let h = containerH * 0.8;

      if (ratioType === '16:9') {
        if (w / (16 / 9) <= containerH) {
          h = w / (16 / 9);
        } else {
          w = h * (16 / 9);
        }
      } else if (ratioType === '4:3') {
        if (w / (4 / 3) <= containerH) {
          h = w / (4 / 3);
        } else {
          w = h * (4 / 3);
        }
      } else if (ratioType === '1:1') {
        const side = Math.min(w, h);
        w = side;
        h = side;
      } else if (ratioType === '9:16') {
        if (h * (9 / 16) <= containerW) {
          w = h * (9 / 16);
        } else {
          h = w / (9 / 16);
        }
      }

      const x = Math.max(0, (containerW - w) / 2);
      const y = Math.max(0, (containerH - h) / 2);
      setCropBox({ x, y, w, h });
    },
    []
  );

  const handleLoadedMetadata = () => {
    if (videoRef.current && containerRef.current) {
      const vW = videoRef.current.videoWidth;
      const vH = videoRef.current.videoHeight;
      setVideoDimensions({ width: vW, height: vH });

      const cW = videoRef.current.clientWidth || 640;
      const cH = videoRef.current.clientHeight || 360;
      setContainerDimensions({ width: cW, height: cH });

      updateCropBoxForPreset(preset, cW, cH);
    }
  };

  const applyPreset = (newPreset: PresetRatio) => {
    setPreset(newPreset);
    if (containerDimensions.width > 0 && containerDimensions.height > 0) {
      updateCropBoxForPreset(newPreset, containerDimensions.width, containerDimensions.height);
    }
  };

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    if (handle) {
      setActiveHandle(handle);
    } else {
      setIsDraggingBox(true);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ ...cropBox });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingBox && !activeHandle) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const { width: cW, height: cH } = containerDimensions;

      if (isDraggingBox) {
        const newX = Math.max(0, Math.min(cW - cropStart.w, cropStart.x + dx));
        const newY = Math.max(0, Math.min(cH - cropStart.h, cropStart.y + dy));
        setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (activeHandle) {
        let newX = cropStart.x;
        let newY = cropStart.y;
        let newW = cropStart.w;
        let newH = cropStart.h;

        if (activeHandle.includes('e')) newW = Math.min(cW - cropStart.x, Math.max(40, cropStart.w + dx));
        if (activeHandle.includes('s')) newH = Math.min(cH - cropStart.y, Math.max(40, cropStart.h + dy));
        if (activeHandle.includes('w')) {
          const possibleW = Math.max(40, cropStart.w - dx);
          newX = cropStart.x + (cropStart.w - possibleW);
          newW = possibleW;
        }
        if (activeHandle.includes('n')) {
          const possibleH = Math.max(40, cropStart.h - dy);
          newY = cropStart.y + (cropStart.h - possibleH);
          newH = possibleH;
        }

        // If preset ratio is set, enforce aspect ratio
        if (preset !== 'free') {
          let targetRatio = 16 / 9;
          if (preset === '4:3') targetRatio = 4 / 3;
          if (preset === '1:1') targetRatio = 1;
          if (preset === '9:16') targetRatio = 9 / 16;

          if (activeHandle.includes('e') || activeHandle.includes('w')) {
            newH = newW / targetRatio;
          } else {
            newW = newH * targetRatio;
          }
        }

        setCropBox({ x: Math.max(0, newX), y: Math.max(0, newY), w: Math.min(cW, newW), h: Math.min(cH, newH) });
      }
    },
    [isDraggingBox, activeHandle, dragStart, cropStart, containerDimensions, preset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingBox(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isDraggingBox || activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBox, activeHandle, handleMouseMove, handleMouseUp]);

  // Convert container crop box to real video pixel box
  const getRealCropBox = () => {
    if (containerDimensions.width === 0 || containerDimensions.height === 0) {
      return { x: 0, y: 0, width: videoDimensions.width, height: videoDimensions.height, videoWidth: videoDimensions.width, videoHeight: videoDimensions.height };
    }
    const scaleX = videoDimensions.width / containerDimensions.width;
    const scaleY = videoDimensions.height / containerDimensions.height;

    const realX = Math.round(cropBox.x * scaleX);
    const realY = Math.round(cropBox.y * scaleY);
    const realW = Math.round(cropBox.w * scaleX);
    const realH = Math.round(cropBox.h * scaleY);

    return {
      x: Math.max(0, realX),
      y: Math.max(0, realY),
      width: Math.min(videoDimensions.width - realX, realW),
      height: Math.min(videoDimensions.height - realY, realH),
      videoWidth: videoDimensions.width,
      videoHeight: videoDimensions.height,
    };
  };

  const handleCrop = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setSuccess(null);

      const targetCrop = getRealCropBox();
      const resultBytes = await cropVideo(file, targetCrop, (prog) => setProgress(prog));

      const fileName = file.name.replace(/\.[^/.]+$/, '');
      downloadFile(resultBytes, `${fileName}_cropped_${targetCrop.width}x${targetCrop.height}.mp4`, 'video/mp4');
      setSuccess('影片裁切成功！檔案已開始自動下載。');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '影片裁切過程中發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoDimensions({ width: 0, height: 0 });
    setError(null);
    setSuccess(null);
  };

  const realCrop = getRealCropBox();

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
            <Crop size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>影片畫面裁切 (Video Crop)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              拖曳調整裁切框或選擇比例預設，精準剔除不需要的影片畫面邊框。
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
            {/* Top bar with presets & reset */}
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
                    原始解析度: {videoDimensions.width} x {videoDimensions.height} px
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['16:9', '4:3', '1:1', '9:16', 'free'] as PresetRatio[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyPreset(r)}
                    className="glass-button"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.85rem',
                      borderColor: preset === r ? 'var(--accent-primary)' : undefined,
                      background: preset === r ? 'rgba(139, 92, 246, 0.25)' : undefined,
                    }}
                  >
                    {r === 'free' ? '自訂' : r}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={resetAll}
                  className="glass-button"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
                >
                  <RotateCcw size={14} /> 更換影片
                </button>
              </div>
            </div>

            {/* Interactive Canvas / Video Crop Overlay Container */}
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                margin: '0 auto 1.5rem',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                display: 'inline-block',
                maxWidth: '100%',
                userSelect: 'none',
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                controls
                style={{ display: 'block', maxWidth: '100%', maxHeight: '500px' }}
              />

              {/* Crop box overlay */}
              {containerDimensions.width > 0 && (
                <div
                  onMouseDown={(e) => handleMouseDown(e, null)}
                  style={{
                    position: 'absolute',
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.w}px`,
                    height: `${cropBox.h}px`,
                    border: '2px dashed #8b5cf6',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                    cursor: 'move',
                    boxSizing: 'border-box',
                    zIndex: 10,
                  }}
                >
                  {/* Info Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Maximize2 size={12} />
                    {realCrop.width} x {realCrop.height} px
                  </div>

                  {/* Corner Resize Handles */}
                  {['nw', 'ne', 'se', 'sw'].map((h) => (
                    <div
                      key={h}
                      onMouseDown={(e) => handleMouseDown(e, h)}
                      style={{
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        background: '#8b5cf6',
                        border: '2px solid #fff',
                        borderRadius: '50%',
                        cursor: `${h}-resize`,
                        top: h.includes('n') ? '-6px' : undefined,
                        bottom: h.includes('s') ? '-6px' : undefined,
                        left: h.includes('w') ? '-6px' : undefined,
                        right: h.includes('e') ? '-6px' : undefined,
                        zIndex: 20,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Target info & action bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                裁切尺寸: <strong style={{ color: 'var(--text-primary)' }}>{realCrop.width} x {realCrop.height} px</strong>{' '}
                (位置: X: {realCrop.x}, Y: {realCrop.y})
              </div>

              <button
                type="button"
                onClick={handleCrop}
                disabled={isProcessing}
                className="glass-button glass-button-primary"
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    正在裁切影片 ({progress}%)...
                  </>
                ) : (
                  <>
                    <Download size={18} /> 開始裁切影片
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
                  <span>影片畫面裁切處理中...</span>
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
