import time
import psutil
import platform
import os

class TelemetryTracker:
    def __init__(self):
        self.start_time = None
        self.metrics = {
            "cpu_percent": 0.0,
            "ram_used_gb": 0.0,
            "ram_total_gb": 0.0,
            "ram_percent": 0.0,
            "whisper_ms": 0,
            "llama_ms": 0,
            "tts_ms": 0,
            "total_latency_ms": 0,
            "tokens_sec": 0.0,
            "model_name": "Llama-3-8B-Instruct (Q4_K_M)",
            "kleidi_ai_enabled": False,
            "arch": platform.machine()
        }
        self.check_kleidi_ai()

    def check_kleidi_ai(self):
        """Check if running on Arm with KleidiAI / GGML CPU optimization flags."""
        arch = platform.machine().lower()
        is_arm = "arm" in arch or "aarch64" in arch
        # Check environment or build flags
        kleidi_env = os.environ.get("GGML_CPU_KLEIDIAI", "0") == "1"
        self.metrics["kleidi_ai_enabled"] = is_arm or kleidi_env

    def get_system_stats(self):
        """Get live CPU and Memory usage."""
        mem = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=None)
        return {
            "cpu_percent": round(cpu, 1),
            "ram_used_gb": round(mem.used / (1024 ** 3), 2),
            "ram_total_gb": round(mem.total / (1024 ** 3), 2),
            "ram_percent": round(mem.percent, 1)
        }

    def compute_metrics(self, whisper_ms: float, llama_ms: float, tts_ms: float, generated_tokens: int = 45):
        """Compute pipeline performance metrics and token speeds."""
        sys_stats = self.get_system_stats()
        total_latency = whisper_ms + llama_ms + tts_ms
        
        tokens_per_sec = 0.0
        if llama_ms > 0:
            tokens_per_sec = round(generated_tokens / (llama_ms / 1000.0), 1)

        self.metrics.update({
            **sys_stats,
            "whisper_ms": int(whisper_ms),
            "llama_ms": int(llama_ms),
            "tts_ms": int(tts_ms),
            "total_latency_ms": int(total_latency),
            "tokens_sec": tokens_per_sec
        })
        return self.metrics

telemetry = TelemetryTracker()
