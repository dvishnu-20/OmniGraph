import os
import pandas as pd
from typing import Dict, Any, Tuple

class CSVLoader:
    def __init__(self):
        self.active_df: pd.DataFrame = None
        self.active_filename: str = ""

    def load_file(self, filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load a CSV, Excel, or JSON dataset into a pandas DataFrame."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset file not found: {filepath}")

        ext = os.path.splitext(filepath)[1].lower()
        if ext == ".csv":
            df = pd.read_csv(filepath)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(filepath)
        elif ext == ".json":
            df = pd.read_json(filepath)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        self.active_df = df
        self.active_filename = os.path.basename(filepath)
        summary = self.get_df_summary(df)
        return df, summary

    def get_df_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate summary schema, column types, sample rows, and numerical stats."""
        col_info = {col: str(df[col].dtype) for col in df.columns}
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        stats = {}
        for col in numeric_cols:
            stats[col] = {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": round(float(df[col].mean()), 2),
                "sum": round(float(df[col].sum()), 2)
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
