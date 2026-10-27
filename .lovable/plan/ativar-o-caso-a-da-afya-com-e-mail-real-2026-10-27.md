# Ativar o Caso A da Afya com e-mail real

## O que muda
1. **Caso A ganha acesso real**: o e-mail informado passa a ser o login do Caso A. A conta já fica confirmada e o aluno entra direto, sem precisar validar o e-mail.
2. **Nome realista**: o Caso A passa a se chamar **Mariana Costa Ribeiro**. O nome aparece no perfil dela, mas o portal institucional continua mostrando apenas "Aluno #N".
3. **E-mails normais**: o Caso A deixa de estar bloqueado e passa a receber os e-mails da plataforma (mensagens, avisos e triagem), como qualquer aluno. Os casos B–F continuam bloqueados.
4. **Painel Admin → Dados Demo**: cada caso ganha uma chave "Receber e-mails" e um campo de nome. Assim os próximos e-mails que você enviar podem ser ativados lá mesmo, sem expor a senha no chat.
5. **Regra da senha**: hoje a senha precisa ter uma letra maiúscula, e a que você enviou não tem nenhuma. A regra passa a aceitar no mínimo 12 caracteres com letras e números, e a maiúscula deixa de ser obrigatória. A senha informada passa a ser aceita.

## Segurança
- Recomendo trocar essa senha depois do primeiro acesso, porque ela foi escrita no chat.
- O histórico do Caso A continua sintético. Só os e-mails passam a ser enviados de verdade.

## Detalhes técnicos
- `afya-study-cases`: incluir na ação `assign` os campos opcionais `name` e `notificationsEnabled`. A ação passa a atualizar `profiles.nome`, `pacientes.nome` e os metadados de auth, e a gravar `synthetic_student_cases.notifications_blocked = !notificationsEnabled`. A validação da senha fica em `min(12)` com letra e número.
- `isStudyNotificationBlocked` já lê `notifications_blocked`, então não muda.
- O formulário de Admin → Dados Demo ganha os campos de nome e "Receber e-mails".
- Executar `assign` para o caso A com o e-mail e a senha informados, `name` "Mariana Costa Ribeiro" e `notificationsEnabled: true`. Depois, confirmar o login pela autenticação.
