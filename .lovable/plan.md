

## Plano: Refatorar Página de Dados Demo para Suportar Múltiplas Instituições

### Objetivo

Transformar a página `/admin/demo-data` em uma ferramenta flexível que permite criar dados demo para **qualquer instituição**, com campos configuráveis para quantidade de profissionais, pacientes e diários emocionais.

---

### Nova Interface da Página

```
┌─────────────────────────────────────────────────────────────────┐
│  🧪 Gerador de Dados Demo                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Criar Nova Instituição com Dados Demo ──────────────────┐  │
│  │                                                           │  │
│  │  Nome da Instituição*    [_____________________________]  │  │
│  │  Tipo                    (○ Pública  ● Privada)          │  │
│  │                                                           │  │
│  │  ── Quantidade de Dados ──                                │  │
│  │  Profissionais           [ 5  ] (1-20)                   │  │
│  │  Pacientes/Alunos        [ 10 ] (1-50)                   │  │
│  │  Diários Emocionais      [ 100 ] (10-500) por aluno      │  │
│  │                                                           │  │
│  │  [🚀 Criar Instituição e Dados Demo]                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Instituições Existentes ─────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │ 🏫 Centro Universitário de Volta Redonda (UniFOA)    ││  │
│  │  │ [Adicionar Dados] [Limpar Dados Demo]                 ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │ 🏫 Universidade Estadual de Campinas (UNICAMP)        ││  │
│  │  │ [Adicionar Dados] [Limpar Dados Demo]                 ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Log de Execução ─────────────────────────────────────────┐  │
│  │  ✅ Criados 5 profissionais para UNICAMP                  │  │
│  │  ✅ Criados 10 estudantes para UNICAMP                    │  │
│  │  ✅ Criados 120 diários emocionais                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Arquitetura Técnica

#### 1. Nova Edge Function: `seed-demo-data` (Genérica)

Uma única Edge Function que substitui as específicas (unifoa, unicamp), aceitando parâmetros dinâmicos:

```typescript
// Parâmetros de entrada
interface SeedDemoDataParams {
  action: "seed_all" | "seed_professionals" | "seed_students" | 
          "seed_coupons" | "seed_mood_entries" | "seed_appointments" | 
          "cleanup" | "create_institution";
  
  // Para criação de nova instituição
  institution_name?: string;
  institution_type?: "public" | "private";
  
  // Para instituição existente
  institution_id?: string;
  
  // Quantidades configuráveis
  professionals_count?: number;  // 1-20
  students_count?: number;       // 1-50
  mood_entries_per_student?: number; // 10-50 (total = students * entries)
  
  // Tenant alvo
  tenant_id?: string;
}
```

#### 2. Geração Dinâmica de Nomes

A Edge Function usará arrays de nomes brasileiros para gerar profissionais e estudantes aleatórios:

```typescript
const FIRST_NAMES = [
  "Ana", "Beatriz", "Camila", "Daniela", "Eduardo", 
  "Fernando", "Gabriela", "Helena", "Igor", "Julia",
  "Leonardo", "Mariana", "Nicolas", "Patricia", "Rafael",
  "Thiago", "Vanessa", "William", "Yara", "Zeca"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues",
  "Ferreira", "Almeida", "Pereira", "Lima", "Gomes"
];

// Gera nome como: "Dr. Eduardo Ferreira Lima"
```

---

### Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/seed-demo-data/index.ts` | **Criar** | Edge Function genérica |
| `supabase/config.toml` | **Modificar** | Registrar nova função |
| `src/hooks/useDemoData.tsx` | **Modificar** | Aceitar parâmetros dinâmicos |
| `src/pages/admin/DemoData.tsx` | **Modificar** | Nova interface com formulário |

---

### Detalhes da Implementação

#### A. Edge Function `seed-demo-data`

