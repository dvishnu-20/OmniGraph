import os
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

class CSVLoader:
    def __init__(self):
        self.active_df: pd.DataFrame = None
        self.active_filename: str = ""
        self.cache: Dict[str, Tuple[pd.DataFrame, Dict[str, Any]]] = {}

    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Automatically clean numerical string columns (e.g. '$1,200', '15%', ' 450 ') into float/int types."""
        df = df.copy()
        
        # Clean column names (strip whitespace)
        df.columns = [str(col).strip() for col in df.columns]

        for col in df.select_dtypes(include=['object', 'category']).columns:
            # Check sample non-null values
            non_null_samples = df[col].dropna().astype(str).str.strip()
            if non_null_samples.empty:
                continue

            # Test if column values represent currency or percentage or numbers with commas
            is_numeric_like = non_null_samples.head(20).apply(
                lambda val: bool(re.match(r'^[$\u20ac\u00a3\u20b9\s]*[-+]?[0-9,]+(?:\.[0-9]+)?%?\s*$', val))
            ).all()

            if is_numeric_like:
                try:
                    cleaned_series = (
                        df[col].astype(str)
                        .str.replace(r'[$\u20ac\u00a3\u20b9,%\s]', '', regex=True)
                    )
                    converted = pd.to_numeric(cleaned_series, errors='coerce')
                    if converted.notnull().sum() > 0:
                        df[col] = converted
                except Exception:
                    pass

        return df

    def load_file(self, filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load a CSV, Excel, or JSON dataset reliably into a pandas DataFrame (with memory cache)."""
        abs_path = os.path.abspath(filepath)
        if abs_path in self.cache:
            df, summary = self.cache[abs_path]
            self.active_df = df
            self.active_filename = os.path.basename(abs_path)
            return df, summary

        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Dataset file not found: {abs_path}")

        ext = os.path.splitext(abs_path)[1].lower()
        df = None

        if ext == ".csv" or ext == ".txt":
            encodings_to_try = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
            delimiters_to_try = [',', ';', '\t', '|']
            
            loaded = False
            for encoding in encodings_to_try:
                for sep in delimiters_to_try:
                    try:
                        temp_df = pd.read_csv(filepath, encoding=encoding, sep=sep)
                        if len(temp_df.columns) > 1 or sep == ',':
                            df = temp_df
                            loaded = True
                            break
                    except Exception:
                        continue
                if loaded:
                    break

            if df is None:
                df = pd.read_csv(filepath, on_bad_lines='skip')

        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(filepath)
        elif ext == ".json":
            df = pd.read_json(filepath)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        # Clean numerical string formats ($1,000, 15%)
        df = self._clean_dataframe(df)

        self.active_df = df
        self.active_filename = os.path.basename(abs_path)
        summary = self.get_df_summary(df)
        self.cache[abs_path] = (df, summary)
        return df, summary

    def get_df_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate summary schema, column types, sample rows, and numerical stats."""
        col_info = {col: str(df[col].dtype) for col in df.columns}
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()

        stats = {}
        for col in numeric_cols:
            s = df[col].dropna()
            if len(s) > 0:
                stats[col] = {
                    "min": round(float(s.min()), 2),
                    "max": round(float(s.max()), 2),
                    "mean": round(float(s.mean()), 2),
                    "sum": round(float(s.sum()), 2)
                }

        return {
            "filename": self.active_filename,
            "row_count": len(df),
            "col_count": len(df.columns),
            "columns": col_info,
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "stats": stats,
            "sample_head": df.head(5).to_dict(orient="records")
        }

    def format_summary_for_prompt(self, summary: Dict[str, Any]) -> str:
        """Convert dataframe summary into a clean text block for LLM prompt."""
        text = f"Dataset File: {summary['filename']}\n"
        text += f"Total Rows: {summary['row_count']}, Total Columns: {summary['col_count']}\n"
        text += "Columns & Types:\n"
        for col, dtype in summary['columns'].items():
            text += f" - {col} ({dtype})\n"

        if summary['stats']:
            text += "Numerical Summaries:\n"
            for col, stat in summary['stats'].items():
                text += f" - {col}: Sum={stat['sum']}, Mean={stat['mean']}, Min={stat['min']}, Max={stat['max']}\n"

        text += "Sample Rows (First 3):\n"
        for i, row in enumerate(summary['sample_head'][:3]):
            text += f" Row {i+1}: {row}\n"

        return text

csv_loader = CSVLoader()

