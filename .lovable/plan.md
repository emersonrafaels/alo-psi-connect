## Problema

Ao clicar em **Salvar Contatos** na aba Saúde & Emergência do perfil, nada acontece — nem sucesso, nem erro. A causa provável está em `src/pages/Profile.tsx` na função `saveEmergencyContacts`:

1. `if (!patientData?.id) return;` — sai silenciosamente sem avisar o usuário quando o id do paciente ainda não carregou (ou o usuário não tem registro em `pacientes`).
2. O `delete` no Supabase não checa erro (falha silenciosa por RLS, por exemplo).
3. Se todos os contatos estiverem inválidos (faltando nome/relação/telefone), o botão executa mas não dá retorno claro.

## Correções em `src/pages/Profile.tsx` (`saveEmergencyContacts`)

- Se `patientData?.id` estiver ausente → mostrar toast destrutivo "Não foi possível identificar seu cadastro de paciente" e retornar.
- Validar antes de tudo se há pelo menos 1 contato com nome + relação + telefone preenchidos; senão toast destrutivo "Preencha nome, relação e telefone de pelo menos um contato".
- Capturar erro do `delete` (`{ error: deleteError }`) e lançar caso ocorra.
- No `catch`, incluir `error?.message` na descrição do toast para facilitar diagnóstico.
- Logar `console.error` no catch para deixar rastro nos logs.

Nada mais é alterado — mesmo layout, mesmo fluxo, apenas feedback correto via toast (`useToast`, já importado).
