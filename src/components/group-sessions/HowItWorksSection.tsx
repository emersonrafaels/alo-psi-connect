import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, UserCheck, Mail, Video } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    number: "1",
    title: "Escolha o tema",
    description: "Navegue pelos encontros disponíveis e escolha o tema que mais te interessa"
  },
  {
    icon: UserCheck,
    number: "2",
    title: "Inscreva-se",
    description: "Confirme sua presença com apenas um clique. É rápido e gratuito!"
  },
  {
    icon: Mail,
    number: "3",
    title: "Receba o link",
    description: "Você receberá um email com o link do Google Meet e instruções"
  },
  {
    icon: Video,
    number: "4",
    title: "Participe",
    description: "Entre no horário marcado e participe de uma conversa acolhedora e transformadora"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Como Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participar de um encontro é simples e acessível. Veja como funciona:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {step.number}
                    </div>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-primary/30">
                      →
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};