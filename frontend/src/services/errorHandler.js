import toast from 'react-hot-toast';

/**
 * Serviço de Gestão de Erros
 * 
 * Oferece funcionalidades centralizadas para:
 * - Mapeamento de erros para mensagens em PT-PT
 * - Notificações toast (erro, sucesso, aviso, info)
 * - Retry automático com backoff exponencial
 * - Validação de formulários
 * - Logging estruturado
 * - Tratamento global de erros não capturados
 */

/**
 * Mapeamento de mensagens de erro para português de Portugal
 * Cobre erros de rede, HTTP status codes e erros customizados
 */
const errorMessages = {
  // Erros de Network/Conexão
  'Network Error': 'Erro de conexão. Verifique sua internet.',
  'timeout of': 'A requisição demorou muito. Tente novamente.',
  'ERR_NETWORK': 'Erro de rede. Sem conexão com o servidor.',
  
  // Erros HTTP 4xx (Cliente)
  400: 'Dados inválidos. Verifique o formulário.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Acesso negado. Não tem permissão.',
  404: 'Recurso não encontrado.',
  409: 'Conflito! Este item já existe.',
  429: 'Muitas requisições. Aguarde um momento.',
  422: 'Dados inválidos. Verifique os campos.',
  
  // Erros HTTP 5xx (Servidor)
  500: 'Erro no servidor. Tente mais tarde.',
  502: 'Gateway inválido. Servidor indisponível.',
  503: 'Serviço indisponível. Tente mais tarde.',
  
  // Erros customizados da aplicação
  'CAPSULE_NOT_FOUND': 'Cápsula não encontrada.',
  'USER_NOT_FOUND': 'Utilizador não encontrado.',
  'INVALID_TOKEN': 'Token inválido ou expirado.',
  'PASSWORD_MISMATCH': 'As palavras-passe não coincidem.',
  'EMAIL_ALREADY_EXISTS': 'Este email já está registado.',
};

/**
 * Extrai a mensagem de erro a partir de diferentes formatos
 * Trata erros Axios, erros nativos e strings
 * @param {Error|Object} error - O objeto de erro
 * @returns {string} Mensagem de erro traduzida para PT-PT
 */
export const getErrorMessage = (error) => {
  // Erro Axios com resposta do servidor
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    return errorMessages[msg] || msg;
  }

  // Erro Axios com status HTTP
  if (error?.response?.status) {
    return errorMessages[error.response.status] || 'Erro desconhecido';
  }

  // Mensagem de erro simples
  if (error?.message) {
    for (const [key, value] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return value;
      }
    }
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return errorMessages[error] || error;
  }

  return 'Algo correu mal. Tente novamente.';
};

/**
 * Mostra notificação toast de erro
 * @param {Error|string} error - O erro a mostrar
 * @param {string} customMessage - Mensagem customizada (opcional)
 * @returns {Toast} Referência ao toast para controlo
 */
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error);
  
  console.error('Erro:', error);
  
  return toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#f87171',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    },
    icon: '❌',
  });
};

/**
 * Mostra notificação toast de sucesso
 * @param {string} message - Mensagem de sucesso
 * @returns {Toast} Referência ao toast para controlo
 */
export const showSuccessToast = (message) => {
  return toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      color: '#6ee7b7',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    },
    icon: '✅',
  });
};

/**
 * Mostra notificação toast de aviso
 * @param {string} message - Mensagem de aviso
 * @returns {Toast} Referência ao toast para controlo
 */
export const showWarningToast = (message) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      color: '#fcd34d',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    },
    icon: '⚠️',
  });
};

/**
 * Mostra notificação toast de informação
 * @param {string} message - Mensagem informativa
 * @returns {Toast} Referência ao toast para controlo
 */
export const showInfoToast = (message) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      color: '#93c5fd',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    },
    icon: 'ℹ️',
  });
};

