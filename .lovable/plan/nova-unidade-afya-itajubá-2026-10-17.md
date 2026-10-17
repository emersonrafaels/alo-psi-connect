# Nova unidade Afya Itajubá

## O que muda
- A Afya ganha uma terceira unidade: **Afya Itajubá**, junto de Contagem e Montes Claros.
- Itajubá recebe a mesma estrutura das outras unidades:
  - Cursos: Medicina, Enfermagem, Psicologia e Odontologia.
  - Turnos: Integral (Medicina), Matutino e Noturno (demais cursos).
  - Turmas por período (ex.: "MED-3A", "ENF-N-5B"), com 30 a 60 alunos cada.
- Cerca de **800 novos alunos fictícios**, todos vinculados a uma turma de Itajubá e exibidos como "Aluno #N". A Afya passa a ter cerca de 2.800 alunos.

## Mesmo padrão de dados
- Diários emocionais dos últimos ~4 meses, com no máximo um registro por dia e valores dentro de cada escala.
- Mesma curva do semestre: começo estável, piora nas provas (semanas 8 a 10 e últimas 3 semanas) e recuperação parcial.
- Noturno com menos energia e sono e mais estresse.
- Participação desigual: cerca de 15% ativos, 35% ocasionais, 30% com 1 a 3 registros e 20% sem registros.
- Trajetórias de melhora, piora, oscilação e estabilidade.
- Triagens com distribuição parecida: cerca de 3% críticos, 8% em alerta, 20% em atenção e o restante estável ou sem triagem.
- Liberações do Buddy para alunos com registros suficientes.
- Itajubá terá um perfil intermediário entre Contagem e Montes Claros, para gerar comparações úteis.
- Tudo marcado como demonstração, com e-mails do domínio demo e sem envio de mensagens.

## Validação
- Conferir totais, cobertura por curso e turno e limites das escalas.
- Confirmar que Contagem, Montes Claros e as outras instituições não mudaram.
- Verificar que Itajubá aparece nos filtros da lista de alunos.

## Detalhes técnicos
- Inserção direta dos dados no banco, em lotes, com a mesma lógica usada para as duas unidades atuais: base do aluno + efeito do curso e do turno + curva do semestre + ruído, sempre limitado à escala.
- Tabelas: `institution_academic_units`, `profiles`/`pacientes`, `patient_institutions`, `patient_institution_placements`, `mood_entries`, `mood_entry_analyses`, `student_triage` e as liberações do Buddy.
- Não há mudança na estrutura do banco nem no código.
