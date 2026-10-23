import { describe, expect, test } from 'vitest';
import { buildTrendSeries } from './trendSeries';
import type { MoodEntry } from '@/hooks/useStudentActivityData';

const entry = (overrides: Partial<MoodEntry> = {}): MoodEntry => ({ id: '1', date: '2026-10-22', mood_score: 1, anxiety_level: 5, energy_level: 2, sleep_quality: null, sleep_hours: null, tags: null, journal_text: null, emotion_values: { mood: 4, energy: 3, anxiety: 3, stress: 3 }, ...overrides });
describe('student-history sentiment series', () => {
  test('Humor, Energia and Ansiedade each appear once despite legacy/dynamic duplicates', () => {
    const series = buildTrendSeries([entry()]);
    expect(series.map((s) => s.label)).toEqual(['Humor', 'Ansiedade', 'Energia', 'Sono', 'Estresse']);
    expect(series[0].getValue(entry())).toBe(1);
    expect(series[1].getValue(entry())).toBe(5);
  });
  test('a missing legacy score falls back to its dynamic alias', () => {
    expect(buildTrendSeries([entry()])[0].getValue(entry({ mood_score: null }))).toBe(4);
  });
  test('distinct sentiments do not recycle colors after the fifth series', () => {
    const series = buildTrendSeries([entry({ emotion_values: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`feeling_${i}`, 3])) })]);
    expect(new Set(series.map((s) => s.colorToken)).size).toBe(24);
  });
});