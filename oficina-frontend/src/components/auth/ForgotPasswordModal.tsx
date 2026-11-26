import React, { useState, useEffect } from 'react';
import { authRecoveryService } from '../../services/authRecoveryService';
import { useCapsLock } from '../../hooks/useCapsLock';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import {
  MailIcon,
  KeyIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  ChevronLeftIcon,
} from '../ui/Icons';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onSuccessReset?: (identifier: string) => void;
}

type Step = 'REQUEST_CODE' | 'CONFIRM_CODE' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onSuccessReset,
}) => {
  const [step, setStep] = useState<Step>('REQUEST_CODE');
  const [identifier, setIdentifier] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { isCapsLockOn, checkCapsLock } = useCapsLock();

  useEffect(() => {
    if (isOpen) {
      setIdentifier(initialIdentifier || '');
      setCodigo('');
      setNovaSenha('');
      setConfirmarSenha('');
      setError(null);
      setInfoMessage(null);
      setStep('REQUEST_CODE');
    }
  }, [isOpen, initialIdentifier]);

  const passwordRequirements = [
    { label: 'Pelo menos 8 caracteres', met: novaSenha.length >= 8 },
    { label: 'Uma letra maiúscula', met: /[A-Z]/.test(novaSenha) },
    { label: 'Uma letra minúscula', met: /[a-z]/.test(novaSenha) },
    { label: 'Um número', met: /[0-9]/.test(novaSenha) },
    { label: 'Um caractere especial (@, #, $, etc.)', met: /[^A-Za-z0-9]/.test(novaSenha) },
    {
      label: 'As senhas coincidem',
      met: novaSenha.length > 0 && novaSenha === confirmarSenha,
    },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Por favor, informe seu e-mail ou login.');
      return;
    }

    setLoading(true);
    try {
      const response = await authRecoveryService.solicitar(trimmed);
      setInfoMessage(
        response.message ||
          'Se os dados estiverem cadastrados, você receberá um código de verificação por e-mail.'
      );
      setStep('CONFIRM_CODE');
    } catch (err: any) {
      setError(err.message || 'Não foi possível solicitar o código de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRedefinicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codigo.trim()) {
      setError('Por favor, informe o código de verificação recebido.');
      return;
    }

    if (!allRequirementsMet) {
      setError('A nova senha precisa atender a todos os requisitos abaixo.');
      return;
    }

    setLoading(true);
    try {
      await authRecoveryService.confirmar({
        email_ou_login: identifier.trim(),
        codigo: codigo.trim(),
        nova_senha: novaSenha,
      });

      setStep('SUCCESS');
      if (onSuccessReset) {
        onSuccessReset(identifier.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Código incorreto ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const modalSubtitle = {
    REQUEST_CODE: 'Informe seus dados para receber o código',
    CONFIRM_CODE: 'Digite o código recebido e sua nova senha',
    SUCCESS: 'Senha redefinida com sucesso',
  }[step];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recuperar Senha"
      subtitle={modalSubtitle}
      maxWidth="max-w-md"
    >
      {/* Alertas reutilizáveis com InlineAlert */}
      <InlineAlert message={error} onDismiss={() => setError(null)} />

      {/* PASSO 1: Solicitar Código */}
      {step === 'REQUEST_CODE' && (
        <form onSubmit={handleSolicitarCodigo} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Informe o seu <strong>e-mail</strong> ou <strong>login</strong> cadastrado. Você receberá um código para redefinir sua senha.
          </p>

          <Input
            label="E-mail ou Login"
            id="recovery-identifier"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Digite seu usuário ou e-mail"
            prefix={<MailIcon className="w-4 h-4" />}
            autoFocus
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </Button>
          </div>
        </form>
      )}

      {/* PASSO 2: Confirmar Código e Nova Senha */}
      {step === 'CONFIRM_CODE' && (
        <form onSubmit={handleConfirmarRedefinicao} className="space-y-4">
          {infoMessage && (
            <InlineAlert
              message={infoMessage}
              variant="success"
              onDismiss={() => setInfoMessage(null)}
            />
          )}

          <Input
            label="Código de verificação"
            id="recovery-code"
            type="text"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Digite o código recebido"
            maxLength={10}
            prefix={<KeyIcon className="w-4 h-4" />}
            labelAction={
              <button
                type="button"
                onClick={() => setStep('REQUEST_CODE')}
                className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" /> Trocar login
              </button>
            }
            autoFocus
            required
            className="font-mono tracking-wider"
          />

          <Input
            label="Nova senha"
            id="recovery-new-password"
            type={mostrarNovaSenha ? 'text' : 'password'}
            value={novaSenha}
            onChange={(e) => {
              setNovaSenha(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            placeholder="Digite a nova senha"
            prefix={<LockIcon className="w-4 h-4" />}
            suffix={
              <button
                type="button"
                title={mostrarNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
                aria-label={mostrarNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setMostrarNovaSenha((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {mostrarNovaSenha ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
              </button>
            }
            required
          />

          <Input
            label="Confirmar nova senha"
            id="recovery-confirm-password"
            type={mostrarConfirmarSenha ? 'text' : 'password'}
            value={confirmarSenha}
            onChange={(e) => {
              setConfirmarSenha(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            placeholder="Repita a nova senha"
            prefix={<LockIcon className="w-4 h-4" />}
            suffix={
              <button
                type="button"
                title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
                aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {mostrarConfirmarSenha ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
              </button>
            }
            required
          />

          {/* Alerta de Caps Lock Ativado */}
          {isCapsLockOn && (
            <InlineAlert
              message="Atenção: A tecla Caps Lock está ativada."
              variant="warning"
              autoScroll={false}
            />
          )}

          {/* Checklist de Requisitos da Senha */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="block text-[11px] font-medium text-slate-600 mb-1">
              Requisitos para a senha:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
              {passwordRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 ${
                    req.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  <span>{req.met ? '✓' : '•'}</span>
                  <span className="truncate">{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const res = await authRecoveryService.solicitar(identifier.trim());
                  setInfoMessage(res.message);
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Reenviar código
            </button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !allRequirementsMet}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* PASSO 3: Sucesso */}
      {step === 'SUCCESS' && (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckIcon className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">Senha alterada!</h4>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Sua senha foi atualizada. Você já pode fazer login no sistema.
          </p>
          <div className="pt-3">
            <Button variant="primary" onClick={onClose} className="w-full">
              Ir para o Login
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
