/**
 * Project Citrus — TV-03 Core Image Conversion & Structural Validation
 * 
 * Implements:
 * - JPG → PNG conversion
 * - PNG → JPG conversion with white background transparency flattening
 * - EXIF orientation normalization via createImageBitmap({ imageOrientation: 'from-image' })
 * - Memory management with explicit ImageBitmap.close()
 * - Structural binary metadata inspection (JPEG APP1 / PNG eXIf/tEXt/zTXt/iTXt elimination check)
 * - Safe error handling without leaking raw file bytes
 */

export type SupportedImageFormat = 'jpeg' | 'png';

export interface ImageInspection {
  format: SupportedImageFormat;
  mimeType: string;
  width: number;
  height: number;
  hasAlphaHint?: boolean;
}

export interface StructuralMetadataValidation {
  isClean: boolean;
  checkedMarkersOrChunks: string[];
  findings: string[];
}

export interface ImageConversionResult {
  blob: Blob;
  outputFilename: string;
  sourceFormat: SupportedImageFormat;
  targetFormat: SupportedImageFormat;
  sourceSizeBytes: number;
  outputSizeBytes: number;
  width: number;
  height: number;
  transparencyFlattened: boolean;
  metadataValidation: StructuralMetadataValidation;
  durationMs: number;
}

/**
 * Inspects magic bytes at the beginning of an ArrayBuffer or File to identify
 * genuine JPEG or PNG format independently of file extensions.
 */
export async function detectImageFormat(file: File): Promise<SupportedImageFormat> {
  if (file.size < 8) {
    throw new Error('File is too small to contain a valid image header (minimum 8 bytes required).');
  }

  const headerSlice = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(headerSlice);

  // JPEG magic bytes: 0xFF, 0xD8, 0xFF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // Check common unsupported formats to provide actionable error messages
  // GIF: GIF87a / GIF89a (0x47, 0x49, 0x46)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    throw new Error('GIF format is not supported in MVP-1. Only JPG and PNG are supported.');
  }
  // WebP: RIFF ... WEBP (0x52, 0x49, 0x46, 0x46)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    throw new Error('WebP format is not supported in MVP-1. Only JPG and PNG are supported.');
  }

  throw new Error(
    'Unsupported file format. The file header does not match valid JPEG (FF D8 FF) or PNG (89 50 4E 47) signatures.'
  );
}

/**
 * Structurally inspects a generated JPEG byte stream to ensure sensitive APP segments
 * (APP1 Exif/XMP, APP13 IPTC, COM) were omitted by the canvas encoder.
 */
export function inspectJpegMetadata(bytes: Uint8Array): StructuralMetadataValidation {
  const checkedMarkers: string[] = [];
  const findings: string[] = [];
  let isClean = true;

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return {
      isClean: false,
      checkedMarkersOrChunks: ['SOI'],
      findings: ['Invalid JPEG: Missing SOI (FF D8) marker.'],
    };
  }

  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    // Standalone markers without payload length
    if (marker === 0xd8 /* SOI */ || marker === 0xd9 /* EOI */ || marker === 0x00 /* Stuffed byte */) {
      continue;
    }
    // RST markers (D0 - D7)
    if (marker >= 0xd0 && marker <= 0xd7) {
      continue;
    }

    if (offset + 2 > bytes.length) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];

    if (marker === 0xe1) {
      // APP1: EXIF / XMP metadata
      isClean = false;
      checkedMarkers.push('APP1 (0xFFE1)');
      findings.push('Detected APP1 metadata segment (EXIF/XMP).');
    } else if (marker === 0xed) {
      // APP13: Photoshop IRB / IPTC metadata
      isClean = false;
      checkedMarkers.push('APP13 (0xFFED)');
      findings.push('Detected APP13 metadata segment (IPTC).');
    } else if (marker === 0xfe) {
      // COM: Plaintext comment
      isClean = false;
      checkedMarkers.push('COM (0xFFFE)');
      findings.push('Detected COM (comment) segment.');
    } else if (marker === 0xe0) {
      checkedMarkers.push('APP0 (0xFFE0 / JFIF)');
    } else if (marker === 0xc0) {
      checkedMarkers.push('SOF0 (0xFFC0 / Baseline)');
    } else if (marker === 0xc4) {
      checkedMarkers.push('DHT (0xFFC4 / Huffman)');
    } else if (marker === 0xdb) {
      checkedMarkers.push('DQT (0xFFDB / Quantization)');
    } else if (marker === 0xda) {
      checkedMarkers.push('SOS (0xFFDA / Scan)');
      // SOS is followed directly by compressed entropy stream; break marker scan
      break;
    }

    offset += length;
  }

  if (isClean && findings.length === 0) {
    findings.push('Verified: 0 APP1 (EXIF/XMP), 0 APP13 (IPTC), 0 COM segments found in JPEG stream.');
  }

  return {
    isClean,
    checkedMarkersOrChunks: checkedMarkers,
    findings,
  };
}

/**
 * Structurally inspects a generated PNG byte stream chunk-by-chunk to verify that
 * ancillary metadata chunks (eXIf, tEXt, zTXt, iTXt) were omitted.
 */
