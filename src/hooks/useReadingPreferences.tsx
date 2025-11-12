import { useState, useEffect } from 'react';

export type ReadingTheme = 'light' | 'dark' | 'sepia';
export type FontSize = 'small' | 'medium' | 'large';
export type ContentWidth = 'narrow' | 'medium' | 'wide';

interface ReadingPreferences {
  theme: ReadingTheme;
  fontSize: FontSize;
  contentWidth: ContentWidth;
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  theme: 'light',
  fontSize: 'medium',
  contentWidth: 'medium',
};

const STORAGE_KEY = 'blog_reading_preferences';

export const useReadingPreferences = () => {
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save reading preferences:', error);
    }
  }, [preferences]);

  const setTheme = (theme: ReadingTheme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const setFontSize = (fontSize: FontSize) => {
    setPreferences((prev) => ({ ...prev, fontSize }));
  };

  const setContentWidth = (contentWidth: ContentWidth) => {
    setPreferences((prev) => ({ ...prev, contentWidth }));
  };

  return {
    preferences,
    setTheme,
    setFontSize,
    setContentWidth,
  };
};
