import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';

// Define a estrutura do objeto de usuário
export interface User {
  nome_usuario: string;
  // funcao_usuario: string;
  [key: string]: any;
}

// Define a estrutura do contexto
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (loginInput: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          method: 'GET',
          credentials: 'include' // Garante o envio do cookie HttpOnly
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error("Erro na verificação de sessão:", e);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  const authContextValue = useMemo<AuthContextType>(() => ({
    isAuthenticated,
    user,
    loading,
    login: async (loginInput: string, senha: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Para o backend poder setar o cookie HttpOnly
        body: JSON.stringify({ login: loginInput, senha })
      });

      // 1. Verifica primeiro se a requisição falhou (status fora da faixa 200-299)
      if (!response.ok) {
        // Se o servidor caiu ou a rota não existe, o Content-Type geralmente é text/html
        const contentType = response.headers.get('content-type');

        // 2. Se o servidor enviou um JSON de erro, lê a mensagem customizada (ex: status 400 ou 401)
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(`${errorData.message} (Erro ${response.status})` || 'Credenciais inválidas.');
        } else {
          // 3. Se não for JSON (geralmente uma página HTML), lança erro baseado no status HTTP
          switch (response.status) {
            case 401:
              throw new Error(`Login e/ou senha incorretos. Verifique se as credenciais digitadas estão corretas (Erro ${response.status})`);
            case 403:
              throw new Error(`Acesso negado. Você não tem permissão para realizar essa ação. Realize o login novamente para continuar (Erro ${response.status})`);
            case 404:
              throw new Error(`A rota de login não foi encontrada no servidor. Se o problema persistir, contate o suporte (Erro ${response.status})`);
            case 413:
              throw new Error(`O volume de dados enviado é maior do que o permitido pelo servidor. Se o problema persistir, contate o suporte (Erro ${response.status})`);
            case 429:
              throw new Error(`Excesso de tentativas de login. Tente novamente em instantes (Erro ${response.status})`);
            case 500:
              throw new Error(`Ocorreu um erro inesperado no servidor. Tente novamente em instantes (Erro ${response.status})`);
            case 502:
              throw new Error(`Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente (Erro ${response.status})`);
            case 503:
              throw new Error(`O sistema está temporariamente fora do ar. Tente novamente mais tarde (Erro ${response.status})`);
            case 504:
              throw new Error(`O servidor demorou muito para responder. Atualize a página e tente novamente (Erro ${response.status})`);
            default:
              // Caso seja um status não mapeado
              throw new Error(`Não foi possível completar a ação devido a um erro inesperado no servidor. Se o problema persistir, contate o suporte (Erro ${response.status})`);
          }
        }
      }
      const userData = await response.json();
      setIsAuthenticated(true);
      setUser(userData);
    },
    logout: async () => {
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include' 
        });
      } catch (e) {
        console.error("Erro ao efetuar logout", e);
      }
      setIsAuthenticated(false);
      setUser(null); 
    },
  }), [isAuthenticated, user, loading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};