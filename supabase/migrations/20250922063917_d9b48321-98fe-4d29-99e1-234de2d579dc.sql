-- Atualizar gêneros dos profissionais baseado em seus nomes
-- Profissionais do gênero feminino
UPDATE profiles 
SET genero = 'feminino' 
WHERE nome IN (
  'Aline Mariana Rodicz',
  'Anne Françoise Kaufmann Kunath', 
  'Beatriz Rocha Lobo',
  'Bianca Lopes De Oliveira',
  'Bruna Borges',
  'Bruna Lagazzi De Marchi',
  'Carolina Rohde',
  'Elaine Soares de Oliveira',
  'Erika Oliveira Polizelli',
  'Fernanda Bizella Paschoalinotto',
  'Fernanda Tomassi',
  'Gabriela Kumai Mattedi',
  'Giulia Rezk',
  'Helena Novaes Ferreira',
  'Julia Alves dos Santos',
  'Laissa Beatriz Camargo de Souza',
  'Larissa Fernandes Francisco',
  'Laura Bogea Muller',
  'Maria Luiza Menegazzo Pereira',
  'Mina Cikara',
  'Mônica Moreno da Silva',
  'Natalia Ferracini de Oliveira',
  'Stephanie Correia',
  'Vitória Ananko Dória'
);

-- Profissionais do gênero masculino
UPDATE profiles 
SET genero = 'masculino' 
WHERE nome IN (
  'Eduardo Pimenta Cunha',
  'João Paulo Consentino Solano',
  'Leonardo Carriço Apostolatos',
  'Paulo Roberto',
  'Rodrigo De Carvalho Pazeto',
  'Vitor Panicali Mello Guida',
  'Mohhamed'
);

-- Verificar o resultado das atualizações
SELECT 
  nome,
  genero,
  tipo_usuario
FROM profiles 
WHERE tipo_usuario = 'profissional'
ORDER BY genero, nome;