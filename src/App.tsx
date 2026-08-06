import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeoMeta } from './components/SeoMeta';
import { Dashboard } from './pages/Dashboard';
import { ToolPlaceholder } from './pages/ToolPlaceholder';

import { PdfMerge } from './pages/pdf/PdfMerge';
import { PdfSplit } from './pages/pdf/PdfSplit';
import { PdfToImage } from './pages/pdf/PdfToImage';

import { VideoCutter } from './pages/video/VideoCutter';
import { VideoCrop } from './pages/video/VideoCrop';
import { VideoToGif } from './pages/video/VideoToGif';
import { AudioExtractor } from './pages/video/AudioExtractor';

import { AudioCutter } from './pages/audio/AudioCutter';
import { VoiceRecorder } from './pages/audio/VoiceRecorder';

import { ImageConverter } from './pages/converter/ImageConverter';

export default function App() {
  return (
    <HashRouter>
      <SeoMeta />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header Navigation */}
        <Header />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '1rem 0 3rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/category/:category" element={<Dashboard />} />

            {/* Video Tools */}
            <Route path="/video-cutter" element={<VideoCutter />} />
            <Route path="/video-crop" element={<VideoCrop />} />
            <Route path="/video-to-gif" element={<VideoToGif />} />
            <Route path="/audio-extractor" element={<AudioExtractor />} />

            {/* PDF Tools */}
            <Route path="/pdf-merge" element={<PdfMerge />} />
            <Route path="/pdf-split" element={<PdfSplit />} />
            <Route path="/pdf-to-image" element={<PdfToImage />} />

            {/* Audio Tools */}
            <Route path="/audio-cutter" element={<AudioCutter />} />
            <Route path="/voice-recorder" element={<VoiceRecorder />} />

            {/* Converter Tools */}
            <Route path="/image-converter" element={<ImageConverter />} />

            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </HashRouter>
  );
}
