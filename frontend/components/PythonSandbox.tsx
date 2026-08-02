'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Play,
  Terminal,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PythonSandboxProps {
  initialCode?: string;
  initialStdout?: string;
  initialTimeMs?: number;
  initialError?: string | null;
  onExecuteResult?: (result: any) => void;
}

const SAMPLE_PRESETS = [
  {
    label: 'Linear Regression Forecast',
    desc: 'Fit y = mx + c trend model & predict next 3 periods',
    code: [
      '# Fit Linear Regression Model on Target Numerical Variable',
      "val_col = [c for c in df.select_dtypes(include=[np.number]).columns if 'revenue' in c.lower() or 'sales' in c.lower() or 'profit' in c.lower()][0]",
      "time_col = [c for c in df.columns if any(k in c.lower() for k in ['date', 'month', 'year'])][0]",
      '',
      'grouped = df.groupby(time_col, sort=False)[val_col].sum().reset_index()',
      'x_idx = np.arange(len(grouped))',
      'y_vals = grouped[val_col].values.astype(float)',
      '',
      'slope, intercept = np.polyfit(x_idx, y_vals, 1)',
      'next_x = np.arange(len(grouped), len(grouped) + 3)',
      'next_y = slope * next_x + intercept',
      '',
      'data_points = []',
      'for i, row in grouped.iterrows():',
      '    data_points.append({"name": str(row[time_col]), "value": round(float(row[val_col]), 2), "secondary": round(float(slope * i + intercept), 2)})',
      '',
      'for j, py in enumerate(next_y):',
      '    data_points.append({"name": f"Forecast +{j+1}", "value": round(float(py), 2), "secondary": round(float(py), 2)})',
      '',
      'ui_component = {',
      '    "type": "line_chart",',
      '    "title": f"Linear Regression Trend & Prediction ({val_col})",',
      '    "xAxis": time_col,',
      '    "yAxis": val_col,',
      '    "data": data_points',
      '}',
      '',
      'print(f"Linear Fit Equation: y = {slope:.2f}x + {intercept:.2f}")',
      'print(f"Predicted next period value: ${next_y[0]:,.2f}")'
    ].join('\n')
  },
  {
    label: 'IQR Outlier Detection',
    desc: 'Identify extreme outliers using 1.5x IQR boundary',
    code: [
      '# Outlier Detection Engine',
      'num_cols = df.select_dtypes(include=[np.number]).columns.tolist()',
      'target_col = num_cols[0]',
      "name_col = df.select_dtypes(include=['object']).columns[0] if len(df.select_dtypes(include=['object']).columns) > 0 else df.columns[0]",
      '',
      's = df[target_col].dropna()',
      'q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))',
      'iqr = q3 - q1',
      'lower_bound, upper_bound = q1 - 1.5 * iqr, q3 + 1.5 * iqr',
      '',
      'df_outliers = df[(df[target_col] < lower_bound) | (df[target_col] > upper_bound)]',
      'if df_outliers.empty:',
      '    mean_val = float(s.mean())',
      '    df_temp = df.copy()',
      "    df_temp['dev'] = (df_temp[target_col] - mean_val).abs()",
      "    df_outliers = df_temp.sort_values(by='dev', ascending=False).head(3)",
      '',
      'top_outliers = df_outliers.head(5)',
      'data_points = [{"name": str(r[name_col]), "value": round(float(r[target_col]), 2), "secondary": round(lower_bound, 2)} for _, r in top_outliers.iterrows()]',
      '',
      'ui_component = {',
      '    "type": "bar_chart",',
      '    "title": f"Statistical Outliers in {target_col}",',
      '    "xAxis": name_col,',
      '    "yAxis": target_col,',
      '    "data": data_points',
      '}',
      '',
      'print(f"Identified {len(df_outliers)} outlier records.")',
      'print(f"IQR Lower Threshold: {lower_bound:.2f} | Upper Threshold: {upper_bound:.2f}")'
    ].join('\n')
  },
  {
    label: 'Correlation Heatmap',
    desc: 'Calculate full Pearson correlation matrix',
    code: [
      '# Compute Correlation Matrix Heatmap',
      'numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()[:5]',
      'corr_matrix = df[numeric_cols].corr().fillna(0)',
      'matrix = [[round(float(corr_matrix.loc[r, c]), 2) for c in numeric_cols] for r in numeric_cols]',
      '',
      'ui_component = {',
      '    "type": "heatmap",',
      '    "title": "Pearson Correlation Heatmap Matrix",',
      '    "matrix": {',
      '        "xLabels": numeric_cols,',
      '        "yLabels": numeric_cols,',
      '        "matrix": matrix',
      '    }',
      '}',
      '',
      'print(f"Analyzed correlation across {len(numeric_cols)} numerical features.")'
    ].join('\n')
  }
];

