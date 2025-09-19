import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RecorderState = 'idle' | 'recording' | 'recorded' | 'uploading';

interface UseAudioRecorderReturn {
  state: RecorderState;
  audioUrl: string | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  deleteRecording: () => void;
  uploadAudio: (userId: string, entryDate: string) => Promise<string | null>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [state, setState] = useState<RecorderState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      toast({
        title: "Permissão necessária",
        description: "É necessário permitir acesso ao microfone para gravar áudio.",
        variant: "destructive",
      });
      setHasPermission(false);
      return false;
    }
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setState('recorded');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setState('recording');
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro na gravação",
        description: "Não foi possível iniciar a gravação de áudio.",
        variant: "destructive",
      });
    }
  }, [hasPermission, requestPermission, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setState('idle');
    setDuration(0);
    audioChunksRef.current = [];
  }, [audioUrl]);

  const uploadAudio = useCallback(async (userId: string, entryDate: string): Promise<string | null> => {
    if (!audioUrl || !audioChunksRef.current.length) return null;
    
    setState('uploading');
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });
      
      const fileName = `${userId}/${entryDate}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('mood-audio-notes')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('mood-audio-notes')
        .getPublicUrl(fileName);
      
      setState('recorded');
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível salvar a gravação de áudio.",
        variant: "destructive",
      });
      setState('recorded');
      return null;
    }
  }, [audioUrl, toast]);

  return {
    state,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    deleteRecording,
    uploadAudio,
    hasPermission,
    requestPermission,
    audioChunksRef,
    mediaRecorderRef,
  };
};