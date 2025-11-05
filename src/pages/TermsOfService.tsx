import Header from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, CreditCard, Shield, AlertCircle, Scale, UserCheck } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Termos de Serviço</h1>
          </div>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">1. Definições e Escopo</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estes Termos de Serviço ("Termos") regem o uso da plataforma Rede Bem Estar 
                  ("Plataforma"), operada pela empresa Rede Bem Estar ("nós", "nosso" ou "Empresa").
                </p>
                <div className="space-y-2">
                  <p className="text-muted-foreground"><strong>Usuário:</strong> Qualquer pessoa que acesse ou utilize a Plataforma</p>
                  <p className="text-muted-foreground"><strong>Paciente:</strong> Usuário que busca serviços de psicologia</p>
                  <p className="text-muted-foreground"><strong>Profissional:</strong> Psicólogo cadastrado que oferece serviços</p>
                  <p className="text-muted-foreground"><strong>Serviços:</strong> Agendamento e realização de consultas psicológicas</p>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">2. Cadastro e Responsabilidades do Usuário</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Cadastro</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Informações verdadeiras, precisas e atualizadas</li>
                      <li>Idade mínima de 18 anos ou consentimento dos responsáveis</li>
                      <li>Manutenção da confidencialidade de dados de acesso</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Responsabilidades</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Uso adequado e legal da Plataforma</li>
                      <li>Respeito aos profissionais e outros usuários</li>
                      <li>Comparecimento às consultas agendadas</li>
                      <li>Comunicação de cancelamentos com antecedência</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">3. Uso da Plataforma</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Agendamentos</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Agendamentos sujeitos à disponibilidade dos profissionais</li>
                      <li>Confirmação automática ou manual conforme configuração</li>
                      <li>Possibilidade de reagendamento conforme política individual</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Cancelamentos</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Cancelamento gratuito com até 24h de antecedência</li>
                      <li>Cancelamentos tardios podem incorrer em taxas</li>
                      <li>Faltas não justificadas podem resultar em cobrança integral</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">4. Pagamentos e Reembolsos</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Formas de Pagamento</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Pagamentos processados via MercadoPago</li>
                      <li>Cartão de crédito, débito e PIX aceitos</li>
                      <li>Preços definidos pelos profissionais individuais</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Política de Reembolso</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Reembolso integral para cancelamentos até 24h antes</li>
                      <li>Reembolso parcial para cancelamentos entre 12-24h</li>
                      <li>Sem reembolso para cancelamentos com menos de 12h</li>
                      <li>Exceções em casos de emergência médica comprovada</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">5. Responsabilidades dos Profissionais</h2>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Registro válido no Conselho Regional de Psicologia (CRP)</li>
                  <li>Manutenção da confidencialidade e sigilo profissional</li>
                  <li>Cumprimento do Código de Ética da Psicologia</li>
                  <li>Pontualidade e profissionalismo nas consultas</li>
                  <li>Comunicação adequada sobre disponibilidade</li>
                  <li>Responsabilidade pelos atendimentos realizados</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">6. Limitações de Responsabilidade</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    A Rede Bem Estar é uma plataforma de intermediação e não se responsabiliza por:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Qualidade dos serviços prestados pelos profissionais</li>
                    <li>Resultados terapêuticos ou diagnósticos</li>
                    <li>Condutas inadequadas de usuários ou profissionais</li>
                    <li>Interrupções técnicas ou indisponibilidade temporária</li>
                    <li>Perdas ou danos decorrentes do uso da plataforma</li>
                  </ul>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm">
                      <strong>Importante:</strong> Em situações de emergência psiquiátrica, 
                      procure atendimento presencial imediato ou ligue para o SAMU (192) 
                      ou CVV (188).
                    </p>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">7. Propriedade Intelectual</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Todo o conteúdo da Plataforma, incluindo textos, imagens, logos, códigos e 
                  funcionalidades, é de propriedade da Rede Bem Estar ou de terceiros licenciadores. 
                  É proibida a reprodução, distribuição ou uso comercial sem autorização expressa.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">8. Modificações dos Termos</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
                  Alterações significativas serão comunicadas com 30 dias de antecedência. 
                  O uso continuado da Plataforma após as alterações constitui aceitação 
                  dos novos termos.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">9. Lei Aplicável e Jurisdição</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos são regidos pelas leis brasileiras. Quaisquer disputas serão 
                  resolvidas preferencialmente por mediação ou arbitragem. Em último caso, 
                  será competente o foro da Comarca de São Paulo - SP.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">10. Contato</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para dúvidas sobre estes Termos de Serviço:
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">Rede Bem Estar</p>
                  <p className="text-muted-foreground">E-mail: alopsi.host@gmail.com</p>
                  <p className="text-muted-foreground">Telefone: (11) 97587-2447</p>
                  <p className="text-muted-foreground">
                    Endereço: R. Joaquim Távora, 1240 - Vila Mariana, São Paulo - SP
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;