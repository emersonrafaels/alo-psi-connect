import { validateCPF } from '@/utils/cpfValidator';

export interface ParsedUser {
  nome: string;
  email: string;
  cpf?: string;
  data_nascimento?: string;
  genero?: string;
  telefone?: string;
  tipo_usuario: 'paciente' | 'profissional';
  senha?: string;
  instituicao?: string;
  crp_crm?: string;
  profissao?: string;
  preco_consulta?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedUserWithValidation extends ParsedUser {
  id: string;
  validation: ValidationResult;
}

export const useBulkUserValidation = () => {
  const validateUser = (user: ParsedUser): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações críticas (bloqueiam importação)
    if (!user.nome || user.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }

    if (!user.email || user.email.trim() === '') {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Email inválido');
    }

    if (!user.tipo_usuario) {
      errors.push('Tipo de usuário é obrigatório');
    } else if (!['paciente', 'profissional'].includes(user.tipo_usuario)) {
      errors.push('Tipo deve ser "paciente" ou "profissional"');
    }

    // Validação de CPF se fornecido
    if (user.cpf && user.cpf.trim() !== '') {
      if (!validateCPF(user.cpf)) {
        errors.push('CPF inválido');
      }
    }

    // Validação de data de nascimento se fornecida
    if (user.data_nascimento) {
      const birthDate = new Date(user.data_nascimento);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        errors.push('Data de nascimento inválida');
      } else if (birthDate > today) {
        errors.push('Data de nascimento não pode ser no futuro');
      } else {
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age > 150) {
          warnings.push('Data de nascimento parece muito antiga');
        } else if (age < 13) {
          warnings.push('Usuário tem menos de 13 anos');
        }
      }
    }

    // Validações específicas para profissionais
    if (user.tipo_usuario === 'profissional') {
      if (!user.crp_crm || user.crp_crm.trim() === '') {
        warnings.push('CRP/CRM não informado');
      }
      
      if (!user.profissao || user.profissao.trim() === '') {
        warnings.push('Profissão não informada');
      }
      
      if (!user.preco_consulta || user.preco_consulta <= 0) {
        warnings.push('Preço da consulta não informado (será usado padrão R$ 120,00)');
      } else if (user.preco_consulta < 50) {
        warnings.push('Preço da consulta muito baixo');
      } else if (user.preco_consulta > 1000) {
        warnings.push('Preço da consulta muito alto');
      }
    }

    // Validação de telefone se fornecido
    if (user.telefone && user.telefone.trim() !== '') {
      const phoneDigits = user.telefone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        warnings.push('Telefone em formato inválido (use DDD + número)');
      }
    }

    // Validação de senha se fornecida
    if (user.senha && user.senha.trim() !== '') {
      if (user.senha.length < 6) {
        errors.push('Senha deve ter no mínimo 6 caracteres');
      }
    } else {
      warnings.push('Senha não fornecida (será gerada automaticamente)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const validateUsers = (users: ParsedUser[]): ParsedUserWithValidation[] => {
    const emails = new Set<string>();
    const cpfs = new Set<string>();

    return users.map((user, index) => {
      const validation = validateUser(user);
      
      // Verificar duplicatas na própria planilha
      if (user.email) {
        const emailLower = user.email.toLowerCase();
        if (emails.has(emailLower)) {
          validation.warnings.push('Email duplicado na planilha');
        } else {
          emails.add(emailLower);
        }
      }

      if (user.cpf) {
        const cpfClean = user.cpf.replace(/\D/g, '');
        if (cpfClean && cpfs.has(cpfClean)) {
          validation.warnings.push('CPF duplicado na planilha');
        } else if (cpfClean) {
          cpfs.add(cpfClean);
        }
      }

      // Recalcular isValid após adicionar avisos de duplicata
      validation.isValid = validation.errors.length === 0;

      return {
        ...user,
        id: `temp-${index}`,
        validation
      };
    });
  };

  return {
    validateUser,
    validateUsers
  };
};
