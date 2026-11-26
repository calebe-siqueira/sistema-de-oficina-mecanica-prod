import React from 'react';

import { STATUS_MAP } from '../utils/constants';
import { formatCurrency, maskPlaca } from '../utils/masks';
import { formatDateBR } from '../utils/date';

import Button from '../components/ui/Button';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { EditIcon } from '../components/ui/Icons';
import {
  StickyTableContainer,
  StickyActionHeader,
  StickyActionCell,
  StickyActionGroup
} from '../components/ui/StickyTable';

import { ResponseOsDTO } from '../types/ordem_servico';

export interface ServiceOrderListProps {
  orders: ResponseOsDTO[];
  view?: string;
  clientId?: string | number | null;
  noOrdersMessage?: string;
  api?: any; // necessário para alteração de status
  onEdit?: (os: ResponseOsDTO) => void;
  onStatusChange?: (os: ResponseOsDTO, newStatus: string) => void;
}

const ServiceOrderList: React.FC<ServiceOrderListProps> = ({
  orders = [],
  view,
  clientId,
  noOrdersMessage,
  onEdit,
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
  };

  return (
    <StickyTableContainer>
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">OS Nº</th>
            {/* Exibe o cabeçalho da coluna de cliente apenas se estiver na listagem geral de OS */}
            {view !== "osListForClient" && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Cliente</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Veículo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Total</th>
            <StickyActionHeader className="border-b border-gray-200">Ações</StickyActionHeader>
          </tr>
        </thead>
        <tbody className="bg-white">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={view !== 'osListForClient' ? 7 : 6} className="border-b border-gray-200">
                <TableEmptyState message={finalNoOrdersMessage} />
              </td>
            </tr>
          ) : orders.map((os: ResponseOsDTO) => (
            <tr key={os.cod_os} className="hover:bg-gray-50 group">
              <td className="px-4 py-3 text-sm font-semibold border-b border-gray-200">{os.cod_os}</td>
              {view !== "osListForClient" && (
                <td className="px-4 py-3 text-sm border-b border-gray-200">{os.nome_cliente}</td>
              )}
              <td className="px-4 py-3 text-sm capitalize truncate border-b border-gray-200">
                {maskPlaca(os.placa || '')} <br />
                {os.modelo?.montadora?.nome_montadora} {os.modelo?.nome_modelo} <br />
                <span className="text-xs text-gray-500 capitalize">{os.cor} - {String(os.ano || '').substring(0, 4)}</span>
              </td>
              <td className="px-4 py-3 text-sm border-b border-gray-200">{formatDateBR(os.data_os, '-')}</td>
              <td className="px-4 py-3 text-sm border-b border-gray-200">
                <select
                  title='Alterar status da OS'
                  value={os.status_servico}
                  onChange={(e) => onStatusChange && onStatusChange(os, e.target.value)}
                  className={`text-xs font-semibold rounded-full px-2 py-1 border border-gray-300 focus:ring-0 cursor-pointer ${colorStatusOS(os.status_servico ? os.status_servico : 0)}`}
                >
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-sm border-b border-gray-200">{formatCurrency(os.valor_total)}</td>

              <StickyActionCell className="border-b border-gray-200">
                <StickyActionGroup>
                  {onEdit && (
                    <Button
                      variant="floating"
                      title='Editar OS'
                      className="bg-white hover:bg-blue-50 hover:text-blue-900"
                      onClick={() => onEdit(os)}
                    >
                      <EditIcon className="h-5 w-5" />
                    </Button>
                  )}
                </StickyActionGroup>
              </StickyActionCell>
            </tr>
          ))}
        </tbody>
      </table>
    </StickyTableContainer>
  );
};

export default ServiceOrderList;
