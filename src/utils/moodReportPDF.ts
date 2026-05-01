import jsPDF from 'jspdf';
import { parseInsightContent, type StructuredInsight } from './moodInsightHelpers';

interface MoodEntryLike {
  date: string;
  mood_score?: number | null;
  energy_level?: number | null;
  anxiety_level?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  journal_text?: string | null;
}

interface ThemeAggregateLike {
  theme: string;
  count: number;
  category: string;
}

interface ExportOptions {
  patientName: string;
  periodDays: number;
  entries: MoodEntryLike[];
  themes: ThemeAggregateLike[];
  insightContent?: string | null;
}

function avg(values: Array<number | null | undefined>): number {
  const valid = values.filter((v): v is number => typeof v === 'number');
  if (!valid.length) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

export function exportMoodReportPDF(opts: ExportOptions): void {
  const { patientName, periodDays, entries, themes, insightContent } = opts;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório do Diário Emocional', margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`${patientName} · Últimos ${periodDays} dias · Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
  y += 10;
  pdf.setTextColor(0);

  // Métricas médias
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Médias do período', margin, y);
  y += 6;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const metricsRows = [
    ['Humor', avg(entries.map(e => e.mood_score)) + '/5'],
    ['Energia', avg(entries.map(e => e.energy_level)) + '/5'],
    ['Ansiedade', avg(entries.map(e => e.anxiety_level)) + '/5'],
    ['Horas de sono', avg(entries.map(e => e.sleep_hours)) + 'h'],
    ['Qualidade do sono', avg(entries.map(e => e.sleep_quality)) + '/5'],
    ['Total de registros', String(entries.length)],
  ];
  metricsRows.forEach(([label, val]) => {
    pdf.text(`• ${label}: ${val}`, margin + 2, y);
    y += 5;
  });
  y += 4;

  // Temas recorrentes
  if (themes.length > 0) {
    checkPageBreak(20);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Temas recorrentes', margin, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    themes.slice(0, 10).forEach((t) => {
      checkPageBreak(6);
      pdf.text(`• ${t.theme} (${t.category}) — ${t.count}x`, margin + 2, y);
      y += 5;
    });
    y += 4;
  }

  // Insight estruturado da IA
  if (insightContent) {
    const parsed = parseInsightContent(insightContent);
    if (parsed?.kind === 'structured') {
      const data = parsed.data as StructuredInsight;
      checkPageBreak(20);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Análise mais recente', margin, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const writeSection = (title: string, items: string[]) => {
        if (!items?.length) return;
        checkPageBreak(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        items.forEach((item) => {
          const lines = pdf.splitTextToSize(`• ${item}`, pageWidth - 2 * margin - 4);
          checkPageBreak(lines.length * 5);
          pdf.text(lines, margin + 2, y);
          y += lines.length * 5;
        });
        y += 2;
      };

      const summaryLines = pdf.splitTextToSize(data.summary, pageWidth - 2 * margin);
      checkPageBreak(summaryLines.length * 5);
      pdf.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 2;

      writeSection('Padrões positivos', data.positive_patterns);
      writeSection('Pontos de atenção', data.attention_points);
      writeSection('Sugestões', data.suggested_actions);
    }
  }

  // Histórico
  if (entries.length > 0) {
    checkPageBreak(20);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Registros do período', margin, y);
    y += 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    entries.slice(0, 60).forEach((e) => {
      checkPageBreak(7);
      const line = `${e.date} · Humor ${e.mood_score ?? '—'}/5 · Energia ${e.energy_level ?? '—'}/5 · Ansiedade ${e.anxiety_level ?? '—'}/5 · Sono ${e.sleep_hours ?? '—'}h`;
      pdf.text(line, margin, y);
      y += 5;
    });
  }

  // Footer disclaimer
  checkPageBreak(15);
  y = Math.max(y, pageHeight - margin - 10);
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(
    'Este relatório é informativo, gerado a partir dos seus próprios registros. Não substitui acompanhamento profissional.',
    margin,
    y
  );

  pdf.save(`diario-emocional-${new Date().toISOString().slice(0, 10)}.pdf`);
}
