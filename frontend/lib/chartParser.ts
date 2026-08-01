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

export interface UIComponentSpec {
  type: 'bar_chart' | 'line_chart' | 'area_chart' | 'pie_chart' | 'scatter_chart' | 'kpi_cards' | 'table';
  title?: string;
  xAxis?: string;
  yAxis?: string;
  data?: ChartDataPoint[];
  kpis?: KPIPoint[];
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

  if (rawType.includes('line')) type = 'line_chart';
  else if (rawType.includes('area')) type = 'area_chart';
  else if (rawType.includes('pie')) type = 'pie_chart';
  else if (rawType.includes('scatter')) type = 'scatter_chart';
  else if (rawType.includes('kpi') || rawType.includes('card')) type = 'kpi_cards';
  else if (rawType.includes('table')) type = 'table';
  else type = 'bar_chart';

  const cleanedData: ChartDataPoint[] = Array.isArray(spec.data)
    ? spec.data.map((item: any, idx: number) => ({
        name: String(item.name || item.x || item.category || `Item ${idx + 1}`),
        value: typeof item.value === 'number' ? item.value : parseFloat(item.value || item.y || 0),
        ...item
      }))
    : [];

  return {
    type,
    title: spec.title || 'OmniGraph Data Visualizer',
    xAxis: spec.xAxis || 'Category',
    yAxis: spec.yAxis || 'Value',
    data: cleanedData,
    kpis: Array.isArray(spec.kpis) ? spec.kpis : []
  };
}
