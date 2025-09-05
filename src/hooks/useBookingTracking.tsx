import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TrackingEvent {
  event_name: string;
  event_data?: any;
  professional_id?: string;
  booking_data?: any;
}

export const useBookingTracking = (professionalId?: string) => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>();

  // Gerar session ID único se não existir
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  const trackEvent = async (event: TrackingEvent) => {
    try {
      // Apenas incluir professional_id se for um UUID válido
      const isValidUUID = (id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      };

      const finalProfessionalId = event.professional_id || professionalId;
      const validProfessionalId = finalProfessionalId && isValidUUID(finalProfessionalId) ? finalProfessionalId : null;

      const trackingData = {
        user_id: user?.id || null,
        session_id: sessionIdRef.current!,
        event_name: event.event_name,
        event_data: event.event_data || null,
        professional_id: validProfessionalId,
        booking_data: event.booking_data || null,
      };

      await supabase
        .from('user_booking_tracking')
        .insert(trackingData);

      console.log('📊 Tracking event:', event.event_name, trackingData);
    } catch (error) {
      console.error('Erro ao registrar tracking:', error);
    }
  };

  // Track automático quando o hook é inicializado
  useEffect(() => {
    trackEvent({
      event_name: 'booking_page_loaded',
      event_data: { 
        timestamp: new Date().toISOString(),
        user_logged_in: !!user 
      }
    });
  }, []);

  return { trackEvent };
};