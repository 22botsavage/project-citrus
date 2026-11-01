import React from 'react';
import CitrusApp from '@/components/citrus-app';

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
                Browser-Local Processing &amp; Media Tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% In-Browser Execution
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <CitrusApp />

        {/* Prototype Footer */}
        <footer className="mt-8 pt-6 border-t border-neutral-200 text-center text-xs text-neutral-500 space-y-1">
          <p>
            Project Citrus • Milestone MVP-1 • Tasks TV-01 &amp; TV-03
          </p>
          <p className="text-[11px] text-neutral-400">
            Client-side Canvas, Web Crypto, and File API validation • Zero external telemetry
          </p>
        </footer>
      </div>
    </main>
  );
}
