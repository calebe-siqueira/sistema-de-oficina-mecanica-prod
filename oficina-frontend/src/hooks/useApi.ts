import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toastify } from '../components/modules/SystemMessages';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const useApi = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('O useApi deve ser utilizado dentro de um AuthProvider');
  }

  const { logout } = authContext;

  const request = useCallback(
    async (endpoint: string, method: string = 'GET', body: any = null): Promise<any> => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        const options: RequestInit = { 
          method, 
          headers,
          credentials: 'include' // Envia os cookies HttpOnly
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`/api${endpoint}`, options);
        
        if (response.status === 401 || response.status === 403) {
          logout();
          const expiredMessage = 'Sessão expirada ou acesso negado. Faça login novamente.';
          throw new ApiError(expiredMessage, response.status, null);
        }
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
          throw new ApiError(errData.message || `Erro ${response.status}`, response.status, errData);
        }
        
        if (response.status === 204) return null;
        return response.json();
      } catch (error: any) {
        toastify.errorMessage(error.message, error);
        throw error;
      }
    },
    [logout]
  );

  return request;
};
