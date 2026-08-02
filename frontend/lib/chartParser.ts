export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface KPIPoint {
  label: string;
  value: string;
  subtext?: string;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface HeatmapMatrix {
  xLabels: string[];
  yLabels: string[];
  matrix: number[][];
}

export interface BoxPlotPoint {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

export interface Scatter3DPoint {
  name: string;
  x: number;
  y: number;
  z: number;
  size?: number;
  category?: string;
}

export interface UIComponentSpec {
  type:
    | 'bar_chart'
    | 'line_chart'
    | 'area_chart'
    | 'pie_chart'
    | 'scatter_chart'
    | 'kpi_cards'
    | 'table'
    | 'heatmap'
    | 'radar_chart'
    | 'treemap'
    | 'boxplot'
    | 'scatter_3d';
  title?: string;
  xAxis?: string;
  yAxis?: string;
  zAxis?: string;
  data?: ChartDataPoint[];
  kpis?: KPIPoint[];
  heatmapData?: HeatmapCell[];
  heatmapMatrix?: HeatmapMatrix;
  boxPlotData?: BoxPlotPoint[];
  scatter3DData?: Scatter3DPoint[];
}

export function parseChartSpec(spec: any): UIComponentSpec {
  if (!spec || typeof spec !== 'object') {
    return {
      type: 'bar_chart',
      title: 'Data Analysis Result',
      data: []
    };
  }

  const rawType = (spec.type || 'bar_chart').toLowerCase();
  let type: UIComponentSpec['type'] = 'bar_chart';

  if (rawType.includes('heatmap') || rawType.includes('correlation')) type = 'heatmap';
  else if (rawType.includes('radar') || rawType.includes('spider')) type = 'radar_chart';
  else if (rawType.includes('tree')) type = 'treemap';
  else if (rawType.includes('box')) type = 'boxplot';
  else if (rawType.includes('3d') || rawType.includes('scatter_3d')) type = 'scatter_3d';
  else if (rawType.includes('line')) type = 'line_chart';
  else if (rawType.includes('area')) type = 'area_chart';
  else if (rawType.includes('pie')) type = 'pie_chart';
  else if (rawType.includes('scatter')) type = 'scatter_chart';
  else if (rawType.includes('kpi') || rawType.includes('card')) type = 'kpi_cards';
  else if (rawType.includes('table')) type = 'table';
  else type = 'bar_chart';

  const cleanedData: ChartDataPoint[] = Array.isArray(spec.data)
    ? spec.data.map((item: any, idx: number) => ({
        name: String(item.name || item.x || item.category || item.subject || `Item ${idx + 1}`),
        value: typeof item.value === 'number' ? item.value : parseFloat(item.value || item.y || 0),
        ...item
      }))
    : [];

  let heatmapData: HeatmapCell[] | undefined;
  if (type === 'heatmap' && Array.isArray(spec.data)) {
    heatmapData = spec.data.map((item: any) => ({
      x: String(item.x || item.row || item.name || ''),
      y: String(item.y || item.col || ''),
      value: typeof item.value === 'number' ? item.value : parseFloat(item.value || 0)
    }));
  }

  let boxPlotData: BoxPlotPoint[] | undefined;
  if (type === 'boxplot' && Array.isArray(spec.data)) {
    boxPlotData = spec.data.map((item: any, idx: number) => ({
      category: String(item.category || item.name || `Group ${idx + 1}`),
      min: typeof item.min === 'number' ? item.min : 0,
      q1: typeof item.q1 === 'number' ? item.q1 : 0,
      median: typeof item.median === 'number' ? item.median : 0,
      q3: typeof item.q3 === 'number' ? item.q3 : 0,
      max: typeof item.max === 'number' ? item.max : 0,
      outliers: Array.isArray(item.outliers) ? item.outliers : []
    }));
  }

  let scatter3DData: Scatter3DPoint[] | undefined;
  if (type === 'scatter_3d' && Array.isArray(spec.data)) {
    scatter3DData = spec.data.map((item: any, idx: number) => ({
      name: String(item.name || `Point ${idx + 1}`),
      x: typeof item.x === 'number' ? item.x : parseFloat(item.x || 0),
      y: typeof item.y === 'number' ? item.y : parseFloat(item.y || 0),
      z: typeof item.z === 'number' ? item.z : parseFloat(item.z || 0),
      size: typeof item.size === 'number' ? item.size : (typeof item.z === 'number' ? Math.abs(item.z) : 10),
      category: item.category ? String(item.category) : undefined
    }));
  }

  return {
    type,
    title: spec.title || 'OmniGraph Data Visualizer',
    xAxis: spec.xAxis || 'Category',
    yAxis: spec.yAxis || 'Value',
    zAxis: spec.zAxis || 'Z-Axis',
    data: cleanedData,
    kpis: Array.isArray(spec.kpis) ? spec.kpis : [],
    heatmapData,
    heatmapMatrix: spec.heatmapMatrix || spec.matrix,
    boxPlotData,
    scatter3DData
  };
}
