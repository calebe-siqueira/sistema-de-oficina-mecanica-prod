/**
 * useMeusServiceOrders.ts
 *
 * Hook que gerencia a listagem paginada das ordens de serviço do cliente
 * autenticado. Suporta filtro opcional por placa de veículo.
 *
 * Endpoints:
 *  - GET /api/meu-perfil/os?page=X&size=Y
 *  - GET /api/meu-perfil/os/veiculo?placa=XXX&page=X&size=Y
 */

import { useState, useEffect, useCallback } from 'react';

import { useApi } from './useApi';
import { fetchMinhasOs } from '../services/clientAreaService';

import type { ResponseOsDTO } from '../types/ordem_servico';

const DEFAULT_PAGE_SIZE = 10;
/** Delay em ms para o debounce do campo de busca por placa */
const DEBOUNCE_DELAY_MS = 400;

export interface UseMeusServiceOrdersReturn {
  orders: ResponseOsDTO[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  setCurrentPage: (page: number) => void;
  /** Termo de busca / filtro por placa */
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  /** Filtro por placa de veículo (alias para searchTerm) */
  placaFilter: string;
  setPlacaFilter: (placa: string) => void;
  reload: () => void;
}

export function useMeusServiceOrders(
  pageSize: number = DEFAULT_PAGE_SIZE,
  initialPlaca: string = '',
): UseMeusServiceOrdersReturn {
  const request = useApi();

  const [orders, setOrders] = useState<ResponseOsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  /** Valor digitado pelo usuário (imediato) */
  const [placaFilter, setPlacaFilter] = useState<string>(() => initialPlaca);
  /** Valor efetivamente enviado à API (com debounce) */
  const [debouncedPlaca, setDebouncedPlaca] = useState<string>(() => initialPlaca.trim());

  // ─── Debounce do placaFilter ───
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedPlaca(placaFilter.trim()),
      DEBOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [placaFilter]);

  // Ao mudar o filtro, volta para a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedPlaca]);

  // ─── Fetch ───
  const fetchData = useCallback(
    async (cancelled: { value: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const page = await fetchMinhasOs(request, {
          page: currentPage - 1, // backend usa 0-indexed
          size: pageSize,
          placa: debouncedPlaca || undefined,
        });

        if (!cancelled.value) {
          setOrders(page.content);
          setTotalPages(page.total_pages ?? 1);
          setTotalElements(page.total_elements ?? page.content.length);
        }
      } catch (err: unknown) {
        if (!cancelled.value) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar ordens de serviço.';
          setError(msg);
        }
      } finally {
        if (!cancelled.value) setLoading(false);
      }
    },
    [request, currentPage, pageSize, debouncedPlaca],
  );

  useEffect(() => {
    const cancelled = { value: false };
    fetchData(cancelled);
    return () => {
      cancelled.value = true;
    };
  }, [fetchData]);

  const reload = useCallback(() => {
    const cancelled = { value: false };
    fetchData(cancelled);
  }, [fetchData]);

  return {
    orders,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    searchTerm: placaFilter,
    setSearchTerm: setPlacaFilter,
    placaFilter,
    setPlacaFilter,
    reload,
  };
}
