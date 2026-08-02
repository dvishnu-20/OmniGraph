import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from backend.utils.sandbox import python_executor

class PandasAgent:
    """Executes data queries and statistical analytics on DataFrames by generating and executing Python code."""

    def analyze(self, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        query_lower = query.lower()

        # Identify numeric & categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        time_cols = [c for c in cat_cols + df.columns.tolist() if any(k in c.lower() for k in ['month', 'date', 'year', 'quarter', 'day', 'time', 'period'])]
        rev_cols = [c for c in numeric_cols if any(k in c.lower() for k in ['revenue', 'sales', 'profit', 'amount', 'total', 'spending', 'price', 'quantity', 'cost', 'value', 'units', 'margin', 'rate', 'score', 'count', 'val'])]
        
        # Filter out ID / Code / Index columns from numerical fallback
        measure_cols = [c for c in numeric_cols if not any(id_k in c.lower() for id_k in ['id', 'no', 'num', 'code', 'zip', 'index', 'number'])]
        target_val_col = rev_cols[0] if rev_cols else (measure_cols[0] if measure_cols else (numeric_cols[0] if numeric_cols else None))

        code = ""

        # 1. Linear Regression & Predictive Trend Forecasting
        if "regression" in query_lower or "predict" in query_lower or "forecast" in query_lower:
            val_col = target_val_col if target_val_col else (numeric_cols[0] if numeric_cols else df.columns[1])
            time_col = time_cols[0] if time_cols else (cat_cols[0] if cat_cols else df.columns[0])
            code = f"""# Autonomous Linear Regression & Predictive Forecasting
val_col = {repr(val_col)}
time_col = {repr(time_col)}

grouped = df.groupby(time_col, sort=False)[val_col].sum().head(30).reset_index()
x_indices = np.arange(len(grouped))
y_vals = grouped[val_col].values.astype(float)

# Fit linear regression model y = mx + c
if len(x_indices) > 1:
    slope, intercept = np.polyfit(x_indices, y_vals, 1)
else:
    slope, intercept = 0.0, y_vals[0] if len(y_vals) > 0 else 0.0

# Forecast next 3 time periods
next_x = np.arange(len(grouped), len(grouped) + 3)
next_y = slope * next_x + intercept

data_points = []
for idx_val, row in grouped.iterrows():
    pred_val = float(slope * idx_val + intercept)
    data_points.append({{
        "name": str(row[time_col]),
        "value": round(float(row[val_col]), 2),
        "secondary": round(float(pred_val), 2)
    }})

# Add predictions
for j_val, px in enumerate(next_x):
    pred_val = float(next_y[j_val])
    data_points.append({{
        "name": f"Forecast +{{j_val+1}}",
        "value": round(float(pred_val), 2),
        "secondary": round(float(pred_val), 2)
    }})

r2_score = round(float(np.corrcoef(y_vals, slope * x_indices + intercept)[0, 1] ** 2), 3) if len(y_vals) > 1 else 1.0

ui_component = {{
    "type": "line_chart",
    "title": f"Linear Regression & Predictive Forecast ({val_col})",
    "xAxis": time_col,
    "yAxis": val_col,
    "data": data_points
}}
print(f"Fit Linear Regression model (y = {{slope:.2f}}x + {{intercept:.2f}}, R² = {{r2_score}}). Predicted next period: {{next_y[0]:,.2f}}.")
"""

        # 2. Outlier Detection Engine (IQR & Z-score)
        elif ("outlier" in query_lower or "top 3 outlier" in query_lower or "margin" in query_lower) and numeric_cols:
            col_candidates = [c for c in numeric_cols if any(k in c.lower() for k in ['margin', 'profit', 'revenue', 'sales', 'spending', 'cost'])]
            target_col = col_candidates[0] if col_candidates else numeric_cols[0]
            name_col = cat_cols[0] if cat_cols else df.columns[0]
            code = f"""# Outlier Detection Engine (IQR & Deviation Analysis)
target_col = {repr(target_col)}
name_col = {repr(name_col)}

s = df[target_col].dropna()
q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))
iqr = q3 - q1
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr

df_outliers = df[(df[target_col] < lower_bound) | (df[target_col] > upper_bound)].copy()
if df_outliers.empty:
    mean_val = float(s.mean())
    df_temp = df.copy()
    df_temp['dev'] = (df_temp[target_col] - mean_val).abs()
    df_outliers = df_temp.sort_values(by='dev', ascending=False).head(3)

top_outliers = df_outliers.head(5)
data_points = []
for _, row in top_outliers.iterrows():
    data_points.append({{
        "name": str(row[name_col]),
        "value": round(float(row[target_col]), 2),
        "secondary": round(float(lower_bound), 2)
    }})

ui_component = {{
    "type": "bar_chart",
    "title": f"Top Statistical Outliers in {target_col}",
    "xAxis": name_col,
    "yAxis": target_col,
    "data": data_points
}}
print(f"Identified {{len(df_outliers)}} statistical outliers in {target_col} beyond IQR bounds [{{lower_bound:.2f}}, {{upper_bound:.2f}}].")
"""

        # 3. Heatmap / Correlation Matrix Analysis
        elif ("heatmap" in query_lower or "matrix" in query_lower or "correlation" in query_lower):
            if len(numeric_cols) >= 2:
                cols_to_use = numeric_cols[:6]
                code = f"""# Correlation Matrix Analysis
cols_to_use = {repr(cols_to_use)}
corr_df = df[cols_to_use].corr().fillna(0)
matrix = [[round(float(corr_df.loc[r, c]), 2) for c in cols_to_use] for r in cols_to_use]

cells = []
for r_idx, r_col in enumerate(cols_to_use):
    for c_idx, c_col in enumerate(cols_to_use):
        cells.append({{
            "x": c_col,
            "y": r_col,
            "value": matrix[r_idx][c_idx]
        }})

ui_component = {{
    "type": "heatmap",
    "title": f"Correlation Matrix Heatmap ({', '.join(cols_to_use[:3])})",
    "data": cells,
    "matrix": {{
        "xLabels": cols_to_use,
        "yLabels": cols_to_use,
        "matrix": matrix
    }}
}}
print(f"Calculated correlation matrix heatmap across {{len(cols_to_use)}} numerical variables.")
"""
            else:
                val_col = numeric_cols[0] if numeric_cols else df.columns[0]
                cat_col = cat_cols[0] if cat_cols else df.columns[0]
                code = f"""# Category Feature Correlation Heatmap
val_col = {repr(val_col)}
cat_col = {repr(cat_col)}

top_cats = df[cat_col].astype(str).value_counts().head(5).index.tolist()
df_sub = df[df[cat_col].astype(str).isin(top_cats)].copy()
dummies = pd.get_dummies(df_sub[cat_col].astype(str))
dummies[val_col] = pd.to_numeric(df_sub[val_col], errors='coerce').fillna(0)

corr_df = dummies.corr().fillna(0)
cols_to_use = corr_df.columns.tolist()
matrix = [[round(float(corr_df.loc[r, c]), 2) for c in cols_to_use] for r in cols_to_use]

cells = []
for r_idx, r_col in enumerate(cols_to_use):
    for c_idx, c_col in enumerate(cols_to_use):
        cells.append({{
            "x": c_col,
            "y": r_col,
            "value": matrix[r_idx][c_idx]
        }})

ui_component = {{
    "type": "heatmap",
    "title": f"Category Feature Correlation Heatmap ({val_col})",
    "data": cells,
    "matrix": {{
        "xLabels": cols_to_use,
        "yLabels": cols_to_use,
        "matrix": matrix
    }}
}}
print(f"Generated feature correlation matrix heatmap for {{val_col}} across top {{cat_col}} items.")
"""

        # 4. Box Plot / Outlier & Quantile Distribution
        elif ("box" in query_lower or "boxplot" in query_lower or "quartile" in query_lower) and numeric_cols:
            cols_to_box = numeric_cols[:5]
            code = f"""# Box Plot / Outlier & Quantile Distribution
box_data = []
cols_to_box = {repr(cols_to_box)}
for col in cols_to_box:
    s = df[col].dropna()
    if len(s) == 0:
        continue
    q1 = float(s.quantile(0.25))
    median = float(s.median())
    q3 = float(s.quantile(0.75))
    iqr = q3 - q1
    min_val = float(s[s >= (q1 - 1.5 * iqr)].min() if len(s[s >= (q1 - 1.5 * iqr)]) > 0 else s.min())
    max_val = float(s[s <= (q3 + 1.5 * iqr)].max() if len(s[s <= (q3 + 1.5 * iqr)]) > 0 else s.max())
    outliers = [round(float(v), 2) for v in s[(s < min_val) | (s > max_val)].head(5).tolist()]

    box_data.append({{
        "category": col,
        "min": round(min_val, 2),
        "q1": round(q1, 2),
        "median": round(median, 2),
        "q3": round(q3, 2),
        "max": round(max_val, 2),
        "outliers": outliers
    }})

ui_component = {{
    "type": "boxplot",
    "title": f"Statistical Box Plot Distribution ({', '.join(cols_to_box[:3])})",
    "data": box_data
}}
print(f"Box plot computed quartiles and outlier boundaries across {{len(cols_to_box)}} numerical features.")
"""

        # 5. 3D Scatter Plot (3 Variables: X, Y, Z)
        elif ("3d" in query_lower or "scatter_3d" in query_lower or "three variable" in query_lower) and len(numeric_cols) >= 3:
            x_col, y_col, z_col = numeric_cols[0], numeric_cols[1], numeric_cols[2]
            label_col = cat_cols[0] if cat_cols else ""
            code = f"""# 3D Scatter Analysis
x_col, y_col, z_col = {repr(x_col)}, {repr(y_col)}, {repr(z_col)}
label_col = {repr(label_col)}
scatter_3d_data = []
for i, row in df.head(35).iterrows():
    item_name = str(row[label_col]) if label_col and label_col in df.columns else f"Record #{i+1}"
    scatter_3d_data.append({{
        "name": item_name,
        "x": round(float(row[x_col]), 2),
        "y": round(float(row[y_col]), 2),
        "z": round(float(row[z_col]), 2),
        "size": round(abs(float(row[z_col])), 2)
    }})

ui_component = {{
    "type": "scatter_3d",
    "title": f"3D Scatter Analysis: {{x_col}} vs {{y_col}} vs {{z_col}}",
    "xAxis": x_col,
    "yAxis": y_col,
    "zAxis": z_col,
    "data": scatter_3d_data
}}
print(f"Mapped 3D scatter spatial correlation for {{x_col}}, {{y_col}}, and depth axis {{z_col}}.")
"""

        # 6. Radar / Spider Chart Comparative Analysis
        elif ("radar" in query_lower or "spider" in query_lower or "multi-axis" in query_lower):
            group_col = cat_cols[0] if cat_cols else (df.columns[0] if len(df.columns) > 0 else "")
            num_cols = numeric_cols[:4]
            code = f"""# Radar Chart Comparative Analysis
group_col = {repr(group_col)}
num_cols = {repr(num_cols)}

radar_data = []
if group_col and num_cols:
    for num_col in num_cols:
        max_val = df[num_col].max() or 1
        item_score = round(float(df[num_col].mean() / max_val * 100), 1)
        radar_data.append({{"name": num_col, "value": item_score}})

ui_component = {{
    "type": "radar_chart",
    "title": f"Multi-Axis Radar Comparison by {{group_col}}",
    "data": radar_data
}}
print(f"Radar analysis evaluated comparative multi-axis score across {{len(radar_data)}} metrics.")
"""

        # 7. Treemap Hierarchical Allocation
        elif ("treemap" in query_lower or "tree" in query_lower or "hierarch" in query_lower) and target_val_col:
            group_col = cat_cols[0] if cat_cols else df.columns[0]
            code = f"""# Treemap Allocation Analysis
group_col = {repr(group_col)}
target_val_col = {repr(target_val_col)}

grouped = df.groupby(group_col)[target_val_col].sum().reset_index().sort_values(by=target_val_col, ascending=False)
tree_data = [{{"name": str(row[group_col]), "value": round(float(row[target_val_col]), 2)}} for _, row in grouped.iterrows()]

ui_component = {{
    "type": "treemap",
    "title": f"Hierarchical Treemap: {{target_val_col}} by {{group_col}}",
    "data": tree_data
}}
print(f"Treemap hierarchical allocation rendered across {{len(tree_data)}} segments.")
"""

        # 8. Trend / Monthly analysis
        elif ("trend" in query_lower or "month" in query_lower or "over time" in query_lower) and time_cols and target_val_col:
            group_col = time_cols[0]
            code = f"""# Time-series Trend Analysis
group_col = {repr(group_col)}
target_val_col = {repr(target_val_col)}

grouped = df.groupby(group_col, sort=False)[target_val_col].sum().reset_index()
data_points = [{{"name": str(row[group_col]), "value": round(float(row[target_val_col]), 2)}} for _, row in grouped.iterrows()]

ui_component = {{
    "type": "line_chart",
    "title": f"{{target_val_col}} Trend by {{group_col}}",
    "xAxis": group_col,
    "yAxis": target_val_col,
    "data": data_points
}}
if data_points:
    print(f"{{target_val_col}} peaked at {{data_points[-1]['value']}} in {{data_points[-1]['name']}}.")
"""

        # 9. Region / Category Breakdown (Bar Chart or Pie Chart)
        elif ("region" in query_lower or "category" in query_lower or "compare" in query_lower or "breakdown" in query_lower or "share" in query_lower or "pie" in query_lower) and target_val_col:
            group_candidates = [c for c in cat_cols if c.lower() not in [c.lower() for c in time_cols]]
            group_col = "Region" if "region" in query_lower and "Region" in df.columns else (group_candidates[0] if group_candidates else (cat_cols[0] if cat_cols else df.columns[0]))
            chart_type = "pie_chart" if ("pie" in query_lower or "share" in query_lower or "distribution" in query_lower) else "bar_chart"
            code = f"""# Categorical Share Breakdown
group_col = {repr(group_col)}
target_val_col = {repr(target_val_col)}
chart_type = {repr(chart_type)}

grouped = df.groupby(group_col)[target_val_col].sum().reset_index().sort_values(by=target_val_col, ascending=False)
data_points = [{{"name": str(row[group_col]), "value": round(float(row[target_val_col]), 2)}} for _, row in grouped.iterrows()]

ui_component = {{
    "type": chart_type,
    "title": f"{{target_val_col}} Breakdown by {{group_col}}",
    "xAxis": group_col,
    "yAxis": target_val_col,
    "data": data_points
}}
if data_points:
    top_group = data_points[0]['name']
    top_val = data_points[0]['value']
    print(f"The {{top_group}} segment led performance contributing {{top_val}} in total {{target_val_col.lower()}}.")
"""

        # 10. Scatter Plot / Correlation (e.g. Revenue vs Profit, Customer Age vs Spending)
        elif ("correlation" in query_lower or "scatter" in query_lower or "vs" in query_lower) and len(numeric_cols) >= 2:
            x_col = numeric_cols[0]
            y_col = numeric_cols[1]
            label_col = cat_cols[0] if cat_cols else ""
            code = f"""# Correlation analysis between variables
x_col = {repr(x_col)}
y_col = {repr(y_col)}
label_col = {repr(label_col)}

data_points = [
    {{
        "name": str(row[label_col]) if label_col and label_col in df.columns else f"Record #{i+1}",
        "x": round(float(row[x_col]), 2),
        "y": round(float(row[y_col]), 2)
    }} for i, row in df.head(30).iterrows()
]
corr = round(float(df[x_col].corr(df[y_col])), 2)

ui_component = {{
    "type": "scatter_chart",
    "title": f"Correlation: {{x_col}} vs {{y_col}} (r = {{corr}})",
    "xAxis": x_col,
    "yAxis": y_col,
    "data": data_points
}}
print(f"Analysis shows a correlation coefficient of {{corr}} between {{x_col}} and {{y_col}}.")
"""

        # 11. KPI Cards summary query
        elif "kpi" in query_lower or "summary" in query_lower or "overview" in query_lower or "stats" in query_lower:
            num_cols = numeric_cols[:4]
            code = f"""# Key Performance Indicators Overview
num_cols = {repr(num_cols)}
kpis = []
for num_col in num_cols:
    total_val = df[num_col].sum()
    mean_val = df[num_col].mean()
    formatted_val = f"${{total_val:,.0f}}" if any(k in num_col.lower() for k in ['revenue', 'profit', 'sales']) else f"{{total_val:,.0f}}"
    kpis.append({{
        "label": num_col,
        "value": formatted_val,
        "subtext": f"Avg: {{mean_val:,.1f}}"
    }})

ui_component = {{
    "type": "kpi_cards",
    "title": "Dataset Key Performance Indicators",
    "kpis": kpis
}}
print(f"Dataset overview computed across {{len(df)}} records showing total value of {{kpis[0]['value'] if kpis else 0}}.")
"""

        # 12. Default / Fallback case
        else:
            group_col = cat_cols[0] if cat_cols else df.columns[0]
            val_col = target_val_col if target_val_col else (numeric_cols[0] if numeric_cols else df.columns[1])
            code = f"""# General Dataset Summary Fallback
group_col = {repr(group_col)}
val_col = {repr(val_col)}

grouped = df.groupby(group_col)[val_col].sum().head(10).reset_index()
data_points = [{{"name": str(row[group_col]), "value": round(float(row[val_col]), 2)}} for _, row in grouped.iterrows()]

ui_component = {{
    "type": "bar_chart",
    "title": f"{{val_col}} Analysis by {{group_col}}",
    "xAxis": group_col,
    "yAxis": val_col,
    "data": data_points
}}
print(f"Generated analysis for {{val_col}} across {{group_col}} categories.")
"""

        # Execute code in sandbox
        success, stdout, local_vars, err, exec_ms = python_executor.execute(code, df)
        
        # Read resulting variables
        ui_comp = local_vars.get("ui_component")
        if not ui_comp:
            ui_comp = {
                "type": "bar_chart",
                "title": "Dataset Analysis Result",
                "data": []
            }
            
        speech_text = local_vars.get("speech_text")
        if not speech_text:
            if stdout:
                speech_text = stdout.strip().split('\n')[0]
            else:
                speech_text = "Calculated the requested analysis metrics."

        return {
            "type": ui_comp.get("type", "bar_chart"),
            "title": ui_comp.get("title", "Dataset Analysis"),
            "xAxis": ui_comp.get("xAxis", "Category"),
            "yAxis": ui_comp.get("yAxis", "Value"),
            "zAxis": ui_comp.get("zAxis", "Z-Axis"),
            "data": ui_comp.get("data", []),
            "kpis": ui_comp.get("kpis", []),
            "matrix": ui_comp.get("matrix"),
            "speech_text": speech_text,
            "code": code,
            "stdout": stdout,
            "execution_time_ms": exec_ms,
            "execution_error": err
        }


pandas_agent = PandasAgent()


