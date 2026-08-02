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

from backend.utils.sandbox import python_executor

class SandboxExecuteRequest(BaseModel):
    code: str
    dataset_name: Optional[str] = None

@router.post("/sandbox/execute")
def execute_sandbox_code(req: SandboxExecuteRequest):
    if csv_loader.active_df is None:
        samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
        default_path = os.path.join(samples_dir, "sales_data.csv")
        csv_loader.load_file(default_path)

    df = csv_loader.active_df
    success, stdout, local_vars, err, exec_ms = python_executor.execute(req.code, df)

    ui_comp = local_vars.get("ui_component")
    if not ui_comp:
        ui_comp = {
            "type": "bar_chart",
            "title": "Sandbox Execution Output",
            "data": []
        }

    speech_text = local_vars.get("speech_text")
    if not speech_text:
        speech_text = stdout.strip().split('\n')[0] if stdout.strip() else "Sandbox Python code executed successfully."

    return {
        "success": success,
        "stdout": stdout,
        "ui_component": ui_comp,
        "speech_text": speech_text,
        "execution_time_ms": exec_ms,
        "error": err
    }

from backend.data.db_connector import db_connector

class DBConnectRequest(BaseModel):
    db_url: Optional[str] = None

class SQLExecuteRequest(BaseModel):
    sql: str

@router.get("/database/schema")
def get_database_schema():
    return db_connector.get_schema_summary()

@router.post("/database/connect")
def connect_database(req: DBConnectRequest):
    db_target = req.db_url if req.db_url else "enterprise_data.db"
    res = db_connector.connect(db_target)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/database/execute-sql")
def execute_sql_query(req: SQLExecuteRequest):
    success, stdout, df, local_vars, err, exec_ms = db_connector.execute_sql(req.sql)
    if not success or df is None:
        return {
            "success": False,
            "stdout": "",
            "ui_component": {"type": "bar_chart", "title": "SQL Error", "data": []},
            "speech_text": f"SQL Error: {err}",
            "execution_time_ms": exec_ms,
            "error": err
        }

    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    val_col = numeric_cols[0] if numeric_cols else (df.columns[1] if len(df.columns) > 1 else df.columns[0])
    name_col = cat_cols[0] if cat_cols else df.columns[0]
    
    data_points = []
    for _, row in df.head(30).iterrows():
        val = row[val_col]
        try:
            formatted_val = round(float(val), 2)
        except Exception:
            formatted_val = str(val)

        data_points.append({
            "name": str(row[name_col]),
            "value": formatted_val
        })

    ui_comp = {
        "type": "bar_chart" if len(data_points) <= 12 else "table",
        "title": f"SQL Result: {val_col} by {name_col}",
        "xAxis": name_col,
        "yAxis": val_col,
        "data": data_points
    }

    return {
        "success": True,
        "stdout": stdout,
        "ui_component": ui_comp,
        "speech_text": f"SQL query returned {len(df)} records.",
        "execution_time_ms": exec_ms,
        "error": None
    }

from backend.ai.vision import vision_analyzer
from fastapi import UploadFile, File

@router.post("/vision/analyze")
async def analyze_vision_file(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename or "chart.png"
    
    if filename.lower().endswith(".pdf"):
        success, df, ui_comp, summary_text, exec_ms = vision_analyzer.analyze_pdf(contents, filename)
    else:
        success, df, ui_comp, summary_text, exec_ms = vision_analyzer.analyze_image(contents, filename)

    if not success or df is None:
        raise HTTPException(status_code=400, detail=summary_text)

    csv_loader.active_df = df
    csv_loader.active_dataset_name = f"[Vision] {filename}"
    
    code = f"# Multi-Modal Vision Extracted Code ({filename})\n# Extracted shape: {df.shape[0]} rows, {df.shape[1]} cols\n"
    code += f"df = pd.DataFrame({df.to_dict(orient='list')})\nui_component = {ui_comp}"

    return {
        "success": True,
        "filename": filename,
        "stdout": summary_text,
        "code": code,
        "ui_component": ui_comp,
        "speech_text": summary_text,
        "execution_time_ms": exec_ms,
        "df_summary": csv_loader.get_df_summary(df)
    }

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



