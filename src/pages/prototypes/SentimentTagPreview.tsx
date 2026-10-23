import { Badge } from '@/components/ui/badge';
import {
  sentimentBand,
  SENTIMENT_BAND_STYLES,
  SENTIMENT_BAND_DOTS,
  SENTIMENT_BAND_LEGEND,
  SENTIMENT_BAND_HINT,
  SentimentBand,
} from '@/features/triage/sentimentBands';

const SAMPLE = [
  { emotion: 'Ansiedade', average: 5 },
  { emotion: 'Estresse', average: 3.3 },
  { emotion: 'Energia', average: 2 },
  { emotion: 'Sono', average: 2 },
  { emotion: 'Humor', average: 1 },
];

export default function SentimentTagPreview() {
  return (
    <div className="p-6 max-w-xl">
      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Sentimentos predominantes</p>
      <p className="text-[11px] text-muted-foreground mb-2">
        Média das notas que o aluno deu a cada sentimento nos últimos 30 dias (1 = muito baixo, 5 = muito alto).
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLE.map(e => {
          const band = sentimentBand(e.emotion, e.average);
          return (
            <Badge
              key={e.emotion}
              variant="secondary"
              title={SENTIMENT_BAND_HINT[band]}
              className={`text-xs ${SENTIMENT_BAND_STYLES[band]}`}
            >
              {e.emotion} · média {e.average.toFixed(1).replace('.', ',')}
            </Badge>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {(['good', 'medium', 'bad'] as SentimentBand[]).map(band => (
          <span key={band} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${SENTIMENT_BAND_DOTS[band]}`} />
            {SENTIMENT_BAND_LEGEND[band]}
          </span>
        ))}
      </div>
    </div>
  );
}
