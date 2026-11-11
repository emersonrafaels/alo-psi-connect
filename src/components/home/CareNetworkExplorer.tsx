import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Heart, Smartphone, Users, Building2, Check } from "lucide-react";
const services = [
  {
    Icon: Heart, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
    title: "Cuidado individual",
    description: "Um espaço de escuta e acolhimento para cuidar de você.",
    items: ["Atendimentos psicológicos", "Atendimentos psiquiátricos", "Encaminhamento para suporte adequado", "Acolhimento com olhar humano e especializado"],
  },
  {
    Icon: Smartphone, color: "var(--rbe-brand-pink)", textOnIcon: "#fff",
    title: "Ferramentas para o aluno",
    description: "Pequenos cuidados que acompanham o seu dia a dia.",
    items: ["Diário Emocional", "Buddy, companheiro digital de acompanhamento", "Check-ins de humor, energia e ansiedade", "Ferramentas de autorregulação", "Trilhas e conteúdos de bem-estar", "Escalas e testes de acompanhamento emocional", "Agenda Solidária"],
  },
  {
    Icon: Users, color: "var(--rbe-brand-mint)", textOnIcon: "var(--rbe-primary)",
    title: "Experiências coletivas",
    description: "Encontros que aproximam e fortalecem a vida em comunidade.",
    items: ["Grupos temáticos", "Rodas de conversa", "Workshops", "Palestras e ações de conscientização", "Ativações em campus e programas especiais"],
  },
  {
    Icon: Building2, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
    title: "Soluções para instituições",
    description: "Informação e parceria para uma universidade que cuida.",
    items: ["Dashboard com dados agregados e anônimos", "Diário Emocional com visão institucional", "ISEU-RBE, índice semestral de equilíbrio universitário", "Relatórios estratégicos e reuniões de acompanhamento", "Personalização white-label", "Apoio à permanência, clima institucional e prevenção"],
  },
];
export default function CareNetworkExplorer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(services[0].title);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .35 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      preference.removeEventListener("change", updatePreference);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (paused || hovered || focused || !visible || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive(current => services[(services.findIndex(service => service.title === current) + 1) % services.length].title);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, visible, reducedMotion]);

  return (
    <Tabs.Root ref={rootRef} value={active} onValueChange={value => { setActive(value); setPaused(true); }} orientation="horizontal" className="rbe-care-explorer"
      data-playing={!paused && !hovered && !focused && visible && !reducedMotion}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <Tabs.List className="rbe-care-nav" aria-label="Formas de cuidar">
        {services.map(({ title, Icon, color }) => (
          <Tabs.Trigger key={title} value={title} className="rbe-care-tab" style={{ "--care-accent": color } as CSSProperties}>
            <Icon size={20} aria-hidden="true" />
            <span>{title}</span>
            <span className="rbe-care-progress" aria-hidden="true" />
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div className="rbe-care-stage">
        {services.map(({ title, Icon, items, description, color }) => (
          <Tabs.Content key={title} value={title} forceMount className="rbe-care-content" style={{ "--care-accent": color } as CSSProperties}>
            <div className="rbe-care-summary">
              <Icon size={36} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p className="rbe-care-description">{description}</p>
            </div>
            <ul>{items.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}
