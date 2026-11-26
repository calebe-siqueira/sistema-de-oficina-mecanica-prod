import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCapsLock } from '../hooks/useCapsLock';
import { getDefaultDashboard } from '../hooks/useRoleRedirect';
import { AuthContext } from '../context/AuthContext';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
} from '../components/ui/Icons';

const REMEMBER_ME_KEY = 'carbulab_remembered_login';

export const LoginScreen: React.FC = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarLogin, setLembrarLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { isCapsLockOn, checkCapsLock } = useCapsLock();

  // Carrega login previamente lembrado, se existir
  useEffect(() => {
    try {
      const savedLogin = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedLogin) {
        setLogin(savedLogin);
        setLembrarLogin(true);
      }
    } catch {
      // Ignora erro em ambientes restritos de armazenamento
    }
  }, []);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (authContext?.isAuthenticated && authContext.user) {
      const from = location.state?.from?.pathname;

      // Tenta enviar para a rota de origem, se houver. 
      // Se não houver origem, manda para o dashboard padrão.
      // (Se a rota 'from' for proibida para o usuário, o ProtectedRoute fará o bloqueio e o redirecionamento seguro)
      const destination = from || getDefaultDashboard(authContext.user.funcao);
      navigate(destination, { replace: true });
    }
  }, [authContext?.isAuthenticated, authContext?.user, navigate, location]);

  const authLogin = authContext?.login;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedLogin = login.trim();
    if (!trimmedLogin || !senha) {
      setError('Por favor, preencha o login e a senha.');
      return;
    }

    setLoading(true);

    if (!authLogin) {
      setError('Serviço de autenticação temporariamente indisponível.');
      setLoading(false);
      return;
    }

    try {
      await authLogin(trimmedLogin, senha);

      // Salva ou remove o login lembrado
      try {
        if (lembrarLogin) {
          localStorage.setItem(REMEMBER_ME_KEY, trimmedLogin);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      } catch {
        // Ignora erros de localStorage
      }
    } catch (err: any) {
      const rawMessage: string = err?.message || '';

      // Tratamento claro e seguro, sem revelar se o usuário ou a senha estão errados
      if ( rawMessage.includes('401')
        || rawMessage.toLowerCase().includes('credenciais')
        || rawMessage.toLowerCase().includes('incorret')
        || rawMessage.toLowerCase().includes('inexistente')
      ) {
        setError('Login ou senha incorretos. Verifique os dados digitados e tente novamente.');
      } else if (rawMessage.includes('429')) {
        setError('Muitas tentativas de acesso. Por favor, aguarde alguns instantes.');
      } else {
        setError('Não foi possível entrar no sistema. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSuccess = (usedIdentifier: string) => {
    if (usedIdentifier) {
      setLogin(usedIdentifier);
    }
    setSenha('');
    setError(null);
    setSuccessNotice('Senha redefinida com sucesso! Você já pode entrar com a sua nova senha.');
  };

  return (
    <div className="min-h-dvh bg-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      {/* Container Centralizado */}
      <div className="w-full max-w-md">
        {/* Identidade da Marca: Minimalista e Profissional */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-[#001B7D] flex items-center justify-center p-1 shadow-md shadow-slate-900/10 mb-1">
            <img
              src="/Carburador White.svg"
              alt="Carbulab"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Carbu<span className="text-[#001B7D]/70">lab</span>
          </h1>
          <p className="text-xs text-slate-500">
            Oficina Mecânica
          </p>
        </div>

        <Card className="w-full shadow-sm border border-slate-200/80 rounded-2xl">
          <CardContent className="px-6 py-8 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Login
            </h2>

            {/* Aviso de Sucesso com InlineAlert */}
            <InlineAlert
              message={successNotice}
              variant="success"
              onDismiss={() => setSuccessNotice(null)}
            />

            {/* Mensagem de Erro com InlineAlert */}
            <InlineAlert
              message={error}
              variant="error"
              onDismiss={() => setError(null)}
            />

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Usuário ou E-mail"
                id="login"
                name="login"
                type="text"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  if (error) setError(null);
                }}
                // placeholder="Digite seu usuário ou e-mail"
                prefix={<UserIcon className="w-4 h-4" />}
                required
                autoFocus
                autoComplete="username"
              />

              <Input
                label="Senha"
                id="senha"
                name="password"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={checkCapsLock}
                // placeholder="Digite sua senha"
                prefix={<LockIcon className="w-4 h-4" />}
                suffix={
                  <button
                    type="button"
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="text-slate-400 hover:text-slate-600"
                    onClick={() => setMostrarSenha((prev) => !prev)}
                  >
                    {mostrarSenha ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4" />
                    )}
                  </button>
                }
                labelAction={
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:underline"
                  >
                    Esqueci minha senha
                  </button>
                }
                required
                autoComplete="current-password"
              />

              {/* Indicador de Caps Lock Ativado com InlineAlert */}
              {isCapsLockOn && (
                <InlineAlert
                  message="Atenção: A tecla Caps Lock está ativada."
                  variant="warning"
                  autoScroll={false}
                />
              )}

              {/* Checkbox "Lembrar meu login" */}
              <div className="pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrarLogin}
                    onChange={(e) => setLembrarLogin(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Lembrar meu login</span>
                </label>
              </div>

              {/* Botão de Entrar */}
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 text-sm font-medium rounded-lg shadow-sm transition"
                disabled={loading || !login.trim() || !senha}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rodapé Minimalista */}
        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} Carbulab
        </p>
      </div>

      {/* Modal de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        initialIdentifier={login}
        onSuccessReset={handlePasswordResetSuccess}
      />
    </div>
  );
};
