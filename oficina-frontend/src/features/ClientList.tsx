import React from 'react';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { maskCpfCnpj, maskPhone, maskPlaca } from '../utils/masks';
import {
  StickyTableContainer,
  StickyActionHeader,
  StickyActionCell,
  StickyActionGroup
} from '../components/ui/StickyTable';

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
    <StickyTableContainer>
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">CPF/CNPJ</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Contato (Cel/Tel)</th>
            {searchType === 'placa' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Placa encontrada</th>}
            {renderActions && <StickyActionHeader className="border-b border-gray-200">Ações</StickyActionHeader>}
          </tr>
        </thead>
        <tbody className="bg-white">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={searchType === 'placa' ? (renderActions ? 5 : 4) : (renderActions ? 4 : 3)} className="border-b border-gray-200">
                <TableEmptyState message='Nenhum cliente encontrado' />
              </td>
            </tr>
          ) : (
            clients.map(client => (
              <tr key={client.cod_cliente} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">{client.nome_cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{maskCpfCnpj(client.cpf_cnpj, client.tipo) || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{client.celular ? maskPhone(client.celular) : (maskPhone(client.telefone) || '-')}</td>
                {searchType === 'placa' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold border-b border-gray-200">{maskPlaca(client.placa_encontrada) || '-'}</td>
                )}
                {renderActions && (
                  <StickyActionCell className="border-b border-gray-200">
                    <StickyActionGroup>
                      {renderActions(client)}
                    </StickyActionGroup>
                  </StickyActionCell>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </StickyTableContainer>
  );
};

export default ClientList;
