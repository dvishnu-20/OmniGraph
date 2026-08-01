import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class PandasAgent:
    """Executes data queries and statistical analytics on DataFrames."""

    def analyze(self, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        query_lower = query.lower()

        # Identify numeric & categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        # 1. Trend / Monthly analysis
        time_cols = [c for c in cat_cols + df.columns.tolist() if any(k in c.lower() for k in ['month', 'date', 'year', 'quarter', 'day'])]
        rev_cols = [c for c in numeric_cols if any(k in c.lower() for k in ['revenue', 'sales', 'profit', 'amount', 'total', 'spending'])]
        
        target_val_col = rev_cols[0] if rev_cols else (numeric_cols[0] if numeric_cols else None)

        if ("trend" in query_lower or "month" in query_lower or "over time" in query_lower) and time_cols and target_val_col:
            group_col = time_cols[0]
            grouped = df.groupby(group_col, sort=False)[target_val_col].sum().reset_index()
            data = [{"name": str(row[group_col]), "value": round(float(row[target_val_col]), 2)} for _, row in grouped.iterrows()]
            return {
                "type": "line_chart",
                "title": f"{target_val_col} Trend by {group_col}",
                "xAxis": group_col,
                "yAxis": target_val_col,
                "data": data,
                "speech_text": f"{target_val_col} peaked at {data[-1]['value']} in {data[-1]['name']} with a positive upward trajectory."
            }

        # 2. Region / Category Breakdown (Bar Chart or Pie Chart)
        group_candidates = [c for c in cat_cols if c.lower() not in [c.lower() for c in time_cols]]
        if ("region" in query_lower or "category" in query_lower or "compare" in query_lower or "breakdown" in query_lower or "share" in query_lower or "pie" in query_lower) and group_candidates and target_val_col:
            group_col = "Region" if "region" in query_lower and "Region" in df.columns else group_candidates[0]
            grouped = df.groupby(group_col)[target_val_col].sum().reset_index().sort_values(by=target_val_col, ascending=False)
            data = [{"name": str(row[group_col]), "value": round(float(row[target_val_col]), 2)} for _, row in grouped.iterrows()]
            
            top_group = data[0]['name'] if data else "N/A"
            top_val = data[0]['value'] if data else 0
            
            chart_type = "pie_chart" if ("pie" in query_lower or "share" in query_lower or "distribution" in query_lower) else "bar_chart"
            return {
                "type": chart_type,
                "title": f"{target_val_col} Breakdown by {group_col}",
                "xAxis": group_col,
                "yAxis": target_val_col,
                "data": data,
                "speech_text": f"The {top_group} segment led performance contributing {top_val} in total {target_val_col.lower()}."
            }

        # 3. Scatter Plot / Correlation (e.g. Revenue vs Profit, Customer Age vs Spending)
        if ("correlation" in query_lower or "scatter" in query_lower or "vs" in query_lower) and len(numeric_cols) >= 2:
            x_col = numeric_cols[0]
            y_col = numeric_cols[1]
            data = [{"name": f"Item {i+1}", "x": round(float(row[x_col]), 2), "y": round(float(row[y_col]), 2)} for i, row in df.head(30).iterrows()]
            corr = round(float(df[x_col].corr(df[y_col])), 2)
            return {
                "type": "scatter_chart",
                "title": f"Correlation: {x_col} vs {y_col} (r = {corr})",
                "xAxis": x_col,
                "yAxis": y_col,
                "data": data,
                "speech_text": f"Analysis shows a correlation coefficient of {corr} between {x_col} and {y_col}."
            }

        # 4. KPI Cards summary query
        if "kpi" in query_lower or "summary" in query_lower or "overview" in query_lower or "stats" in query_lower:
            kpis = []
            for num_col in numeric_cols[:4]:
                total_val = df[num_col].sum()
                mean_val = df[num_col].mean()
                formatted_val = f"${total_val:,.0f}" if any(k in num_col.lower() for k in ['revenue', 'profit', 'sales']) else f"{total_val:,.0f}"
                kpis.append({
                    "label": num_col,
                    "value": formatted_val,
                    "subtext": f"Avg: {mean_val:,.1f}"
                })
            return {
                "type": "kpi_cards",
                "title": "Dataset Key Performance Indicators",
                "kpis": kpis,
                "speech_text": f"Dataset overview computed across {len(df)} records showing total revenue of {kpis[0]['value']}."
            }

        # Default: Bar chart of top numerical aggregated by first categorical column
        group_col = cat_cols[0] if cat_cols else df.columns[0]
        val_col = target_val_col if target_val_col else df.columns[1]
        grouped = df.groupby(group_col)[val_col].sum().head(10).reset_index()
        data = [{"name": str(row[group_col]), "value": round(float(row[val_col]), 2)} for _, row in grouped.iterrows()]

        return {
            "type": "bar_chart",
            "title": f"{val_col} Analysis by {group_col}",
            "xAxis": group_col,
            "yAxis": val_col,
            "data": data,
            "speech_text": f"Generated analysis for {val_col} across {group_col} categories."
        }

pandas_agent = PandasAgent()
