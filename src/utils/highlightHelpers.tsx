import React from 'react';

export const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-primary/20 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export const getRelevanceScore = (post: any, searchTerm: string): number => {
  if (!searchTerm) return 0;
  
  const term = searchTerm.toLowerCase();
  let score = 0;
  
  // Título tem maior peso
  if (post.title?.toLowerCase().includes(term)) {
    score += 10;
  }
  
  // Tags têm peso médio
  const tagMatch = post.tags?.some((tag: any) => 
    tag.name?.toLowerCase().includes(term)
  );
  if (tagMatch) score += 5;
  
  // Excerpt tem peso médio-baixo
  if (post.excerpt?.toLowerCase().includes(term)) {
    score += 3;
  }
  
  // Conteúdo tem menor peso
  if (post.content?.toLowerCase().includes(term)) {
    score += 1;
  }
  
  return score;
};
