
## Plano: Criar Dados Demo para UNICAMP

### Contexto

A UNICAMP (Universidade Estadual de Campinas) já existe no banco de dados com ID `d06b3a18-efef-478a-84cb-bbaa5e8ddd36` e tipo `public`, mas está **completamente vazia**:
- 0 profissionais
- 0 estudantes  
- 0 administradores
- 0 cupons

Vou criar uma Edge Function dedicada para popular a UNICAMP com dados demo semelhantes ao Instituto de Psicologia Aplicada São Paulo (IPSP), apenas com nomes diferentes.

---

### Dados a Serem Criados

#### 1. Profissionais (4 profissionais)

| Nome | Profissão | CRP | Preço | Especialidades | Vínculo |
|------|-----------|-----|-------|----------------|---------|
| Dra. Camila Andrade Ribeiro | Psicóloga Clínica | CRP 06/112233 | R$ 150 | TCC, Ansiedade, Depressão | partner |
| Dr. Thiago Nascimento Costa | Psicólogo | CRP 06/223344 | R$ 140 | Psicanálise, Trauma, Luto | partner |
| Amanda Cristina Melo | Estudante de Psicologia | CRP 06/334455 | R$ 80 | Atendimento Supervisionado | partner |
| Dr. Marcos Vinicius Prado | Psicólogo Clínico | CRP 06/445566 | R$ 180 | Neuropsicologia, TDAH | employee |

#### 2. Estudantes (10 estudantes)

| Nome | Email | Status |
|------|-------|--------|
| Laura Fernandes Dias | laura.fernandes@unicamp.edu.br | enrolled |
| Bruno Almeida Torres | bruno.almeida@unicamp.edu.br | enrolled |
| Bianca Rodrigues Lima | bianca.rodrigues@unicamp.edu.br | enrolled |
| Caio Henrique Souza | caio.henrique@unicamp.edu.br | enrolled |
| Leticia Martins Pereira | leticia.martins@unicamp.edu.br | enrolled |
| Gustavo Costa Moreira | gustavo.costa@unicamp.edu.br | enrolled |
| Fernanda Oliveira Santos | fernanda.oliveira@unicamp.edu.br | graduated |
| Leonardo Carvalho Nunes | leonardo.carvalho@unicamp.edu.br | enrolled |
| Raquel Sousa Freitas | raquel.sousa@unicamp.edu.br | enrolled |
| Vitor Barbosa Gomes | vitor.barbosa@unicamp.edu.br | inactive |

#### 3. Cupons Promocionais (6 cupons)

| Código | Desconto | Tipo | Público-Alvo |
|--------|----------|------|--------------|
| UNICAMP-BOAS-VINDAS-RBE | 20% | percentage | Estudantes da instituição |
| UNICAMP-PRIMEIRA-SESSAO-RBE | R$ 40 | fixed_amount | Todos |
| UNICAMP-ESTUDANTE-RBE | 25% | percentage | Estudantes da instituição |
| UNICAMP-BOAS-VINDAS-MEDCOS | 20% | percentage | Estudantes da instituição |
| UNICAMP-ESTUDANTE-MEDCOS | 25% | percentage | Estudantes da instituição |
| UNICAMP-PRIMEIRA-GRATIS | 100% | percentage | Estudantes da instituição |

#### 4. Diários Emocionais (100-150 entradas)

- 10-15 entradas por estudante
- Distribuídas nos últimos 30 dias
- Scores variados (humor, ansiedade, energia, sono)
- Tags contextuais (#provas, #estágio, #tcc, etc.)

#### 5. Agendamentos Demo (~40 agendamentos)

- 25 passados (realizados)
- 3 cancelados
- 12 futuros (confirmados/pendentes)

---

### Implementação Técnica

#### Nova Edge Function: `seed-unicamp-demo-data`

Estrutura baseada na `seed-unifoa-demo-data`, com:

```typescript
// Constants
const UNICAMP_ID = "d06b3a18-efef-478a-84cb-bbaa5e8ddd36";
const DEMO_MARKER = "[DEMO-UNICAMP]";

// Professionals, Students, Coupons arrays...

// Functions:
- seedProfessionals()
- seedStudents() 
- seedCoupons()
- seedMoodEntries()
- seedAppointments()
- cleanup()
```

#### Endpoints da Edge Function

| Action | Descrição |
|--------|-----------|
| `seed_all` | Cria cenário completo (limpa antes se existir) |
| `seed_professionals` | Apenas profissionais |
| `seed_students` | Apenas estudantes |
| `seed_coupons` | Apenas cupons |
| `seed_mood_entries` | Apenas diários emocionais |
| `seed_appointments` | Apenas agendamentos |
| `cleanup` | Remove todos os dados demo |

---

### Tenant Configuration

Os dados serão vinculados a **ambos os tenants**:
- **Medcos** (`3a9ae5ec-50a9-4674-b808-7735e5f0afb5`) - Cupons com sufixo `-MEDCOS`
- **Rede Bem Estar** (`472db0ac-0f45-4998-97da-490bc579efb1`) - Cupons com sufixo `-RBE`

Profissionais e estudantes serão vinculados ao tenant **Medcos** (padrão para demos), mas podem ser alterados posteriormente.

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/seed-unicamp-demo-data/index.ts` | **Criar** - Nova Edge Function |
| `supabase/config.toml` | **Modificar** - Adicionar configuração da função |

---

### Diferenças do IPSP

| Aspecto | IPSP | UNICAMP |
|---------|------|---------|
| Tipo | private | public |
| ID | a1b2c3d4-... | d06b3a18-... |
| Email domain | @example.com | @unicamp.edu.br |
| Marker | (nenhum específico) | [DEMO-UNICAMP] |
| Cupons | 6 | 6 (códigos diferentes) |

---

### Administradores

Como você mencionou que vai adicionar outros usuários administrativos, a Edge Function **não criará admins automaticamente**. Você pode adicionar administradores manualmente via:
1. Painel Admin → Instituições → UNICAMP → Gerenciar Admins
2. Ou Edge Function `create-institutional-user`

---

### Execução

Após deploy, você pode chamar a função via:
```javascript
// Criar cenário completo
await supabase.functions.invoke('seed-unicamp-demo-data', {
  body: { action: 'seed_all' }
});
```

Ou via página admin de demo data existente (se adaptada para suportar múltiplas instituições).

---

### Ordem de Implementação

1. Criar Edge Function `seed-unicamp-demo-data`
2. Atualizar `supabase/config.toml`
3. Deploy automático
4. Testar chamando a função
5. Verificar dados no portal institucional

