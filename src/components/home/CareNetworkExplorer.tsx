import * as Tabs from "@radix-ui/react-tabs";
import { Heart, Smartphone, Users, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
const services = [
  {
    Icon: Heart, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
    title: "Cuidado individual",
    items: ["Atendimentos psicológicos", "Atendimentos psiquiátricos", "Encaminhamento para suporte adequado", "Acolhimento com olhar humano e especializado"],
  },
  {
    Icon: Smartphone, color: "var(--rbe-brand-pink)", textOnIcon: "#fff",
    title: "Ferramentas para o aluno",
    items: ["Diário Emocional", "Buddy, companheiro digital de acompanhamento", "Check-ins de humor, energia e ansiedade", "Ferramentas de autorregulação", "Trilhas e conteúdos de bem-estar", "Escalas e testes de acompanhamento emocional", "Agenda Solidária"],
  },
  {
    Icon: Users, color: "var(--rbe-brand-mint)", textOnIcon: "var(--rbe-primary)",
    title: "Experiências coletivas",
    items: ["Grupos temáticos", "Rodas de conversa", "Workshops", "Palestras e ações de conscientização", "Ativações em campus e programas especiais"],
  },
  {
    Icon: Building2, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
    title: "Soluções para instituições",
    items: ["Dashboard com dados agregados e anônimos", "Diário Emocional com visão institucional", "ISEU-RBE, índice semestral de equilíbrio universitário", "Relatórios estratégicos e reuniões de acompanhamento", "Personalização white-label", "Apoio à permanência, clima institucional e prevenção"],
  },
];
export default function CareNetworkExplorer() {
  return (
    <Tabs.Root defaultValue={services[0].title} orientation="vertical" className="rbe-care-explorer">
      <Tabs.List className="rbe-care-nav" aria-label="Formas de cuidar">
        {services.map(({ title, Icon, color, textOnIcon }) => (
          <Tabs.Trigger key={title} value={title} className="rbe-care-tab">
            <span className="rbe-care-tab-icon" style={{ background: color, color: textOnIcon }}><Icon size={22} aria-hidden="true" /></span>
            <span>{title}</span><ArrowRight className="rbe-care-arrow" size={20} aria-hidden="true" />
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div className="rbe-care-stage">
        {services.map(({ title, Icon, items }) => (
          <Tabs.Content key={title} value={title} className="rbe-care-content">
            <Icon className="rbe-care-watermark" aria-hidden="true" strokeWidth={.7} />
            <h3>{title}</h3>
            <ul>{items.map(item => <li key={item}><CheckCircle2 size={18} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}