/**
 * Executa uma função com retry automático e backoff exponencial
 * Útil para operações que podem ser temporárias (falhas de rede, timeout)
 * @param {Function} fn - Função a executar
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} delay - Atraso inicial em ms (padrão: 1000, duplica a cada retry)
 * @returns {Promise} Resultado da função após sucesso ou último erro
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Não fazer retry em erros de autenticação ou autorização
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw error;
      }
      
      // Aguarda antes de fazer retry (backoff exponencial: 1s, 2s, 4s)
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Tentativa ${i + 1} após ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

/**
 * Wrapper para operações com tratamento de erro automático
 * Mostra toast de sucesso/erro automaticamente
 * @param {Function} fn - Função a executar
 * @param {string} successMessage - Mensagem de sucesso (opcional)
 * @param {string} errorMessage - Mensagem de erro customizada (opcional)
 * @param {boolean} showSuccess - Se deve mostrar mensagem de sucesso (padrão: true)
 * @returns {Promise} Resultado da função
 */
export const withErrorHandling = async (
  fn,
  successMessage = null,
  errorMessage = null,
  showSuccess = true
) => {
  try {
    const result = await fn();
    // Mostra mensagem de sucesso se configurado
    if (showSuccess && successMessage) {
      showSuccessToast(successMessage);
    }
    return result;
  } catch (error) {
    // Mostra mensagem de erro automaticamente
    showErrorToast(error, errorMessage);
    throw error;
  }
};

/**
 * Validador de formulário com esquema de regras
 * @param {Object} data - Dados do formulário
 * @param {Object} schema - Esquema de validação
 * @returns {Object} Objeto com erros por campo (vazio se válido)
 * 
 * Exemplo de schema:
 * {
 *   email: { required: true, email: true, label: 'Email' },
 *   password: { required: true, minLength: 8, label: 'Palavra-passe' },
 *   name: { required: true, maxLength: 50 }
 * }
 */
export const validateForm = (data, schema) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Validação obrigatória
    if (rules.required && (!value || value.trim() === '')) {
      errors[field] = `${rules.label || field} é obrigatório`;
      continue;
    }
    
    // Comprimento mínimo
    if (rules.minLength && value && value.length < rules.minLength) {
      errors[field] = `${rules.label || field} deve ter pelo menos ${rules.minLength} caracteres`;
    }
    
    // Comprimento máximo
    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors[field] = `${rules.label || field} não pode exceder ${rules.maxLength} caracteres`;
    }
    
    // Validação de email
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = 'Email inválido';
      }
    }
    
    // Validação com regex
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors[field] = rules.message || `${rules.label || field} está em formato inválido`;
    }
    
    // Validação customizada
    if (rules.custom) {
      // Executa função de validação customizada
      const customError = rules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return errors;
};

/**
 * Sistema de logging estruturado com timestamps
 * Fornece métodos para diferentes níveis de log
 */
export const logger = {
  // Log informativo padrão
  log: (message, data = null) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`, data || '');
  },
  
  // Log de erro (em vermelho)
  error: (message, error = null) => {
    console.error(`[${new Date().toLocaleTimeString()}] ERRO: ${message}`, error || '');
  },
  
  // Log de aviso (em amarelo)
  warn: (message, data = null) => {
    console.warn(`[${new Date().toLocaleTimeString()}] AVISO: ${message}`, data || '');
  },
  
  // Log de informação
  info: (message, data = null) => {
    console.info(`[${new Date().toLocaleTimeString()}] INFO: ${message}`, data || '');
  },
};

/**
 * Tratador global de erro não capturado
 */
export const setupGlobalErrorHandler = () => {
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showErrorToast(event.error, 'Erro inesperado. Recarregue a página.');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorToast(event.reason, 'Erro inesperado. Recarregue a página.');
  });
};

export default {
  getErrorMessage,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  retryWithBackoff,
  withErrorHandling,
  validateForm,
  logger,
  setupGlobalErrorHandler,
};
