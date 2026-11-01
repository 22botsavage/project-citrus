'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  FileX2,
  ShieldAlert
} from 'lucide-react';
import {
  convertImageLocally,
  ImageConversionResult,
  detectImageFormat,
  SupportedImageFormat
} from '@/lib/tv03-image';
import { formatBytes } from '@/lib/tv01-crypto';

type ConversionState = 'idle' | 'file-selected' | 'processing' | 'success' | 'error';

export default function ImageConverter() {
  const [state, setState] = useState<ConversionState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<SupportedImageFormat | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageConversionResult | null>(null);
  const [outputObjectUrl, setOutputObjectUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadInitiated, setDownloadInitiated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up Object URLs when unmounting or switching files
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
    };
  }, [previewUrl, outputObjectUrl]);

  const cleanupArtifacts = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (outputObjectUrl) {
      URL.revokeObjectURL(outputObjectUrl);
      setOutputObjectUrl(null);
    }
    setResult(null);
    setDownloadInitiated(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processSelectedFile(files[0]);
  };

  const processSelectedFile = async (file: File) => {
    cleanupArtifacts();
    setErrorMessage(null);
    setSelectedFile(file);

    try {
      // Validate magic bytes early
      const fmt = await detectImageFormat(file);
      setDetectedFormat(fmt);

      // Create preview URL for valid image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setState('file-selected');
    } catch (err) {
      setDetectedFormat(null);
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid file format. Only JPG and PNG are supported.'
      );
      setState('error');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setErrorMessage('No file selected to convert.');
      setState('error');
      return;
    }

    if (state === 'processing') return;

    setState('processing');
    setErrorMessage(null);

    try {
      const conversionResult = await convertImageLocally(selectedFile);
      const url = URL.createObjectURL(conversionResult.blob);

      setResult(conversionResult);
      setOutputObjectUrl(url);
      setState('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during local image conversion.'
      );
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!outputObjectUrl || !result) return;

    const tempLink = document.createElement('a');
    tempLink.href = outputObjectUrl;
    tempLink.download = result.outputFilename;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    setDownloadInitiated(true);
  };

  const handleReset = () => {
    cleanupArtifacts();
    setSelectedFile(null);
    setDetectedFormat(null);
    setErrorMessage(null);
    setState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper generators for instant, in-browser test fixtures
  const generateSampleTransparentPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a translucent background with geometric shapes
    // Transparent background is left default (rgba(0,0,0,0))
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;

    // Solid blue circle
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, Math.PI * 2);
    ctx.fill();

    // Semi-transparent amber badge
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.beginPath();
    ctx.roundRect(180, 100, 160, 100, [16]);
    ctx.fill();

    // White label text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Project Citrus', 200, 145);
    ctx.font = '12px sans-serif';
    ctx.fillText('Alpha Layer Test', 200, 170);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'citrus_alpha_sample.png', {
        type: 'image/png',
        lastModified: Date.now(),
      });
      processSelectedFile(file);
    }, 'image/png');
  };

  const generateSampleJpg = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a landscape gradient
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(0.5, '#1E293B');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);

    // Decorative graphics
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(200, 150, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Citrus Sample JPG', 200, 145);
    ctx.font = '12px sans-serif';
    ctx.fillText('Ready for PNG Lossless Conversion', 200, 170);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'citrus_photo_sample.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        processSelectedFile(file);
      },
      'image/jpeg',
      0.9
    );
  };

  const generateSampleCorruptedFile = () => {
    // Generate file with invalid/truncated bytes
    const badBytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34, 0x56, 0x78]);
    const blob = new Blob([badBytes], { type: 'image/jpeg' });
    const file = new File([blob], 'corrupted_sample.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    processSelectedFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Main Prototype Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4 bg-neutral-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                TV-03 Engine
              </span>
              <span className="text-xs font-medium text-neutral-500">
                JPG ↔ PNG In-Browser Conversion
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mt-1">
              Browser-Local JPG &amp; PNG Image Converter
            </h3>
          </div>

          {/* State Indicator Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">State:</span>
            {state === 'idle' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
                Idle
              </span>
            )}
            {state === 'file-selected' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                File Selected
              </span>
            )}
            {state === 'processing' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                Converting Locally
              </span>
            )}
            {state === 'success' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Converted
              </span>
            )}
            {state === 'error' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Failure
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* File Picker Zone */}
          {state === 'idle' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Select JPG or PNG image to convert"
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-base font-semibold text-neutral-800">
                  Select a local JPG or PNG image to convert
                </p>
                <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                  Automatically routes: <strong>JPG → PNG</strong> or <strong>PNG → JPG</strong>.
                  All decoding and encoding happens 100% locally in your browser memory.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50">
                  <ImageIcon className="w-4 h-4 text-neutral-500" />
                  Browse Device Images
                </div>
              </div>

              {/* Instant Test Fixture Buttons */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Built-in Test Fixtures (No Local Files Needed):
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={generateSampleTransparentPng}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-medium transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Load Transparent PNG (TC-IMG-03/04)
                  </button>
                  <button
                    type="button"
                    onClick={generateSampleJpg}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-medium transition flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Load Sample JPG (TC-IMG-01)
                  </button>
                  <button
                    type="button"
                    onClick={generateSampleCorruptedFile}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-medium transition flex items-center gap-1.5"
                  >
                    <FileX2 className="w-3.5 h-3.5 text-red-600" />
                    Load Corrupted Fixture (TC-IMG-09)
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected / Converted State */}
          {selectedFile && (
            <div className="space-y-6">
              {/* File Overview Card */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0 overflow-hidden">
                      {previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewUrl}
                          alt="Source Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 text-sm break-all">
                          {selectedFile.name}
                        </span>
                        {detectedFormat && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-white uppercase tracking-wider">
                            {detectedFormat}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 mt-1">
                        <span>
                          <strong className="text-neutral-700 font-medium">Input Size:</strong>{' '}
                          {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString()} bytes)
                        </span>
                        <span>
                          <strong className="text-neutral-700 font-medium">Conversion Path:</strong>{' '}
                          {detectedFormat === 'jpeg' ? (
                            <span className="font-semibold text-blue-700">JPG → PNG (Lossless)</span>
                          ) : detectedFormat === 'png' ? (
                            <span className="font-semibold text-amber-700">PNG → JPG (Lossy, White BG)</span>
                          ) : (
                            'Determining...'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {state !== 'processing' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset / Pick Another
                    </button>
                  )}
                </div>

                {/* Mandatory Transparency Loss Warning for PNG -> JPG */}
                {detectedFormat === 'png' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-semibold">
                        PNG Transparency Flattening Notice:
                      </strong>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        JPEG format does not support transparency (alpha channels). All transparent and semi-transparent pixels will be permanently flattened onto an opaque pure white (<code>#FFFFFF</code>) background. JPEG encoding is also lossy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Source Preservation Guarantee Badge */}
                <div className="pt-2 border-t border-neutral-200/70 flex items-center gap-2 text-xs text-neutral-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-neutral-800 font-medium">Source preservation:</strong>{' '}
                    The source image is read as an in-memory buffer. Your original file remains 100% unaltered.
                  </span>
                </div>
              </div>

              {/* Action Trigger Button */}
              {state === 'file-selected' && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConvert}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-medium text-sm transition shadow-sm"
                  >
                    <span>Execute Conversion</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                  <span className="text-xs text-neutral-500">
                    Runs 100% in-browser via Canvas &amp; ImageBitmap. Zero server uploads.
                  </span>
                </div>
              )}

              {/* Processing Progress Bar */}
              {state === 'processing' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-amber-900 font-medium">
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      Decoding bitmap, compositing canvas, and stripping metadata...
                    </span>
                    <span className="text-xs text-amber-700">Client Memory</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full w-3/4 animate-pulse" />
                  </div>
                  <p className="text-xs text-amber-700">
                    Actions are disabled during active processing to prevent memory conflicts.
                  </p>
                </div>
              )}

              {/* Conversion Success View */}
              {state === 'success' && result && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-neutral-900">
                          Conversion Completed Successfully
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          {result.durationMs} ms
                        </span>
                        <span>
                          Dimensions: <strong>{result.width} × {result.height} px</strong>
                        </span>
                      </div>
                    </div>

                    {/* Before & After Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Input ({result.sourceFormat.toUpperCase()})
                        </span>
                        <div className="text-sm font-bold text-neutral-800">
                          {formatBytes(result.sourceSizeBytes)}
                        </div>
                        <p className="text-neutral-500 text-[11px]">
                          Original container file
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                          Converted Output ({result.targetFormat.toUpperCase()})
                        </span>
                        <div className="text-sm font-bold text-emerald-900">
                          {formatBytes(result.outputSizeBytes)}
                        </div>
                        <p className="text-emerald-700 text-[11px]">
                          {result.targetFormat === 'png'
                            ? 'Lossless PNG container (may expand for photos)'
                            : 'Lossy JPEG container (transparency flattened to white)'}
                        </p>
                      </div>
                    </div>

                    {/* Structural Metadata Verification Card */}
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Structural Metadata Verification:
                        </span>
                        {result.metadataValidation.isClean ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            CLEAN (EXIF/GPS STRIPPED)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold text-[10px]">
                            METADATA DETECTED
                          </span>
                        )}
                      </div>
                      <ul className="text-[11px] text-neutral-600 space-y-1 list-disc list-inside">
                        {result.metadataValidation.findings.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                      <div className="text-[10px] text-neutral-400 pt-1">
                        Inspected markers/chunks: {result.metadataValidation.checkedMarkersOrChunks.join(', ') || 'Standard headers'}
                      </div>
                    </div>

                    {/* Download & Actions Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs shadow-xs transition"
                        >
                          <Download className="w-4 h-4" />
                          Download Converted {result.targetFormat.toUpperCase()} ({result.outputFilename})
                        </button>
                      </div>

                      <div className="text-xs text-neutral-500">
                        {downloadInitiated ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Download triggered to browser save manager
                          </span>
                        ) : (
                          <span>Blob ready in browser memory</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message Display */}
              {state === 'error' && errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 text-sm space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Conversion Error
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed font-mono bg-red-100/60 p-2.5 rounded border border-red-200">
                    {errorMessage}
                  </p>
                  <p className="text-xs text-red-600">
                    Sensitive file contents are never exposed in error outputs.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scope Boundaries Disclaimer */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-neutral-800">
          <Info className="w-4 h-4 text-neutral-500" />
          <span>TV-03 Scope Boundaries &amp; Format Policy</span>
        </div>
        <p className="leading-relaxed">
          Project Citrus MVP-1 supports strictly <strong>JPG → PNG</strong> and <strong>PNG → JPG</strong> conversions.
          Formats such as HEIC, WebP, GIF, SVG, TIFF, and RAW are disabled by design. Same-format re-encoding (JPG → JPG, PNG → PNG) is deferred to preserve clear user expectations.
        </p>
      </div>
    </div>
  );
}
