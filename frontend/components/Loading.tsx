'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Loader2, Sparkles, Mic, Layers } from 'lucide-react';

interface LoadingProps {
  stage: string;
  message: string;
}

export const Loading: React.FC<LoadingProps> = ({ stage, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col items-center justify-center my-4 text-center"
    >
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-indigo-600 text-white animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {stage || 'Zero-GPU Copilot'}
        </span>
      </div>

      <h4 className="text-base font-semibold text-gray-200 mt-1">{message || 'Processing dataset query...'}</h4>
      <p className="text-xs text-gray-400 mt-1 max-w-md">
        Whisper STT ➔ Llama.cpp Reasoning ➔ Generative UI Engine ➔ Piper TTS Voice
      </p>
    </motion.div>
  );
};
