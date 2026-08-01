'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Cpu,
  Mic,
  BarChart3,
  Zap,
  ArrowRight,
  Database,
  Layers,
  Volume2,
  FileSpreadsheet,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const pipelineSteps = [
    { step: '01', title: 'Voice Input', desc: 'Browser MediaRecorder & Web Speech API', icon: <Mic className="w-6 h-6 text-rose-400" /> },
    { step: '02', title: 'Whisper STT', desc: 'Fast speech-to-text conversion on CPU', icon: <Volume2 className="w-6 h-6 text-amber-400" /> },
    { step: '03', title: 'Pandas & Llama', desc: 'Dataset schema analysis & structured JSON', icon: <Cpu className="w-6 h-6 text-cyan-400" /> },
    { step: '04', title: 'Generative UI', desc: 'Auto-rendered Recharts & KPI Cards', icon: <BarChart3 className="w-6 h-6 text-indigo-400" /> },
    { step: '05', title: 'Piper Voice Answer', desc: 'Text-to-Speech audio response streamed back', icon: <Sparkles className="w-6 h-6 text-emerald-400" /> },
  ];

  const features = [
    {
      title: 'Zero-GPU Arm Execution',
      desc: 'Engineered for Arm CPU servers (Oracle Cloud Ampere A1) using GGML_CPU_KLEIDIAI flags without needing expensive discrete GPUs.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      tag: 'KleidiAI Accelerated'
    },
    {
      title: 'Voice-Driven Conversational AI',
      desc: 'Speak questions directly into your microphone or type queries. Receive instant synthesized audio responses and transcripts.',
      icon: <Mic className="w-6 h-6 text-rose-400" />,
      tag: 'Whisper + Piper TTS'
    },
    {
      title: 'Generative UI Component Engine',
      desc: 'AI dynamically decides component types (Bar, Line, Area, Pie, Scatter, Table, KPI Cards) matching your specific dataset query.',
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      tag: 'Recharts + Motion'
    },
    {
      title: 'Custom CSV & Excel Analysis',
      desc: 'Upload any dataset file. The copilot inspects columns, data types, statistical distributions, and computes insights on the fly.',
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-400" />,
      tag: 'Pandas Engine'
    },
    {
      title: 'Live Telemetry & Benchmarks',
      desc: 'Track actual CPU %, RAM usage, latency breakdowns (Whisper ms, Llama ms, TTS ms), and token speed (tokens/sec).',
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      tag: 'Real-time Metrics'
    },
    {
      title: 'WebSocket Realtime Pipeline',
      desc: 'Sub-second audio streaming over low-latency WebSockets with automatic connection resilience and stage monitoring.',
      icon: <ShieldCheck className="w-6 h-6 text-violet-400" />,
      tag: 'WebSocket Stream'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-indigo-500/20 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-indigo-200 to-cyan-300">
              OmniGraph
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/copilot"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Launch Copilot Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-xl"
        >
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Zero-GPU Arm CPU Architecture • Powered by KleidiAI</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-tight"
        >
          Voice-Driven Generative UI Data Copilot
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base md:text-xl text-gray-400 max-w-2xl leading-relaxed"
        >
          Speak your data requests, analyze CSV & Excel datasets on CPU servers without GPUs, and watch dynamic interactive charts render automatically.
        </motion.p>

        {/* Primary CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/copilot"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm md:text-base shadow-2xl shadow-indigo-500/50 flex items-center gap-3 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Launch Copilot Studio</span>
          </Link>

          <a
            href="#architecture"
            className="px-8 py-4 rounded-2xl glass-panel hover:bg-gray-800/80 text-gray-200 border border-gray-700 font-semibold text-sm md:text-base transition-all"
          >
            Explore Architecture
          </a>
        </motion.div>
      </section>

      {/* Pipeline Workflow Section */}
      <section id="architecture" className="px-6 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-gray-100">End-to-End Voice & Data Flow</h2>
          <p className="text-sm text-gray-400 mt-2">Zero-GPU CPU Processing Pipeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineSteps.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="glass-panel p-5 rounded-2xl border border-indigo-500/20 flex flex-col justify-between relative overflow-hidden"
            >
              <span className="text-3xl font-black text-indigo-500/20 absolute top-3 right-3 font-mono">{s.step}</span>
              <div className="mb-4">{s.icon}</div>
              <div>
                <h3 className="text-base font-bold text-gray-100">{s.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-gray-100">Engineered for Maximum Performance</h2>
          <p className="text-sm text-gray-400 mt-2">Zero GPU Dependencies • Full Stack Generative UI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-2xl border border-gray-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700">{f.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-indigo-500/30 text-center relative overflow-hidden bg-gradient-to-r from-indigo-900/30 via-background to-cyan-900/30">
          <h2 className="text-2xl md:text-4xl font-black text-gray-100">Ready to Experience Voice Data Copilot?</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mt-3">
            Analyze sample datasets or upload your own CSV files live in the Copilot Studio workspace.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/copilot"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-2xl shadow-indigo-500/50 flex items-center gap-3 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              <span>Launch Copilot Studio Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-8 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 OmniGraph • Zero-GPU Generative UI Data Copilot</p>
          <div className="flex items-center gap-6">
            <Link href="/copilot" className="hover:text-indigo-400 transition-colors">Copilot Studio</Link>
            <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
