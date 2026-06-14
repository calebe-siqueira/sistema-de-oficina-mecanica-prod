import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Ajuste o caminho conforme sua pasta
import Input from '../components/Input'; // Importe seus componentes de UI
import Button from '../components/Button';
import { LuEye, LuEyeOff, LuEyeClosed } from 'react-icons/lu';

type AuthContextData = {
  login: (login: string, senha: string) => Promise<void>;
} | null;

export const TelaLogin: React.FC = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authContext = useContext(AuthContext as React.Context<AuthContextData>);
  const authLogin = authContext?.login;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!authLogin) {
      setError('Contexto de autenticação não disponível.');
      setLoading(false);
      return;
    }
    
    try {
      await authLogin(login, senha);
    } catch (err: any) {
      setError(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Login ou E-mail" 
            id="login" 
            type="text" 
            value={login} 
            onChange={(e) => setLogin(e.target.value)} 
            required 
            autoFocus 
          />

          <div className="relative">
            <Input
              label="Senha"
              id="senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute inset-y-11 right-0 pr-3 flex items-center text-sm leading-5"
              // onMouseDown={() => setMostrarSenha((prev) => !prev)}
              // onMouseUp={() => setMostrarSenha((prev) => !prev)}
              onClick={() => setMostrarSenha((prev) => !prev)}
            >
              {mostrarSenha ? (
                <LuEye className="h-5 w-5 text-gray-500" />
              ) : (
                <LuEyeOff className="h-5 w-5 text-gray-400" />
                // <LuEyeClosed className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};