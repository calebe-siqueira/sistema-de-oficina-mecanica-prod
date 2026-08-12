import React from 'react';

import { STATUS_MAP } from '../utils/constants';
import { maskPlaca } from '../utils/masks';
import { formatSafeDate } from '../utils/date';

import Button from '../components/ui/Button';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { LuSquarePen, LuTrash2 } from '../components/ui/Icons';

import { ResponseOsDTO } from '../types/ordem_servico';

export interface ServiceOrderListProps {
  orders: ResponseOsDTO[];
  view?: string;
  clientId?: string | number | null;
  noOrdersMessage?: string;
  api?: any; // necessário para alteração de status
  onEdit?: (os: ResponseOsDTO) => void;
  onDelete?: (os: ResponseOsDTO) => void;
  onStatusChange?: (os: ResponseOsDTO, newStatus: string) => void;
}

const ServiceOrderList: React.FC<ServiceOrderListProps> = ({
  orders = [],
  view,
  clientId,
  noOrdersMessage,
  onEdit,
  onDelete,
  onStatusChange
}) => {

  const finalNoOrdersMessage = noOrdersMessage ? noOrdersMessage : "Nenhuma OS encontrada";

  const colorStatusOS = (status: number | string) => {
    switch (Number(status)) {
      case 1: return 'bg-gray-100 text-gray-800'; // Orçamento
      case 2: return 'bg-blue-100 text-blue-800'; // OS aberta
      case 3: return 'bg-yellow-100 text-yellow-800'; // Em andamento
      case 4: return 'bg-green-100 text-green-800'; // Finalizada
      case 5: return 'bg-red-100 text-red-800'; // Cancelada
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
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
          {orders.length === 0 ? (
            <tr>
              <td colSpan={view !== 'osListForClient' ? 7 : 6}>
                <TableEmptyState message={finalNoOrdersMessage} />
              </td>
            </tr>
          ) : orders.map((os: ResponseOsDTO) => (
            <tr key={os.cod_os} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold">{os.cod_os}</td>
              {view !== "osListForClient" && (
                <td className="px-4 py-3 text-sm">{os.nome_cliente}</td>
              )}
              <td className="px-4 py-3 text-sm capitalize truncate">
                {maskPlaca(os.placa || '')} <br />
                {os.modelo?.montadora?.nome_montadora} {os.modelo?.nome_modelo} <br />
                <span className="text-xs text-gray-500 capitalize">{os.cor} - {String(os.ano || '').substring(0, 4)}</span>
              </td>
              {/* <td className="px-4 py-3 text-sm">{os.nome_modelo} ({maskPlaca(os.placa || '')})</td> */}
              <td className="px-4 py-3 text-sm">{os.data_os ? formatSafeDate(os.data_os).split('-').reverse().join('/') : '-'}</td>
              <td className="px-4 py-3 text-sm">
                <select
                  title='Alterar status da OS'
                  value={os.status_servico}
                  onChange={(e) => onStatusChange && onStatusChange(os, e.target.value)}
                  className={`text-xs font-semibold rounded-full px-2 py-1 border border-gray-300 focus:ring-0 cursor-pointer ${colorStatusOS(os.status_servico ? os.status_servico : 0)}`}
                >
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-sm">R$ {parseFloat(String(os.valor_total || 0)).toFixed(2)}</td>

              <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[125px] text-left z-10">
                <div className="flex flex-col w-[66px] sm:min-w-[125px] sm:flex-row sm:items-center gap-2">
                  {onEdit && (
                    <Button
                      variant="floating"
                      title='Editar OS'
                      className="bg-white hover:bg-blue-50 hover:text-blue-900"
                      onClick={() => onEdit(os)}
                    >
                      <LuSquarePen className="h-5 w-5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="floating"
                      title='Excluir OS'
                      className="bg-white text-red-600 hover:bg-red-50 hover:text-red-500"
                      onClick={() => onDelete(os)}
                    >
                      <LuTrash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceOrderList;

