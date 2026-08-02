import { useState, useEffect, useRef, useCallback } from 'react';

export interface TelemetryData {
  cpu_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  ram_percent: number;
  whisper_ms: number;
  llama_ms: number;
  tts_ms: number;
  total_latency_ms: number;
  tokens_sec: number;
  model_name: string;
  kleidi_ai_enabled: boolean;
  arch: string;
}

export interface CopilotResponse {
  transcript: string;
  speech_text: string;
  ui_component: any;
  audio_b64: string;
  telemetry: TelemetryData;
  code?: string;
  stdout?: string;
  execution_time_ms?: number;
  execution_error?: string | null;
}

export function useWebSocket(url: string = 'ws://localhost:8000/stream') {
  const [isConnected, setIsConnected] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [latestResponse, setLatestResponse] = useState<CopilotResponse | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[WebSocket] Connected to backend');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') {
              if (data.telemetry) {
                setTelemetry((prev) => ({ ...prev, ...data.telemetry }));
              }
            } else if (data.type === 'processing') {
              if (data.stage) setProcessingStage(data.stage);
              if (data.message) setProcessingMessage(data.message);
              if (data.transcript) setUserTranscript(data.transcript);
            } else if (data.type === 'copilot_json') {
              // Immediately clear loading state and render UI component chart
              setProcessingStage('');
              setProcessingMessage('');
              setUserTranscript(data.transcript || '');
              setLatestResponse((prev) => ({
                transcript: data.transcript || '',
                speech_text: data.speech_text || '',
                ui_component: data.ui_component,
                audio_b64: prev?.audio_b64 || '',
                telemetry: data.telemetry,
                code: data.code,
                stdout: data.stdout,
                execution_time_ms: data.execution_time_ms,
                execution_error: data.execution_error
              }));
              if (data.telemetry) setTelemetry(data.telemetry);
            } else if (data.type === 'copilot_audio') {
              // Attach synthesized audio once TTS completes
              setLatestResponse((prev) => prev ? {
                ...prev,
                audio_b64: data.audio_b64 || prev.audio_b64,
                telemetry: data.telemetry || prev.telemetry
              } : null);
              if (data.telemetry) setTelemetry(data.telemetry);
            } else if (data.type === 'copilot_response') {
              setProcessingStage('');
              setProcessingMessage('');
              setUserTranscript(data.transcript || '');
              setLatestResponse(data);
              if (data.telemetry) setTelemetry(data.telemetry);
            } else if (data.type === 'error') {
              setProcessingStage('');
              setProcessingMessage('');
              console.error('[Copilot Error]', data.message);
            }
          } catch (e) {
            console.error('[WebSocket Message Error]', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('[WebSocket Error]', err);
          ws.close();
        };
      } catch (err) {
        console.error('[WebSocket Init Error]', err);
      }
    };

    connect();

    // Live CPU & RAM system telemetry poll interval (every 4 seconds)
    const telemetryInterval = setInterval(() => {
      fetch('http://localhost:8000/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.system) {
            setTelemetry((prev) => ({
              ...prev,
              ...data.system,
              kleidi_ai_enabled: data.kleidi_ai ?? prev?.kleidi_ai_enabled ?? false
            } as TelemetryData));
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (telemetryInterval) clearInterval(telemetryInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  const sendAudio = useCallback((base64Audio: string, transcript?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setProcessingStage('Whisper STT');
      setProcessingMessage('Processing data query...');
      wsRef.current.send(JSON.stringify({
        type: 'audio_chunk',
        audio: base64Audio,
        transcript: transcript || ''
      }));
    } else {
      console.warn('[WebSocket] Cannot send audio, connection closed.');
    }
  }, []);

  const selectDataset = useCallback((name: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'select_dataset',
        name: name
      }));
    }
  }, []);

  return {
    isConnected,
    processingStage,
    processingMessage,
    userTranscript,
    latestResponse,
    telemetry,
    sendAudio,
    selectDataset
  };
}
