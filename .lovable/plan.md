

## Tornar Telefone obrigatório no Contato de Emergência

### Alteração

**`src/pages/register/PatientForm.tsx`** (linha 908-910) — Mudar a validação de `(c.telefone || c.email)` para `c.telefone` (telefone passa a ser obrigatório, email continua opcional):

```typescript
const canProceedStepEmergency = contatosEmergencia.some(c => 
  c.nome && c.relacao && (c.relacao !== 'outro' || c.relacaoOutro) && c.telefone
);
```

Também atualizar o label/placeholder do campo telefone no formulário para indicar que é obrigatório (adicionar asterisco ou indicador visual).

