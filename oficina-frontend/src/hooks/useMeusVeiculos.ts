/**
 * useMeusVeiculos.ts
 *
 * Hook que gerencia o estado e a paginação da listagem de veículos
 * do cliente autenticado. Suporta filtro por placa com debounce
 * para evitar chamadas excessivas à API durante a digitação.
 *
 * Endpoints:
 *  - GET /api/meu-perfil/veiculos?page=X&size=Y
 *  - GET /api/meu-perfil/veiculos/search/placa?placa=XXX&page=X&size=Y
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useApi } from './useApi';
import { fetchMeusVeiculos } from '../services/clientAreaService';

import type { ResponseVeiculoDTO } from '../types/veiculo';

const DEFAULT_PAGE_SIZE = 10;
/** Delay em ms para o debounce do campo de busca por placa */
const DEBOUNCE_DELAY_MS = 400;

export interface UseMeusVeiculosReturn {
  vehicles: ResponseVeiculoDTO[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  reload: () => void;
}

export function useMeusVeiculos(
  pageSize: number = DEFAULT_PAGE_SIZE,
  initialPlaca: string = '',
): UseMeusVeiculosReturn {
  const request = useApi();

  const [vehicles, setVehicles] = useState<ResponseVeiculoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  /** Valor digitado pelo usuário (imediato) */
  const [searchTerm, setSearchTerm] = useState<string>(() => initialPlaca);
  /** Valor efetivamente enviado à API (com debounce) */
  const [debouncedPlaca, setDebouncedPlaca] = useState<string>(() => initialPlaca.trim());

  // ─── Debounce do searchTerm ───
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedPlaca(searchTerm.trim()),
      DEBOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        const page = await fetchMeusVeiculos(request, {
          page: currentPage - 1, // backend usa 0-indexed
          size: pageSize,
          placa: debouncedPlaca || undefined,
        });

        if (!cancelled.value) {
          setVehicles(page.content);
          setTotalPages(page.total_pages ?? 1);
          setTotalElements(page.total_elements ?? page.content.length);
        }
      } catch (err: unknown) {
        if (!cancelled.value) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar veículos.';
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
    vehicles,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    reload,
  };
}
