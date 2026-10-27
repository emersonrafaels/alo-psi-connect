import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { PortalPageShell } from '@/features/institution/portal/PortalPageShell';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { Inbox } from '@/features/messaging/Inbox';
import { Composer } from '@/features/messaging/Composer';
import { LogoLoader } from '@/components/ui/logo-loader';

export default function InstitutionMessages() {
  const { userInstitutions, isLoading } = useInstitutionAccess() as any;
  const institutionId = userInstitutions?.[0]?.institution_id as string | undefined;
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PortalPageShell>
        <div className="space-y-6 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Mensagens</h1>
              <p className="text-sm text-muted-foreground">Envie comunicados aos alunos e acompanhe as respostas. Alunos aparecem como "Aluno" até responderem.</p>
            </div>
            <Button onClick={() => setOpen(true)} disabled={!institutionId}><MessageSquarePlus className="mr-2 h-4 w-4" />Nova mensagem</Button>
          </div>
          {isLoading ? <LogoLoader /> : <Inbox />}
          {institutionId && <Composer mode="institution" institutionId={institutionId} open={open} onOpenChange={setOpen} />}
        </div>
      </PortalPageShell>
      <Footer />
    </div>
  );
}
