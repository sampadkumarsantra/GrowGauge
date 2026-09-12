'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Mic, Square } from 'lucide-react';
import { TextInput } from './field';

interface SpeechRecognitionResultEvent {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult:
    | ((this: SpeechRecognitionLike, event: SpeechRecognitionResultEvent) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceTextInput({
  onTranscript,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  onTranscript: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const startListening = () => {
    if (listening) {
      stopListening();
      return;
    }
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = '';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const result = event.results?.[0];
      const transcript = result?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    rec.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  };

  if (!supported) {
    return <TextInput {...props} className={className} />;
  }

  return (
    <div className="relative">
      <TextInput {...props} className={clsx('pr-10', className)} />
      <button
        type="button"
        onClick={startListening}
        aria-label={listening ? 'Stop voice input' : 'Enter this answer by voice'}
        title={listening ? 'Stop voice input' : 'Speak this answer'}
        className={clsx(
          'absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-[2px] transition-colors',
          listening
            ? 'text-paper bg-clay hover:bg-clay/90'
            : 'text-ink-mute hover:text-indigo hover:bg-indigo-tint'
        )}
      >
        {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}