export function PythonSandbox({
  initialCode = '# Live Sandboxed Python Code Engine\nprint(f"Dataset shape: {df.shape}")\nprint(df.describe())',
  initialStdout = '',
  initialTimeMs = 0,
  initialError = null,
  onExecuteResult
}: PythonSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [stdout, setStdout] = useState(initialStdout);
  const [execTime, setExecTime] = useState(initialTimeMs);
  const [error, setError] = useState<string | null>(initialError);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'console'>('code');

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (initialStdout !== undefined) setStdout(initialStdout);
    if (initialTimeMs !== undefined) setExecTime(initialTimeMs);
    if (initialError !== undefined) setError(initialError);
  }, [initialStdout, initialTimeMs, initialError]);

  const handleRunCode = async (codeToRun: string = code) => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStdout(data.stdout || 'Code executed with no output.');
        setExecTime(data.execution_time_ms || 0);
        setError(data.error || null);

        if (onExecuteResult) {
          onExecuteResult(data);
        }
      } else {
        setError(data.error || 'Execution failed or rejected by AST security check.');
        setStdout(data.stdout || '');
        setExecTime(data.execution_time_ms || 0);
      }
    } catch (err: any) {
      setError(`Backend connection error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl transition-all">
      {/* Sandbox Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-100 tracking-wide">
                Autonomous Python Sandbox
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                AST Shielded
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Sandboxed engine executing code on Pandas DataFrame (`df`)
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
            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Analytics Presets:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCode(preset.code);
                      handleRunCode(preset.code);
                    }}
                    className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-indigo-950/60 border border-gray-800 hover:border-indigo-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-gray-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>{preset.label}</span>
                      <Play className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'code'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Python Editor</span>
                </button>

                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'console'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Stdout Console</span>
                  {stdout && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCode(initialCode);
                    setError(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => handleRunCode(code)}
                  disabled={isExecuting}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Run Python Code'}</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Code Editor */}
            {activeTab === 'code' && (
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 font-mono text-xs shadow-inner">
                <div className="p-3 bg-gray-900/90 text-gray-500 text-[10px] border-b border-gray-800 flex items-center justify-between">
                  <span>Injected Scope: `df` (Pandas DataFrame), `pd`, `np`, `math`</span>
                  <span>Press Run to update chart & findings</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="w-full bg-gray-950 text-indigo-100 p-3.5 outline-none resize-y font-mono text-xs leading-relaxed selection:bg-indigo-600 selection:text-white"
                />
              </div>
            )}

            {/* Tab 2: Console Output */}
            {activeTab === 'console' && (
              <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs min-h-[160px] text-gray-200">
                <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider flex items-center justify-between border-b border-gray-800 pb-1">
                  <span>Execution Standard Output (stdout)</span>
                  {execTime > 0 && <span className="text-emerald-400">⚡ Execution time: {execTime} ms</span>}
                </div>
                {stdout ? (
                  <pre className="text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">{stdout}</pre>
                ) : (
                  <span className="text-gray-600 italic">No console logs outputted yet.</span>
                )}
              </div>
            )}

            {/* Error Notification Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Sandbox Error:</span> {error}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
