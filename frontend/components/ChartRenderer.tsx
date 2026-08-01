'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Table as TableIcon, Layers } from 'lucide-react';
import { parseChartSpec, UIComponentSpec } from '../lib/chartParser';

interface ChartRendererProps {
  spec: any;
}

const COLOR_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-indigo-500/30 shadow-xl text-xs text-gray-100">
        <p className="font-semibold text-indigo-300 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300 capitalize">{entry.name}:</span>
            <span className="font-mono font-bold text-white">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ spec }) => {
  const parsed: UIComponentSpec = parseChartSpec(spec);
  const data = parsed.data || [];

  if (!spec || (!data.length && (!parsed.kpis || !parsed.kpis.length))) {
    return (
      <div className="flex flex-col items-center justify-center h-80 rounded-2xl glass-card border border-dashed border-gray-700/60 p-8 text-center">
        <div className="p-4 rounded-full bg-indigo-500/10 mb-4 text-indigo-400">
          <BarChart3 className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-gray-200">Awaiting Voice Request</h3>
        <p className="text-sm text-gray-400 max-w-sm mt-1">
          Speak a question like <span className="text-indigo-400 font-mono">"Plot revenue by month"</span> or <span className="text-indigo-400 font-mono">"Compare profit across categories"</span>.
        </p>
      </div>
    );
  }

  const renderIcon = () => {
    switch (parsed.type) {
      case 'line_chart': return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'area_chart': return <Activity className="w-5 h-5 text-indigo-400" />;
      case 'pie_chart': return <PieIcon className="w-5 h-5 text-emerald-400" />;
      case 'table': return <TableIcon className="w-5 h-5 text-amber-400" />;
      case 'kpi_cards': return <Layers className="w-5 h-5 text-violet-400" />;
      default: return <BarChart3 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden"
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
            {renderIcon()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100 tracking-tight">{parsed.title}</h2>
            <p className="text-xs text-gray-400">Generative UI Render • {parsed.type.toUpperCase().replace('_', ' ')}</p>
          </div>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          AI Generated
        </span>
      </div>

      {/* KPI Cards View */}
      {parsed.type === 'kpi_cards' && parsed.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2">
          {parsed.kpis.map((kpi, idx) => (
            <div key={idx} className="glass-card p-4 rounded-xl border border-indigo-500/20 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{kpi.label}</span>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 my-2">
                {kpi.value}
              </div>
              {kpi.subtext && <span className="text-xs text-emerald-400 font-medium">{kpi.subtext}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Data Table View */}
      {parsed.type === 'table' && (
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-800/60 uppercase text-gray-400 border-b border-gray-700">
              <tr>
                <th className="p-3">Category / Name</th>
                <th className="p-3 font-mono">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-3 font-medium text-gray-200">{row.name}</td>
                  <td className="p-3 font-mono font-bold text-indigo-300">{row.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dynamic Recharts Rendering */}
      {parsed.type !== 'table' && parsed.type !== 'kpi_cards' && (
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {parsed.type === 'line_chart' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4' }} activeDot={{ r: 8 }} />
              </LineChart>
            ) : parsed.type === 'area_chart' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#areaGrad)" />
              </AreaChart>
            ) : parsed.type === 'pie_chart' ? (
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} innerRadius={45} paddingAngle={4} label>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
              </PieChart>
            ) : parsed.type === 'scatter_chart' ? (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis type="number" dataKey="x" name={parsed.xAxis} stroke="#9ca3af" fontSize={12} />
                <YAxis type="number" dataKey="y" name={parsed.yAxis} stroke="#9ca3af" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name={parsed.title} data={data} fill="#8b5cf6" />
              </ScatterChart>
            ) : (
              /* Default Bar Chart */
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};
