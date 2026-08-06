import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Configure pdfjs worker to reliable CDN version matching installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Get total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

/**
 * Merge multiple PDF files into a single PDF document
 */
export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  if (!files || files.length === 0) {
    throw new Error('未選擇任何 PDF 檔案');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Parse page range string like "1-3, 5, 7-10" into 0-indexed page number array
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pagesSet.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pagesSet.add(pageNum - 1);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Split/Extract specified pages from a PDF file
 */
export async function splitPdfFile(
  file: File,
  selectedPagesOrRange: string | number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  let targetIndices: number[] = [];
  if (Array.isArray(selectedPagesOrRange)) {
    targetIndices = selectedPagesOrRange.filter((idx) => idx >= 0 && idx < totalPages);
  } else {
    targetIndices = parsePageRanges(selectedPagesOrRange, totalPages);
  }

  if (targetIndices.length === 0) {
    throw new Error('未指定有效的頁碼範圍');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

export interface PdfImageResult {
  pageNum: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Convert PDF pages into images using pdfjs-dist
 */
export async function pdfToImages(
  file: File,
  options: {
    format?: 'png' | 'jpeg';
    scale?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<PdfImageResult[]> {
  const format = options.format || 'png';
  const scale = options.scale || 1.5;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const results: PdfImageResult[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('無法創建 Canvas 繪圖環境');
    }

    // Fill white background for JPEG
    if (format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL(mimeType, 0.92);
    
    // Convert to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`第 ${i} 頁轉檔失敗`));
      }, mimeType, 0.92);
    });

    results.push({
      pageNum: i,
      dataUrl,
      blob,
      width: viewport.width,
      height: viewport.height,
    });

    if (options.onProgress) {
      options.onProgress(i, numPages);
    }
  }

  return results;
}

/**
 * Create a ZIP file from rendered image pages using JSZip
 */
export async function createZipFromImages(
  images: { pageNum: number; blob: Blob }[],
  filenamePrefix: string = 'pdf_page',
  format: 'png' | 'jpeg' = 'png'
): Promise<Blob> {
  const zip = new JSZip();
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  images.forEach((img) => {
    const fileName = `${filenamePrefix}_${String(img.pageNum).padStart(3, '0')}.${ext}`;
    zip.file(fileName, img.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger download of a Blob or Uint8Array file
 */
export function downloadFile(
  data: Blob | Uint8Array,
  filename: string,
  mimeType: string = 'application/pdf'
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
