# Ocultar o botão "Ver Perfil" dos cards de profissionais na homepage

## Contexto
Na homepage, a seção "Profissionais que acolhem com presença" exibe cards dos profissionais, cada um com um botão "Ver Perfil" no canto inferior que leva à página do profissional. O usuário quer ocultar esse botão.

## Alteração
No arquivo `src/components/home/HomeRedeBemEstar.tsx`, remover o botão "Ver Perfil" (linhas 872-878) dos cards de profissionais na homepage, mantendo o restante do card (foto, nome, profissão, CRP/CRM e especialidades) intacto.

```tsx
// Remover:
<button
  onClick={() => goToProfessional(p.id)}
  className="px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105"
  style={{ background: "var(--rbe-primary-container)", color: "var(--rbe-on-primary)" }}
>
  Ver Perfil <ArrowUpRight className="w-3.5 h-3.5 inline ml-1" />
</button>
```

O container `div.mt-auto` (linha 866) será ajustado para não ficar vazio caso só exista o preço, mantendo o layout balanceado.

## Escopo
- Apenas a homepage. Outras páginas (Professionals, Schedule, etc.) não são afetadas.
