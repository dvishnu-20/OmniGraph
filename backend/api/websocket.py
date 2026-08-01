import os
import json
import base64
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.ai.whisper import whisper_engine
from backend.ai.llama import llama_engine
from backend.ai.tts import tts_engine
from backend.data.csv_loader import csv_loader
from backend.utils.prompt import build_copilot_prompt
from backend.utils.telemetry import telemetry

ws_router = APIRouter()

TEMP_DIR = os.path.join(os.path.dirname(__file__), "..", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@ws_router.websocket("/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connected.")

    # Send initial connection confirmation & telemetry
    await websocket.send_json({
        "type": "connected",
        "message": "OmniGraph Zero-GPU Copilot Connected",
        "telemetry": telemetry.get_system_stats()
    })

    while True:
        try:
            raw_data = await websocket.receive_text()
            message = json.loads(raw_data)
            msg_type = message.get("type", "")

            # 1. Select / Switch Dataset
            if msg_type == "select_dataset":
                dataset_name = message.get("name", "sales_data.csv")
                samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
                filepath = os.path.join(samples_dir, dataset_name)
                if os.path.exists(filepath):
                    _, summary = csv_loader.load_file(filepath)
                    await websocket.send_json({
                        "type": "dataset_loaded",
                        "summary": summary
                    })
                continue

            # 2. Query / Audio Processing Pipeline
            if msg_type in ["audio_chunk", "audio", "text_query", "query"] or "audio" in message or "transcript" in message:
                # Notify frontend that processing has started
                await websocket.send_json({
                    "type": "processing",
                    "stage": "Whisper STT",
                    "message": "Processing user data query..."
                })

                # Check for user text/transcript
                user_transcript = message.get("transcript", "").strip() or message.get("text", "").strip() or message.get("query", "").strip()
                whisper_ms = 0.0

                if not user_transcript:
                    # Save base64 audio to temp.wav if audio packet sent
                    audio_base64 = message.get("audio", "")
                    if "," in audio_base64:
                        audio_base64 = audio_base64.split(",")[1]
                    
                    audio_bytes = base64.b64decode(audio_base64) if audio_base64 else b"0"*1024
                    temp_audio_path = os.path.join(TEMP_DIR, "input_speech.wav")
                    with open(temp_audio_path, "wb") as f:
                        f.write(audio_bytes)

                    user_transcript, whisper_ms = whisper_engine.transcribe(temp_audio_path)
                else:
                    whisper_ms = 35.0  # Fast browser STT latency

                await websocket.send_json({
                    "type": "processing",
                    "stage": "Llama.cpp LLM",
                    "transcript": user_transcript,
                    "message": f"Analyzing CSV with question: '{user_transcript}'"
                })

                # Ensure active dataset is loaded
                if csv_loader.active_df is None:
                    samples_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")
                    default_path = os.path.join(samples_dir, "sales_data.csv")
                    csv_loader.load_file(default_path)

                # STAGE 2: Llama Reasoning & Structured UI JSON
                summary_text = csv_loader.format_summary_for_prompt(csv_loader.get_df_summary(csv_loader.active_df))
                prompt = build_copilot_prompt(summary_text, user_transcript)
                
                copilot_response, llama_ms, generated_tokens = llama_engine.generate(prompt, user_transcript)

                speech_text = copilot_response.get("speech_text", "Here is your requested data analysis.")
                ui_component = copilot_response.get("ui_component", {})

                await websocket.send_json({
                    "type": "processing",
                    "stage": "Piper TTS",
                    "message": "Synthesizing voice response..."
                })

                # STAGE 3: Piper Text-to-Speech
                output_speech_wav = os.path.join(TEMP_DIR, f"response_{int(time.time())}.wav")
                audio_path, tts_ms = tts_engine.synthesize(speech_text, output_speech_wav)

                # Encode output audio to Base64
                output_audio_b64 = ""
                if os.path.exists(audio_path):
                    with open(audio_path, "rb") as af:
                        output_audio_b64 = base64.b64encode(af.read()).decode("utf-8")

                # Compute performance metrics & telemetry
                telemetry_data = telemetry.compute_metrics(whisper_ms, llama_ms, tts_ms, generated_tokens)

                # Send complete payload back to frontend
                await websocket.send_json({
                    "type": "copilot_response",
                    "transcript": user_transcript,
                    "speech_text": speech_text,
                    "ui_component": ui_component,
                    "audio_b64": output_audio_b64,
                    "telemetry": telemetry_data
                })

        except WebSocketDisconnect:
            print("[WebSocket] Client disconnected.")
            break
        except Exception as e:
            print(f"[WebSocket Error Handled] {e}")
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception:
                break
