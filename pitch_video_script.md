# OmniGraph 3-Minute Video Pitch & Presentation Guide 🎬

This document outlines the exact scene-by-scene script, terminal commands, prompt queries, and visual cues for recording the 3-minute hackathon demonstration video.

---

## ⏱️ Video Timeline Breakdown

```
[0:00 - 0:45] ──▶ Part 1: The Hook (Live Voice & Instant UI Render)
[0:45 - 1:30] ──▶ Part 2: The Reveal (SSH into 12GB / 2-OCPU Zero-GPU Server)
[1:30 - 2:30] ──▶ Part 3: The Engineering (Arm Performix & KleidiAI SIMD)
[2:30 - 3:00] ──▶ Part 4: The Impact & Open-Source Pitch
```

---

## 🎬 Detailed Scene-by-Scene Script

### Part 1: The Hook (0:00 - 0:45)
* **Visual:** Screen recording of standard laptop running `http://localhost:3000/copilot`.
* **Action:** Click the glowing Mic button on Copilot Studio.
* **Voice Prompt:** *"Omni, look at our vendor risk dataset and plot a scatter chart of risk score versus compliance score."*
* **What Happens:**
  - **1.0 second mark:** Recharts scatter plot instantly appears on the canvas with color-coded risk tiers (`copilot_json` zero-latency stream).
  - **1.5 second mark:** Piper TTS audio voice response plays back: *"I have plotted the vendor risk versus compliance score. CloudTech and CyberGuard show high compliance with low risk, whereas DataDynamics requires immediate review."*
* **Narrator Voiceover:** *"This is OmniGraph—a voice-driven generative UI data copilot. No waiting, no pre-rendered charts, and most importantly: ZERO GPUs."*

---

### Part 2: The Reveal (0:45 - 1:30)
* **Visual:** Split screen. Left side: Next.js Web App. Right side: Terminal showing SSH connection to Oracle Cloud Ampere A1.
* **Terminal Command:**
  ```bash
  ssh ubuntu@<ORACLE_INSTANCE_IP>
  htop
  ```
* **Key Visuals to Highlight in Terminal:**
  - `htop` showing **CPU usage on 2 Cores** (Neoverse N1).
  - Memory consumption holding steady at **~4.2 GB out of 12 GB RAM**.
  - **0 NVIDIA GPUs / 0 CUDA drivers**.
* **Narrator Voiceover:** *"In June 2026, cloud providers slashed free tier specs down to 12GB RAM and 2 OCPUs. Most teams gave up on running local LLMs without expensive GPUs. We didn't. OmniGraph runs entirely inside Oracle's 12GB Always-Free tier."*

---

### Part 3: The Engineering (1:30 - 2:30)
* **Visual:** Showcase system architecture diagram and telemetry bar (`Tokens/Sec: 38.6 t/s`, `Arm KleidiAI Enabled`).
* **Technical Highlights:**
  1. **Low-Latency Response Pipeline:** Explain how the WebSocket bridge streams `copilot_json` before `copilot_audio` to eliminate perceived latency.
  2. **Arm KleidiAI SIMD Acceleration:** Show the before/after benchmark graph:
     - *Standard C++ Build:* 12.4 tokens/sec.
     - *Arm KleidiAI Build:* **38.6 tokens/sec (3.1x speedup)**.
  3. **Arm Performix Profiling:** Mention 96.1% L1/L2 cache hit rate and 64% reduction in matrix multiplication overhead.

---

### Part 4: The Impact & Call to Action (2:30 - 3:00)
* **Visual:** Return to Copilot Studio. Select `q3_financials.csv` dataset and ask:
  *"Omni, show our top 3 sectors by revenue growth."*
* **Narrator Voiceover:** *"OmniGraph proves that enterprise-grade Generative UI and voice AI don't require thousand-dollar GPUs. Everything you see today is open-source, containerized with Docker, and ready to deploy on any Arm CPU server in under 2 minutes."*
* **Ending Screen:** GitHub Repository URL & MIT License badge.

---

## 🛠️ Pre-Recording Checklist
- [x] Backend running (`python backend/main.py` or `docker-compose up`)
- [x] Sample datasets pre-loaded (`vendor_risk.csv`, `q3_financials.csv`)
- [x] Browser open at `http://localhost:3000/copilot`
- [x] Terminal ready with `htop`
