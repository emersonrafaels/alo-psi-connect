import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { parseISODateLocal } from '@/lib/utils';
import {
  getEmotionRaw,
  getScale,
  INVERTED_EMOTIONS,
  pearson,
} from '@/utils/moodSeriesBuilder';
import { getEmotionDisplayName } from '@/utils/emotionFormatters';

interface Props {
  entries: MoodEntry[];
  userConfigs: EmotionConfig[];
  days: number;
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function avg(nums: number[]): number | null {
  const v = nums.filter((n) => Number.isFinite(n));
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export const PatternNarrativeCard = ({ entries, userConfigs, days }: Props) => {
  const sentences = useMemo(() => {
    if (entries.length === 0) return [] as string[];
    const out: string[] = [];
    const enabled = userConfigs.filter((c) => c.is_enabled);

    const now = new Date();
    const sinceCurrent = new Date(now);
    sinceCurrent.setDate(sinceCurrent.getDate() - days);
    const sincePrev = new Date(now);
    sincePrev.setDate(sincePrev.getDate() - days * 2);

    const current = entries.filter((e) => parseISODateLocal(e.date) >= sinceCurrent);
    const previous = entries.filter((e) => {
      const d = parseISODateLocal(e.date);
      return d >= sincePrev && d < sinceCurrent;
    });

    // 1) Variação por emoção
    const variations: Array<{ key: string; label: string; deltaPct: number; inverted: boolean }> = [];
    enabled.forEach((c) => {
      const cur = avg(current.map((e) => getEmotionRaw(e, c.emotion_type)).filter((v): v is number => v !== null));
      const prev = avg(previous.map((e) => getEmotionRaw(e, c.emotion_type)).filter((v): v is number => v !== null));
      if (cur === null || prev === null || prev === 0) return;
      const { min, max } = getScale(userConfigs, c.emotion_type);
      const deltaPct = ((normalize(cur, min, max) - normalize(prev, min, max)) * 100);
      if (Math.abs(deltaPct) >= 5) {
        variations.push({
          key: c.emotion_type,
          label: getEmotionDisplayName(c.emotion_type, userConfigs),
          deltaPct,
          inverted: INVERTED_EMOTIONS.has(c.emotion_type),
        });
      }
    });
    variations.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
    variations.slice(0, 2).forEach((v) => {
      const direction = v.deltaPct > 0 ? 'subiu' : 'caiu';
      const tone = (v.deltaPct > 0) === !v.inverted ? '🌱' : '⚠️';
      out.push(`${tone} ${v.label} ${direction} ${Math.abs(v.deltaPct).toFixed(0)}% em relação ao período anterior.`);
    });

    // 2) Pior dia da semana para humor
    const moodByWeekday = new Map<number, number[]>();
    current.forEach((e) => {
      const v = getEmotionRaw(e, 'mood');
      if (v === null) return;
      const wd = parseISODateLocal(e.date).getDay();
      if (!moodByWeekday.has(wd)) moodByWeekday.set(wd, []);
      moodByWeekday.get(wd)!.push(v);
    });
    if (moodByWeekday.size >= 3) {
      const ranked = Array.from(moodByWeekday.entries())
        .map(([wd, arr]) => ({ wd, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length }))
        .filter((r) => r.n >= 2)
        .sort((a, b) => a.avg - b.avg);
      if (ranked.length >= 2) {
        const worst = ranked[0];
        const best = ranked[ranked.length - 1];
        if (best.avg - worst.avg >= 0.5) {
          out.push(`📅 ${WEEKDAYS[worst.wd].charAt(0).toUpperCase() + WEEKDAYS[worst.wd].slice(1)} costuma ser seu dia mais difícil; ${WEEKDAYS[best.wd]} aparece com o melhor humor.`);
        }
      }
    }

    // 3) Correlação sono ↔ ansiedade
    const sleepArr: number[] = [];
    const anxietyArr: number[] = [];
    current.forEach((e) => {
      const s = getEmotionRaw(e, 'sleep_quality');
      const a = getEmotionRaw(e, 'anxiety');
      if (s !== null && a !== null) {
        sleepArr.push(s);
        anxietyArr.push(a);
      }
    });
    if (sleepArr.length >= 5) {
      const r = pearson(sleepArr, anxietyArr);
      if (r !== null && r <= -0.4) {
        out.push(`😴 Quando você dorme melhor, sua ansiedade tende a ceder (correlação ${r.toFixed(2)}).`);
      } else if (r !== null && r >= 0.4) {
        out.push(`😴 Curiosamente, dias de melhor sono coincidem com mais ansiedade (correlação ${r.toFixed(2)}). Vale observar.`);
      }
    }

    // 4) Consistência
    const recordedDays = new Set(current.map((e) => e.date)).size;
    const rate = (recordedDays / days) * 100;
    if (rate >= 70) {
      out.push(`✨ Você manteve registros em ${recordedDays} de ${days} dias — consistência acima de ${Math.round(rate)}%.`);
    } else if (rate >= 40) {
      out.push(`📝 Você registrou em ${recordedDays} de ${days} dias. Pequenas anotações diárias deixam os padrões mais nítidos.`);
    } else {
      out.push(`📝 Apenas ${recordedDays} registros nos últimos ${days} dias. Tente registrar mais vezes para observar melhor o seu padrão.`);
    }

    return out.slice(0, 5);
  }, [entries, userConfigs, days]);

  if (sentences.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Sua história nos últimos {days} dias
        </CardTitle>
        <CardDescription>Padrões observados nos seus registros, em linguagem clara.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sentences.map((s, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/90 bg-muted/40 rounded-lg px-3 py-2">
              {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