```typescript
// Fluxo principal
async function handleRequest(req: Request) {
  const { 
    action, 
    institution_id, 
    institution_name, 
    institution_type,
    professionals_count = 5,
    students_count = 10,
    mood_entries_per_student = 12,
    tenant_id 
  } = await req.json();

  // Se action = "create_institution", cria a instituição primeiro
  if (action === "create_institution") {
    const newInstitution = await createInstitution(
      institution_name, 
      institution_type
    );
    institution_id = newInstitution.id;
  }

  // Depois popula com dados demo
  switch (action) {
    case "seed_all":
    case "create_institution":
      await seedAll({
        institution_id,
        professionals_count,
        students_count,
        mood_entries_per_student,
        tenant_id
      });
      break;
    // ... outros casos
  }
}
```

#### B. Hook `useDemoData` Refatorado

```typescript
export interface DemoDataParams {
  action: DemoDataAction;
  institutionId?: string;
  institutionName?: string;
  institutionType?: "public" | "private";
  professionalsCount?: number;
  studentsCount?: number;
  moodEntriesPerStudent?: number;
  tenantId?: string;
}

export const useDemoData = () => {
  const executeAction = async (params: DemoDataParams) => {
    const { data, error } = await supabase.functions.invoke("seed-demo-data", {
      body: {
        action: params.action,
        institution_id: params.institutionId,
        institution_name: params.institutionName,
        institution_type: params.institutionType,
        professionals_count: params.professionalsCount,
        students_count: params.studentsCount,
        mood_entries_per_student: params.moodEntriesPerStudent,
        tenant_id: params.tenantId,
      },
    });
    // ...
  };
  // ...
};
```

#### C. Página `DemoData.tsx` Refatorada

Nova estrutura com três seções:

1. **Formulário de Criação**
   - Input para nome da instituição
   - Radio buttons para tipo (pública/privada)
   - Sliders/inputs numéricos para quantidades
   - Select para escolher tenant alvo

2. **Lista de Instituições Existentes**
   - Usa `useInstitutions()` hook existente
   - Cards com ações rápidas (Adicionar Dados, Limpar)
   - Mostra contagem atual de dados demo

3. **Log de Execução**
   - Mantém funcionalidade atual
   - Exibe resultados das operações

---

### Validações e Limites

| Campo | Mínimo | Máximo | Padrão |
|-------|--------|--------|--------|
| Nome da Instituição | 3 chars | 100 chars | - |
| Profissionais | 1 | 20 | 5 |
| Pacientes/Alunos | 1 | 50 | 10 |
| Diários por Aluno | 5 | 30 | 12 |

---

### Lógica de Geração de Email

O domínio do email será gerado automaticamente baseado no nome:

```typescript
function generateEmailDomain(institutionName: string): string {
  // "Universidade Estadual de Campinas (UNICAMP)" -> "unicamp.edu.br"
  // "Centro Universitário XYZ" -> "xyz.edu.br"
  const match = institutionName.match(/\(([^)]+)\)/);
  if (match) {
    return `${match[1].toLowerCase().replace(/\s+/g, '')}.edu.br`;
  }
  const slug = institutionName
    .toLowerCase()
    .replace(/universidade|centro|faculdade|de|do|da|dos|das/gi, '')
    .trim()
    .split(' ')[0];
  return `${slug}.edu.br`;
}
```

---

### Compatibilidade

- **Edge Functions antigas** (`seed-unifoa-demo-data`, `seed-unicamp-demo-data`): Serão mantidas para não quebrar referências existentes, mas marcadas como deprecated.
- **Dados existentes**: A nova função pode limpar dados criados pelas funções antigas usando o `DEMO_MARKER` em cada registro.

---

### Componentes UI Utilizados

- `Input` - Nome da instituição
- `RadioGroup` - Tipo (pública/privada)
- `Slider` ou `Input[type=number]` - Quantidades
- `Select` - Escolha do tenant
- `Card` - Lista de instituições
- `Button` - Ações
- `Badge` - Status e contagens

---

### Ordem de Implementação

1. Criar Edge Function `seed-demo-data`
2. Atualizar `supabase/config.toml`
3. Refatorar hook `useDemoData`
4. Redesenhar página `DemoData.tsx`
5. Testar criação de nova instituição
6. Testar adição de dados a instituição existente

