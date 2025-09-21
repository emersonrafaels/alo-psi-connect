import jsPDF from 'jspdf';
import { DemoMoodEntry } from '@/hooks/useMoodExperience';
import { getTodayLocalDateString, parseISODateLocal } from '@/lib/utils';

interface PDFConfig {
  includeLogo?: boolean;
  includeStats?: boolean;
  includeGraphs?: boolean;
}

export const generateProfessionalPDF = (
  entry: DemoMoodEntry | null,
  stats?: any,
  config: PDFConfig = {}
) => {
  const pdf = new jsPDF();
  const { includeLogo = true, includeStats = true, includeGraphs = false } = config;
  
  // Configurações de estilo
  const primaryColor: [number, number, number] = [74, 144, 226]; // Cor primária da AloPsi
  const secondaryColor: [number, number, number] = [100, 100, 100];
  const headerHeight = 30;
  let yPosition = 20;

  // Cabeçalho com logo/título
  if (includeLogo) {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, 210, headerHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AloPsi - Diário Emocional', 20, 18);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Relatório de Bem-estar Emocional', 20, 25);
    
    yPosition = headerHeight + 15;
  }

  // Reset cor do texto
  pdf.setTextColor(0, 0, 0);

  // Data de geração
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition);
  yPosition += 15;

  // Se houver entrada específica
  if (entry) {
    // Título da entrada
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Entrada do Diário', 20, yPosition);
    yPosition += 10;

    // Data da entrada
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text(`Data: ${parseISODateLocal(entry.date).toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 15;

    // Métricas principais
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Métricas Emocionais', 20, yPosition);
    yPosition += 10;

    const metrics = [
      { label: 'Humor', value: entry.mood_score, max: 10, color: [34, 197, 94] as [number, number, number] },
      { label: 'Energia', value: entry.energy_level, max: 5, color: [251, 191, 36] as [number, number, number] },
      { label: 'Ansiedade', value: entry.anxiety_level, max: 5, color: [239, 68, 68] as [number, number, number] }
    ];

    metrics.forEach((metric, index) => {
      const barWidth = 120;
      const barHeight = 8;
      const percentage = (metric.value / metric.max) * 100;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${metric.label}: ${metric.value}/${metric.max}`, 20, yPosition);
      
      // Barra de progresso
      pdf.setFillColor(230, 230, 230);
      pdf.rect(85, yPosition - 5, barWidth, barHeight, 'F');
      
      pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.rect(85, yPosition - 5, (barWidth * percentage) / 100, barHeight, 'F');
      
      yPosition += 15;
    });

    // Informações do sono (se disponível)
    if (entry.sleep_hours || entry.sleep_quality) {
      yPosition += 5;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informações do Sono', 20, yPosition);
      yPosition += 10;

      if (entry.sleep_hours) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Horas de sono: ${entry.sleep_hours}h`, 20, yPosition);
        yPosition += 8;
      }

      if (entry.sleep_quality) {
        pdf.text(`Qualidade do sono: ${entry.sleep_quality}/5`, 20, yPosition);
        yPosition += 15;
      }
    }

    // Tags (se disponível)
    if (entry.tags && entry.tags.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tags', 20, yPosition);
      yPosition += 10;

      const tagsText = entry.tags.join(', ');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const splitTags = pdf.splitTextToSize(tagsText, 170);
      pdf.text(splitTags, 20, yPosition);
      yPosition += (splitTags.length * 5) + 10;
    }

    // Reflexões (se disponível)
    if (entry.journal_text) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reflexões', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const splitText = pdf.splitTextToSize(entry.journal_text, 170);
      
      // Verificar se precisa de nova página
      if (yPosition + (splitText.length * 5) > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(splitText, 20, yPosition);
      yPosition += (splitText.length * 5) + 15;
    }
  }

  // Estatísticas (se disponível e habilitado)
  if (stats && includeStats) {
    // Verificar se precisa de nova página
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Estatísticas Gerais', 20, yPosition);
    yPosition += 15;

    const statsData = [
      { label: 'Total de entradas', value: stats.totalEntries },
      { label: 'Humor médio', value: `${stats.avgMood}/10` },
      { label: 'Energia média', value: `${stats.avgEnergy}/5` },
      { label: 'Ansiedade média', value: `${stats.avgAnxiety}/5` }
    ];

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    statsData.forEach(stat => {
      pdf.text(`${stat.label}: ${stat.value}`, 20, yPosition);
      yPosition += 8;
    });
  }

  // Rodapé
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text('Gerado por AloPsi - Plataforma de Bem-estar Emocional', 20, 285);
    pdf.text(`Página ${i} de ${pageCount}`, 180, 285);
    pdf.text('Para mais informações, visite: alopsi.com.br', 20, 290);
  }

  return pdf;
};

export const downloadPDF = (pdf: jsPDF, filename: string = 'diario-emocional') => {
  const timestamp = getTodayLocalDateString();
  pdf.save(`${filename}-${timestamp}.pdf`);
};