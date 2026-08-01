'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play, RotateCcw, MessageSquareQuote } from 'lucide-react';

interface AudioPlayerProps {
  speechText: string;
  audioB64: string;
  transcript?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  speechText,
  audioB64,
  transcript,
  onPlayStateChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioB64 && audioRef.current) {
      const src = audioB64.startsWith('data:') ? audioB64 : `data:audio/wav;base64,${audioB64}`;
      audioRef.current.src = src;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
      }).catch(err => {
        console.warn('[Audio Player Autoplay Prevented]', err);
      });
    }
  }, [audioB64, onPlayStateChange]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!speechText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 rounded-2xl border border-indigo-500/20 shadow-lg my-4"
    >
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
        }}
      />

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
          <MessageSquareQuote className="w-5 h-5" />
        </div>

        <div className="flex-1">
          {transcript && (
            <p className="text-xs text-indigo-300 font-medium mb-1 flex items-center gap-1">
              <span>Voice Question:</span> <span className="text-gray-300 italic">"{transcript}"</span>
            </p>
          )}
          <p className="text-sm font-semibold text-gray-100 leading-relaxed">{speechText}</p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 border border-gray-700 transition-colors"
            title={isPlaying ? "Pause Answer" : "Replay Answer"}
          >
            {isPlaying ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
