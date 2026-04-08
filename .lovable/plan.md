

## Tornar foto obrigatória no cadastro profissional

### O que muda
A foto de perfil (Step 3) deixa de ser opcional e passa a ser obrigatória para avançar no cadastro.

### Alterações em `src/pages/register/ProfessionalForm.tsx`

1. **Validação do Step 3** — Alterar `canProceedStep3` de `true` para verificar se há foto selecionada (arquivo local ou URL do Google):
   ```
   canProceedStep3 = !!(selectedPhotoFile || photoPreviewUrl || formData.fotoPerfilUrl)
   ```

2. **Indicador visual** — Adicionar marcador de obrigatório (`*`) no label/texto do Step 3, e uma mensagem de aviso caso o usuário tente avançar sem foto.

3. **Texto de orientação** — Atualizar o texto descritivo de "Adicione uma foto..." para indicar que é obrigatório (ex: "A foto de perfil é obrigatória para o cadastro").

