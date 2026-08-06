import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { mergePdfFiles, getPdfPageCount, downloadFile } from '../../utils/pdfEngine';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount: number | null;
  loadingPageCount: boolean;
}

export function PdfMerge() {
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (files: FileList | File[]) => {
    setError(null);
    setSuccess(null);
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setError('請上傳有效的 PDF 檔案 (.pdf)');
      return;
    }

    const newItems: PdfFileItem[] = pdfFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      pageCount: null,
      loadingPageCount: true,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Fetch page counts asynchronously
    newItems.forEach(async (item) => {
      try {
        const count = await getPdfPageCount(item.file);
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, pageCount: count, loadingPageCount: false } : p))
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, pageCount: 0, loadingPageCount: false } : p))
        );
      }
    });
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
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const clearAll = () => {
    setItems([]);
    setError(null);
    setSuccess(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setError('請至少上傳 2 個 PDF 檔案以進行合併');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const files = items.map((i) => i.file);
      const mergedPdfBytes = await mergePdfFiles(files);

      downloadFile(mergedPdfBytes, `merged_${Date.now()}.pdf`, 'application/pdf');
      setSuccess('PDF 合併成功！檔案已開始自動下載。');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '合併 PDF 時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header breadcrumb & title */}
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
            <Layers size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>一鍵合併 PDF 檔案</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              輕鬆將多個 PDF 文件按自訂順序合併為單一文件，完全在您的瀏覽器本地處理。
            </p>
          </div>
        </div>
      </div>

      {/* Main card container */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,application/pdf"
          multiple
          style={{ display: 'none' }}
        />

        {items.length === 0 ? (
          /* Empty state dropzone */
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
              拖曳多個 PDF 檔案至此處，或點擊選擇檔案
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              支援一次選擇多個 PDF 檔案，無檔案大小上限
            </p>
          </div>
        ) : (
          /* File list & controls */
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
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  已選擇 {items.length} 個檔案 (共 {totalPages} 頁)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  您可以透過上下按鈕調整合併順序
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button"
                  style={{ fontSize: '0.875rem' }}
                >
                  <Plus size={16} /> 新增更多檔案
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="glass-button"
                  style={{ color: '#ef4444', fontSize: '0.875rem' }}
                >
                  <Trash2 size={16} /> 清空全部
                </button>
              </div>
            </div>

            {/* List items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <FileText size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.file.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                        {item.loadingPageCount ? (
                          <span>計算頁數中...</span>
                        ) : (
                          <span>{item.pageCount || 0} 頁</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ordering & delete actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="glass-button"
                      style={{ padding: '0.4rem', opacity: index === 0 ? 0.3 : 1 }}
                      title="向上移動"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === items.length - 1}
                      className="glass-button"
                      style={{ padding: '0.4rem', opacity: index === items.length - 1 ? 0.3 : 1 }}
                      title="向下移動"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="glass-button"
                      style={{ padding: '0.4rem', color: '#ef4444' }}
                      title="刪除此檔案"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dropzone bar for adding more */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1px dashed var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '2rem',
                background: 'rgba(0,0,0,0.05)',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              拖曳更多 PDF 到這裡上傳
            </div>

            {/* Action Bar */}
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
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                準備合併 <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> 個檔案
              </div>

              <button
                type="button"
                onClick={handleMerge}
                disabled={isProcessing || items.length < 2}
                className="glass-button glass-button-primary"
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  opacity: isProcessing || items.length < 2 ? 0.6 : 1,
                  cursor: isProcessing || items.length < 2 ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    正在合併 PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} /> 一鍵合併 PDF
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
