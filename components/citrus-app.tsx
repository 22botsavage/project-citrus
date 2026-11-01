'use client';

import React, { useState } from 'react';
import ImageConverter from '@/components/image-converter';
import LocalProcessor from '@/components/local-processor';
import {
  ShieldCheck,
  Cpu,
  Image as ImageIcon,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

export default function CitrusApp() {
  const [activeTab, setActiveTab] = useState<'tv03' | 'tv01'>('tv03');

  return (
    <div className="space-y-8">
      {/* Module Switcher Tabs */}
      <div className="flex border-b border-neutral-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('tv03')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'tv03'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>TV-03: JPG ↔ PNG Converter</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Active Build
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tv01')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'tv01'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          }`}
        >
          <Cpu className="w-4 h-4 text-neutral-500" />
          <span>TV-01: Cryptographic Digest Prototype</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
            Baseline
          </span>
        </button>
      </div>

      {/* Tab 1: TV-03 Image Converter */}
      {activeTab === 'tv03' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-600 shadow-2xs">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Task TV-03</span>
              <span className="text-neutral-300">•</span>
              <span className="font-medium text-neutral-800">Approved Scope: JPG ↔ PNG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              Browser-Local JPG &amp; PNG Image Converter
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
              Converts JPG to lossless PNG or PNG to lossy JPG with white-background transparency flattening, EXIF orientation normalization, and structural metadata stripping. Zero server uploads.
            </p>
          </div>

          {/* Scope Notice Box */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-neutral-800">
              <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>MVP-1 Technical Guardrails</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Strictly scoped to <strong>JPG → PNG</strong> and <strong>PNG → JPG</strong>.
              HEIC, WebP, GIF, SVG, and same-format re-encoding are disabled. Source files are read-only; converted files are generated separately in browser memory.
            </p>
            <div className="pt-1 flex flex-wrap gap-4 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Source Preservation Guaranteed
              </span>
              <span className="inline-flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                White-Background Alpha Flattening
              </span>
              <span className="inline-flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                EXIF / GPS Scrubbing
              </span>
            </div>
          </div>

          {/* TV-03 Component */}
          <ImageConverter />
        </div>
      )}

      {/* Tab 2: TV-01 Baseline Crypto Processor */}
      {activeTab === 'tv01' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-600 shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-neutral-500" />
              <span>Task TV-01 Proof of Concept</span>
              <span className="text-neutral-300">•</span>
              <span className="font-medium text-neutral-800">Baseline In-Browser Processor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              Browser-Local File Processing &amp; Cryptographic Digest
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
              Baseline technical feasibility demonstration for client-side file reading, in-memory SHA-256 calculation via Web Crypto API, and local artifact generation without remote server transmission.
            </p>
          </div>

          <LocalProcessor />
        </div>
      )}
    </div>
  );
}
