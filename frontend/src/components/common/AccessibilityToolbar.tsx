import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import {
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Eye,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

export const AccessibilityToolbar: React.FC = () => {
  const {
    textSize,
    setTextSize,
    contrastMode,
    setContrastMode,
    fontMode,
    setFontMode,
    isSpeaking,
    stopSpeaking,
    speechRate,
    setSpeechRate,
    isToolbarOpen,
    setIsToolbarOpen,
  } = useAccessibility();

  return (
    <>
      {/* Floating Accessibility Trigger Pill */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center gap-2 px-3 py-2 bg-rose-700 text-white text-xs font-semibold rounded-full shadow-scholarly-elevated hover:bg-rose-800 transition-all animate-pulse"
            title="Stop Text-to-Speech Reading"
          >
            <VolumeX className="h-4 w-4" />
            <span>Stop Reading</span>
          </button>
        )}

        <button
          onClick={() => setIsToolbarOpen(!isToolbarOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-forest-dark text-warm-ivory border border-gold/40 rounded-full shadow-scholarly-elevated hover:bg-forest hover:border-gold transition-all focus:outline-none focus:ring-2 focus:ring-gold"
          aria-label="Open accessibility options"
          title="Accessibility & Reading Preferences (TTS, Font Size, Contrast)"
        >
          <Eye className="h-4 w-4 text-gold" />
          <span className="text-xs font-serif font-bold hidden sm:inline">Accessibility</span>
        </button>
      </div>

      {/* Floating Accessibility Drawer / Panel */}
      {isToolbarOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-ivory-border shadow-scholarly-elevated p-5 text-left text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-forest/10 text-forest">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-forest-dark">
                  Reading & Accessibility Controls
                </h3>
                <p className="text-[11px] text-charcoal-muted">Customized scholarly study preferences</p>
              </div>
            </div>
            <button
              onClick={() => setIsToolbarOpen(false)}
              className="p-1 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-ivory"
              aria-label="Close accessibility panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* 1. Text Sizing */}
            <div>
              <label className="font-serif font-bold text-xs text-forest-dark block mb-2">
                Text Scaling (Adjustable Size)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'large', 'xlarge'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                      textSize === size
                        ? 'bg-forest text-warm-ivory border-forest font-bold'
                        : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                    }`}
                  >
                    <span className="capitalize">{size === 'xlarge' ? 'Extra Large' : size}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Dyslexia-Friendly Font Mode */}
            <div>
              <label className="font-serif font-bold text-xs text-forest-dark block mb-2">
                Reading Font Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFontMode('standard')}
                  className={`py-1.5 px-3 rounded-lg border text-left transition-colors ${
                    fontMode === 'standard'
                      ? 'bg-forest text-warm-ivory border-forest font-bold'
                      : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                  }`}
                >
                  <span className="font-serif block">Scholarly Serif</span>
                  <span className="text-[10px] opacity-75">Standard typeface</span>
                </button>
                <button
                  onClick={() => setFontMode('dyslexic')}
                  className={`py-1.5 px-3 rounded-lg border text-left transition-colors ${
                    fontMode === 'dyslexic'
                      ? 'bg-forest text-warm-ivory border-forest font-bold'
                      : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                  }`}
                >
                  <span className="font-sans font-bold block">Dyslexia Legible</span>
                  <span className="text-[10px] opacity-75">High-contrast spacing</span>
                </button>
              </div>
            </div>

            {/* 3. Contrast Modes */}
            <div>
              <label className="font-serif font-bold text-xs text-forest-dark block mb-2">
                Color & Contrast Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setContrastMode('normal')}
                  className={`py-2 px-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors ${
                    contrastMode === 'normal'
                      ? 'bg-forest text-warm-ivory border-forest font-bold'
                      : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Scholarly Ivory</span>
                </button>
                <button
                  onClick={() => setContrastMode('high-contrast-dark')}
                  className={`py-2 px-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors ${
                    contrastMode === 'high-contrast-dark'
                      ? 'bg-zinc-900 text-amber-300 border-amber-400 font-bold'
                      : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span className="text-[11px]">High Contrast Dark</span>
                </button>
                <button
                  onClick={() => setContrastMode('high-contrast-light')}
                  className={`py-2 px-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors ${
                    contrastMode === 'high-contrast-light'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-ivory/50 text-charcoal border-ivory-border hover:bg-ivory'
                  }`}
                >
                  <Type className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Monochrome</span>
                </button>
              </div>
            </div>

            {/* 4. Text to Speech Audio Narration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-serif font-bold text-xs text-forest-dark flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-forest" />
                  Text-to-Speech (TTS) Speed
                </label>
                {isSpeaking && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Audio Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`flex-1 py-1 rounded text-center font-mono text-[11px] border transition-colors ${
                      speechRate === rate
                        ? 'bg-gold-dark text-white border-gold-dark font-bold'
                        : 'bg-ivory/60 text-charcoal border-ivory-border hover:bg-ivory'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-ivory-cream flex items-center justify-between text-[11px] text-charcoal-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-gold" />
              Persists automatically
            </span>
            <button
              onClick={() => {
                setTextSize('normal');
                setContrastMode('normal');
                setFontMode('standard');
                setSpeechRate(1.0);
                stopSpeaking();
              }}
              className="text-forest hover:text-gold-dark hover:underline font-semibold"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </>
  );
};

