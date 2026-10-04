import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onEnd?: (transcript: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  onEnd,
  lang = 'en-US',
}: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    latestTranscriptRef.current = '';
    setError(null);
  }, [stop]);

  const start = useCallback(() => {
    setError(null);
    latestTranscriptRef.current = '';
    setTranscript('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    // Stop existing instance if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          latestTranscriptRef.current = currentTranscript;
          setTranscript(currentTranscript);
          onResult?.(currentTranscript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition subtask error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone in browser.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected.');
        } else if (event.error === 'service-not-allowed') {
          setError('Speech service disallowed by browser settings.');
        } else {
          setError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd?.(latestTranscriptRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      setError('Could not access microphone.');
    }
  }, [lang, onResult, onEnd]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}
