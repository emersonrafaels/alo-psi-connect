import { Badge } from "@/components/ui/badge";

interface SessionTagBadgesProps {
  tags: string[];
  maxVisible?: number;
}

export const SessionTagBadges = ({ tags, maxVisible = 3 }: SessionTagBadgesProps) => {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((tag, index) => (
        <Badge 
          key={index} 
          variant="secondary"
          className="text-xs"
        >
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};