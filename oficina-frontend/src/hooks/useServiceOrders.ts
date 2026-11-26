import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { toastify } from '../components/modules/SystemMessages';
import { ResponseOsDTO } from '../types/ordem_servico';

export interface UseServiceOrdersOptions {
  clientId?: number | string | null;
  searchType?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  filterStatus?: string;
  page?: number;
  size?: number;
}

export interface UseServiceOrdersReturn {
  orders: ResponseOsDTO[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  totalPages: number;
  totalElements: number;
}

/**
 * Hook unificado para busca e gerenciamento paginado de Ordens de Serviço.
 * Toda a busca, filtragem e paginação ocorrem no backend via /os/search.
 */
export function useServiceOrders(options: UseServiceOrdersOptions = {}): UseServiceOrdersReturn {
  const {
    clientId = null,
    searchType = '',
    searchTerm = '',
    startDate = '',
    endDate = '',
    filterStatus = 'Todas',
    page = 1,
    size = 25
  } = options;

  const [orders, setOrders] = useState<ResponseOsDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const prevServerParamsRef = useRef<string>('');

  const fetchOrders = useCallback(async () => {
    if (clientId === 'new') {
      setLoading(false);
      setOrders([]);
      setTotalPages(1);
      setTotalElements(0);
      return;
    }

    setLoading(true);
    try {
      let url = `/os/search?page=${page - 1}&size=${size}`;
      if (clientId) url += `&clienteId=${clientId}`;
      if (searchType && searchType !== 'intervalo_data') url += `&type=${searchType}`;
      if (searchTerm) url += `&term=${encodeURIComponent(searchTerm)}`;
      if (startDate) url += `&dataInicio=${startDate}`;
      if (endDate) url += `&dataFim=${endDate}`;
      if (filterStatus && filterStatus !== 'Todas') url += `&status=${filterStatus}`;

      const d = await api(url);
      if (d && d.content) {
        setOrders(d.content);
        setTotalPages(d.total_pages || 1);
        setTotalElements(d.total_elements || 0);
      } else {
        setOrders(Array.isArray(d) ? (d as ResponseOsDTO[]) : []);
        setTotalPages(1);
        setTotalElements(0);
      }
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar OS. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [clientId, page, size, searchType, searchTerm, startDate, endDate, filterStatus, api]);

  useEffect(() => {
    // Para busca por intervalo de datas, a busca automática só ocorre quando
    // ambas as datas estão preenchidas (ou ambas limpas)
    if (searchType === 'intervalo_data') {
      const bothFilled = Boolean(startDate && endDate);
      const neitherFilled = Boolean(!startDate && !endDate);
      if (!bothFilled && !neitherFilled) {
        return;
      }
    }

    const serverKey = `${clientId || ''}_${searchType}_${searchTerm}_${startDate}_${endDate}_${filterStatus}_${page}_${size}`;
    if (prevServerParamsRef.current !== serverKey) {
      prevServerParamsRef.current = serverKey;
      fetchOrders();
    }
  }, [clientId, searchType, searchTerm, startDate, endDate, filterStatus, page, size, fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    totalPages,
    totalElements
  };
}
