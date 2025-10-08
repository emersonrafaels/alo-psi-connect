import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const SESSION_KEY = 'blog_session_id';

const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

export const usePostViewTracking = (postId: string) => {
  const { user } = useAuth();
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const scrollPercentageRef = useRef<number>(0);
  const sessionId = getOrCreateSessionId();

  // Track inicial view
  useEffect(() => {
    if (!postId || hasTrackedView) return;

    const trackView = async () => {
      try {
        const referrer = document.referrer || null;
        const deviceType = getDeviceType();

        await supabase.functions.invoke('track-blog-view', {
          body: {
            postId,
            sessionId,
            userId: user?.id || null,
            referrer,
            deviceType,
            timeSpent: 0,
            completedReading: false,
          },
        });

        setHasTrackedView(true);
        console.log('[View Tracking] Initial view tracked');
      } catch (error) {
        console.error('[View Tracking] Error tracking view:', error);
      }
    };

    trackView();
  }, [postId, sessionId, user?.id, hasTrackedView]);

  // Track scroll e tempo de leitura
  useEffect(() => {
    if (!postId || !hasTrackedView) return;

    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      scrollPercentageRef.current = Math.max(scrollPercentageRef.current, scrolled);
    };

    window.addEventListener('scroll', handleScroll);

    // Track ao sair da página
    const trackExit = async () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const completedReading = scrollPercentageRef.current >= 80;

      try {
        await supabase.functions.invoke('track-blog-view', {
          body: {
            postId,
            sessionId,
            userId: user?.id || null,
            timeSpent,
            completedReading,
          },
        });
        console.log(`[View Tracking] Exit tracked - Time: ${timeSpent}s, Completed: ${completedReading}`);
      } catch (error) {
        console.error('[View Tracking] Error tracking exit:', error);
      }
    };

    window.addEventListener('beforeunload', trackExit);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', trackExit);
    };
  }, [postId, sessionId, user?.id, hasTrackedView]);

  return { sessionId, hasTrackedView };
};
