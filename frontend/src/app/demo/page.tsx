'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface TourStep {
  title: string;
  duration: number; // in seconds
  text: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Platform Introduction',
    duration: 6,
    text: 'Welcome to A.I. Rural Finance, an intelligent credit decisioning platform built to bridge formal credit access gaps for rural micro-enterprises and agricultural owners.'
  },
  {
    title: 'Accessibility Audio Guide',
    duration: 8,
    text: 'First, we test our integrated voice accessibility feature. Clicking read aloud next to dynamic matches translates and speaks complex scheme benefits clearly to help low-literacy users.'
  },
  {
    title: 'Credit Booster Quiz',
    duration: 8,
    text: 'Next, we engage with the Credit Booster Quiz. Answering basic financial management questions correctly rewards the farmer with an immediate plus five percent boost to their eligible borrowing power.'
  },
  {
    title: 'Real-time UPI Integration',
    duration: 11,
    text: 'By opening the UPI QR Code modal and triggering a simulated client payment, our backend broadcasts transaction details instantly via WebSockets—recalculating KPIs and graph trends live.'
  },
  {
    title: 'Monsoon Overdraft Relief',
    duration: 11,
    text: 'Moving to loans, we claim the Emergency Climate Relief Overdraft. If delayed rainfall or local droughts threaten farm operations, a pre-approved, interest-free Rs. 10,000 credit line is issued instantly.'
  },
  {
    title: 'Credit Score Simulator',
    duration: 6,
    text: 'Finally, merchants can slide the Credit Score Simulator. Adjusting revenue, expense ratios, and business age shows them how sound financial management unlocks higher credit limits.'
  }
];

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = TOUR_STEPS.reduce((sum, s) => sum + s.duration, 0);

  // Load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer Guy or similar warm male voice in English
        const maleVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Guy') || v.name.includes('David') || v.name.includes('Male'))
        ) || voices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(maleVoice || null);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handle TTS trigger on step transition
  const speakCurrentStep = (stepText: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(stepText);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      // Warm professional male voice qualities
      utterance.pitch = 0.95;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Main player timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= totalDuration) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Compute active step based on elapsed time
  useEffect(() => {
    let acc = 0;
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      acc += TOUR_STEPS[i].duration;
      if (elapsedTime < acc) {
        if (currentStepIndex !== i) {
          setCurrentStepIndex(i);
          if (isPlaying) {
            speakCurrentStep(TOUR_STEPS[i].text);
          }
        }
        break;
      }
    }
  }, [elapsedTime, isPlaying, currentStepIndex]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      speakCurrentStep(TOUR_STEPS[currentStepIndex].text);
    } else {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setCurrentStepIndex(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Jump to specific step start
  const handleJumpToStep = (index: number) => {
    let startOffset = 0;
    for (let i = 0; i < index; i++) {
      startOffset += TOUR_STEPS[i].duration;
    }
    setElapsedTime(startOffset);
    setCurrentStepIndex(index);
    if (isPlaying) {
      speakCurrentStep(TOUR_STEPS[index].text);
    } else {
      setIsPlaying(true);
      speakCurrentStep(TOUR_STEPS[index].text);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI Rural Finance
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-sm text-slate-300 font-semibold">🎬 Platform Tour Guide</span>
        </div>
        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
        >
          Return to Dashboard
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2 max-w-xl">
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Interactive Video Tour Player
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Experience our 10 advanced hackathon upgrades natively. Play the video below to hear the spoken English Male voice explanation synced with dynamic closed captions!
          </p>
        </div>

        {/* Video Player Display Container */}
        <div className="relative w-full max-w-3xl aspect-[1.66] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
          
          {/* Main webp animation rendering */}
          <div className="flex-1 w-full relative flex items-center justify-center bg-slate-950">
            <img
              src="/rural_finance_demo.webp"
              alt="Walkthrough Video Frame"
              className="w-full h-full object-contain"
            />
            {!isPlaying && elapsedTime === 0 && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition">
                <button
                  onClick={handlePlayPause}
                  className="h-16 w-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl transition hover:scale-110 active:scale-95"
                >
                  ▶
                </button>
                <span className="text-xs font-bold text-slate-300">Click to Play Interactive Guided Tour</span>
              </div>
            )}
          </div>

          {/* Synced Burned-in-Style Closed Captions Overlay */}
          <div className="p-4 bg-slate-950/95 border-t border-slate-900 text-center min-h-[70px] flex items-center justify-center">
            <p className="text-xs font-semibold text-blue-300 leading-relaxed max-w-2xl px-4 animate-fade-in font-mono">
              💬 [Subtitle]: {TOUR_STEPS[currentStepIndex].text}
            </p>
          </div>
        </div>

        {/* Media Controls Bar */}
        <div className="w-full max-w-3xl bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{isPlaying ? '⏸ Pause' : '▶ Play'}</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                ✕ Reset
              </button>
            </div>

            {/* Timeline slider indicator */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Interactive Steps Jump Chips */}
          <div className="border-t border-slate-800/60 pt-3 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={idx}
                onClick={() => handleJumpToStep(idx)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                  currentStepIndex === idx
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Step {idx + 1}: {step.title}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
