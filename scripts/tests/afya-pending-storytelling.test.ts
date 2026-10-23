import { describe, expect, it } from 'bun:test';
import { STORIES, average } from '../afya-pending-storytelling';

describe('Afya pending storytelling', () => {
  it('refreshes ten distinct existing students without touching A–F', () => {
    expect(STORIES.length).toBe(10);
    expect(new Set(STORIES.map(s => s.patient)).size).toBe(10);
    const protectedCases = ['e18c2d8a-6b0d-47fb-b545-c4cbce31c478','c67a9902-0246-4f4b-bad2-3ad25bfb2395','ee43522b-fcaa-428d-9728-c6fa50915b83','09f8869d-284b-44c2-927e-6697a8e8e30f','0f873384-10ff-4bb9-a94e-dbbd267613c7','c19ecdc2-5e11-4dea-b318-99a7a78f51f9'];
    expect(STORIES.filter(s => protectedCases.includes(s.patient))).toEqual([]);
  });
  it('uses distinct sentiment profiles instead of the same mood 1', () => {
    expect(new Set(STORIES.map(s => [0,1,2,3].map(i => average(s,i)).join(','))).size).toBe(10);
    expect(STORIES.filter(s => average(s,0) === 1)).toHaveLength(0);
  });
  it('keeps every story eligible for the current Em Risco queue', () => {
    for (const s of STORIES) expect(average(s,0)<=1.5 || average(s,1)>=4.5).toBe(true);
  });
  it('keeps all diary values on the 1–5 scale', () => {
    for (const s of STORIES) for (const row of [...s.recent,s.before]) for (const value of row) {
      expect(value>=1 && value<=5 && Number.isInteger(value)).toBe(true);
    }
  });
  it('varies the combinations of practices and scale trajectories across all ten', () => {
    expect(new Set(STORIES.map(s => s.practices.join(','))).size).toBe(10);
    expect(new Set(STORIES.map(s => JSON.stringify(s.scales))).size).toBe(10);
    const maxima: Record<string,number> = {WHO5:25,GAD7:21,PHQ9:27,PSS10:40,ISI:28,MHCSF:70};
    for (const s of STORIES) for (const [code,values] of Object.entries(s.scales)) for (const v of values) {
      expect(v>=0 && v<=(maxima[code] ?? -1)).toBe(true);
    }
  });
});