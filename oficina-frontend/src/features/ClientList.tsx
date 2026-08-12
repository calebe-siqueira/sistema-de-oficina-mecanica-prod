import React from 'react';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { maskCpf, maskCnpj, maskPhone, maskPlaca } from '../utils/masks';

export interface ClientListProps {
  clients: any[];
  searchType?: string;
  renderActions?: (client: any) => React.ReactNode;
}

const ClientList: React.FC<ClientListProps> = ({
  clients = [],
  searchType,
  renderActions
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF/CNPJ</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato (Cel/Tel)</th>
            {searchType === 'placa' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa encontrada</th>}
            <th className="sticky right-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase z-10 w-[66px] sm:w-[125px]">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={searchType === 'placa' ? 5 : 4}>
                <TableEmptyState message='Nenhum cliente encontrado' />
              </td>
            </tr>
          ) : (
            clients.map(client => (
              <tr key={client.cod_cliente} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.nome_cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.tipo === 'F' ? maskCpf(client.cpf_cnpj) : maskCnpj(client.cpf_cnpj)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.celular ? maskPhone(client.celular) : (maskPhone(client.telefone) || '-')}</td>
                {searchType === 'placa' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">{maskPlaca(client.placa_encontrada) || '-'}</td>
                )}
                <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[125px] text-left z-10">
                  <div className="flex flex-col w-[66px] sm:min-w-[125px] sm:flex-row sm:items-center gap-2">
                    {/* Injeta dinamicamente o botão e a ação que será renderizada para cada item da lista de clientes (OCP) */}
                    {renderActions && renderActions(client)}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientList;
