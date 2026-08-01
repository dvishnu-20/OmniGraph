# OmniGraph Next-Level Enhancements Plan 🚀

This document outlines architectural choices and implementation options to scale **OmniGraph** into an enterprise-grade, multi-modal AI data platform. You can choose any of these options based on your target use cases.

---

## 🌟 Option 1: Advanced Chart Components & Statistical Visualizations

Expand the Generative UI engine ([ChartRenderer.tsx](file:///c:/Users/duddu/Downloads/omnigraph/frontend/components/ChartRenderer.tsx)) beyond standard charts to support complex statistical data views.

### Proposed Additions:
- **Heatmap Chart (`heatmap`)**: Visualizes correlation matrices, monthly intensity, and regional performance matrices.
- **Radar / Spider Chart (`radar_chart`)**: Multi-axis comparative analysis (e.g. Vendor comparison across Speed, Quality, Price, Support).
- **Treemap Chart (`treemap`)**: Hierarchical budget allocation and category breakdown.
- **Box Plot (`boxplot`)**: Outlier detection and statistical distribution (quartiles, min, max, median).
- **3D Scatter Plot (`scatter_3d`)**: Multi-variable correlation (e.g. Price vs Volume vs Satisfaction).

### Implementation Plan:
1. Extend `lib/chartParser.ts` with schema interfaces for matrix data structures.
2. Integrate `nivo` or `recharts` radar/treemap components in `ChartRenderer.tsx`.
3. Update `pandas_agent.py` to calculate correlation matrices using `df.corr()`.

---

## 🐍 Option 2: Autonomous Python Code Execution (Sandboxed Engine)

Allow the LLM to generate and execute arbitrary Python / Pandas code on datasets for complex queries like *"Find top 3 outliers in profit margin"* or *"Run a linear regression predicting next month's sales"*.

### Architecture:
```
 User Query ➔ Llama Code Generator ➔ Pyodide / Docker Sandbox ➔ Dynamic Chart & Findings
```

### Implementation Plan:
1. Integrate `Pyodide` (WebAssembly Python in browser) or sandboxed `exec()` inside backend.
2. Add code sanitization rules to block restricted system imports (`os`, `sys`, `subprocess`).
3. Return both execution stdout text, calculated stats, and chart specs.

---

## 🗄️ Option 3: Enterprise SQL Database Connectors

Enable OmniGraph to query live enterprise databases directly rather than uploaded static files.

### Supported Databases:
- **PostgreSQL / MySQL**
- **Snowflake**
- **ClickHouse / BigQuery**
- **SQLite**

### Implementation Plan:
1. Add `sqlalchemy` or `asyncpg` connection pool manager in `backend/data/db_connector.py`.
2. Update system prompt in `utils/prompt.py` to output valid SQL queries based on database schema.
3. Execute SQL query ➔ convert result set to DataFrame ➔ render dynamic UI.

---

## 🎙️ Option 4: Sub-300ms WebRTC Real-Time Audio Pipeline

Upgrade the audio streaming channel from base64 WebSocket chunks to full-duplex **WebRTC** for near-instantaneous speech interaction.

### Benefits:
- Reduces latency by 40%.
- Supports continuous bi-directional voice barge-in (interrupting the AI while speaking).
- Smooth audio packet pacing using Opus codec.

### Implementation Plan:
1. Add `aiortc` (Python WebRTC library) to `backend/requirements.txt`.
2. Implement WebRTC peer connection handler in `backend/api/webrtc.py`.
3. Connect frontend `RTCPeerConnection` in `hooks/useRecorder.ts`.

---

## 📷 Option 5: Multi-Modal Vision & Document Analysis

Enable users to upload images of charts, invoices, or PDF financial statements alongside CSV files.

### Capabilities:
- Chart-to-Data Extraction (converting image bar charts into editable DataFrames).
- Financial Report OCR & tabular extraction.
- Natural language questions about document images.

### Implementation Plan:
1. Add `tesseract` / `easyocr` or LLaVA / Qwen2-VL vision model runner in `backend/ai/vision.py`.
2. Add PDF parser (`pdfplumber`) to extract embedded tables into pandas DataFrames.
3. Add drag-and-drop image upload zone in `DatasetSelector.tsx`.

---

## 🎯 Summary Matrix: Choose Your Upgrade Path

| Option | Primary Benefit | Complexity | Key Technologies |
| :--- | :--- | :---: | :--- |
| **Option 1: Advanced Visualizations** | Richer charts (Heatmaps, Radar, Treemaps) | Low | Recharts / Nivo |
| **Option 2: Autonomous Python Code** | Arbitrary analytics & predictive modeling | Medium | Pyodide / Sandboxed Exec |
| **Option 3: Enterprise SQL Connector** | Live querying on PostgreSQL/Snowflake | Medium | SQLAlchemy / AsyncPG |
| **Option 4: WebRTC Low-Latency Voice** | Sub-300ms speech & voice barge-in | High | aiortc / WebRTC Opus |
| **Option 5: Multi-Modal Vision & PDF** | Chart image & document table extraction | Medium | Tesseract / PDFPlumber |
