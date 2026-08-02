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
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Table as TableIcon,
  Layers,
  Grid,
  Compass,
  Box,
  Sliders,
  Cuboid
} from 'lucide-react';
import { parseChartSpec, UIComponentSpec } from '../lib/chartParser';

interface ChartRendererProps {
  spec: any;
}

const COLOR_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-indigo-500/30 shadow-xl text-xs text-gray-100">
        <p className="font-semibold text-indigo-300 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill || '#6366f1' }} />
            <span className="text-gray-300 capitalize">{entry.name}:</span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Treemap Tile Content Renderer
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value } = props;
  if (width < 30 || height < 20) return null;
  const color = COLOR_PALETTE[index % COLOR_PALETTE.length];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          fillOpacity: 0.85,
          stroke: '#111827',
          strokeWidth: 2,
          rx: 6,
          ry: 6
        }}
      />
      {width > 50 && height > 35 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={11}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
      {width > 50 && height > 35 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="#e0e7ff"
          fontSize={10}
          fontFamily="monospace"
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </text>
      )}
    </g>
  );
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ spec }) => {
  const parsed: UIComponentSpec = parseChartSpec(spec);
  const data = parsed.data || [];

  if (
    !spec ||
    (!data.length &&
      !parsed.heatmapData?.length &&
      !parsed.heatmapMatrix &&
      !parsed.boxPlotData?.length &&
      !parsed.scatter3DData?.length &&
      (!parsed.kpis || !parsed.kpis.length))
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-80 rounded-2xl glass-card border border-dashed border-gray-700/60 p-8 text-center">
        <div className="p-4 rounded-full bg-indigo-500/10 mb-4 text-indigo-400">
          <BarChart3 className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-gray-200">Awaiting Voice Request</h3>
        <p className="text-sm text-gray-400 max-w-sm mt-1">
          Speak a question like <span className="text-indigo-400 font-mono">"Plot correlation heatmap"</span>,{' '}
          <span className="text-indigo-400 font-mono">"Show radar chart"</span> or{' '}
          <span className="text-indigo-400 font-mono">"Show box plot distribution"</span>.
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
      case 'heatmap': return <Grid className="w-5 h-5 text-pink-400" />;
      case 'radar_chart': return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'treemap': return <Box className="w-5 h-5 text-emerald-400" />;
      case 'boxplot': return <Sliders className="w-5 h-5 text-amber-400" />;
      case 'scatter_3d': return <Cuboid className="w-5 h-5 text-indigo-400" />;
      default: return <BarChart3 className="w-5 h-5 text-indigo-400" />;
    }
  };

  // Helper for Heatmap cell colors (-1 to 1 correlation or 0 to N intensity)
  const getHeatmapColor = (val: number, minVal = -1, maxVal = 1) => {
    const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));
    if (norm < 0.33) return `rgba(30, 27, 75, ${0.4 + norm * 1.2})`; // Dark indigo
    if (norm < 0.66) return `rgba(99, 102, 241, ${0.4 + norm * 0.8})`; // Bright indigo/cyan
    return `rgba(16, 185, 129, ${0.5 + norm * 0.5})`; // Vibrant emerald
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

      {/* Heatmap Matrix View */}
      {parsed.type === 'heatmap' && (
        <div className="w-full h-80 pt-2 overflow-auto flex flex-col justify-center items-center">
          {parsed.heatmapMatrix ? (
            <div className="inline-block p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-gray-500 font-mono"></th>
                    {parsed.heatmapMatrix.xLabels.map((col, cIdx) => (
                      <th key={cIdx} className="p-2 text-gray-300 font-semibold truncate max-w-[80px]" title={col}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.heatmapMatrix.yLabels.map((rowLabel, rIdx) => (
                    <tr key={rIdx}>
                      <td className="p-2 text-gray-300 font-semibold text-right truncate max-w-[80px]" title={rowLabel}>
                        {rowLabel}
                      </td>
                      {parsed.heatmapMatrix!.matrix[rIdx]?.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className="p-3 text-center font-mono font-bold text-white rounded-md border border-gray-800/50 transition-all hover:scale-105"
                          style={{ backgroundColor: getHeatmapColor(val) }}
                          title={`${rowLabel} x ${parsed.heatmapMatrix!.xLabels[cIdx]}: ${val}`}
                        >
                          {val.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 w-full max-h-72 p-2 overflow-y-auto">
              {parsed.heatmapData?.map((cell, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-gray-700/60 text-center flex flex-col justify-center transition-all hover:border-indigo-400"
                  style={{ backgroundColor: getHeatmapColor(cell.value, 0, 100) }}
                >
                  <span className="text-[10px] text-gray-300 truncate">{cell.x} - {cell.y}</span>
                  <span className="text-sm font-mono font-black text-white mt-1">{cell.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Box Plot Distribution View */}
      {parsed.type === 'boxplot' && parsed.boxPlotData && (
        <div className="w-full h-80 pt-2 flex items-center justify-around gap-4 overflow-x-auto px-4">
          {parsed.boxPlotData.map((box, idx) => {
            const range = Math.max(1, box.max - box.min);
            const getPct = (val: number) => Math.max(5, Math.min(95, ((val - box.min) / range) * 80 + 10));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-between py-2 min-w-[90px]">
                <span className="text-xs font-semibold text-gray-300">{box.category}</span>
                <div className="relative w-12 h-56 bg-gray-900/80 rounded-xl border border-gray-800 flex items-center justify-center">
                  {/* Vertical Whisper Line */}
                  <div className="absolute w-0.5 bg-indigo-400/60" style={{ top: `${100 - getPct(box.max)}%`, bottom: `${getPct(box.min)}%` }} />
                  {/* Min / Max Caps */}
                  <div className="absolute w-6 h-0.5 bg-indigo-300" style={{ top: `${100 - getPct(box.max)}%` }} />
                  <div className="absolute w-6 h-0.5 bg-indigo-300" style={{ bottom: `${getPct(box.min)}%` }} />
                  {/* Quartile Box */}
                  <div
                    className="absolute w-10 rounded-md border-2 border-indigo-400 bg-gradient-to-b from-indigo-600/40 to-cyan-600/40 shadow-lg"
                    style={{
                      bottom: `${getPct(box.q1)}%`,
                      height: `${Math.max(12, getPct(box.q3) - getPct(box.q1))}%`
                    }}
                  />
                  {/* Median Line */}
                  <div
                    className="absolute w-10 h-1 bg-emerald-400 z-10 shadow-md"
                    style={{ bottom: `${getPct(box.median)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-gray-400 flex flex-col items-center">
                  <span className="text-emerald-400 font-bold">Med: {box.median}</span>
                  <span>[{box.min} - {box.max}]</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Scatter Plot View */}
      {parsed.type === 'scatter_3d' && (
        <div className="w-full h-80 pt-2 relative">
          <div className="absolute top-2 right-2 z-10 bg-gray-900/90 border border-gray-700/80 rounded-lg p-2 text-[10px] font-mono text-gray-300">
            <span className="text-indigo-400 font-bold">X:</span> {parsed.xAxis} |{' '}
            <span className="text-cyan-400 font-bold">Y:</span> {parsed.yAxis} |{' '}
            <span className="text-emerald-400 font-bold">Z (Size):</span> {parsed.zAxis}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
              <XAxis type="number" dataKey="x" name={parsed.xAxis} stroke="#9ca3af" fontSize={12} />
              <YAxis type="number" dataKey="y" name={parsed.yAxis} stroke="#9ca3af" fontSize={12} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} name={parsed.zAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name={parsed.title} data={parsed.scatter3DData || data} fill="#6366f1">
                {(parsed.scatter3DData || data).map((entry, index) => (
                  <Cell
                    key={`cell-3d-${index}`}
                    fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    fillOpacity={0.8}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Standard Recharts Renderings */}
      {parsed.type !== 'table' &&
        parsed.type !== 'kpi_cards' &&
        parsed.type !== 'heatmap' &&
        parsed.type !== 'boxplot' &&
        parsed.type !== 'scatter_3d' && (
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {parsed.type === 'radar_chart' ? (
                <RadarChart outerRadius={90} data={data}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#4b5563" fontSize={10} />
                  <Radar name={parsed.title || 'Metrics'} dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                </RadarChart>
              ) : parsed.type === 'treemap' ? (
                <Treemap
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  stroke="#111827"
                  content={<CustomTreemapContent />}
                >
                  <Tooltip content={<CustomTooltip />} />
                </Treemap>
              ) : parsed.type === 'line_chart' ? (
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

