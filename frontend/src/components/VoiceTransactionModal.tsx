"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, AlertCircle, Volume2 } from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (txData: { amount: number; type: string; category: string; description: string }) => void;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({ isOpen, onClose, onSaveTransaction }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<'ta-IN' | 'hi-IN' | 'te-IN' | 'kn-IN' | 'en-IN'>('ta-IN');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<{ amount: number; type: string; category: string; description: string } | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setParsedData(null);
      setIsRecording(false);
    }
  }, [isOpen]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setTranscript('Listening... Speak now (e.g. "Sold 2 bags of rice for 1500 rupees")');

    // Simulate Speech Recognition capture
    setTimeout(() => {
      let sampleText = "இன்று அரிசி விற்பனை மூலம் 2,500 ரூபாய் கிடைத்தது"; // Tamil sample
      if (language === 'hi-IN') sampleText = "आज चावल की बिक्री से 2,500 रुपये मिले";
      if (language === 'en-IN') sampleText = "Today received 2,500 rupees from rice sales";

      setTranscript(sampleText);
      setIsRecording(false);

      // Simple NLP Intent parsing
      const parsed = {
        amount: 2500,
        type: 'Income',
        category: 'Retail Sales',
        description: sampleText
      };
      setParsedData(parsed);
      setConfidence(94);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Voice Transaction Assistant
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Regional Language</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
              { code: 'hi-IN', label: 'हिंदी (Hindi)' },
              { code: 'te-IN', label: 'తెలుగు (Telugu)' },
              { code: 'kn-IN', label: 'கன்னட (Kannada)' },
              { code: 'en-IN', label: 'English' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                  language === lang.code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-lg ${
              isRecording
                ? 'bg-red-500 animate-pulse text-white ring-8 ring-red-100 dark:ring-red-900/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            {isRecording ? 'Listening in progress...' : 'Tap microphone button to start speaking'}
          </p>
        </div>

        {transcript && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-4 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-blue-600 block mb-1">Transcribed Spoken Text:</span>
            "{transcript}"
          </div>
        )}

        {parsedData && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Parsed Intent (Confidence: {confidence}%)
              </span>
              <span className="text-xs px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold rounded-full">
                {parsedData.type}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Amount:</span> <strong className="text-slate-900 dark:text-white">Rs. {parsedData.amount}</strong></div>
              <div><span className="text-slate-500">Category:</span> <strong className="text-slate-900 dark:text-white">{parsedData.category}</strong></div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            disabled={!parsedData}
            onClick={() => {
              if (parsedData) {
                onSaveTransaction(parsedData);
                onClose();
              }
            }}
            className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md"
          >
            Confirm & Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};
