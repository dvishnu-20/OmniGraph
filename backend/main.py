import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure project root is in sys.path for relative/package imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.api.routes import router as api_router
from backend.api.websocket import ws_router
from backend.api.webrtc import router as webrtc_router
from backend.data.csv_loader import csv_loader

app = FastAPI(
    title="OmniGraph API",
    description="Zero-GPU Generative UI Data Copilot Backend running on Arm / x86 CPU.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)
app.include_router(ws_router)
app.include_router(webrtc_router)

# Serve temp audio files if requested statically
temp_dir = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(temp_dir, exist_ok=True)
app.mount("/temp", StaticFiles(directory=temp_dir), name="temp")

@app.on_event("startup")
def startup_event():
    print("==================================================")
    print("   OmniGraph Zero-GPU Generative UI Data Copilot  ")
    print("==================================================")
    samples_dir = os.path.join(os.path.dirname(__file__), "data", "samples")
    default_csv = os.path.join(samples_dir, "sales_data.csv")
    if os.path.exists(default_csv):
        csv_loader.load_file(default_csv)
        print(f"[Init] Pre-loaded active dataset: sales_data.csv ({len(csv_loader.active_df)} rows)")

@app.get("/")
def root():
    return {
        "project": "OmniGraph",
        "tagline": "Zero-GPU Generative UI Data Copilot",
        "docs": "/docs",
        "ws_endpoint": "/stream"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
