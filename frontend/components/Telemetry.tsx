'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Zap, Gauge, Cpu as ArmIcon, CheckCircle2 } from 'lucide-react';
import { TelemetryData } from '../hooks/useWebSocket';

interface TelemetryProps {
  data: TelemetryData | null;
}

export const Telemetry: React.FC<TelemetryProps> = ({ data }) => {
  const cpu = data?.cpu_percent ?? 0;
  const ramUsed = data?.ram_used_gb ?? 0;
  const ramTotal = data?.ram_total_gb ?? 0;
  const ramPercent = data?.ram_percent ?? 0;
  const latency = data?.total_latency_ms ?? 0;
  const tokensSec = data?.tokens_sec ?? 0;
  const kleidi = data?.kleidi_ai_enabled ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 rounded-2xl border border-indigo-500/20 shadow-xl"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">System Telemetry & Benchmarks</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          kleidi
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
        }`}>
          <ArmIcon className="w-3.5 h-3.5" />
          <span>{kleidi ? 'Arm KleidiAI Enabled' : 'Zero-GPU CPU Engine'}</span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Latency */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Latency</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{latency > 0 ? `${latency} ms` : '--'}</div>
          <div className="text-[10px] text-gray-500 mt-1">Full pipeline roundtrip</div>
        </div>

        {/* Tokens / Sec */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>LLM Speed</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">{tokensSec > 0 ? `${tokensSec} t/s` : '--'}</div>
          <div className="text-[10px] text-gray-500 mt-1">Llama.cpp generation</div>
        </div>

        {/* CPU % */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>CPU Load</span>
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">{cpu > 0 ? `${cpu}%` : '--'}</div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, cpu)}%` }} />
          </div>
        </div>

        {/* RAM */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>RAM</span>
            <HardDrive className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-xl font-bold font-mono text-violet-300">{ramUsed > 0 ? `${ramUsed} GB` : '--'}</div>
          <div className="text-[10px] text-gray-500 mt-1">{ramPercent > 0 ? `${ramPercent}% of ${ramTotal}GB` : 'Memory usage'}</div>
        </div>
      </div>

      {/* Latency Stage Breakdown */}
      {data && (data.whisper_ms > 0 || data.llama_ms > 0 || data.tts_ms > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
          <div className="flex items-center gap-1 font-mono">
            <span className="text-indigo-400 font-semibold">Whisper STT:</span> {data.whisper_ms} ms
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-cyan-400 font-semibold">Llama.cpp:</span> {data.llama_ms} ms
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-semibold">Piper TTS:</span> {data.tts_ms} ms
          </div>
        </div>
      )}
    </motion.div>
  );
};
