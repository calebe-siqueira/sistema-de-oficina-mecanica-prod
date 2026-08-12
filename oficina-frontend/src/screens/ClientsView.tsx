import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { InlineAlert } from '../components/ui/InlineAlert';
import { LuPlus, LuSearch, LuEye } from '../components/ui/Icons';
import { toastify } from '../components/modules/SystemMessages';
import { ITEMS_PER_PAGE_OPTIONS } from '../utils/constants';
import ListWithPagination from '../features/ListWithPagination';
import ClientList from '../features/ClientList';

import { ResponseClienteDTO } from '../types/cliente';

interface ClientsViewProps {
  params: any;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ params }) => {
  const [clients, setClients] = useState<ResponseClienteDTO[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [searchType, setSearchType] = useState<string>(params.searchType || 'nome');
  const [searchInput, setSearchInput] = useState<string>(params.searchTerm || '');
  const [searchTerm, setSearchTerm] = useState<string>(params.searchTerm || '');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const { navigate } = useNavigation();
  const api = useApi();
  const { selectClientForOS } = params;
  const { selectClientForVehicle } = params;

  const fetchClients = useCallback(async (st: string, tipo: string) => {
    setLoading(true);
    setError('');
    try {
      let ep = '/clientes';
      if (st) ep = `/clientes/search?term=${encodeURIComponent(st)}&type=${tipo}`;
      const d = await api(ep);
      setClients(Array.isArray(d) ? d : []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar clientes. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchClients(searchTerm, searchType);
  }, [fetchClients, searchTerm, searchType]);

  useEffect(() => {
    if (params?.action === 'new') navigate('clientForm', { clientId: 'new' });
  }, [params, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchClients(searchTerm, searchType);
  };

  const getViewTitle = () => {
    if (selectClientForOS) return 'Selecione um cliente para a OS';
    if (selectClientForVehicle) return 'Selecione um cliente para o veículo';
    return 'Clientes';
  };

  return (
    <Card>
      <CardHeader
        className='h-16'
        actions={!(selectClientForOS || selectClientForVehicle) && (
          <Button onClick={() => navigate('clientForm', { clientId: 'new' })}>
            <LuPlus className="mr-2 h-5 w-5" />
            Novo cliente
          </Button>
        )}
      >
        {getViewTitle()}
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchTerm('');
                setSearchInput('');
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados do cliente">
                {/* <option value="cod_cliente">Código</option> */}
                <option value="nome">Nome</option>
                <option value="cpf_cnpj">CPF/CNPJ</option>
                <option value="telefone">Celular/Telefone</option>
              </optgroup>
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
              </optgroup>
            </Select>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val); // Seta o valor digitado no input
                if (val.length >= 3 || val.length === 0) {
                  setSearchTerm(val); // Seta o valor da busca quando tiver pelo menos 3 caracteres
                }
              }}
              className="w-full sm:w-auto flex-grow"
            />
            <Button type="submit" variant="primary" className="shrink-0">
              <LuSearch className="mr-2 h-5 w-5" /> Buscar
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
              <select
                className="border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
              >
                {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        <InlineAlert error={error} />

        {loading ? (
          <p>Carregando clientes...</p>
        ) : (
          <ListWithPagination key={searchTerm + searchType} data={clients} itemsPerPage={itemsPerPage}>
            {(paginatedClients: any[]) => (
              <ClientList
                clients={paginatedClients}
                searchType={searchType}
                renderActions={(client: any) => {
                  if (selectClientForOS || selectClientForVehicle) {
                    return (
                      <Button
                        variant="floating"
                        className="bg-green-600 text-white hover:bg-green-700 text-xs py-2.5 px-3"
                        onClick={() => {
                          if (selectClientForVehicle) {
                            navigate('clientForm', { clientId: client.cod_cliente, scrollToVehicles: true, openVehicleModal: true });
                          } else {
                            navigate('clientForm', { clientId: client.cod_cliente, scrollToVehicles: true });
                          }
                        }}
                      >
                        Selecionar
                      </Button>
                    );
                  }
                  return (
                    <Button
                      variant="floating"
                      className="bg-white hover:bg-blue-50 hover:text-blue-900"
                      onClick={() => navigate('clientForm', { clientId: client.cod_cliente })}
                      title="Ver cliente"
                    >
                      <LuEye className="h-5 w-5" />
                    </Button>
                  );
                }}
              />
            )}
          </ListWithPagination>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsView;
