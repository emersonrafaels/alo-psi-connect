# Instituição demo Afya com 2.000 alunos sintéticos

## Objetivo
Criar a instituição **Afya** no ambiente Rede Bem-Estar com cerca de 2.000 alunos fictícios. Os dados devem contar uma história coerente ao longo do semestre, ficar dentro dos limites reais de cada escala e aparecer sempre marcados como demonstração.

## Instituição e acesso
- Afya: instituição privada, ativa e parceira, com o modelo completo **Unidade > Curso > Turno > Turma**.
- Administrador institucional: **Lucas Afya** (lasil18793@ensproxy.com), com acesso somente à Afya e senha temporária pelo fluxo de primeiro acesso já existente.
- Cerca de 10 profissionais fictícios vinculados à Afya.

## Estrutura acadêmica
- Unidades: **Afya Salvador** (~1.200 alunos) e **Afya Itabuna** (~800 alunos).
- Cursos nas duas unidades: Medicina, Enfermagem, Psicologia e Odontologia.
- Turnos: Integral (Medicina), Matutino e Noturno (demais cursos).
- Turmas por semestre/período (ex.: "MED-3A", "ENF-N-5B"), com 30 a 60 alunos cada.
- Todos os alunos ficam vinculados a uma turma, e o caminho completo vem da turma.

## Cenários demonstrativos (conforme a imagem enviada)
1. **Cursos semelhantes em unidades diferentes**: em Itabuna, Medicina tem ansiedade mais alta e sono pior que em Salvador.
2. **Mudanças ao longo do semestre**: período estável no início, piora perto das provas (semanas 8–10 e últimas 3 semanas) e recuperação parcial depois.
3. **Diferenças entre turnos**: no Noturno, energia e sono são mais baixos e o estresse é maior (perfil de quem trabalha e estuda).
4. **Participação desigual**: cerca de 15% dos alunos ativos e constantes, 35% ocasionais, 30% que fizeram só 1 a 3 registros e 20% cadastrados sem nenhum registro. A cobertura varia por turma.
5. **Mudanças nos registros emocionais**: alunos com trajetórias de melhora, piora, oscilação e estabilidade.
6. **Investigação institucional**: uma turma (Enfermagem Noturno 5º período, Itabuna) com piora clara. Ela terá triagens em andamento, notas institucionais e um plano de apoios ligado ao caso.

## Dados por recurso
- Diários emocionais no semestre (~4 meses até hoje), no máximo um por aluno por dia, com valores inteiros dentro de cada escala.
- Escalas emocionais respondidas só por uma parte dos alunos, em 1 a 3 aplicações, com pontuações válidas.
- Análises e retratos do Buddy apenas para quem tem registros suficientes, e liberação Buddy na visão institucional.
- Triagens com distribuição realista de risco: cerca de 3% críticos, 8% em alerta, 20% em atenção, a maioria estável e uma parte sem triagem.
- Algumas práticas, jornadas e consultas, em menor volume.

## Identificação de demonstração
- Todos os registros recebem uma marca demo consistente, e os e-mails usam um domínio próprio de demonstração. Assim é possível auditar e limpar tudo depois.
- **Selo visível "Dados demonstrativos"** no Portal Institucional sempre que a instituição exibida for demo, para evitar confusão com dados reais da Afya.
- Os alunos fictícios não recebem nenhuma comunicação.

## Detalhes técnicos
- Ampliar a função `seed-demo-data` com a ação `seed_afya`: idempotente, executada em lotes (~100 alunos por chamada) para respeitar os limites, com datas relativas ao dia da execução e números aleatórios com semente fixa para que o resultado se repita.
- Gerar perfis de alunos (nomes brasileiros variados, idade, gênero) sem contas de login, exceto quando alguma área exigir. Usar `patient_institutions`, `institution_academic_units` e `patient_institution_placements`.
- Cada valor vem de um modelo: base do aluno + efeito da unidade, do curso e do turno + curva do semestre + ruído, sempre limitado ao intervalo da escala.
- Migration pequena: adicionar a coluna `is_demo boolean` em `educational_institutions`, que controla o selo no portal. A Afya e a EBMSP ficam marcadas como demo.
- Validação: conferir os totais e a cobertura por unidade, curso e turno, confirmar que os filtros mostram as diferenças, checar que nenhum valor sai dos limites e que as outras instituições não foram alteradas.
