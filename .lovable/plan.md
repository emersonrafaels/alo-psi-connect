## Alteração

Em `src/pages/buddy/BuddyPrivacy.tsx`, remover a dependência de `filled` para habilitar os controles de privacidade — o usuário poderá pré-configurar suas preferências antes mesmo de ter conteúdo no retrato.

1. **Switches "Compartilhar com psicólogo/psiquiatra"**: remover `disabled={!filled}`.
2. **Botão "Guardar só para mim"**: remover `disabled` e a classe `opacity-40 cursor-not-allowed`.
3. **Botão "Remover"**: manter desabilitado quando `!filled` (não faz sentido remover algo que não existe).
4. **Legenda "Sem conteúdo preenchido ainda"**: trocar por "Sem conteúdo ainda — preferência será aplicada quando você preencher" para deixar claro que a escolha ficará pré-configurada.

Preferências continuam sendo persistidas em `buddy_privacy_preferences` normalmente.