import { describe, it, expect } from 'vitest';
import { CASES, canManageCases, moodAt, scoredAnswers } from '../../supabase/functions/afya-study-cases/cases';

describe('Afya study rules',()=>{
  it('creates exactly student cases A, B and C',()=>{expect(CASES.map(c=>c.key)).toEqual(['A','B','C']);});
  it('allows platform admins but not institutional admins or students to assign access',()=>{
    expect(canManageCases(['admin'])).toBe(true);expect(canManageCases(['super_admin'])).toBe(true);
    expect(canManageCases(['institution_admin'])).toBe(false);expect(canManageCases([])).toBe(false);
  });
  it('keeps A better than B and C for anxiety',()=>{
    const sums = ['A','B','C'].map(k=>scoredAnswers(k,'GAD7',2,7,3).reduce((a,b)=>a+b,0));
    expect(sums[0]).toBeLessThan(sums[1]);expect(sums[1]).toBeLessThan(sums[2]);
  });
  it('gives B a recovery after the evaluation period',()=>{expect(moodAt('B',0).anxiety).toBeLessThan(moodAt('B',20).anxiety);});
  it('keeps C a simulated high-need case',()=>{expect(moodAt('C',1)).toEqual({mood:2,anxiety:5,energy:2,sleep:2});});
});