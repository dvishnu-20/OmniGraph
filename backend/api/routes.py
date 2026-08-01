import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.data.csv_loader import csv_loader
from backend.data.pandas_agent import pandas_agent
from backend.ai.llama import llama_engine
from backend.utils.prompt import build_copilot_prompt
from backend.utils.telemetry import telemetry

router = APIRouter(prefix="/api")

class QueryRequest(BaseModel):
    query: str
    dataset_name: Optional[str] = None

@router.get("/health")
def health_check():
    return {
        "status": "online",
        "system": telemetry.get_system_stats(),
        "kleidi_ai": telemetry.metrics["kleidi_ai_enabled"]
    }

@router.get("/datasets")
def list_datasets():
    samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
    os.makedirs(samples_dir, exist_ok=True)
    files = [f for f in os.listdir(samples_dir) if f.endswith(('.csv', '.xlsx', '.json'))]
    
    active_name = csv_loader.active_filename if csv_loader.active_filename else (files[0] if files else "")
    return {
        "active_dataset": active_name,
        "available_datasets": files
    }

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV, Excel, or JSON files are supported.")
    
    samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
    os.makedirs(samples_dir, exist_ok=True)
    save_path = os.path.join(samples_dir, file.filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    df, summary = csv_loader.load_file(save_path)
    return {
        "message": f"Successfully uploaded and loaded dataset {file.filename}",
        "summary": summary
    }

@router.get("/dataset/preview")
def preview_dataset(name: Optional[str] = None):
    samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
    if name:
        filepath = os.path.join(samples_dir, name)
        if os.path.exists(filepath):
            df, summary = csv_loader.load_file(filepath)
            return summary

    if csv_loader.active_df is not None:
        return csv_loader.get_df_summary(csv_loader.active_df)

    # Default to sales_data.csv
    default_path = os.path.join(samples_dir, "sales_data.csv")
    if os.path.exists(default_path):
        df, summary = csv_loader.load_file(default_path)
        return summary

    raise HTTPException(status_code=404, detail="No active dataset found.")

@router.post("/query")
def process_text_query(req: QueryRequest):
    if csv_loader.active_df is None:
        samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
        default_path = os.path.join(samples_dir, "sales_data.csv")
        csv_loader.load_file(default_path)

    summary_text = csv_loader.format_summary_for_prompt(csv_loader.get_df_summary(csv_loader.active_df))
    prompt = build_copilot_prompt(summary_text, req.query)
    
    response_json, llama_ms, tokens = llama_engine.generate(prompt, req.query)
    return {
        "query": req.query,
        "response": response_json,
        "llama_ms": llama_ms,
        "tokens_sec": round(tokens / (llama_ms / 1000.0), 1) if llama_ms > 0 else 0
    }
