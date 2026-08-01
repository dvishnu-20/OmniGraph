import { useState, useRef, useCallback } from 'react';

export interface UseRecorderReturn {
  isRecording: boolean;
  audioLevel: number;
  transcript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ base64Audio: string; transcriptText: string }>;
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognizedTextRef = useRef<string>('');

  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    recognizedTextRef.current = '';
    setTranscript('');

    // 1. Browser Speech Recognition setup (Web Speech API)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              recognizedTextRef.current += text + ' ';
            } else {
              interimText += text;
            }
          }
          setTranscript((recognizedTextRef.current + interimText).trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('[Web Speech API Error]', e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('[Web Speech API Init Failed]', e);
      }
    }

    // 2. MediaRecorder & Audio Level Visualizer setup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Mime-type safety check for browser compatibility
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error('[MediaRecorder Stream Error]', err);
      setIsRecording(true);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ base64Audio: string; transcriptText: string }> => {
    return new Promise((resolve) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      setAudioLevel(0);
      setIsRecording(false);

      const finalTranscript = recognizedTextRef.current.trim();

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve({
          base64Audio: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
          transcriptText: finalTranscript
        });
        return;
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve({
            base64Audio: base64String,
            transcriptText: finalTranscript
          });
        };
        reader.readAsDataURL(audioBlob);

        recorder.stream.getTracks().forEach((track) => track.stop());
      };

      recorder.stop();
    });
  }, []);

  return {
    isRecording,
    audioLevel,
    transcript,
    startRecording,
    stopRecording
  };
}
