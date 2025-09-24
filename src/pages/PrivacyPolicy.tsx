import Header from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Lock, User, Calendar, Database, Eye, FileText } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
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
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">1. Introdução</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  A Alô, Psi! ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. 
                  Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos 
                  suas informações quando você utiliza nossa plataforma de agendamento de consultas 
                  psicológicas online.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">2. Informações que Coletamos</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dados Pessoais
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                      <li>Nome completo, e-mail, telefone</li>
                      <li>Data de nascimento e informações demográficas</li>
                      <li>Informações de cadastro profissional (para psicólogos)</li>
                      <li>Dados bancários para pagamentos (processados via MercadoPago)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dados de Agendamento
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                      <li>Histórico de consultas e agendamentos</li>
                      <li>Preferências de horário e profissional</li>
                      <li>Dados de sincronização com Google Calendar (quando autorizado)</li>
                      <li>Informações sobre cancelamentos e reagendamentos</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">3. Como Usamos suas Informações</h2>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Facilitar o agendamento e gerenciamento de consultas</li>
                  <li>Conectar pacientes aos profissionais adequados</li>
                  <li>Processar pagamentos de forma segura</li>
                  <li>Sincronizar com sua agenda do Google Calendar (com sua permissão)</li>
                  <li>Enviar notificações sobre consultas e lembretes</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Compartilhamos suas informações apenas nas seguintes situações:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Com profissionais de saúde para consultas agendadas</li>
                  <li>Com provedores de serviços (Supabase, MercadoPago, Google)</li>
                  <li>Quando exigido por lei ou autoridades competentes</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">5. Segurança dos Dados</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos medidas de segurança técnicas e organizacionais apropriadas para proteger 
                  suas informações, incluindo criptografia, controles de acesso e monitoramento contínuo. 
                  Nossos dados são hospedados na Supabase com infraestrutura em conformidade com padrões 
                  internacionais de segurança.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">6. Seus Direitos (LGPD)</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                  <li>Exclusão de dados pessoais desnecessários ou tratados inadequadamente</li>
                  <li>Portabilidade dos dados para outro provedor</li>
                  <li>Revogação do consentimento</li>
                  <li>Informações sobre compartilhamento de dados</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">7. Integração com Google Calendar</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Quando você autoriza a sincronização com o Google Calendar, acessamos apenas as 
                  informações necessárias para exibir sua disponibilidade e criar eventos de consulta. 
                  Você pode revogar este acesso a qualquer momento através das configurações de sua conta 
                  Google ou entrando em contato conosco.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">8. Contato</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, 
                  entre em contato conosco:
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Alô, Psi!</p>
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

export default PrivacyPolicy;