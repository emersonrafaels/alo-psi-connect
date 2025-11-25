import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

export const SessionsCTASection = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const handleNewsletterSignup = () => {
    // Scroll to newsletter section or redirect to a newsletter page
    const newsletterSection = document.getElementById('newsletter-section');
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If no newsletter section exists, could open a modal or redirect
      console.log('Newsletter signup requested');
    }
  };

  const handleSuggestTheme = () => {
    navigate(buildTenantPath(tenant?.slug || 'alopsi', '/contato'));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground text-xs font-bold">!</span>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Não perca nenhum encontro!
              </h3>
              <p className="text-muted-foreground text-lg">
                Receba novidades sobre os próximos temas e horários diretamente no seu email, 
                ou sugira um assunto que você gostaria de conversar.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleNewsletterSignup}
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 min-w-[200px]"
              >
                <Mail className="w-5 h-5" />
                Quero ser avisado
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleSuggestTheme}
                className="gap-2 border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:scale-105 transition-all duration-200 min-w-[200px]"
              >
                <Sparkles className="w-5 h-5 text-primary" />
                Sugerir um tema
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};