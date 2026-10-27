import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Inbox } from '@/features/messaging/Inbox';
import { Composer } from '@/features/messaging/Composer';
import { LogoLoader } from '@/components/ui/logo-loader';

export default function Messages() {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <LogoLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mensagens</h1>
            <p className="text-sm text-muted-foreground">Comunicados e conversas com a Rede Bem-Estar e sua instituição.</p>
          </div>
          {isAdmin && <Button onClick={() => setOpen(true)}><MessageSquarePlus className="mr-2 h-4 w-4" />Nova mensagem</Button>}
        </div>
        <Inbox />
        {isAdmin && <Composer mode="admin" open={open} onOpenChange={setOpen} />}
      </main>
      <Footer />
    </div>
  );
}
