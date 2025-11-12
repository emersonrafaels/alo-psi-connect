import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Briefcase, Calendar } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { format } from 'date-fns';

export default function InstitutionProfessionals() {
  const { linkedProfessionals, isLoading } = useInstitutionAccess();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredProfessionals = linkedProfessionals.filter(p =>
    p.profissionais.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profissionais.profissao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Profissionais da Instituição</h1>
        <p className="text-muted-foreground mt-2">
          {linkedProfessionals.length} profissionais vinculados
        </p>
      </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou profissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Profissionais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfessionals.map((prof) => (
          <Card key={prof.professional_id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={prof.profissionais.foto_perfil_url || ''} />
                  <AvatarFallback>
                    {prof.profissionais.display_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {prof.profissionais.display_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {prof.profissionais.profissao}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{prof.profissionais.user_email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{prof.relationship_type}</Badge>
              </div>

              {prof.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Desde {format(new Date(prof.start_date), 'MM/yyyy')}</span>
                </div>
              )}

              <Badge variant={prof.profissionais.ativo ? 'default' : 'secondary'}>
                {prof.profissionais.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfessionals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum profissional encontrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}
