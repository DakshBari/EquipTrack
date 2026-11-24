import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal typings for the Web Speech API. Browsers expose it as
 * `SpeechRecognition` (spec / Safari) or `webkitSpeechRecognition` (Chrome, Edge,
 * Samsung Internet). Firefox does not ship it.
 */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const isSpeechRecognitionSupported = () => getRecognitionCtor() !== null;

// Browsers only allow one active recognition session, so the hook instances share
// a handle and a new session stops whichever field was listening before.
let activeSession: { stop: () => void } | null = null;

function describeError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow microphone permission for this site in your browser settings, or type instead.';
    case 'audio-capture':
      return 'No microphone was found on this device. You can keep typing.';
    case 'no-speech':
      return 'No speech detected. Tap the microphone and try again.';
    case 'network':
      return 'The speech service could not be reached (check your connection). You can keep typing.';
    case 'language-not-supported':
      return 'Voice input does not support this language on your device. You can keep typing.';
    default:
      return 'Voice input stopped unexpectedly. Tap the microphone to try again, or type instead.';
  }
}

interface UseSpeechToTextOptions {
  /** Called with each finalised phrase. */
  onFinalText: (text: string) => void;
  lang?: string;
}

export function useSpeechToText({ onFinalText, lang }: UseSpeechToTextOptions) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalText);
  onFinalRef.current = onFinalText;

  const supported = isSpeechRecognitionSupported();

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(
        'Voice input is not supported in this browser. Try Chrome, Edge or Safari, or type your notes.'
      );
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Voice input needs a secure (https) connection. You can keep typing.');
      return;
    }

    activeSession?.stop();
    setError(null);
    setInterim('');

    const recognition = new Ctor();
    recognition.lang = lang || navigator.language || 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          if (transcript.trim()) onFinalRef.current(transcript.trim());
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText.trim());
    };
    recognition.onerror = (event) => {
      // 'aborted' fires when we stop the session ourselves.
      if (event.error !== 'aborted') setError(describeError(event.error));
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (activeSession?.stop === stopThis) activeSession = null;
    };

    const stopThis = () => recognition.stop();
    recognitionRef.current = recognition;
    activeSession = { stop: stopThis };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError(describeError('unknown'));
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    []
  );

  return { supported, listening, interim, error, clearError: () => setError(null), start, stop, toggle };
}
