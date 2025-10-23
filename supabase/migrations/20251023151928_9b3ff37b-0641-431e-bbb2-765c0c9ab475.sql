-- Adicionar constraint UNIQUE se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_configurations_unique_key'
  ) THEN
    ALTER TABLE system_configurations 
    ADD CONSTRAINT system_configurations_unique_key UNIQUE (category, key, tenant_id);
  END IF;
END
$$;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Super admins can manage all configurations" ON system_configurations;
DROP POLICY IF EXISTS "Admins can view all configurations" ON system_configurations;

-- Criar políticas RLS
CREATE POLICY "Super admins can manage all configurations"
  ON system_configurations
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view all configurations"
  ON system_configurations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Inserir configuração inicial de instituições de ensino (global)
INSERT INTO system_configurations (category, key, value, description, tenant_id)
VALUES (
  'registration',
  'educational_institutions',
  '[
    "Centro Universitário Barão de Mauá",
    "Centro Universitário das Américas (FAM)",
    "Centro Universitário São Camilo",
    "Centro Universitário São Leopoldo Mandic",
    "Faculdade de Ciências Médicas da Santa Casa de São Paulo (FCMSCSP)",
    "Faculdade de Medicina de São José do Rio Preto (FAMERP)",
    "Faculdade de Medicina do ABC (FMABC)",
    "Fundação Getúlio Vargas (FGV)",
    "Insper - Instituto de Ensino e Pesquisa",
    "Pontifícia Universidade Católica de Campinas (PUC-Campinas)",
    "Pontifícia Universidade Católica de São Paulo (PUC-SP)",
    "Pontifícia Universidade Católica do Paraná (PUC-PR)",
    "Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)",
    "Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS)",
    "Universidade Anhembi Morumbi",
    "Universidade Cidade de São Paulo (UNICID)",
    "Universidade de Brasília (UnB)",
    "Universidade de Marília (UNIMAR)",
    "Universidade de São Paulo (USP)",
    "Universidade do Estado do Rio de Janeiro (UERJ)",
    "Universidade Estadual de Campinas (UNICAMP)",
    "Universidade Estadual de Londrina (UEL)",
    "Universidade Estadual de Maringá (UEM)",
    "Universidade Estadual Paulista (UNESP)",
    "Universidade Federal da Bahia (UFBA)",
    "Universidade Federal de Goiás (UFG)",
    "Universidade Federal de Minas Gerais (UFMG)",
    "Universidade Federal de Pernambuco (UFPE)",
    "Universidade Federal de Santa Catarina (UFSC)",
    "Universidade Federal de São Paulo (UNIFESP)",
    "Universidade Federal do Ceará (UFC)",
    "Universidade Federal do Espírito Santo (UFES)",
    "Universidade Federal do Paraná (UFPR)",
    "Universidade Federal do Rio de Janeiro (UFRJ)",
    "Universidade Federal do Rio Grande do Norte (UFRN)",
    "Universidade Federal do Rio Grande do Sul (UFRGS)",
    "Universidade Federal Fluminense (UFF)",
    "Universidade Nove de Julho (UNINOVE)",
    "Universidade Paulista (UNIP)",
    "Universidade Positivo",
    "Universidade Presbiteriana Mackenzie"
  ]'::jsonb,
  'Lista de instituições de ensino exibidas no cadastro de pacientes estudantes',
  NULL
)
ON CONFLICT (category, key, tenant_id) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();