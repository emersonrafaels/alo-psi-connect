# Botão "Voltar ao Meu espaço" na Triagem

Quando a Coordenação clínica (ou Admin RBE) entra na Triagem do portal a partir do Meu espaço, o menu lateral passa a mostrar dois botões no rodapé:

- Voltar ao Portal Institucional (como hoje)
- Voltar ao Meu espaço (novo, logo abaixo, com ícone de casa)

Gestores da própria instituição continuam vendo só o botão atual.

## Detalhes técnicos
- `src/pages/institution/InstitutionTriage.tsx`: no rodapé da sidebar, renderizar um segundo `Link to="/meu-espaco"` quando `isStaffPortalView()` (de `useInstitutionAccess`) for verdadeiro; mesmo estilo e comportamento recolhido (só ícone + title).
