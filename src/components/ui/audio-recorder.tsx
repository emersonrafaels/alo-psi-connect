import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Play, Pause, Trash2, Upload } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import { getTenantDisplayName } from '@/utils/tenantHelpers';

interface AudioRecorderProps {
  onAudioUploaded?: (audioUrl: string) => void;
  onTranscriptionComplete?: (transcription: string, reflection: string) => void;
  existingAudioUrl?: string;
  userId: string;
  entryDate: string;
  tenantId?: string;
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioUploaded,
  onTranscriptionComplete,
  existingAudioUrl,
  userId,
  entryDate,
  tenantId,
  className
}) => {
  const {
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
    mediaRecorderRef
  } = useAudioRecorder();
  
  const { tenant } = useTenant();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleUpload = async () => {
    const uploadedUrl = await uploadAudio(userId, entryDate);
    if (uploadedUrl && onAudioUploaded) {
      onAudioUploaded(uploadedUrl);
    }
  };

  const handleTranscribeAndUpload = async () => {
    if (!audioUrl || !audioChunksRef.current) return;
    
    setIsTranscribing(true);
    
    try {
      // First upload the audio
      const uploadedUrl = await uploadAudio(userId, entryDate);
      
      if (uploadedUrl && onAudioUploaded) {
        onAudioUploaded(uploadedUrl);
      }

      // Then transcribe the audio
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
      const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          tenant_id: tenantId 
        }
      });
        
        if (error) {
          throw error;
        }
        
        if (transcriptionData && onTranscriptionComplete) {
          onTranscriptionComplete(transcriptionData.transcription, transcriptionData.reflection);
        }
        
        setIsTranscribing(false);
      };
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setIsTranscribing(false);
    }
  };

  const getRecordingIndicator = () => {
    if (state === 'recording') {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Gravando... {formatDuration(duration)}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gravação de Áudio</h3>
        {getRecordingIndicator()}
      </div>

      {/* Existing audio */}
      {existingAudioUrl && !audioUrl && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Áudio salvo:</p>
          <audio 
            controls 
            src={existingAudioUrl}
            className="w-full"
          />
        </div>
      )}

      {/* New recording controls */}
      {state === 'idle' && (
        <div className="space-y-3">
          {!hasPermission && (
            <Button 
              variant="outline" 
              onClick={requestPermission}
              className="w-full"
            >
              <Mic className="w-4 h-4 mr-2" />
              Permitir acesso ao microfone
            </Button>
          )}
          
          {hasPermission && (
            <Button 
              onClick={startRecording}
              className="w-full"
              variant="outline"
            >
              <Mic className="w-4 h-4 mr-2" />
              Iniciar gravação
            </Button>
          )}
        </div>
      )}

      {/* Recording controls */}
      {state === 'recording' && (
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-8 bg-primary/60 rounded animate-pulse" />
              <div className="w-2 h-12 bg-primary/80 rounded animate-pulse" style={{animationDelay: '0.1s'}} />
              <div className="w-2 h-6 bg-primary/60 rounded animate-pulse" style={{animationDelay: '0.2s'}} />
              <div className="w-2 h-10 bg-primary/80 rounded animate-pulse" style={{animationDelay: '0.3s'}} />
              <div className="w-2 h-4 bg-primary/60 rounded animate-pulse" style={{animationDelay: '0.4s'}} />
            </div>
            <p className="text-sm text-muted-foreground">Fale no microfone...</p>
          </div>
          
          <Button 
            onClick={stopRecording}
            variant="destructive"
            className="w-full"
          >
            <MicOff className="w-4 h-4 mr-2" />
            Parar gravação
          </Button>
        </div>
      )}

      {/* Recorded audio controls */}
      {(state === 'recorded' || state === 'uploading') && audioUrl && (
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gravação concluída</span>
              <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
            </div>
            
            <audio 
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: isPlaying ? '100%' : '0%' }}
                />
              </div>
            </div>
          </div>
          
          {isTranscribing && (
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-primary">Transcrevendo com a Inteligência {getTenantDisplayName(tenant, 'Rede Bem Estar')}...</span>
              </div>
              <p className="text-xs text-muted-foreground">Aguarde enquanto a IA processa seu áudio</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={deleteRecording}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={state === 'uploading' || isTranscribing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
            
            {onTranscriptionComplete ? (
              <Button 
                onClick={handleTranscribeAndUpload}
                size="sm"
                className="flex-1"
                disabled={state === 'uploading' || isTranscribing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isTranscribing ? 'Transcrevendo...' : state === 'uploading' ? 'Salvando...' : 'Transcrever e Salvar'}
              </Button>
            ) : (
              <Button 
                onClick={handleUpload}
                size="sm"
                className="flex-1"
                disabled={state === 'uploading' || isTranscribing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {state === 'uploading' ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
