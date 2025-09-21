import { memo } from 'react';

interface FormattedInsightTextProps {
  text: string;
  className?: string;
}

export const FormattedInsightText = memo(({ text, className }: FormattedInsightTextProps) => {
  // Function to format the text with basic markdown-like styling
  const formatText = (content: string) => {
    // Split by double line breaks to create paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check if it's a heading (starts with ## or **Title**)
      if (paragraph.startsWith('##') || (paragraph.startsWith('**') && paragraph.includes('**') && paragraph.split('**').length <= 3)) {
        const cleanTitle = paragraph.replace(/^##\s*/, '').replace(/^\*\*(.*)\*\*/, '$1').trim();
        return (
          <h4 key={index} className="font-semibold text-sm mb-2 text-primary">
            {cleanTitle}
          </h4>
        );
      }
      
      // Process inline formatting within paragraphs
      const formattedParagraph = paragraph.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          return (
            <strong key={partIndex} className="font-medium text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
      
      // Check if it's a list item
      if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ')) {
        const items = paragraph.split('\n').filter(item => item.trim().startsWith('- ') || item.trim().startsWith('• '));
        if (items.length > 1) {
          return (
            <ul key={index} className="list-disc list-inside space-y-1 text-sm mb-3 ml-2">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-muted-foreground">
                  {item.replace(/^[•-]\s*/, '').trim()}
                </li>
              ))}
            </ul>
          );
        }
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-sm text-muted-foreground leading-relaxed mb-3">
          {formattedParagraph}
        </p>
      );
    });
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {formatText(text)}
    </div>
  );
});