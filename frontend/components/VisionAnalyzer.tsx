'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  Table
} from 'lucide-react';

interface VisionAnalyzerProps {
  onVisionResult?: (result: any) => void;
}

const VISION_PRESETS = [
  {
    name: 'sample_q3_revenue_chart.png',
    label: 'Sample Revenue Chart',
    desc: 'Extract Quarterly Revenue & Margin Data Points',
    type: 'image/png'
  },
  {
    name: 'sample_cloud_invoice.png',
    label: 'Sample Vendor Invoice',
    desc: 'Extract Itemized Billing Items & Amounts',
    type: 'image/png'
  },
  {
    name: 'financial_report_2024.pdf',
    label: 'Sample Financial PDF',
    desc: 'Extract Embedded Financial Report Tables',
    type: 'application/pdf'
  }
];

export function VisionAnalyzer({ onVisionResult }: VisionAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleUploadAndAnalyze = async (fileToProcess: File | null = file) => {
    if (!fileToProcess) {
      setError('Please select or drop an image/PDF file to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', fileToProcess);

    try {
      const res = await fetch('http://localhost:8000/api/vision/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSummary(data.stdout || 'Vision data extracted successfully.');
        setExecTime(data.execution_time_ms || 0);
        setError(null);
        if (onVisionResult) {
          onVisionResult(data);
        }
      } else {
        setError(data.error || 'Failed to analyze vision document.');
      }
    } catch (err: any) {
      setError(`Vision Engine Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetSelect = (preset: typeof VISION_PRESETS[0]) => {
    // 1x1 valid PNG base64 byte array for preset images
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const byteCharacters = atob(base64Png);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: preset.type });
    const dummyFile = new File([blob], preset.name, { type: preset.type });
    setFile(dummyFile);
    setImagePreview(null);
    handleUploadAndAnalyze(dummyFile);
  };

  return (
    <div className="glass-panel rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl transition-all">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Camera className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-100 tracking-wide">
                Multi-Modal Vision & Document Analyzer
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                OCR & Chart-to-Data
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Extract chart data points, receipts, & PDF tables into editable DataFrames
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {execTime > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current animate-pulse" />
              <span>{execTime.toFixed(1)} ms</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-4"
          >
            {/* Quick Vision Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-2">
                <Eye className="w-3 h-3 text-indigo-400" /> 1-Click Vision Presets:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {VISION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-indigo-950/60 border border-gray-800 hover:border-indigo-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-gray-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {preset.type === 'application/pdf' ? (
                          <FileText className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        {preset.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-4 text-center cursor-pointer bg-gray-950/80 hover:bg-indigo-950/20 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-200">
                    {file ? file.name : 'Click or Drag & Drop Chart Image or PDF'}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Supports PNG, JPG, WEBP, and PDF files
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview & Action Button */}
            {file && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-rose-400">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-200 block truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUploadAndAnalyze()}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isAnalyzing ? 'Extracting Data...' : 'Analyze & Extract Data'}</span>
                </button>
              </div>
            )}

            {/* Summary Output */}
            {summary && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Vision Extraction Complete:</span> {summary}
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Vision Error:</span> {error}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
