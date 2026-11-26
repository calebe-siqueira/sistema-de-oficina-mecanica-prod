/**
 * useMeusDashboard.ts
 *
 * Hook que gerencia o estado do dashboard do cliente autenticado.
 * Busca dados de GET /api/meu-perfil/dashboard.
 *
 * Usa flag de cancelamento para prevenir atualizações de estado
 * após desmontagem do componente (memory-leak prevention).
 */

import { useState, useEffect } from 'react';

import { useApi } from './useApi';
import { fetchMeuDashboard } from '../services/clientAreaService';

import type { DashboardClienteDTO } from '../types/meuPerfil';

export interface UseMeuDashboardReturn {
  dashboard: DashboardClienteDTO | null;
  loading: boolean;
  error: string | null;
}

export function useMeuDashboard(): UseMeuDashboardReturn {
  const request = useApi();

  const [dashboard, setDashboard] = useState<DashboardClienteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMeuDashboard(request);
        if (!cancelled) setDashboard(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar os dados do dashboard.';
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

  return { dashboard, loading, error };
}
