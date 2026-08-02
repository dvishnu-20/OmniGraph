'use client';

import React, { useState, useEffect } from 'react';
import { Database, Upload, FileText, Check, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface DatasetSelectorProps {
  onSelectDataset: (name: string) => void;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({ onSelectDataset }) => {
  const [datasets, setDatasets] = useState<string[]>(['sales_data.csv', 'vendor_risk.csv', 'q3_financials.csv']);
  const [activeDataset, setActiveDataset] = useState<string>('sales_data.csv');
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load available datasets & active dataset preview
  const fetchPreview = (name: string) => {
    setIsLoadingPreview(true);
    setSummary(null);
    fetch(`http://localhost:8000/api/dataset/preview?name=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.filename) {
          setSummary(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingPreview(false);
      });
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/datasets')
      .then((res) => res.json())
      .then((data) => {
        if (data.available_datasets && data.available_datasets.length > 0) {
          setDatasets(data.available_datasets);
        }
        if (data.active_dataset) {
          setActiveDataset(data.active_dataset);
          fetchPreview(data.active_dataset);
        }
      })
      .catch(() => {
        setDatasets(['sales_data.csv']);
      });
  }, []);

  const handleSelect = (name: string) => {
    setActiveDataset(name);
    setUploadError(null);
    onSelectDataset(name);
    fetchPreview(name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.summary && data.summary.filename) {
        setDatasets((prev) => Array.from(new Set([...prev, data.summary.filename])));
        setSummary(data.summary);
        handleSelect(data.summary.filename);
      } else {
        setUploadError(data.detail || data.message || 'Failed to parse uploaded dataset file.');
      }
    } catch (err: any) {
      console.error('[Upload Error]', err);
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 shadow-md mb-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Dataset</h4>
            <span className="text-sm font-semibold text-gray-100 flex items-center gap-1.5 mt-0.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              {activeDataset}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingPreview ? (
            <div className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 text-xs text-indigo-300 font-medium flex items-center gap-1.5 border border-indigo-500/30 animate-pulse">
              <Info className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Loading metadata...</span>
            </div>
          ) : summary ? (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-medium flex items-center gap-1 border border-gray-700 transition-all"
            >
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>{summary.row_count} rows, {summary.col_count} cols</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : null}

          {/* Dataset Dropdown Selector */}
          <select
            value={activeDataset}
            onChange={(e) => handleSelect(e.target.value)}
            className="bg-gray-900 text-xs text-gray-200 border border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {datasets.map((name) => (
              <option key={name} value={name}>
                📊 {name}
              </option>
            ))}
          </select>

          {/* Custom CSV Upload Button */}
          <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-lg shadow-indigo-500/20">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload CSV'}</span>
            <input type="file" accept=".csv,.xlsx,.xls,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Expanded Dataset Metadata Drawer */}
      {showDetails && summary && (
        <div className="mt-4 pt-3 border-t border-gray-800/80 text-xs text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono bg-gray-950/60 p-3 rounded-xl">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              Numerical Columns ({summary.numeric_columns?.length || 0}):
            </span>
            <div className="flex flex-wrap gap-1">
              {summary.numeric_columns?.map((c: string) => (
                <span key={c} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px]">
                  {c}
                </span>
              )) || <span className="text-gray-500 italic">None detected</span>}
            </div>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              Categorical / Text Columns ({summary.categorical_columns?.length || 0}):
            </span>
            <div className="flex flex-wrap gap-1">
              {summary.categorical_columns?.map((c: string) => (
                <span key={c} className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  {c}
                </span>
              )) || <span className="text-gray-500 italic">None detected</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
