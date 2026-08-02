'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Zap,
  Radio,
  Volume2,
  Sliders,
  Sparkles,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

interface WebRTCVoiceControllerProps {
  onModeChange?: (mode: 'websocket' | 'webrtc') => void;
}

export function WebRTCVoiceController({ onModeChange }: WebRTCVoiceControllerProps) {
  const { sessionState, startStreaming, stopStreaming, triggerBargeIn } = useWebRTC();
  const [activePipelineMode, setActivePipelineMode] = useState<'websocket' | 'webrtc'>('webrtc');

  const handleModeSwitch = (mode: 'websocket' | 'webrtc') => {
    setActivePipelineMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 shadow-xl transition-all">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
              Sub-300ms WebRTC Real-Time Audio Pipeline
            </h3>
            <p className="text-[10px] text-gray-400">
              Full-duplex RTP/Opus audio streaming with bi-directional voice barge-in
            </p>
          </div>
        </div>

        {/* Pipeline Selector Switch */}
        <div className="flex items-center p-1 rounded-xl bg-gray-900 border border-gray-800">
          <button
            onClick={() => handleModeSwitch('websocket')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activePipelineMode === 'websocket'
                ? 'bg-gray-800 text-gray-200 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            WebSocket (Base64)
          </button>
          <button
            onClick={() => handleModeSwitch('webrtc')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              activePipelineMode === 'webrtc'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400 fill-current" />
            <span>WebRTC (Sub-300ms)</span>
          </button>
        </div>
      </div>

      {/* WebRTC Live Status Bar */}
      {activePipelineMode === 'webrtc' && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-950/80 rounded-xl border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-300">
                {sessionState.isConnected ? 'Full-Duplex Opus Channel Active' : 'Connecting WebRTC...'}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-amber-400" />
                {sessionState.latencyMs} ms Latency
              </span>

              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Opus 48kHz Codec
              </span>
            </div>
          </div>

          {/* Voice Barge-In Indicator Box */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-gray-950 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-gray-100 flex items-center gap-1">
                  Bi-Directional Voice Barge-In Supported
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </span>
                <p className="text-[10px] text-gray-400">
                  Speak anytime while AI is answering to instantly interrupt TTS playback
                </p>
              </div>
            </div>

            <button
              onClick={() => triggerBargeIn()}
              className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-[11px] font-bold transition-all whitespace-nowrap"
            >
              Test Interrupt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
