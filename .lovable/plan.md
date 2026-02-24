

## Corrigir emojis invertidos no slider de Estresse

### Problema

Na tabela `default_emotion_types`, o campo `default_emoji_set` do tipo "stress" esta com os emojis invertidos:

| Valor | Atual (errado) | Correto |
|-------|----------------|---------|
| 1 | 😓 (estressado) | 🧘 (relaxado) |
| 2 | 😥 (ansioso) | 😌 (calmo) |
| 3 | 😐 (neutro) | 😐 (neutro) |
| 4 | 😌 (calmo) | 😥 (ansioso) |
| 5 | 🧘 (relaxado) | 😓 (estressado) |

O esquema de cores ja esta correto (1=verde/baixo, 5=vermelho/alto), mas os emojis comunicam o oposto.

### Correcao

Executar um UPDATE no banco de dados para inverter o emoji_set do tipo "stress":

```sql
UPDATE default_emotion_types
SET default_emoji_set = '{"1":"🧘","2":"😌","3":"😐","4":"😥","5":"😓"}'
WHERE emotion_type = 'stress';
```

Tambem verificar e corrigir os registros de configuracao dos usuarios que ja possuem o stress configurado (tabela de configs de emocoes do usuario), para que herdem a correcao.

### Escopo

- Correcao direta no banco de dados (1 UPDATE)
- Verificar configs de usuarios existentes para aplicar a mesma correcao
- Nenhum arquivo de codigo precisa ser alterado (o componente `DynamicEmotionSlider` le os emojis do banco)

