
## Remover opção "Quero atender" da página de tipo de usuário

### Alteração
Em `src/pages/register/UserType.tsx`, remover o segundo `Card` ("Quero atender" / "Continuar como Profissional") e manter apenas o card "Quero ser atendido". Ajustar o layout para centralizar o card único (remover grid de 2 colunas).

### Arquivo impactado
- `src/pages/register/UserType.tsx` — remover card profissional, ajustar layout para card único centralizado (`max-w-md mx-auto` em vez de `grid md:grid-cols-2`)
