import React from 'react';
import LocalProcessor from '@/components/local-processor';
import { ShieldCheck, Cpu, FileCheck2, AlertCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-100/60 text-neutral-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-900 tracking-tight">
                  Project Citrus
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  MVP-1
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Task TV-01 — Browser-Local Processing Prototype
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Local-Only Execution
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Prototype Hero Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-600 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-neutral-500" />
            <span>Technical Feasibility Prototype</span>
            <span className="text-neutral-300">•</span>
            <span className="font-medium text-neutral-800">Priority P0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            Browser-Local File Processing &amp; Cryptographic Digest
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
            Technical feasibility demonstration for client-side file reading, in-memory SHA-256 calculation via Web Crypto API, and local artifact generation without remote server transmission.
          </p>
        </div>

        {/* Prototype Scope Notice Box */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-neutral-800">
            <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>P0 Feasibility Scope Notice</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            This prototype is an isolated technical proof of concept for local computation. It is{' '}
            <strong>NOT</strong> the production PDF compression feature and{' '}
            <strong>NOT</strong> the production JPG/PNG conversion feature. Source files remain completely unaltered on the client device.
          </p>
          <div className="pt-1 flex flex-wrap gap-4 text-[11px] text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Source Preservation Guaranteed
            </span>
            <span className="inline-flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              In-Memory Blob Receipts
            </span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Native Web Crypto API
            </span>
          </div>
        </div>

        {/* Core Interactive Processor */}
        <LocalProcessor />

        {/* Prototype Footer */}
        <footer className="pt-6 border-t border-neutral-200 text-center text-xs text-neutral-500 space-y-1">
          <p>
            Project Citrus • Milestone MVP-1 • Task ID TV-01
          </p>
          <p className="text-[11px] text-neutral-400">
            Client-side Web Crypto and File API validation • Zero external telemetry
          </p>
        </footer>
      </div>
    </main>
  );
}
