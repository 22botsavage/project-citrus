/**
 * TV-01 Core Processing Logic (Local / In-Browser Only)
 * 
 * Demonstrates:
 * - Local file reading into memory via ArrayBuffer
 * - Web Crypto API SHA-256 digest calculation
 * - In-memory output artifact (Blob) generation
 * - No network transmission or external API dependency
 */

export interface ComputationResult {
  digestHex: string;
  durationMs: number;
  byteLength: number;
  timestamp: string;
}

export interface ArtifactData {
  projectName: string;
  milestone: string;
  taskId: string;
  prototypeName: string;
  sourceFile: {
    name: string;
    sizeBytes: number;
    mimeType: string;
    lastModifiedISO: string;
  };
  computation: {
    algorithm: string;
    digestSha256: string;
    durationMs: number;
    computedAtISO: string;
    executionScope: string;
  };
  sourcePreservationNotice: string;
  disclaimer: string;
}

/**
 * Checks whether the current runtime environment supports the Web Crypto API
 * with subtle.digest available.
 */
export function isWebCryptoSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.digest === 'function'
  );
}

/**
 * Formats a byte number into a human-readable string.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm))} ${sizes[unitIndex]}`;
}

/**
 * Reads a File locally into an ArrayBuffer and computes its SHA-256 digest
 * strictly in-browser using window.crypto.subtle.digest.
 */
export async function computeFileSha256(file: File): Promise<ComputationResult> {
  if (!isWebCryptoSupported()) {
    throw new Error(
      'Web Crypto API is not supported in this browser environment. window.crypto.subtle is required for local digest computation.'
    );
  }

  const startTime = performance.now();

  // Read file as ArrayBuffer strictly in browser memory
  const arrayBuffer = await file.arrayBuffer();

  // Perform cryptographic digest calculation locally
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);

  const durationMs = performance.now() - startTime;

  // Convert binary ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const digestHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    digestHex,
    durationMs: Math.round(durationMs * 100) / 100,
    byteLength: arrayBuffer.byteLength,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates an in-memory JSON Blob representing the computation receipt artifact.
 * Does not write to disk or upload to any remote server.
 */
export function createArtifactBlob(
  file: File,
  computation: ComputationResult
): { blob: Blob; artifactJson: ArtifactData; defaultFilename: string } {
  const artifactJson: ArtifactData = {
    projectName: 'Citrus',
    milestone: 'MVP-1',
    taskId: 'TV-01',
    prototypeName: 'Browser-local processing prototype',
    sourceFile: {
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'text/plain (unspecified by OS)',
      lastModifiedISO: new Date(file.lastModified).toISOString(),
    },
    computation: {
      algorithm: 'SHA-256',
      digestSha256: computation.digestHex,
      durationMs: computation.durationMs,
      computedAtISO: computation.timestamp,
      executionScope: 'Client-side Web Crypto API (window.crypto.subtle)',
    },
    sourcePreservationNotice:
      'The original source file was read in browser memory and remained unaltered. This artifact was generated separately in memory.',
    disclaimer:
      'Technical feasibility prototype artifact. This is NOT compressed media and NOT converted media.',
  };

  const jsonString = JSON.stringify(artifactJson, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

  // Generate a distinct artifact filename preserving the original base name
  const safeBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const defaultFilename = `${safeBaseName}_tv01_digest_receipt.json`;

  return { blob, artifactJson, defaultFilename };
}
