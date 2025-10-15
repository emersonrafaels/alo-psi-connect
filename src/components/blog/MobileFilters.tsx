import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { BlogTag } from "@/hooks/useBlogTags";

interface MobileFiltersProps {
  allTags: BlogTag[];
  selectedTag: string | null;
  onTagSelect: (slug: string | null) => void;
}

export const MobileFilters = ({ allTags, selectedTag, onTagSelect }: MobileFiltersProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 lg:hidden">
          <Filter className="h-4 w-4" />
          Filtros
          {selectedTag && (
            <Badge variant="default" className="ml-1 h-5 px-1.5">
              1
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtrar por Tag</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedTag === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => onTagSelect(null)}
            >
              Todas
            </Badge>
            {allTags.map((tag) => (
              <Badge 
                key={tag.id} 
                variant={selectedTag === tag.slug ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => onTagSelect(tag.slug)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          {selectedTag && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onTagSelect(null)}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
