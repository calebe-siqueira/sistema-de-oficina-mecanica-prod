/**
 * useMeuPerfil.ts
 *
 * Hook que gerencia o estado do perfil do cliente autenticado.
 *
 * Responsabilidades:
 *  - Buscar dados via fetchMeuPerfil (GET /api/meu-perfil)
 *  - Expor ações de alteração de senha e troca de e-mail
 *  - Gerenciar estados de loading / error isolados por operação
 *
 * Segue o princípio de Single Responsibility: cada ação tem seu próprio
 * estado de "submitting" para não bloquear a tela toda durante operações
 * assíncronas independentes.
 */

import { useState, useEffect, useCallback } from 'react';

import { useApi } from './useApi';
import { toastify } from '../components/modules/SystemMessages';
import {
  fetchMeuPerfil,
  alterarMinhaSenha as alterarSenhaService,
  solicitarTrocaEmail as solicitarEmailService,
  confirmarTrocaEmail as confirmarEmailService,
} from '../services/clientAreaService';

import type { ResponseMeuPerfilDTO } from '../types/meuPerfil';
import type {
  AlterarMinhaSenhaDTO,
  SolicitarTrocaEmailDTO,
  ConfirmarTrocaEmailDTO,
} from '../types/meuPerfil';

export interface UseMeuPerfilReturn {
  perfil: ResponseMeuPerfilDTO | null;
  loading: boolean;
  error: string | null;
  /** Submitting isolado por operação para evitar travamento da UI */
  submittingSenha: boolean;
  submittingEmail: boolean;
  alterarSenha: (dto: AlterarMinhaSenhaDTO) => Promise<boolean>;
  solicitarTrocaEmail: (dto: SolicitarTrocaEmailDTO) => Promise<boolean>;
  confirmarTrocaEmail: (dto: ConfirmarTrocaEmailDTO) => Promise<boolean>;
}

export function useMeuPerfil(): UseMeuPerfilReturn {
  const request = useApi();

  const [perfil, setPerfil] = useState<ResponseMeuPerfilDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingSenha, setSubmittingSenha] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  // ─── Carga inicial dos dados do perfil ───
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMeuPerfil(request);
        if (!cancelled) setPerfil(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar os dados do perfil.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [request]);

  // ─── Alterar senha ───
  const alterarSenha = useCallback(
    async (dto: AlterarMinhaSenhaDTO): Promise<boolean> => {
      setSubmittingSenha(true);
      try {
        const res = await alterarSenhaService(request, dto);
        toastify.successMessage(res.message || 'Senha alterada com sucesso!');
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Erro ao alterar a senha.';
        toastify.errorMessage(msg, err);
        return false;
      } finally {
        setSubmittingSenha(false);
      }
    },
    [request],
  );

  // ─── Solicitar troca de e-mail ───
  const solicitarTrocaEmail = useCallback(
    async (dto: SolicitarTrocaEmailDTO): Promise<boolean> => {
      setSubmittingEmail(true);
      try {
        const res = await solicitarEmailService(request, dto);
        toastify.successMessage(
          res.message || 'Código de verificação enviado para o novo e-mail.',
        );
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Erro ao solicitar a troca de e-mail.';
        toastify.errorMessage(msg, err);
        return false;
      } finally {
        setSubmittingEmail(false);
      }
    },
    [request],
  );

  // ─── Confirmar troca de e-mail ───
  const confirmarTrocaEmail = useCallback(
    async (dto: ConfirmarTrocaEmailDTO): Promise<boolean> => {
      setSubmittingEmail(true);
      try {
        const res = await confirmarEmailService(request, dto);
        toastify.successMessage(res.message || 'E-mail alterado com sucesso!');
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Erro ao confirmar a troca de e-mail.';
        toastify.errorMessage(msg, err);
        return false;
      } finally {
        setSubmittingEmail(false);
      }
    },
    [request],
  );

  return {
    perfil,
    loading,
    error,
    submittingSenha,
    submittingEmail,
    alterarSenha,
    solicitarTrocaEmail,
    confirmarTrocaEmail,
  };
}
