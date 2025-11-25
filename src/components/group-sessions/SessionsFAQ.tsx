import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Os encontros são gratuitos?",
    answer: "Sim! Todos os encontros em grupo são 100% gratuitos. Nossa missão é tornar o suporte emocional acessível para todos."
  },
  {
    question: "Preciso ligar a câmera?",
    answer: "Não é obrigatório! Você pode participar apenas com áudio se preferir. Respeitamos sua privacidade e conforto."
  },
  {
    question: "Posso participar de mais de um encontro?",
    answer: "Com certeza! Você pode se inscrever em quantos encontros quiser. Cada sessão aborda um tema diferente."
  },
  {
    question: "Como recebo o link do Google Meet?",
    answer: "Após se inscrever, você receberá um email de confirmação com o link do Google Meet e um lembrete 24h antes do encontro."
  },
  {
    question: "E se eu perder o encontro?",
    answer: "Não se preocupe! Você pode se inscrever em outro encontro sobre o mesmo tema ou temas relacionados quando disponível."
  },
  {
    question: "Os encontros são sigilosos?",
    answer: "Sim! Todos os participantes concordam em manter sigilo sobre o que é compartilhado. É um espaço seguro e acolhedor."
  },
  {
    question: "Posso convidar alguém?",
    answer: "Sim! Compartilhe o link do encontro com amigos ou familiares. Cada pessoa deve fazer sua própria inscrição."
  },
  {
    question: "Há certificado de participação?",
    answer: "Não emitimos certificados. Os encontros são focados em acolhimento e troca de experiências, não em certificação."
  }
];

export const SessionsFAQ = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre os encontros em grupo
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-foreground">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};