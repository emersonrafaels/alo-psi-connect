import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Tag, Award, User } from 'lucide-react';
import { useBlogTags } from '@/hooks/useBlogTags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsFiltersProps {
  dateRange: number;
  onDateRangeChange: (range: number) => void;
  selectedTag?: string;
  onTagChange?: (tag: string | undefined) => void;
  selectedStatus?: 'all' | 'featured' | 'normal';
  onStatusChange?: (status: 'all' | 'featured' | 'normal') => void;
  selectedAuthor?: string;
  onAuthorChange?: (author: string | undefined) => void;
}

export const AnalyticsFilters = ({ 
  dateRange, 
  onDateRangeChange,
  selectedTag,
  onTagChange,
  selectedStatus = 'all',
  onStatusChange,
  selectedAuthor,
  onAuthorChange
}: AnalyticsFiltersProps) => {
  const { data: tags } = useBlogTags();
  const { user } = useAuth();
  
  // Fetch authors for admin filter
  const { data: authors } = useQuery({
    queryKey: ['blog-authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          author_id,
          author:profiles!blog_posts_author_id_fkey(nome)
        `)
        .not('author_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique authors
      const uniqueAuthors = Array.from(
        new Map(data?.map(p => [p.author_id, p.author]) || []).entries()
      ).map(([id, author]: [string, any]) => ({
        id,
        name: author?.nome || 'Administrador do Sistema'
      }));
      
      return uniqueAuthors;
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={dateRange.toString()} onValueChange={(v) => onDateRangeChange(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag Filter */}
      {onTagChange && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedTag || 'all'} onValueChange={(v) => onTagChange(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tags?.map(tag => (
                <SelectItem key={tag.id} value={tag.slug}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status Filter */}
      {onStatusChange && (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedStatus} onValueChange={(v) => onStatusChange(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os posts</SelectItem>
              <SelectItem value="featured">Posts em destaque</SelectItem>
              <SelectItem value="normal">Posts normais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Author Filter (for admins) */}
      {onAuthorChange && authors && authors.length > 0 && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedAuthor || 'all'} onValueChange={(v) => onAuthorChange(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os autores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os autores</SelectItem>
              {authors.map(author => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
