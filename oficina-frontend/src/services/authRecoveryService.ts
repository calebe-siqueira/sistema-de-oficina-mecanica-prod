/**
 * authRecoveryService.ts
 *
 * Serviço de recuperação de senha esquecida via código por e-mail.
 * Centraliza as chamadas para os endpoints públicos:
 *  - POST /api/auth/recuperar-senha/solicitar
 *  - POST /api/auth/recuperar-senha/confirmar
 *
 * Segue os princípios de Responsabilidade Única (SRP) e Clean Code.
 */

export interface SolicitarRecuperacaoPayload {
  email_ou_login: string;
}

export interface ConfirmarRecuperacaoPayload {
  email_ou_login: string;
  codigo: string;
  nova_senha: string;
}

export interface ApiResponse {
  message: string;
}

/**
 * Extrai uma mensagem de erro legível e segura da resposta da API.
 */
async function parseErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
  } catch {
    // Ignora falhas de parse e usa o fallback
  }

  if (response.status === 400) {
    return 'Dados informados inválidos. Verifique as informações e tente novamente.';
  }
  if (response.status === 429) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes.';
  }
  if (response.status >= 500) {
    return 'Ocorreu um erro no servidor. Tente novamente mais tarde.';
  }

  return defaultMessage;
}

export const authRecoveryService = {
  /**
   * Solicita o envio do código de verificação para o e-mail cadastrado do usuário.
   */
  async solicitar(emailOuLogin: string): Promise<ApiResponse> {
    const trimmed = emailOuLogin.trim();
    if (!trimmed) {
      throw new Error('Por favor, informe seu e-mail ou login cadastrado.');
    }

    const response = await fetch('/api/auth/recuperar-senha/solicitar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_ou_login: trimmed } satisfies SolicitarRecuperacaoPayload),
    });

    if (!response.ok) {
      const msg = await parseErrorMessage(
        response,
        'Não foi possível solicitar o código de recuperação. Tente novamente.'
      );
      throw new Error(msg);
    }

    return (await response.json()) as ApiResponse;
  },

  /**
   * Confirma o código recebido por e-mail e define a nova senha do usuário.
   */
  async confirmar(payload: ConfirmarRecuperacaoPayload): Promise<ApiResponse> {
    const trimmedIdentifier = payload.email_ou_login.trim();
    const trimmedCodigo = payload.codigo.trim();
    const novaSenha = payload.nova_senha;

    if (!trimmedIdentifier) {
      throw new Error('Identificador (e-mail ou login) é obrigatório.');
    }
    if (!trimmedCodigo) {
      throw new Error('Informe o código de verificação recebido.');
    }
    if (!novaSenha) {
      throw new Error('Informe a nova senha desejada.');
    }

    const response = await fetch('/api/auth/recuperar-senha/confirmar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_ou_login: trimmedIdentifier,
        codigo: trimmedCodigo,
        nova_senha: novaSenha,
      } satisfies ConfirmarRecuperacaoPayload),
    });

    if (!response.ok) {
      const msg = await parseErrorMessage(
        response,
        'Código inválido, incorreto ou expirado. Tente novamente.'
      );
      throw new Error(msg);
    }

    return (await response.json()) as ApiResponse;
  },
};
