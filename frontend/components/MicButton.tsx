'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  isProcessing,
  isSpeaking,
  audioLevel,
  onMouseDown,
  onMouseUp,
  onClick,
}) => {
  let statusText = 'Click or Hold to Speak';
  let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

  if (isRecording) {
    statusText = 'Listening... Speak your query';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
  } else if (isProcessing) {
    statusText = 'Zero-GPU Copilot Analyzing...';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
  } else if (isSpeaking) {
    statusText = 'Playing Voice Answer...';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Animated Glowing Outer Ring Container */}
      <div className="relative flex items-center justify-center">
        {/* Dynamic Wave Rings on Active Mic */}
        {isRecording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-rose-500/30"
              animate={{ scale: [1, 1.4 + audioLevel * 0.005, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-500/30"
              animate={{ scale: [1, 1.7 + audioLevel * 0.008, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
          </>
        )}

        {/* Primary Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onClick={onClick}
          disabled={isProcessing}
          className={`relative z-10 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full glass-panel shadow-2xl transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-500/50 ring-4 ring-rose-400/50'
              : isProcessing
              ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 shadow-amber-500/50 cursor-wait'
              : isSpeaking
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/50 ring-4 ring-emerald-400/30'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-indigo-500/40 hover:shadow-indigo-500/70 hover:ring-2 hover:ring-indigo-400'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-10 h-10 text-white animate-bounce" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </motion.button>
      </div>

      {/* Status Label Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border backdrop-blur-md transition-colors ${badgeColor}`}
      >
        {statusText}
      </motion.div>
    </div>
  );
};
