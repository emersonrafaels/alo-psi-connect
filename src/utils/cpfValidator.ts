/**
 * Remove formatação do CPF (pontos e traço)
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Formata CPF para XXX.XXX.XXX-XX
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cleanCPF(cpf).slice(0, 11);
  return cleaned
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
};

/**
 * Valida CPF com algoritmo de dígitos verificadores
 * @returns true se CPF é válido, false caso contrário
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

/**
 * Retorna mensagem de erro ou null se válido
 */
export const getCPFErrorMessage = (cpf: string): string | null => {
  const cleaned = cleanCPF(cpf);
  
  if (!cpf) return null;
  if (cleaned.length < 11) return 'CPF deve ter 11 dígitos';
  if (/^(\d)\1+$/.test(cleaned)) return 'CPF não pode ter todos os dígitos iguais';
  if (!validateCPF(cpf)) return 'CPF inválido. Verifique os números digitados';
  
  return null;
};
