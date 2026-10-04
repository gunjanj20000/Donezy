import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Check, Edit2, AlertCircle, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
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
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTaskResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isServiceDisallowed, setIsServiceDisallowed] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdateText = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      const parsed = NaturalLanguageParser.parse(text);
      setParsedResult(parsed);
    } else {
      setParsedResult(null);
    }
  };

  const startListening = () => {
    setErrorMsg(null);
    setIsServiceDisallowed(false);

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
        if (currentTranscript) {
          handleUpdateText(currentTranscript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);

        if (event.error === 'service-not-allowed') {
          setIsServiceDisallowed(true);
          setErrorMsg(
            'Speech service is blocked or disallowed by your browser. If using Brave or strict privacy settings, enable "Google services for speech recognition" in browser settings, or simply type your task below.'
          );
          setTimeout(() => textInputRef.current?.focus(), 150);
        } else if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech was detected. Tap the mic to try again, or type below.');
        } else if (event.error === 'network') {
          setErrorMsg('Network error reaching speech recognition service. Please check your internet or type below.');
        } else if (event.error === 'audio-capture') {
          setErrorMsg('No microphone was found on this device.');
        } else {
          setErrorMsg(`Voice input error: ${event.error}. You can type your task below.`);
        }
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
      setErrorMsg('Could not initialize voice recognition on this device. You can type below.');
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
      setInputText('');
      setParsedResult(null);
      setErrorMsg(null);
      setIsServiceDisallowed(false);
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const detectedCategory = categories.find(c => c.id === parsedResult?.categoryId);

  const sampleVoicePrompts = [
    'Call doctor tomorrow at 10 AM',
    'Buy fresh groceries tonight #shopping',
    'Workout daily at 7 AM !high',
    'Pay credit card bill on Friday',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center relative animate-scale-in max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Voice & Smart Input"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close voice input"
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Voice & Smart Capture
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
          Speak naturally or type your task with automatic dates, times & reminders:
        </p>

        {/* Pulsing Mic Circle */}
        <div className="relative mb-4">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-brand-500/25 animate-ping" />
          )}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`relative z-10 w-22 h-22 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isListening
                ? 'bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-500 text-white scale-105 shadow-brand-500/40 ring-8 ring-brand-100 dark:ring-brand-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse" />
            ) : (
              <MicOff className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isListening ? 'Listening... Speak now' : 'Tap mic to speak'}
          </p>
          {!isListening && errorMsg && (
            <button
              onClick={startListening}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>

        {/* Error notification banner with actionable guidance */}
        {errorMsg && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1">
              <span className="font-semibold block">{errorMsg}</span>
              {isServiceDisallowed && (
                <span className="text-[11px] text-rose-600/90 dark:text-rose-400 block">
                  💡 <strong>Tip for Brave users:</strong> Go to <code className="bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded font-mono">brave://settings/system</code> and toggle on <em>"Use Google services for speech recognition"</em>.
                </span>
              )}
            </div>
          </div>
        )}

        {!speechSupported && (
          <div className="w-full mb-4 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 text-left">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Web Speech API is not supported in this browser. Use the instant text box below!</span>
          </div>
        )}

        {/* Instant Input Fallback / Live Editor */}
        <div className="w-full mb-4">
          <div className="relative">
            <input
              ref={textInputRef}
              type="text"
              value={inputText}
              onChange={(e) => handleUpdateText(e.target.value)}
              placeholder="Or type here (e.g. Call dentist tomorrow 3pm)..."
              className="w-full min-h-[44px] px-3.5 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => handleUpdateText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clickable Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Try:</span>
            {sampleVoicePrompts.slice(0, 3).map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleUpdateText(sample)}
                className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/80 dark:border-slate-700/80 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Confirmation Preview */}
        {parsedResult && parsedResult.cleanTitle && (
          <div className="w-full bg-gradient-to-br from-brand-50/70 to-accent-50/50 dark:from-slate-800 dark:to-slate-800/70 border border-brand-200/60 dark:border-brand-900/40 rounded-2xl p-4 mb-5 text-left animate-slide-up">
            <div className="text-[11px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 mb-1.5 flex items-center justify-between">
              <span>Task Preview</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Ready to save ✓</span>
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2.5">
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
                  🔔 Reminder Set
                </span>
              )}
              {detectedCategory && (
                <span className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  🏷️ {detectedCategory.name}
                </span>
              )}
              {parsedResult.priority !== 'none' && (
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 font-bold uppercase text-[10px]">
                  ⚡ {parsedResult.priority}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mt-1">
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
            Edit More
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
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-40 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};