export function inspectPngMetadata(bytes: Uint8Array): StructuralMetadataValidation {
  const checkedChunks: string[] = [];
  const findings: string[] = [];
  let isClean = true;

  if (bytes.length < 8) {
    return {
      isClean: false,
      checkedMarkersOrChunks: [],
      findings: ['Invalid PNG: Byte stream shorter than 8-byte signature.'],
    };
  }

  let offset = 8; // skip 8-byte PNG signature
  while (offset + 8 <= bytes.length) {
    const chunkLength =
      ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
      0;
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    checkedChunks.push(chunkType);

    if (chunkType === 'eXIf') {
      isClean = false;
      findings.push('Detected eXIf ancillary chunk containing raw EXIF/GPS metadata.');
    } else if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
      isClean = false;
      findings.push(`Detected ${chunkType} text metadata chunk.`);
    }

    // Advance: 4 bytes length + 4 bytes type + chunkLength data + 4 bytes CRC
    offset += 8 + chunkLength + 4;
    if (chunkType === 'IEND') break;
  }

  if (isClean && findings.length === 0) {
    findings.push('Verified: 0 eXIf, 0 tEXt, 0 zTXt, 0 iTXt ancillary metadata chunks found in PNG stream.');
  }

  return {
    isClean,
    checkedMarkersOrChunks: checkedChunks,
    findings,
  };
}

/**
 * Converts a Blob to an ArrayBuffer safely in the browser.
 */
async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Executes browser-local JPG <-> PNG conversion according to TV-03 specifications.
 */
export async function convertImageLocally(
  file: File,
  options: { jpegQuality?: number } = {}
): Promise<ImageConversionResult> {
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty (0 bytes). Please select a valid image file.');
  }

  const startTime = performance.now();

  // 1. Detect source format by inspecting initial magic bytes
  const sourceFormat = await detectImageFormat(file);

  // 2. Enforce strict MVP-1 conversion paths (JPG -> PNG or PNG -> JPG)
  let targetFormat: SupportedImageFormat;
  let targetMimeType: string;
  let extension: string;
  let transparencyFlattened = false;

  if (sourceFormat === 'jpeg') {
    targetFormat = 'png';
    targetMimeType = 'image/png';
    extension = 'png';
  } else if (sourceFormat === 'png') {
    targetFormat = 'jpeg';
    targetMimeType = 'image/jpeg';
    extension = 'jpg';
    transparencyFlattened = true; // PNG -> JPG always applies opaque white compositing
  } else {
    throw new Error('Unsupported format transition. Only JPG → PNG and PNG → JPG are supported in MVP-1.');
  }

  // 3. Decode image and normalize EXIF orientation via createImageBitmap
  let bitmap: ImageBitmap;
  try {
    // imageOrientation: 'from-image' instructs the decoder to transpose coordinates according to EXIF
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    throw new Error(
      `Failed to decode image data (${err instanceof Error ? err.message : 'Corrupted or unsupported payload'}).`
    );
  }

  const width = bitmap.width;
  const height = bitmap.height;

  if (width === 0 || height === 0) {
    bitmap.close();
    throw new Error('Decoded image has invalid dimensions (0x0 pixels).');
  }

  // 4. Set up in-memory canvas matching exact normalized bitmap dimensions
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  try {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d', {
      alpha: targetFormat === 'png', // Disable alpha channel on canvas if exporting to JPEG
      willReadFrequently: false,
    });
  } catch (err) {
    bitmap.close();
    throw new Error(
      `Canvas allocation failed. The image dimensions (${width}x${height}) may exceed browser memory limits: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to acquire 2D rendering context from in-memory canvas.');
  }

  try {
    // 5. Compositing
    if (targetFormat === 'jpeg') {
      // MANDATORY TRANSPARENCY FLATTENING: Pre-fill with pure white (#FFFFFF)
      // Uninitialized canvas is transparent black (rgba(0,0,0,0)), which JPEG turns black.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0);
    } else {
      // JPG -> PNG: Draw directly to preserve color pixels in lossless container
      ctx.drawImage(bitmap, 0, 0);
    }
  } finally {
    // Explicit resource release to prevent GPU/RAM memory leaks
    bitmap.close();
  }

  // 6. Encode canvas to target Blob
  const quality = options.jpegQuality ?? 0.92;
  const outputBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Browser canvas failed to serialize image blob.'));
        }
      },
      targetMimeType,
      targetFormat === 'jpeg' ? quality : undefined
    );
  });

  // 7. Structural Metadata Verification on Output Bytes
  const outputBytes = await blobToUint8Array(outputBlob);
  let metadataValidation: StructuralMetadataValidation;

  if (targetFormat === 'jpeg') {
    metadataValidation = inspectJpegMetadata(outputBytes);
  } else {
    metadataValidation = inspectPngMetadata(outputBytes);
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  // 8. Generate safe, distinct output filename preserving base name
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeBase = rawBaseName || 'converted_image';
  const outputFilename = `${safeBase}_citrus_tv03.${extension}`;

  return {
    blob: outputBlob,
    outputFilename,
    sourceFormat,
    targetFormat,
    sourceSizeBytes: file.size,
    outputSizeBytes: outputBlob.size,
    width,
    height,
    transparencyFlattened,
    metadataValidation,
    durationMs,
  };
}
