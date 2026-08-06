import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  FileImage,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { pdfToImages, createZipFromImages, downloadFile, PdfImageResult } from '../../utils/pdfEngine';

export function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(2.0); // Default to 2x High Res
  const [renderedImages, setRenderedImages] = useState<PdfImageResult[]>([]);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('請上傳有效的 PDF 檔案 (.pdf)');
      return;
    }

    setError(null);
    setSuccess(null);
    setFile(selectedFile);
    setRenderedImages([]);
    setProgress(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const startRender = async () => {
    if (!file) return;

    try {
      setIsRendering(true);
      setError(null);
      setSuccess(null);
      setProgress({ current: 0, total: 0 });

      const images = await pdfToImages(file, {
        format,
        scale,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      });

      setRenderedImages(images);
      setSuccess(`成功將 PDF 轉為 ${images.length} 張圖片！`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'PDF 轉換圖片時發生錯誤，請重試');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadSingleImage = (img: PdfImageResult) => {
    if (!file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const filename = `${baseName}_page_${String(img.pageNum).padStart(3, '0')}.${ext}`;

    downloadFile(img.blob, filename, mime);
  };

  const handleDownloadAllZip = async () => {
    if (!file || renderedImages.length === 0) return;

    try {
      setIsZipping(true);
      setError(null);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const zipBlob = await createZipFromImages(renderedImages, `${baseName}_images`, format);
      downloadFile(zipBlob, `${baseName}_images.zip`, 'application/zip');
      setSuccess('ZIP 壓縮檔下載完成！');
    } catch (err: any) {
      console.error(err);
      setError('打包 ZIP 時發生錯誤');
    } finally {
      setIsZipping(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRenderedImages([]);
    setProgress(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="glass-button" style={{ display: 'inline-flex', marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> 返回工具列表
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-pdf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            <FileImage size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>PDF 轉圖片 (PNG / JPG)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              將 PDF 檔案高畫質轉換為 PNG 或 JPG 圖片，支援單頁下載與一鍵打包 ZIP。
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {!file ? (
          /* Single File Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
              拖曳 PDF 檔案至此處，或點擊選擇檔案
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              支援選擇輸出格式與清晰度解析度
            </p>
          </div>
        ) : (
          /* PDF Image settings & controls */
          <div>
            {/* File info bar */}
            <div
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                <FileText size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="glass-button"
                style={{ fontSize: '0.875rem' }}
              >
                <RotateCcw size={16} /> 更換檔案
              </button>
            </div>

            {/* Format & Resolution options */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Output format */}
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  輸出圖片格式
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className="glass-button"
                    style={{
                      flex: 1,
                      borderColor: format === 'png' ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: format === 'png' ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                      color: format === 'png' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    PNG (無損高品質)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className="glass-button"
                    style={{
                      flex: 1,
                      borderColor: format === 'jpeg' ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: format === 'jpeg' ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                      color: format === 'jpeg' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    JPG (較小檔案)
                  </button>
                </div>
              </div>

              {/* Resolution scale */}
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  渲染解析度 (畫質)
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setScale(1.0)}
                    className="glass-button"
                    style={{
                      flex: 1,
                      borderColor: scale === 1.0 ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: scale === 1.0 ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                      color: scale === 1.0 ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    1x (標準)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(2.0)}
                    className="glass-button"
                    style={{
                      flex: 1,
                      borderColor: scale === 2.0 ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: scale === 2.0 ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                      color: scale === 2.0 ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    2x (高畫質 推薦)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(3.0)}
                    className="glass-button"
                    style={{
                      flex: 1,
                      borderColor: scale === 3.0 ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: scale === 3.0 ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                      color: scale === 3.0 ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    3x (超高畫質)
                  </button>
                </div>
              </div>
            </div>

            {/* Convert trigger if not yet rendered */}
            {renderedImages.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={startRender}
                  disabled={isRendering}
                  className="glass-button glass-button-primary"
                  style={{
                    padding: '0.8rem 2.5rem',
                    fontSize: '1rem',
                    opacity: isRendering ? 0.6 : 1,
                  }}
                >
                  {isRendering ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      {progress && progress.total > 0
                        ? `正在渲染第 ${progress.current} / ${progress.total} 頁...`
                        : '正在開始渲染...'}
                    </>
                  ) : (
                    <>
                      <FileImage size={18} /> 開始轉換為圖片
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Rendered images grid preview */}
            {renderedImages.length > 0 && (
              <div>
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
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    轉換完成！共 {renderedImages.length} 頁圖片
                  </h3>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {isZipping ? (
                      <>
                        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        打包中...
                      </>
                    ) : (
                      <>
                        <Archive size={16} /> 下載全部圖片 (ZIP)
                      </>
                    )}
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                  }}
                >
                  {renderedImages.map((img) => (
                    <div
                      key={img.pageNum}
                      className="glass-panel"
                      style={{
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          background: '#1e293b',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '180px',
                        }}
                      >
                        <img
                          src={img.dataUrl}
                          alt={`第 ${img.pageNum} 頁`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '220px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          }}
                        />
                      </div>

                      <div style={{ padding: '0.75rem 1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ fontWeight: '600' }}>第 {img.pageNum} 頁</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {Math.round(img.width)} × {Math.round(img.height)} px
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingleImage(img)}
                          className="glass-button"
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                        >
                          <Download size={14} /> 下載此頁
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
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
