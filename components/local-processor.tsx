'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Cpu,
  ShieldCheck,
  Clock,
  HardDrive,
  FileCode,
  Info
} from 'lucide-react';
import {
  isWebCryptoSupported,
  formatBytes,
  computeFileSha256,
  createArtifactBlob,
  ComputationResult,
  ArtifactData
} from '@/lib/tv01-crypto';

type ProcessingState = 'idle' | 'file-selected' | 'processing' | 'success' | 'error';
type DownloadState = 'not-ready' | 'prepared' | 'download-initiated';

export default function LocalProcessor() {
  const [state, setState] = useState<ProcessingState>('idle');
  const [downloadState, setDownloadState] = useState<DownloadState>('not-ready');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computation, setComputation] = useState<ComputationResult | null>(null);
  const [artifact, setArtifact] = useState<{
    blob: Blob;
    artifactJson: ArtifactData;
    defaultFilename: string;
    objectUrl: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const webCryptoAvailable = useSyncExternalStore(
    () => () => {},
    () => isWebCryptoSupported(),
    () => true
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount or when artifact changes
  useEffect(() => {
    return () => {
      if (artifact?.objectUrl) {
        URL.revokeObjectURL(artifact.objectUrl);
      }
    };
  }, [artifact]);

  const cleanupArtifact = () => {
    if (artifact?.objectUrl) {
      URL.revokeObjectURL(artifact.objectUrl);
    }
    setArtifact(null);
    setDownloadState('not-ready');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    loadFile(file);
  };

  const loadFile = (file: File) => {
    cleanupArtifact();
    setComputation(null);
    setErrorMessage(null);
    setSelectedFile(file);
    setState('file-selected');
  };

  // Provide a convenient in-memory sample text file generator for frictionless testing
  const loadSampleFile = () => {
    const sampleContent = `Project Citrus — TV-01 Browser-Local Processing Prototype
Milestone: MVP-1
Execution Environment: Local Web Browser Client
Timestamp: ${new Date().toISOString()}

Testing browser-local file handling, Web Crypto API computation, and memory-safe artifact generation.`;
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const sampleFile = new File([blob], 'citrus_sample_document.txt', {
      type: 'text/plain',
      lastModified: Date.now(),
    });
    loadFile(sampleFile);
  };

  const handleCompute = async () => {
    if (!selectedFile) {
      setErrorMessage('No file selected to process.');
      setState('error');
      return;
    }

    if (state === 'processing') {
      // Prevent accidental duplicate processing while running
      return;
    }

    setState('processing');
    setErrorMessage(null);

    try {
      if (!isWebCryptoSupported()) {
        throw new Error(
          'Web Crypto API is unavailable in this browser environment. Ensure the page is served over HTTPS or localhost and supports window.crypto.subtle.'
        );
      }

      // Perform local computation
      const result = await computeFileSha256(selectedFile);
      setComputation(result);

      // Generate in-memory artifact Blob
      const { blob, artifactJson, defaultFilename } = createArtifactBlob(
        selectedFile,
        result
      );
      const objectUrl = URL.createObjectURL(blob);

      setArtifact({
        blob,
        artifactJson,
        defaultFilename,
        objectUrl,
      });

      setDownloadState('prepared');
      setState('success');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during local computation.';
      setErrorMessage(message);
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!artifact) return;

    // Trigger browser download via temporary anchor
    const tempLink = document.createElement('a');
    tempLink.href = artifact.objectUrl;
    tempLink.download = artifact.defaultFilename;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    // Honestly report download initiation (browser cannot programmatically confirm file write completion)
    setDownloadState('download-initiated');
  };

  const handleReset = () => {
    cleanupArtifact();
    setComputation(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyDigest = async () => {
    if (!computation) return;
    try {
      await navigator.clipboard.writeText(computation.digestHex);
      setCopiedDigest(true);
      setTimeout(() => setCopiedDigest(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyJson = async () => {
    if (!artifact) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(artifact.artifactJson, null, 2)
      );
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment status warning if Web Crypto is absent */}
      {!webCryptoAvailable && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">
              Web Crypto API Not Detected
            </h4>
            <p className="mt-1">
              Your browser environment does not expose <code>window.crypto.subtle</code>.
              SHA-256 computation requires a modern secure context (HTTPS or localhost).
            </p>
          </div>
        </div>
      )}

      {/* Main Prototype Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4 bg-neutral-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                TV-01 Prototype
              </span>
              <span className="text-xs font-medium text-neutral-500">
                P0 Technical Proof of Concept
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mt-1">
              Local File Selection &amp; SHA-256 Digest
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
                Processing (Local)
              </span>
            )}
            {state === 'success' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Success
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
                aria-label="Select local text file"
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-base font-semibold text-neutral-800">
                  Select a local text file to test
                </p>
                <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                  Accepts local files (e.g., <code>.txt</code>, plain text).
                  Processing happens 100% in your browser memory via Web Crypto.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  Browse Device Files
                </div>
              </div>

              {/* Sample file fallback button */}
              <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                <span>Want to test without selecting a file from disk?</span>
                <button
                  type="button"
                  onClick={loadSampleFile}
                  className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Load Built-in Sample Text File
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected / Processed State */}
          {selectedFile && (
            <div className="space-y-6">
              {/* File Metadata Overview (TV01-AC-01) */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 text-sm break-all">
                          {selectedFile.name}
                        </span>
                        {selectedFile.size === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Empty (0 B)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 mt-0.5">
                        <span>
                          <strong className="text-neutral-700 font-medium">Size:</strong>{' '}
                          {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString()} bytes)
                        </span>
                        <span>
                          <strong className="text-neutral-700 font-medium">Type:</strong>{' '}
                          {selectedFile.type || 'text/plain (unspecified)'}
                        </span>
                        <span>
                          <strong className="text-neutral-700 font-medium">Modified:</strong>{' '}
                          {new Date(selectedFile.lastModified).toLocaleDateString()}
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

                {/* Source Preservation Guarantee Badge (TV01-AC-04) */}
                <div className="mt-3 pt-3 border-t border-neutral-200/70 flex items-center gap-2 text-xs text-neutral-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-neutral-800 font-medium">Source preservation:</strong>{' '}
                    This file is read as an in-memory buffer only. The original file on your storage is never modified or overwritten.
                  </span>
                </div>
              </div>

              {/* Action Trigger Button */}
              {state === 'file-selected' && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCompute}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Compute SHA-256 Digest Locally
                  </button>
                  <span className="text-xs text-neutral-500">
                    Runs in-browser via <code>crypto.subtle.digest</code>. Zero network requests.
                  </span>
                </div>
              )}

              {/* Processing Progress Bar */}
              {state === 'processing' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-amber-900 font-medium">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin text-amber-600" />
                      Executing Web Crypto SHA-256 digest...
                    </span>
                    <span className="text-xs text-amber-700">Client Memory</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-xs text-amber-700">
                    Duplicate actions are disabled while computation runs.
                  </p>
                </div>
              )}

              {/* Success Result (TV01-AC-02 & TV01-AC-03) */}
              {state === 'success' && computation && (
                <div className="space-y-5">
                  {/* Digest Display */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-semibold text-neutral-900">
                          Computed SHA-256 Digest
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          {computation.durationMs} ms
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                          {computation.byteLength} bytes processed
                        </span>
                      </div>
                    </div>

                    {/* Monospace Digest with Copy Button */}
                    <div className="relative group">
                      <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 font-mono text-xs break-all pr-20 select-all border border-neutral-800">
                        {computation.digestHex}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDigest}
                        className="absolute right-2 top-2 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-sans transition flex items-center gap-1 border border-neutral-700"
                        title="Copy digest to clipboard"
                      >
                        {copiedDigest ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {selectedFile.size === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                        Notice: Input file size was 0 bytes. This is the standard cryptographic SHA-256 digest of an empty stream.
                      </p>
                    )}
                  </div>

                  {/* Output Artifact Section (TV01-AC-03 & TV01-AC-04) */}
                  {artifact && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Output Artifact (In-Memory Blob)
                            </span>
                            <span className="text-xs text-neutral-500">
                              {formatBytes(artifact.blob.size)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1">
                            Receipt artifact prepared in browser memory containing computation parameters and source preservation notice.
                          </p>
                        </div>

                        {/* Download Action */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs shadow-xs transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Artifact (.json)
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyJson}
                            className="px-3 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition"
                            title="Copy receipt JSON"
                          >
                            {copiedJson ? 'Copied' : 'Copy JSON'}
                          </button>
                        </div>
                      </div>

                      {/* Explicit Download Lifecycle Reporting (TV01-AC-03) */}
                      <div className="rounded-lg bg-white border border-neutral-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-neutral-800 font-semibold">
                            Download status:
                          </strong>
                          {downloadState === 'prepared' && (
                            <span className="text-blue-700 font-medium">
                              Artifact prepared in browser memory (Blob URL ready)
                            </span>
                          )}
                          {downloadState === 'download-initiated' && (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Download initiated to browser save manager
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] leading-relaxed">
                          Note: Standard web browsers do not expose a programmatic completion event for user disk writes. This prototype honestly distinguishes artifact generation from browser download initiation.
                        </p>
                      </div>

                      {/* Explicit Media Disclaimer (TV01-AC-03) */}
                      <div className="rounded-lg bg-neutral-100 border border-neutral-200 p-3 text-xs text-neutral-700 flex items-start gap-2">
                        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-neutral-900">
                            Prototype Artifact Scope Disclaimer:
                          </strong>{' '}
                          This downloaded artifact is a JSON computation receipt. It is{' '}
                          <strong>NOT</strong> a compressed PDF and <strong>NOT</strong> a converted image. TV-01 proves browser-local compute and file artifact generation only.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message Display (TV01-AC-05) */}
              {state === 'error' && errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 text-sm space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Computation Error
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed font-mono bg-red-100/60 p-2.5 rounded border border-red-200">
                    {errorMessage}
                  </p>
                  <p className="text-xs text-red-600">
                    Sensitive file contents are never included in error logs or UI messages.
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

      {/* Technical Transparency & Acceptance Criteria Verification Panel */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-xs">
          TV-01 Architecture &amp; Acceptance Criteria Matrix
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-01 — Local File Selection
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                Implemented
              </span>
            </div>
            <p className="text-neutral-600">
              Reads local files directly into memory via native <code>File.arrayBuffer()</code> without form submissions or network endpoints.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-02 — Local Web Crypto Computation
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                Implemented
              </span>
            </div>
            <p className="text-neutral-600">
              Executes <code>window.crypto.subtle.digest(&apos;SHA-256&apos;, ...)</code> natively in the browser thread. Gracefully flags unsupported environments.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-03 — In-Memory Output Generation
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                Implemented
              </span>
            </div>
            <p className="text-neutral-600">
              Generates an in-memory <code>Blob</code> and temporary object URL. Honestly distinguishes artifact preparation from browser-level download initiation.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-04 — Source File Preservation
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                Preserved
              </span>
            </div>
            <p className="text-neutral-600">
              Browser file handles are read-only. Original files remain untouched on the client filesystem; artifacts are distinct files.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-05 — Safe Processing States
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                Implemented
              </span>
            </div>
            <p className="text-neutral-600">
              Explicit state machine (idle, selected, processing, success, error) preventing concurrent re-computation. Safe errors avoid file data leakage.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                TV01-AC-06 — Honest Network Verification
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[10px]">
                Source Inspected
              </span>
            </div>
            <p className="text-neutral-600">
              No telemetry, tracking, or remote API calls in processing logic. As required by AC-06, full network isolation status is acknowledged as needing independent browser devtools network audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
