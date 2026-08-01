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
              if (data.telemetry) setTelemetry(data.telemetry);
            } else if (data.type === 'processing') {
              if (data.stage) setProcessingStage(data.stage);
              if (data.message) setProcessingMessage(data.message);
              if (data.transcript) setUserTranscript(data.transcript);
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

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
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
