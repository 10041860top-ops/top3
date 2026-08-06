import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Scissors,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { splitPdfFile, pdfToImages, downloadFile, parsePageRanges } from '../../utils/pdfEngine';

export function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'range' | 'select'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1-3');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('請上傳有效的 PDF 檔案 (.pdf)');
      return;
    }

    setError(null);
    setSuccess(null);
    setFile(selectedFile);
    setLoadingThumbnails(true);

    try {
      // Generate lightweight page thumbnails (scale = 0.4) for preview
      const images = await pdfToImages(selectedFile, { scale: 0.4 });
      setThumbnails(images.map((img) => ({ pageNum: img.pageNum, dataUrl: img.dataUrl })));
      
      // Default selection to all pages or 1st page
      setSelectedPages(new Set(images.map((img) => img.pageNum)));
      setRangeInput(`1-${images.length}`);
    } catch (err: any) {
      console.error(err);
      setError('無法讀取 PDF 頁面預覽，請確認檔案格式正確');
    } finally {
      setLoadingThumbnails(false);
    }
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

  const togglePageSelect = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    setSelectedPages(new Set(thumbnails.map((t) => t.pageNum)));
  };

  const clearPageSelection = () => {
    setSelectedPages(new Set());
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setSelectedPages(new Set());
    setError(null);
    setSuccess(null);
  };

  const handleSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      let targetPages: number[] = [];

      if (mode === 'range') {
        // Range string mode
        targetPages = parsePageRanges(rangeInput, thumbnails.length);
      } else {
        // Selection mode (1-indexed to 0-indexed)
        targetPages = Array.from(selectedPages)
          .map((p) => p - 1)
          .sort((a, b) => a - b);
      }

      if (targetPages.length === 0) {
        setError('請至少選擇或指定一頁欲分割的 PDF 頁碼');
        return;
      }

      const splitPdfBytes = await splitPdfFile(file, targetPages);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadFile(splitPdfBytes, `${baseName}_split.pdf`, 'application/pdf');

      setSuccess(`PDF 分割成功！已擷取 ${targetPages.length} 頁，檔案已開始下載。`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分割 PDF 時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
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
            <Scissors size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>PDF 頁面分割與提取</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              自由抽取指定頁碼範圍或選擇特定頁面匯出為全新的 PDF 文件。
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
              上傳後可直接預覽頁面縮圖並設定分割範圍
            </p>
          </div>
        ) : (
          /* PDF file controls & split settings */
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
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • 共 {thumbnails.length} 頁
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

            {/* Split mode switcher */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                分割方式
              </label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setMode('range')}
                  className="glass-button"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    borderColor: mode === 'range' ? 'var(--accent-primary)' : 'var(--glass-border)',
                    background: mode === 'range' ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                    color: mode === 'range' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  指定頁碼範圍 (例如 1-3, 5-8)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="glass-button"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    borderColor: mode === 'select' ? 'var(--accent-primary)' : 'var(--glass-border)',
                    background: mode === 'select' ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                    color: mode === 'select' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  選擇特定頁面 ({selectedPages.size} / {thumbnails.length} 頁)
                </button>
              </div>
            </div>

            {/* Mode Controls */}
            {mode === 'range' ? (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  請輸入頁碼或範圍（使用逗號分隔，如: 1-3, 5, 7-10）：
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder={`例如 1-${thumbnails.length}`}
                  className="glass-input"
                  style={{ fontSize: '1rem' }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    點擊下方縮圖選擇要保留並匯出的頁面：
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={selectAllPages} className="glass-button" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                      全選
                    </button>
                    <button type="button" onClick={clearPageSelection} className="glass-button" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                      取消全選
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Thumbnail grid */}
            {loadingThumbnails ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                <p>正在載入 PDF 頁面預覽...</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '1rem',
                  maxHeight: '480px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  marginBottom: '2rem',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                {thumbnails.map((t) => {
                  const isSelected = selectedPages.has(t.pageNum);
                  return (
                    <div
                      key={t.pageNum}
                      onClick={() => mode === 'select' && togglePageSelect(t.pageNum)}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        cursor: mode === 'select' ? 'pointer' : 'default',
                        border: `2px solid ${
                          mode === 'select' && isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'
                        }`,
                        background: '#1a1f2c',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isSelected ? '0 0 12px var(--glow-color)' : 'none',
                      }}
                    >
                      <img
                        src={t.dataUrl}
                        alt={`第 ${t.pageNum} 頁`}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#fff',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        第 {t.pageNum} 頁
                      </div>

                      {mode === 'select' && isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submit Action */}
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
                onClick={handleSplit}
                disabled={isProcessing || loadingThumbnails}
                className="glass-button glass-button-primary"
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  opacity: isProcessing || loadingThumbnails ? 0.6 : 1,
                  cursor: isProcessing || loadingThumbnails ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    正在分割 PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} /> 分割並下載 PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
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
