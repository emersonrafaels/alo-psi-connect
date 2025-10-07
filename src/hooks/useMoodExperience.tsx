import { useState, useEffect } from 'react';
import { useGuestConfig } from './useGuestConfig';
import { calculateAverage } from '@/utils/emotionFormatters';

export interface DemoMoodEntry {
  id: string;
  date: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours?: number;
  sleep_quality?: number;
  journal_text?: string;
  tags?: string[];
}

const DEMO_STORAGE_KEY = 'mood_diary_demo_entries';

export const useMoodExperience = () => {
  const { getGuestDiaryLimit, loading: configLoading } = useGuestConfig();
  const [demoEntries, setDemoEntries] = useState<DemoMoodEntry[]>([]);
  const [canAddMore, setCanAddMore] = useState(true);

  // Load demo entries from localStorage
  useEffect(() => {
    if (configLoading) return;
    
    const limit = getGuestDiaryLimit();
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      try {
        const entries = JSON.parse(stored);
        setDemoEntries(entries);
        setCanAddMore(entries.length < limit);
      } catch (error) {
        console.error('Error parsing demo entries:', error);
        setDemoEntries([]);
      }
    }
  }, [configLoading, getGuestDiaryLimit]);

  const addDemoEntry = (entry: Omit<DemoMoodEntry, 'id'>) => {
    const limit = getGuestDiaryLimit();
    if (demoEntries.length >= limit) {
      return false; // Can't add more
    }

    const newEntry: DemoMoodEntry = {
      ...entry,
      id: Date.now().toString(),
    };

    const updatedEntries = [newEntry, ...demoEntries];
    setDemoEntries(updatedEntries);
    setCanAddMore(updatedEntries.length < limit);
    
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updatedEntries));
    return true;
  };

  const clearDemoData = () => {
    setDemoEntries([]);
    setCanAddMore(true);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const getDemoStats = () => {
    if (demoEntries.length === 0) return null;

    const avgMood = demoEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / demoEntries.length;
    const avgEnergy = demoEntries.reduce((sum, entry) => sum + entry.energy_level, 0) / demoEntries.length;
    const avgAnxiety = demoEntries.reduce((sum, entry) => sum + entry.anxiety_level, 0) / demoEntries.length;

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgAnxiety: Math.round(avgAnxiety * 10) / 10,
      totalEntries: demoEntries.length,
    };
  };

  const limit = getGuestDiaryLimit();
  
  return {
    demoEntries,
    canAddMore,
    entriesLeft: limit - demoEntries.length,
    addDemoEntry,
    clearDemoData,
    getDemoStats,
    isAtLimit: demoEntries.length >= limit,
    limit,
    loading: configLoading,
  };
};