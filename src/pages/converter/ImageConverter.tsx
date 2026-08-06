import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  UploadCloud,
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Archive,
  Trash2,
  Plus,
  Sliders,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';

export type TargetFormat = 'JPG' | 'PNG' | 'WEBP' | 'GIF';

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  targetFormat: TargetFormat;
  quality: number; // 10 to 100
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number | null;
  status: 'idle' | 'converting' | 'done' | 'error';
  errorMessage?: string;
}

export function ImageConverter() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalFormat, setGlobalFormat] = useState<TargetFormat>('WEBP');
  const [globalQuality, setGlobalQuality] = useState<number>(85);
  const [isBatchConverting, setIsBatchConverting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
        if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
      });
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMimeType = (format: TargetFormat): string => {
    switch (format) {
      case 'JPG':
        return 'image/jpeg';
      case 'PNG':
        return 'image/png';
      case 'WEBP':
        return 'image/webp';
      case 'GIF':
        return 'image/gif';
      default:
        return 'image/png';
    }
  };

  const getExtension = (format: TargetFormat): string => {
    switch (format) {
      case 'JPG':
        return 'jpg';
      case 'PNG':
        return 'png';
      case 'WEBP':
        return 'webp';
      case 'GIF':
        return 'gif';
    }
  };

  const handleFilesAdded = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      return (
        type.startsWith('image/') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif') ||
        name.endsWith('.bmp') ||
        name.endsWith('.svg')
      );
    });

    if (validFiles.length === 0) {
      setError('請選擇支援的圖片格式 (JPG, PNG, WEBP, GIF, BMP, SVG)');
      return;
    }

    setError(null);

    const newItemsPromises = validFiles.map((file) => {
      return new Promise<ImageItem>((resolve) => {
        const id = Math.random().toString(36).substring(2, 9);
        const previewUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          resolve({
            id,
            file,
            previewUrl,
            originalWidth: img.naturalWidth || img.width || 0,
            originalHeight: img.naturalHeight || img.height || 0,
            originalSize: file.size,
            targetFormat: globalFormat,
            quality: globalQuality,
            convertedBlob: null,
            convertedUrl: null,
            convertedSize: null,
            status: 'idle',
          });
        };

        img.onerror = () => {
          // Fallback if metadata fails to parse
          resolve({
            id,
            file,
            previewUrl,
            originalWidth: 0,
            originalHeight: 0,
            originalSize: file.size,
            targetFormat: globalFormat,
            quality: globalQuality,
            convertedBlob: null,
            convertedUrl: null,
            convertedSize: null,
            status: 'idle',
          });
        };

        img.src = previewUrl;
      });
    });

    const newItems = await Promise.all(newItemsPromises);
    setImages((prev) => [...prev, ...newItems]);
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

  const convertSingleImage = (item: ImageItem): Promise<{ blob: Blob; url: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width || 800;
          const height = img.naturalHeight || img.height || 600;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('無法建立 Canvas 繪圖畫筆'));
            return;
          }

          const targetMime = getMimeType(item.targetFormat);

          // Fill white background for JPEG since JPEG does not support transparency
          if (item.targetFormat === 'JPG') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          const qualityFactor = Math.max(0.1, Math.min(1.0, item.quality / 100));

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve({ blob, url, size: blob.size });
              } else {
                // Fallback to PNG if browser cannot encode target format
                canvas.toBlob(
                  (fallbackBlob) => {
                    if (fallbackBlob) {
                      const url = URL.createObjectURL(fallbackBlob);
                      resolve({ blob: fallbackBlob, url, size: fallbackBlob.size });
                    } else {
                      reject(new Error('圖片轉檔失敗'));
                    }
                  },
                  'image/png'
                );
              }
            },
            targetMime,
            qualityFactor
          );
        } catch (err: any) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('載入圖片失敗'));
      };

      img.src = item.previewUrl;
    });
  };

  const handleConvertItem = async (id: string) => {
    const targetItem = images.find((item) => item.id === id);
    if (!targetItem) return;

    setImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'converting', errorMessage: undefined } : item))
    );

    try {
      const res = await convertSingleImage(targetItem);

      // Clean up previous converted URL if exists
      if (targetItem.convertedUrl) {
        URL.revokeObjectURL(targetItem.convertedUrl);
      }

      setImages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'done',
                convertedBlob: res.blob,
                convertedUrl: res.url,
                convertedSize: res.size,
              }
            : item
        )
      );
    } catch (err: any) {
      console.error(err);
      setImages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'error',
                errorMessage: err.message || '轉檔失敗',
              }
            : item
        )
      );
    }
  };

  const handleBatchConvert = async () => {
    if (images.length === 0) return;

    setIsBatchConverting(true);
    setError(null);
    setSuccess(null);

    // Set all to converting status
    setImages((prev) =>
      prev.map((item) => ({ ...item, status: 'converting', errorMessage: undefined }))
    );

    let successCount = 0;
    let failCount = 0;

    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      const item = updatedImages[i];
      try {
        const res = await convertSingleImage(item);
        if (item.convertedUrl) {
          URL.revokeObjectURL(item.convertedUrl);
        }
        updatedImages[i] = {
          ...item,
          status: 'done',
          convertedBlob: res.blob,
          convertedUrl: res.url,
          convertedSize: res.size,
        };
        successCount++;
      } catch (err: any) {
        updatedImages[i] = {
          ...item,
          status: 'error',
          errorMessage: err.message || '轉檔失敗',
        };
        failCount++;
      }
    }

    setImages(updatedImages);
    setIsBatchConverting(false);

    if (failCount === 0) {
      setSuccess(`成功轉換全部 ${successCount} 張圖片！`);
    } else {
      setError(`轉換完成：${successCount} 張成功，${failCount} 張失敗。`);
    }
  };

  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.convertedBlob || !item.convertedUrl) return;

    const originalName = item.file.name;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const ext = getExtension(item.targetFormat);
    const downloadName = `${baseName}.${ext}`;

    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;

    try {
      setIsZipping(true);
      setError(null);

      // Convert any items that haven't been converted yet
      const currentImages = [...images];
      const zip = new JSZip();

      const nameCounts: Record<string, number> = {};

      for (let i = 0; i < currentImages.length; i++) {
        let item = currentImages[i];
        if (item.status !== 'done' || !item.convertedBlob) {
          try {
            const res = await convertSingleImage(item);
            item = {
              ...item,
              status: 'done',
              convertedBlob: res.blob,
              convertedUrl: res.url,
              convertedSize: res.size,
            };
            currentImages[i] = item;
          } catch (err: any) {
            console.error(`Error converting ${item.file.name}:`, err);
            continue;
          }
        }

        if (item.convertedBlob) {
          const originalName = item.file.name;
          const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const ext = getExtension(item.targetFormat);

          let fileName = `${baseName}.${ext}`;
          if (nameCounts[fileName]) {
            nameCounts[fileName]++;
            fileName = `${baseName}_${nameCounts[fileName]}.${ext}`;
          } else {
            nameCounts[fileName] = 1;
          }

          zip.file(fileName, item.convertedBlob);
        }
      }

      setImages(currentImages);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = 'converted_images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
      setSuccess('ZIP 壓縮包已成功匯出並開始下載！');
    } catch (err: any) {
      console.error(err);
      setError('打包 ZIP 時發生錯誤');
    } finally {
      setIsZipping(false);
    }
  };

  const handleApplyGlobalFormat = (format: TargetFormat) => {
    setGlobalFormat(format);
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        targetFormat: format,
        status: 'idle',
      }))
    );
  };

  const handleApplyGlobalQuality = (quality: number) => {
    setGlobalQuality(quality);
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        quality,
        status: 'idle',
      }))
    );
  };

  const handleItemFormatChange = (id: string, format: TargetFormat) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, targetFormat: format, status: 'idle' } : item
      )
    );
  };

  const handleItemQualityChange = (id: string, quality: number) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quality, status: 'idle' } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    const itemToRemove = images.find((i) => i.id === id);
    if (itemToRemove) {
      if (itemToRemove.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl);
      if (itemToRemove.convertedUrl) URL.revokeObjectURL(itemToRemove.convertedUrl);
    }
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setImages([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/"
          className="glass-button"
          style={{
            display: 'inline-flex',
            marginBottom: '1rem',
            padding: '0.4rem 0.8rem',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={16} /> 返回工具列表
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-converter)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
            }}
          >
            <RefreshCw size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>圖片格式轉換工具</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              支援 JPG, PNG, WEBP, GIF, BMP, SVG 多圖批次轉換，可獨立調整目標格式與 compression 畫質，100% 瀏覽器本地處理。
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <input
          type="file"
          ref={addMoreInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {images.length === 0 ? (
          /* Empty State Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDraggingOver ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '4.5rem 2rem',
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
              拖曳多張圖片至此處，或點擊選擇圖片檔案
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              支援格式：JPG, PNG, WEBP, GIF, BMP, SVG (可一次選擇多檔)
            </p>
          </div>
        ) : (
          /* Active Image List & Controls */
          <div>
            {/* Control Toolbar */}
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Batch Format & Quality Controls */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.5rem',
                  alignItems: 'center',
                }}
              >
                {/* Global Format Picker */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Sliders size={16} /> 批次統一目標格式：
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['WEBP', 'JPG', 'PNG', 'GIF'] as TargetFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleApplyGlobalFormat(fmt)}
                        className="glass-button"
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.875rem',
                          borderColor:
                            globalFormat === fmt ? 'var(--accent-primary)' : 'var(--glass-border)',
                          background:
                            globalFormat === fmt
                              ? 'rgba(139, 92, 246, 0.2)'
                              : 'var(--glass-bg)',
                          color:
                            globalFormat === fmt
                              ? 'var(--accent-primary)'
                              : 'var(--text-primary)',
                          fontWeight: globalFormat === fmt ? '600' : 'normal',
                        }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Global Quality Slider */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      批次統一壓縮畫質 (Quality)：
                    </label>
                    <span
                      style={{
                        fontWeight: '700',
                        color: 'var(--accent-primary)',
                        fontSize: '0.9rem',
                      }}
                    >
                      {globalQuality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={globalQuality}
                    onChange={(e) => handleApplyGlobalQuality(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--accent-primary)',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="glass-button"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Plus size={16} /> 新增圖片
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="glass-button"
                    style={{ fontSize: '0.875rem', color: '#ef4444' }}
                  >
                    <Trash2 size={16} /> 清空列表
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    已選擇 {images.length} 個圖檔
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleBatchConvert}
                    disabled={isBatchConverting || isZipping}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {isBatchConverting ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        轉檔中...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} /> 一鍵轉換全部
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isBatchConverting || isZipping}
                    className="glass-button glass-button-primary"
                    style={{
                      fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    }}
                  >
                    {isZipping ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        打包中...
                      </>
                    ) : (
                      <>
                        <Archive size={16} /> 一鍵轉換並下載全部 (ZIP)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Images List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {images.map((item) => {
                const isJPG = item.targetFormat === 'JPG';
                const isWEBP = item.targetFormat === 'WEBP';
                const isQualitySupported = isJPG || isWEBP;

                let compressionRatioStr = '';
                if (item.convertedSize && item.originalSize > 0) {
                  const diff = item.convertedSize - item.originalSize;
                  const percent = Math.round((diff / item.originalSize) * 100);
                  if (percent < 0) {
                    compressionRatioStr = `(${percent}%)`;
                  } else {
                    compressionRatioStr = `(+${percent}%)`;
                  }
                }

                return (
                  <div
                    key={item.id}
                    className="glass-panel"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Thumbnail Preview */}
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: 'var(--radius-md)',
                        background:
                          'backgroundImage' in document.body.style
                            ? '#1e293b'
                            : 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      <img
                        src={item.convertedUrl || item.previewUrl}
                        alt={item.file.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    {/* Image Meta Info */}
                    <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          marginBottom: '0.25rem',
                          wordBreak: 'break-all',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={item.file.name}
                      >
                        {item.file.name}
                      </div>

                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          原圖: {item.originalWidth > 0 ? `${item.originalWidth} × ${item.originalHeight} px` : '讀取中'}
                        </span>
                        <span>大小: {formatFileSize(item.originalSize)}</span>
                      </div>

                      {/* Status indicator */}
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                        {item.status === 'idle' && (
                          <span style={{ color: 'var(--text-muted)' }}>待轉換</span>
                        )}
                        {item.status === 'converting' && (
                          <span
                            style={{
                              color: 'var(--accent-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Loader2
                              size={12}
                              className="animate-spin"
                              style={{ animation: 'spin 1s linear infinite' }}
                            />
                            正在轉換...
                          </span>
                        )}
                        {item.status === 'done' && item.convertedSize && (
                          <span
                            style={{
                              color: '#34d399',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontWeight: '600',
                            }}
                          >
                            <CheckCircle2 size={14} /> 已完成 ({formatFileSize(item.convertedSize)}{' '}
                            {compressionRatioStr})
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span
                            style={{
                              color: '#f87171',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <AlertCircle size={14} /> {item.errorMessage || '失敗'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target Format selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        目標格式
                      </span>
                      <select
                        value={item.targetFormat}
                        onChange={(e) =>
                          handleItemFormatChange(item.id, e.target.value as TargetFormat)
                        }
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.85rem',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="WEBP" style={{ background: '#1e293b' }}>WEBP</option>
                        <option value="JPG" style={{ background: '#1e293b' }}>JPG</option>
                        <option value="PNG" style={{ background: '#1e293b' }}>PNG</option>
                        <option value="GIF" style={{ background: '#1e293b' }}>GIF</option>
                      </select>
                    </div>

                    {/* Quality slider */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        minWidth: '130px',
                        opacity: isQualitySupported ? 1 : 0.4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>品質</span>
                        <span>{item.quality}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        disabled={!isQualitySupported}
                        value={item.quality}
                        onChange={(e) =>
                          handleItemQualityChange(item.id, parseInt(e.target.value, 10))
                        }
                        style={{
                          width: '100%',
                          accentColor: 'var(--accent-primary)',
                          cursor: isQualitySupported ? 'pointer' : 'not-allowed',
                        }}
                      />
                    </div>

                    {/* Per-item Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginLeft: 'auto',
                      }}
                    >
                      {item.status === 'done' ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          className="glass-button"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            borderColor: '#34d399',
                            color: '#34d399',
                          }}
                        >
                          <Download size={14} /> 下載
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConvertItem(item.id)}
                          disabled={item.status === 'converting'}
                          className="glass-button"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          {item.status === 'converting' ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                              style={{ animation: 'spin 1s linear infinite' }}
                            />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          轉換
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="glass-button"
                        title="移除圖片"
                        style={{
                          padding: '0.4rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Feedback Notifications */}
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
