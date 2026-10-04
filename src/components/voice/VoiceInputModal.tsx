import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Check, Edit2, AlertCircle } from 'lucide-react';
import { NaturalLanguageParser, ParsedTaskResult } from '../../services/NaturalLanguageParser';
import { useApp } from '../../context/AppContext';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parsed: ParsedTaskResult) => void;
  onEdit: (parsed: ParsedTaskResult) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEdit,
}) => {
  const { categories } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTaskResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    setErrorMsg(null);
    setTranscript('');
    setParsedResult(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (currentTranscript.trim()) {
          const parsed = NaturalLanguageParser.parse(currentTranscript);
          setParsedResult(parsed);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please allow microphone permission.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech detected. Try speaking again.');
        } else {
          setErrorMsg(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMsg('Could not initialize voice recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      setTranscript('');
      setParsedResult(null);
      setErrorMsg(null);
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const detectedCategory = categories.find(c => c.id === parsedResult?.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center relative animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Voice Task Input"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close voice input"
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Voice Task Capture
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          Say what you need to do, like: <br />
          <span className="italic text-brand-600 dark:text-brand-400 font-medium">
            "Remind me to call Dr Sharma tomorrow at 5 PM"
          </span>
        </p>

        {/* Pulsing Mic Circle */}
        <div className="relative mb-6">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
          )}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isListening
                ? 'bg-gradient-to-tr from-brand-600 to-rose-500 text-white scale-105 shadow-brand-500/40 ring-8 ring-brand-100 dark:ring-brand-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : (
              <MicOff className="w-10 h-10" />
            )}
          </button>
        </div>

        <p className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
          {isListening ? 'Listening...' : 'Tap the microphone to speak'}
        </p>

        {/* Fallback notification if unsupported */}
        {!speechSupported && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Speech recognition isn't supported on this browser. You can type in the quick-add sheet.</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Transcript */}
        {transcript && (
          <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 mb-4 text-left border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              Heard:
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Structured Confirmation Preview */}
        {parsedResult && (
          <div className="w-full bg-gradient-to-br from-brand-50/70 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/70 border border-brand-200/60 dark:border-brand-900/40 rounded-2xl p-4 mb-5 text-left">
            <div className="text-[11px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 mb-2">
              Confirmation Preview:
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
              {parsedResult.cleanTitle}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                📅 {parsedResult.dueDate}
              </span>
              {parsedResult.dueTime && (
                <span className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  ⏰ {parsedResult.dueTime}
                </span>
              )}
              {parsedResult.reminderEnabled && (
                <span className="bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800">
                  🔔 Reminder Active
                </span>
              )}
              {detectedCategory && (
                <span className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  🏷️ {detectedCategory.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            disabled={!parsedResult}
            onClick={() => {
              if (parsedResult) {
                onEdit(parsedResult);
                onClose();
              }
            }}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>

          <button
            type="button"
            disabled={!parsedResult}
            onClick={() => {
              if (parsedResult) {
                onSave(parsedResult);
                onClose();
              }
            }}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-40 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
