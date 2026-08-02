'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Wifi, WifiOff, Send, HelpCircle, MessageSquare, ArrowLeft, LayoutDashboard, BarChart3, Terminal, Database, Camera, Volume2, Settings2, SlidersHorizontal } from 'lucide-react';

import { useRecorder } from '../../hooks/useRecorder';
import { useWebSocket } from '../../hooks/useWebSocket';

import { MicButton } from '../../components/MicButton';
import { ChartRenderer } from '../../components/ChartRenderer';
import { Telemetry } from '../../components/Telemetry';
import { AudioPlayer } from '../../components/AudioPlayer';
import { DatasetSelector } from '../../components/DatasetSelector';
import { Loading } from '../../components/Loading';
import { PythonSandbox } from '../../components/PythonSandbox';
import { DatabaseConnector } from '../../components/DatabaseConnector';
import { WebRTCVoiceController } from '../../components/WebRTCVoiceController';
import { VisionAnalyzer } from '../../components/VisionAnalyzer';

export default function CopilotStudioPage() {
  const { isRecording, audioLevel, transcript, startRecording, stopRecording } = useRecorder();
  const {
    isConnected,
    processingStage,
    processingMessage,
    userTranscript,
    latestResponse,
    telemetry,
    sendAudio,
    selectDataset,
  } = useWebSocket('ws://localhost:8000/stream');

  const [textInput, setTextInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [activeStudioTab, setActiveStudioTab] = useState<'canvas' | 'python' | 'sql' | 'vision'>('canvas');
  const [showWebRTCSettings, setShowWebRTCSettings] = useState(false);

  // Sync latestResponse from WebSocket to state & auto-select Canvas tab
  useEffect(() => {
    if (latestResponse) {
      setSandboxResponse(null);
      setActiveStudioTab('canvas');
    }
  }, [latestResponse]);

  const currentUiComponent = sandboxResponse?.ui_component || latestResponse?.ui_component;
  const currentCode = sandboxResponse ? sandboxResponse.code : (latestResponse?.code || '');
  const currentStdout = sandboxResponse ? sandboxResponse.stdout : (latestResponse?.stdout || '');
  const currentTimeMs = sandboxResponse ? sandboxResponse.execution_time_ms : (latestResponse?.execution_time_ms || 0);
  const currentError = sandboxResponse ? sandboxResponse.error : (latestResponse?.execution_error || null);

  // Sync live speech transcript to text input field
  useEffect(() => {
    if (transcript) {
      setTextInput(transcript);
    }
  }, [transcript]);

  // Voice Recording trigger
  const handleMicMouseDown = async () => {
    await startRecording();
  };

  const handleMicMouseUp = async () => {
    const { base64Audio, transcriptText } = await stopRecording();
    const queryToUse = transcriptText || textInput;
    sendAudio(base64Audio, queryToUse);
  };

  const handleMicClick = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      const { base64Audio, transcriptText } = await stopRecording();
      const queryToUse = transcriptText || textInput;
      sendAudio(base64Audio, queryToUse);
    }
  };

  // Text Query Submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    sendAudio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", textInput.trim());
  };

  const sampleQueries = [
    'Run linear regression predicting next month sales',
    'Find top 3 outliers in profit margin',
    'Show correlation heatmap',
    'Show radar chart comparison',
    'Show treemap budget breakdown',
    'Show boxplot distribution',
    'Show 3d scatter plot',
    'Plot revenue by month',
    'Show dataset key performance indicators'
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col justify-between space-y-6">
      {/* Header Bar */}
      <header className="glass-panel p-4 md:px-6 md:py-4 rounded-2xl border border-indigo-500/20 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-indigo-200 to-cyan-300">
                Copilot Studio
              </h1>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> OmniGraph Zero-GPU Generative UI
              </p>
            </div>
          </div>
        </div>

        {/* Server Connection Indicator & WebRTC Settings Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWebRTCSettings(!showWebRTCSettings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showWebRTCSettings
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-gray-800/80 text-gray-300 hover:text-white border-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio & WebRTC Config</span>
          </button>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Backend Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Connecting ws://localhost:8000</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Optional WebRTC Voice Settings Drawer */}
      {showWebRTCSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 rounded-2xl border border-indigo-500/30 shadow-xl"
        >
          <WebRTCVoiceController />
        </motion.div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dataset & Voice Hub (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dataset Selector Card */}
          <DatasetSelector onSelectDataset={selectDataset} />

          {/* Voice & Prompt Mic Card */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-center">
            <MicButton
              isRecording={isRecording}
              isProcessing={!!processingStage}
              isSpeaking={isSpeaking}
              audioLevel={audioLevel}
              onMouseDown={handleMicMouseDown}
              onMouseUp={handleMicMouseUp}
              onClick={handleMicClick}
            />

            {/* Live Voice Speech Transcript Preview */}
            {isRecording && transcript && (
              <div className="my-3 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 animate-pulse flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>"{transcript}"</span>
              </div>
            )}

            {/* Direct Query Text Box Input */}
            <form onSubmit={handleTextSubmit} className="mt-5 flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask any question about your data..."
                className="flex-1 bg-gray-900/90 text-xs text-gray-100 border border-gray-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-500 font-medium"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || !!processingStage}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Sample Queries */}
            <div className="mt-6 pt-4 border-t border-gray-800 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Quick Analytics Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTextInput(q);
                      sendAudio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", q);
                    }}
                    className="text-xs bg-gray-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/40 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 transition-all text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Tabbed Studio Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Studio Workspace Dock Nav Tabs */}
          <div className="p-1.5 bg-gray-900/90 border border-gray-800 rounded-2xl flex items-center justify-between shadow-xl overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              <button
                onClick={() => setActiveStudioTab('canvas')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeStudioTab === 'canvas'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Generative Canvas</span>
              </button>

              <button
                onClick={() => setActiveStudioTab('python')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeStudioTab === 'python'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Python IDE</span>
              </button>

              <button
                onClick={() => setActiveStudioTab('sql')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeStudioTab === 'sql'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>SQL Studio</span>
              </button>

              <button
                onClick={() => setActiveStudioTab('vision')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeStudioTab === 'vision'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Vision OCR</span>
              </button>
            </div>
          </div>

          {/* Realtime Processing State */}
          {processingStage && (
            <Loading stage={processingStage} message={processingMessage} />
          )}

          {/* Audio Synthesized Answer Banner */}
          {latestResponse && (
            <AudioPlayer
              speechText={sandboxResponse ? sandboxResponse.speech_text : latestResponse.speech_text}
              audioB64={latestResponse.audio_b64}
              transcript={latestResponse.transcript || userTranscript}
              onPlayStateChange={setIsSpeaking}
            />
          )}

          {/* Tab 1: Dynamic Generative Chart Canvas */}
          {activeStudioTab === 'canvas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ChartRenderer spec={currentUiComponent} />
            </motion.div>
          )}

          {/* Tab 2: Autonomous Python Sandbox IDE Panel */}
          {activeStudioTab === 'python' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PythonSandbox
                initialCode={currentCode || '# Autonomous Python Sandbox Engine\nprint(f"Dataset shape: {df.shape}")\nprint(df.describe())'}
                initialStdout={currentStdout}
                initialTimeMs={currentTimeMs}
                initialError={currentError}
                onExecuteResult={(result) => {
                  setSandboxResponse(result);
                  setActiveStudioTab('canvas');
                }}
              />
            </motion.div>
          )}

          {/* Tab 3: Enterprise SQL Database Connector Panel */}
          {activeStudioTab === 'sql' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <DatabaseConnector onExecuteResult={(result) => {
                setSandboxResponse(result);
                setActiveStudioTab('canvas');
              }} />
            </motion.div>
          )}

          {/* Tab 4: Multi-Modal Vision & Document Analyzer Panel */}
          {activeStudioTab === 'vision' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <VisionAnalyzer onVisionResult={(result) => {
                setSandboxResponse(result);
                setActiveStudioTab('canvas');
              }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <Telemetry data={telemetry} />
    </main>
  );
}
