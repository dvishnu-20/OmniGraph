'use client';

import React, { useState, useEffect } from 'react';
import { Database, Upload, FileText, Check, Sparkles } from 'lucide-react';

interface DatasetSelectorProps {
  onSelectDataset: (name: string) => void;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({ onSelectDataset }) => {
  const [datasets, setDatasets] = useState<string[]>(['sales_data.csv']);
  const [activeDataset, setActiveDataset] = useState<string>('sales_data.csv');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/datasets')
      .then((res) => res.json())
      .then((data) => {
        if (data.available_datasets) setDatasets(data.available_datasets);
        if (data.active_dataset) setActiveDataset(data.active_dataset);
      })
      .catch(() => {
        // Fallback datasets
        setDatasets(['sales_data.csv']);
      });
  }, []);

  const handleSelect = (name: string) => {
    setActiveDataset(name);
    onSelectDataset(name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.summary && data.summary.filename) {
        setDatasets((prev) => Array.from(new Set([...prev, data.summary.filename])));
        handleSelect(data.summary.filename);
      }
    } catch (err) {
      console.error('[Upload Error]', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
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
        {/* Dataset Dropdown */}
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
          <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
};
