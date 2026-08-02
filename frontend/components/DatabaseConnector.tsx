'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Play,
  Terminal,
  Server,
  Zap,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Table,
  Layers,
  CheckCircle2,
  Code
} from 'lucide-react';

interface DatabaseConnectorProps {
  onExecuteResult?: (result: any) => void;
}

const SQL_PRESETS = [
  {
    label: 'Top Customers by Spend',
    desc: 'JOIN customers & orders to calculate total spend per client',
    sql: 'SELECT c.customer_name, SUM(o.total_amount) AS total_spend FROM orders o JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.customer_name ORDER BY total_spend DESC'
  },
  {
    label: 'Regional Revenue Breakdown',
    desc: 'Aggregate total order volume grouped by geographical region',
    sql: 'SELECT region, SUM(total_amount) AS regional_revenue FROM orders GROUP BY region ORDER BY regional_revenue DESC'
  },
  {
    label: 'Product Sales Volume',
    desc: 'JOIN products & orders to calculate units sold per product',
    sql: 'SELECT p.product_name, SUM(o.quantity) AS total_units_sold FROM orders o JOIN products p ON o.product_id = p.product_id GROUP BY p.product_name ORDER BY total_units_sold DESC'
  }
];

export function DatabaseConnector({ onExecuteResult }: DatabaseConnectorProps) {
  const [schema, setSchema] = useState<any>(null);
  const [dbUrlInput, setDbUrlInput] = useState('');
  const [sqlQuery, setSqlQuery] = useState(SQL_PRESETS[0].sql);
  const [stdout, setStdout] = useState('');
  const [execTime, setExecTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'sql' | 'schema'>('sql');

  // Fetch active schema on mount
  const fetchSchema = () => {
    fetch('http://localhost:8000/api/database/schema')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tables) {
          setSchema(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleConnectDb = async (url?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_url: url || dbUrlInput || null })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchema(data.schema);
        setError(null);
      } else {
        setError(data.error || 'Failed to connect to database.');
      }
    } catch (err: any) {
      setError(`Database Connection Error: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRunSql = async (sqlToRun: string = sqlQuery) => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/database/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlToRun })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStdout(data.stdout || 'SQL query executed successfully.');
        setExecTime(data.execution_time_ms || 0);
        setError(null);
        if (onExecuteResult) {
          onExecuteResult(data);
        }
      } else {
        setError(data.error || 'SQL execution failed.');
        setExecTime(data.execution_time_ms || 0);
      }
    } catch (err: any) {
      setError(`Backend error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl transition-all">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-100 tracking-wide">
                Enterprise SQL Database Connector
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                <Server className="w-3 h-3 text-indigo-400" />
                {schema?.db_name || 'SQLite / PostgreSQL'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Live SQL introspection & execution pool (PostgreSQL, MySQL, SQLite)
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
            {/* Quick Connection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-950/80 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={dbUrlInput}
                  onChange={(e) => setDbUrlInput(e.target.value)}
                  placeholder="postgresql://user:pass@host:5432/dbname or sqlite:///path"
                  className="w-full bg-gray-900 text-xs text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 outline-none font-mono"
                />
                <button
                  onClick={() => handleConnectDb()}
                  disabled={isConnecting}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700 whitespace-nowrap"
                >
                  {isConnecting ? 'Connecting...' : 'Connect URI'}
                </button>
              </div>

              <button
                onClick={() => handleConnectDb('enterprise_data.db')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Load Sample SQLite DB</span>
              </button>
            </div>

            {/* SQL Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-2">
                <Code className="w-3 h-3 text-indigo-400" /> Quick SQL Analytics Queries:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {SQL_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlQuery(preset.sql);
                      handleRunSql(preset.sql);
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
                  onClick={() => setActiveTab('sql')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'sql'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SQL Console</span>
                </button>

                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'schema'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Schema Inspector ({schema?.table_count || 0} tables)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunSql(sqlQuery)}
                  disabled={isExecuting}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Executing...' : 'Run SQL Query'}</span>
                </button>
              </div>
            </div>

            {/* Tab 1: SQL Editor Console */}
            {activeTab === 'sql' && (
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 font-mono text-xs shadow-inner">
                <div className="p-3 bg-gray-900/90 text-gray-500 text-[10px] border-b border-gray-800 flex items-center justify-between">
                  <span>Target DB: {schema?.db_name || 'Active Database'}</span>
                  <span>Press Run to query DB & render dynamic chart</span>
                </div>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={4}
                  spellCheck={false}
                  className="w-full bg-gray-950 text-indigo-100 p-3.5 outline-none resize-y font-mono text-xs leading-relaxed selection:bg-indigo-600 selection:text-white"
                />
              </div>
            )}

            {/* Tab 2: Schema Inspector */}
            {activeTab === 'schema' && (
              <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs max-h-[220px] overflow-y-auto space-y-3">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                  Database Tables & Columns:
                </div>
                {schema?.tables ? (
                  Object.entries(schema.tables).map(([tableName, info]: [string, any]) => (
                    <div key={tableName} className="p-2.5 rounded-lg bg-gray-900 border border-gray-800">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Table className="w-3.5 h-3.5 text-indigo-400" /> {tableName}
                        </span>
                        <span className="text-[10px] text-gray-400">{info.row_count} rows</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(info.columns || {}).map(([colName, dtype]: [string, any]) => (
                          <span key={colName} className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 text-[10px]">
                            {colName} <span className="text-gray-500">({dtype})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No schema loaded.</span>
                )}
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Database Error:</span> {error}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
