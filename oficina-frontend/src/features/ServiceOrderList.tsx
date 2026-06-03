// src/components/ServiceOrderList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { STATUS_MAP } from '../utils/constants';
import { handleStatusChange } from '../utils/handleStatusChange';
import { maskPlaca } from '../utils/maskPlaca';

import Button from '../components/Button';
import { LuSquarePen, LuTrash2 } from '../components/Icons';

import { useApi } from '../App';
import { formatSafeDate } from '../App';

// --- Tipagem das Props ---
interface ServiceOrderListProps {
  clientId?: string | number | null;
  searchType: string;
  searchTerm: string;
  startDate?: string;
  endDate?: string;
  filterStatus?: string;
  itemsPerPage?: number;
  onEdit: (os: any) => void;
  view?: string;
}

// --- Service Order List (Embedded in Client) ---
interface ServiceOrder {
  cod_OS: number | string;
  nome_cliente?: string;
  montadora?: string;
  modelo?: string;
  placa?: string;
  ano?: number;
  cor?: string;
  data_OS?: string;
  status_servico?: number;
  valor_total?: number | string;
  desconto?: number | string;
  tipo_desconto?: string;
  valor_pago?: number | string;
  fk_cod_veiculo?: number | string;
  cod_veiculo?: number | string;
}

const ServiceOrderList: React.FC<ServiceOrderListProps> = ({ clientId, searchType, searchTerm, startDate, endDate, filterStatus, itemsPerPage: itemsPerPageProp, onEdit, view }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(25);
  const api = useApi();

  const fetchOrders = useCallback(async () => {
    if (clientId === 'new') { setLoading(false); return; }
    try {
      const url = clientId ? `/clientes/${clientId}/os` : '/os';
      const d = await api(url) as ServiceOrder[];
      setOrders(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [clientId, api]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let res = orders;

    // Filter by status first
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

    // Filter by term
    if (searchType === 'intervalo_data' && startDate && endDate) {
        res = res.filter(os => {
            if (!os.data_OS) return false;
            const osDate = formatSafeDate(os.data_OS);
            return osDate >= startDate && osDate <= endDate;
        });
    } else if (searchType === 'data' && searchTerm) {
        res = res.filter(os => {
            if (!os.data_OS) return false;
            const osDate = formatSafeDate(os.data_OS);
            return osDate === searchTerm;
        });
    } else if (searchType !== 'intervalo_data' && searchType !== 'data' && searchTerm) {
        const term = searchTerm.toLowerCase();
        res = res.filter(os => {
            switch (searchType) {
                // Dados do Veículo
                case 'placa': return (os.placa || '').toLowerCase().includes(term);
                case 'modelo': return (os.modelo || '').toLowerCase().includes(term);
                case 'montadora': return (os.montadora || '').toLowerCase().includes(term);
                case 'ano': return String(os.ano || '').includes(term);
                case 'cor': return (os.cor || '').toLowerCase().includes(term);
                case 'cod_veiculo': return String(os.fk_cod_veiculo || os.cod_veiculo || '').includes(term);

                // Dados da OS
                case 'cod_OS': return String(os.cod_OS).includes(term);

                // Dados do Cliente
                case 'nome_cliente': return (os.nome_cliente || '').toLowerCase().includes(term);
                default: return true;
            }
        });
    }

    return res;
  }, [orders, searchType, searchTerm, startDate, endDate, filterStatus]);

  useEffect(() => {
    setVisibleCount(itemsPerPageProp || 25);
  }, [filteredOrders, itemsPerPageProp]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  const noOrdersMessage = clientId ? "Nenhuma OS para este cliente." : "Nenhuma OS encontrada.";

  if (loading) return <p>Carregando OS...</p>;
  if (!Array.isArray(orders) || orders.length === 0) return <p className="text-gray-500">{noOrdersMessage}</p>;
  if (filteredOrders.length === 0) return <p className="text-gray-500">Nenhuma OS encontrada para o filtro atual.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS Nº</th>
              {/* Exibe o cabeçalho da coluna de cliente apenas se estiver na listagem geral de OS */}
              {view !== "osListForClient" && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="sticky right-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase z-10 w-[66px] sm:w-[125px]">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleOrders.map(os => (
              <tr key={os.cod_OS} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold">{os.cod_OS}</td>
                {/* Exibe o nome do cliente apenas se estiver na listagem geral de OS */}
                {view !== "osListForClient" && (
                  <td className="px-4 py-3 text-sm">{os.nome_cliente}</td>
                )}
                <td className="px-4 py-3 text-sm">{os.modelo} ({maskPlaca(os.placa)})</td>
                <td className="px-4 py-3 text-sm">{os.data_OS ? formatSafeDate(os.data_OS).split('-').reverse().join('/') : '-'}</td>
                {/* Exibe o seletor de status */}
                <td className="px-4 py-3 text-sm">
                  <select
                    title='Alterar status da OS'
                    value={os.status_servico}
                    onChange={(e) => handleStatusChange(os, e.target.value, api, fetchOrders)}
                    className={`text-xs font-semibold rounded-full px-2 py-1 border border-gray-300 focus:ring-0 cursor-pointer ${os.status_servico == 4 ? 'bg-green-100 text-green-800' : os.status_servico == 5 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm">R$ {parseFloat(String(os.valor_total || 0)).toFixed(2)}</td>
                
                <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[125px] text-left z-10">
                  <div className="flex flex-col w-[66px] sm:min-w-[125px] sm:flex-row sm:items-center gap-2">
                    <Button
                      variant="floating" 
                      title='Editar OS' 
                      className="bg-white hover:bg-blue-50 hover:text-blue-900" 
                      onClick={() => onEdit(os)}
                    >
                      <LuSquarePen className="h-5 w-5" /> 
                    </Button>
                    <Button
                      variant="floating" 
                      title='Excluir OS' 
                      className="bg-white text-red-600 hover:bg-red-50 hover:text-red-500" 
                      onClick={() => {
                        if (window.confirm(`Excluir OS Nº ${os.cod_OS}?`)) {
                          api(`/os/${os.cod_OS}`, 'DELETE').then(fetchOrders).catch(e => alert(e.message))
                        }
                      }}
                    >
                        <LuTrash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleCount < filteredOrders.length && (
        <div className="flex justify-center mt-4 pb-4">
          <Button variant="secondary" onClick={() => setVisibleCount(prev => prev + (itemsPerPageProp || 25))}>
            Mostrar mais {itemsPerPageProp || 25} registros
          </Button>
        </div>
      )}
    </>
  );

};

export default ServiceOrderList;

