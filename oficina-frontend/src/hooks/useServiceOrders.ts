import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './useApi';
import { toastify } from '../components/modules/SystemMessages';
import { formatSafeDate } from '../utils/date';
import { matchesNumber } from '../utils/filters';

import { ResponseOsDTO } from '../types/ordem_servico';

export interface UseServiceOrdersOptions {
  clientId?: number | string | null;
  searchType?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  filterStatus?: string;
}

export interface UseServiceOrdersReturn {
  orders: ResponseOsDTO[];
  filteredOrders: ResponseOsDTO[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
}

export function useServiceOrders(options: UseServiceOrdersOptions = {}): UseServiceOrdersReturn {
  const { clientId = null, searchType = '', searchTerm = '', startDate = '', endDate = '', filterStatus = 'Todas' } = options;
  const [orders, setOrders] = useState<ResponseOsDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const api = useApi();

  const fetchOrders = useCallback(async () => {
    if (clientId === 'new') {
      setLoading(false);
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const url = clientId ? `/clientes/${clientId}/os` : '/os';
      const d = await api(url);
      setOrders(Array.isArray(d) ? d as ResponseOsDTO[] : []);
      setError('');
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar OS. Verifique sua conexão e tente novamente.";
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [clientId, api]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let res = orders;

    // Filtra por status primeiro
    if (filterStatus && filterStatus !== 'Todas') {
      if (filterStatus.startsWith('pag_')) {
        const pagType = filterStatus.split('_')[1];
        res = res.filter(o => {
          const total = parseFloat(String(o.valor_total)) || 0;
          let desc = 0; const dVal = parseFloat(String(o.desconto)) || 0;
          if (o.tipo_desconto === 'P') desc = total * (dVal / 100);
          else if (o.tipo_desconto === 'V') desc = dVal;
          const finalTotal = Math.max(0, total - desc);
          const pago = parseFloat(String(o.valor_pago)) || 0;

          if (pagType === 'pago') return pago >= finalTotal && finalTotal > 0;
          if (pagType === 'pendente') return pago === 0 && finalTotal > 0;
          if (pagType === 'parcial') return pago > 0 && pago < finalTotal;
          return false;
        });
      } else {
        res = res.filter(o => String(o.status_servico) === filterStatus);
      }
    }

    // Filtra por termo (de acordo com o tipo)
    if (searchType === 'intervalo_data' && startDate && endDate) {
      res = res.filter(os => {
        if (!os.data_os) return false;
        const osDate = formatSafeDate(os.data_os);
        return osDate >= startDate && osDate <= endDate;
      });
    } else if (searchType === 'data' && searchTerm) {
      res = res.filter(os => {
        if (!os.data_os) return false;
        const osDate = formatSafeDate(os.data_os);
        return osDate === searchTerm;
      });
    } else if (searchType !== 'intervalo_data' && searchType !== 'data' && searchTerm) {
      const term = searchTerm.toLowerCase();
      res = res.filter(os => {
        switch (searchType) {
          // Dados do veículo
          case 'placa': return (os.placa || '').toLowerCase().includes(term);
          case 'modelo': return (os.modelo?.nome_modelo || '').toLowerCase().includes(term);
          case 'montadora': return (os.modelo?.montadora?.nome_montadora || '').toLowerCase().includes(term);
          case 'ano': return matchesNumber(os.ano, term);
          case 'cor': return (os.cor || '').toLowerCase().includes(term);
          case 'cod_veiculo': return matchesNumber(os.fk_cod_veiculo, term);
          // Dados da OS
          case 'cod_os': return matchesNumber(os.cod_os, term);
          // Dados do cliente
          case 'nome_cliente': return (os.nome_cliente || '').toLowerCase().includes(term);
          default: return true;
        }
      });
    }

    return res;
  }, [orders, searchType, searchTerm, startDate, endDate, filterStatus]);

  return {
    orders,
    filteredOrders,
    loading,
    error,
    fetchOrders
  };
}
