import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TextSize, ContrastMode, FontMode } from '@/types';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  fontMode: FontMode;
  setFontMode: (mode: FontMode) => void;
  // Text to speech
  isSpeaking: boolean;
  speechSupported: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  // Voice recognition search
  isListening: boolean;
  voiceSupported: boolean;
  startVoiceSearch: (onResult: (transcript: string) => void, onError?: (err: string) => void) => void;
  stopVoiceSearch: () => void;
  // Accessibility Modal/Drawer control
  isToolbarOpen: boolean;
  setIsToolbarOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem('scholars_text_size') as TextSize) || 'normal';
  });

  const [contrastMode, setContrastModeState] = useState<ContrastMode>(() => {
    return (localStorage.getItem('scholars_contrast_mode') as ContrastMode) || 'normal';
  });

  const [fontMode, setFontModeState] = useState<FontMode>(() => {
    return (localStorage.getItem('scholars_font_mode') as FontMode) || 'standard';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voiceSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Apply visual accessibility classes to document body
  useEffect(() => {
    const root = document.documentElement;
    // Clear previous accessibility classes
    root.classList.remove(
      'text-size-normal',
      'text-size-large',
      'text-size-xlarge',
      'contrast-normal',
      'contrast-dark',
      'contrast-light',
      'font-standard',
      'font-dyslexic'
    );

    root.classList.add(`text-size-${textSize}`);
    root.classList.add(
      contrastMode === 'high-contrast-dark'
        ? 'contrast-dark'
        : contrastMode === 'high-contrast-light'
        ? 'contrast-light'
        : 'contrast-normal'
    );
    root.classList.add(fontMode === 'dyslexic' ? 'font-dyslexic' : 'font-standard');
  }, [textSize, contrastMode, fontMode]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('scholars_text_size', size);
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    localStorage.setItem('scholars_contrast_mode', mode);
  };

  const setFontMode = (mode: FontMode) => {
    setFontModeState(mode);
    localStorage.setItem('scholars_font_mode', mode);
  };

  // Text To Speech logic
  const speak = useCallback(
    (text: string) => {
      if (!speechSupported) {
        alert('Text-to-speech audio synthesis is not supported in this browser.');
        return;
      }

      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechSupported, speechRate]
  );

  const stopSpeaking = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  // Voice Search Recognition logic
  const startVoiceSearch = useCallback(
    (onResult: (transcript: string) => void, onError?: (err: string) => void) => {
      if (!voiceSupported) {
        if (onError) onError('Voice speech recognition is not supported in this browser.');
        return;
      }

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (onError) onError(event.error || 'Voice recognition error');
        };

        recognition.onresult = (event: any) => {
          setIsListening(false);
          const transcript = event.results[0][0].transcript;
          if (transcript) onResult(transcript);
        };

        recognition.start();
      } catch (err: unknown) {
        setIsListening(false);
        if (onError) onError(err instanceof Error ? err.message : 'Microphone unavailable');
      }
    },
    [voiceSupported]
  );

  const stopVoiceSearch = useCallback(() => {
    setIsListening(false);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        contrastMode,
        setContrastMode,
        fontMode,
        setFontMode,
        isSpeaking,
        speechSupported,
        speak,
        stopSpeaking,
        speechRate,
        setSpeechRate,
        isListening,
        voiceSupported,
        startVoiceSearch,
        stopVoiceSearch,
        isToolbarOpen,
        setIsToolbarOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

