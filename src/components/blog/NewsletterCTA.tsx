import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useNewsletter } from '@/hooks/useNewsletter';

export const NewsletterCTA = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { subscribe, isLoading } = useNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const success = await subscribe({ email });
      if (success) {
        setEmail('');
        setSubscribed(true);
      }
    }
  };

  if (subscribed) {
    return (
      <Card className="p-8 my-8 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-center gap-3 text-primary">
          <CheckCircle2 className="h-6 w-6" />
          <p className="font-medium">Obrigado por se inscrever!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 my-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Receba conteúdo exclusivo</h3>
        <p className="text-muted-foreground mb-6">
          Inscreva-se na nossa newsletter e receba artigos sobre saúde emocional diretamente no seu e-mail.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Inscrever'}
          </Button>
        </form>
      </div>
    </Card>
  );
};
