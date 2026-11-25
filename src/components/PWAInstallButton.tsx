import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Smartphone, X } from 'lucide-react';

interface Props {
  lang: 'km' | 'en';
}

export const PWAInstallButton: React.FC<Props> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop PWA prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95 border border-emerald-500/40"
      >
        <Download className="w-3.5 h-3.5 text-emerald-300" />
        <span>{lang === 'km' ? 'ដំឡើង App' : 'Install PWA'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all border border-emerald-600/30"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
          <span>{lang === 'km' ? 'ដំឡើងលើ iOS' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  {lang === 'km' ? 'ដំឡើងលើ iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    1
                  </div>
                  <p>
                    {lang === 'km'
                      ? 'ចុចលើប៊ូតុង Share (ចែករំលែក) នៅរបារខាងក្រោមនៃកម្មវិធី Safari'
                      : 'Tap the Share button in Safari toolbar at the bottom'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    2
                  </div>
                  <p>
                    {lang === 'km'
                      ? 'អូសចុះក្រោម រួចជ្រើសរើស "Add to Home Screen (បន្ថែមទៅអេក្រង់ដើម)"'
                      : 'Scroll down and tap "Add to Home Screen"'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                {lang === 'km' ? 'យល់ព្រម' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
