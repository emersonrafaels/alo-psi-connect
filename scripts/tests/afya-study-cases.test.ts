import { describe, it, expect } from 'bun:test';
import { CASES, canManageCases, moodAt, scoredAnswers, patternOf } from '../../supabase/functions/afya-study-cases/cases';
import { isStudyNotificationBlocked } from '../../supabase/functions/_shared/study-notifications';

describe('Afya study rules',()=>{
  it('includes the three additional cases D E F',()=>{expect(CASES.map(c=>c.key)).toEqual(['A','B','C','D','E','F']);});
  it('keeps each new case in the same class and unit as its corresponding case',()=>{
    for (const [newKey,oldKey] of [['D','A'],['E','B'],['F','C']]) {
      expect(CASES.find(c=>c.key===newKey)?.classId).toBe(CASES.find(c=>c.key===oldKey)?.classId);
      expect(patternOf(newKey)).toBe(oldKey);
    }
  });
  it('uses different diary and scale histories for each corresponding pair',()=>{
    for (const [newKey,oldKey] of [['D','A'],['E','B'],['F','C']]) {
      expect(Array.from({length:45},(_,day)=>moodAt(newKey,day))).not.toEqual(Array.from({length:45},(_,day)=>moodAt(oldKey,day)));
      for (const [code,count,max] of [['WHO5',5,5],['GAD7',7,3],['PHQ9',9,3],['PSS10',10,4],['ISI',7,4],['MHCSF',14,5]] as const) {
        const history = (key:string)=>[0,1,2].map(c=>scoredAnswers(key,code,c,count,max).reduce((a,b)=>a+b,0));
        expect(history(newKey)).not.toEqual(history(oldKey));
      }
    }
  });
  it('preserves D stable E recovering and F high-need patterns',()=>{
    expect(moodAt('D',1)).toEqual({mood:4,anxiety:1,energy:4,sleep:4});
    expect(moodAt('E',0).anxiety).toBeLessThan(moodAt('E',20).anxiety);
    expect(moodAt('F',1)).toEqual({mood:2,anxiety:5,energy:2,sleep:2});
    const totals = ['D','E','F'].map(k=>scoredAnswers(k,'GAD7',2,7,3).reduce((a,b)=>a+b,0));
    expect(totals[0]).toBeLessThan(totals[1]); expect(totals[1]).toBeLessThan(totals[2]);
  });
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
  it('blocks notification when a synthetic account is found',async()=>{
    const chain = {select:()=>chain,eq:()=>chain,limit:async()=>({data:[{id:'demo'}],error:null})};
    const admin = {from:()=>chain};
    expect(await isStudyNotificationBlocked(admin as never,{userId:'student-c'})).toBe(true);
  });
  it('fails closed if the safety registry is unavailable',async()=>{
    const chain = {select:()=>chain,eq:()=>chain,limit:async()=>({data:null,error:{message:'unavailable'}})};
    await expect(isStudyNotificationBlocked({from:()=>chain} as never,{userId:'student-c'})).rejects.toThrow('Notification safety check failed');
  });
});