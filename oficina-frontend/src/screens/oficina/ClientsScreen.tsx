import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { PlusIcon, SearchIcon, EyeIcon } from '../../components/ui/Icons';
import { toastify } from '../../components/modules/SystemMessages';
import { ItemsPerPageSelector } from '../../components/ui/ItemsPerPageSelector';
import ListWithPagination from '../../features/ListWithPagination';
import ClientList from '../../features/ClientList';

import { ResponseClienteDTO } from '../../types/cliente';
import { Page } from '../../types/page';

export const ClientsScreen: React.FC = () => {
  const [clients, setClients] = useState<ResponseClienteDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const state = location.state || {};
  const { selectClientForOS, selectClientForVehicle } = state;

  const [searchType, setSearchType] = useState<string>(state.searchType || 'nome');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const isIdSearchType = (type: string) => type === 'cod_cliente';

  const {
    searchInput,
    setSearchInput,
    searchTerm,
    triggerSearch,
    resetSearch
  } = useDebouncedSearch({
    initialValue: state.searchTerm || '',
    isIdType: isIdSearchType,
    searchType
  });

  const navigate = useNavigate();
  const api = useApi();

  const fetchClients = useCallback(async (st: string, tipo: string, page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      let ep = `/clientes?page=${page - 1}&size=${size}`;
      if (st) ep = `/clientes/search?term=${encodeURIComponent(st)}&type=${tipo}&page=${page - 1}&size=${size}`;
      const d: Page<ResponseClienteDTO> = await api(ep);
      setClients(d.content || []);
      setTotalPages(d.total_pages || 1);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar clientes. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Carrega clientes conforme filtros, busca e paginação
  useEffect(() => {
    fetchClients(searchTerm, searchType, currentPage, itemsPerPage);
  }, [fetchClients, searchTerm, searchType, currentPage, itemsPerPage]);

  useEffect(() => {
    if (state?.action === 'new') navigate('/clientes/novo', { replace: true });
  }, [state, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const { hasChanged } = triggerSearch();
    if (!hasChanged) {
      fetchClients(searchTerm, searchType, 1, itemsPerPage);
    }
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
          <Button onClick={() => navigate('/clientes/novo')}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Novo cliente
          </Button>
        )}
      >
        {getViewTitle()}
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col items-center sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                resetSearch();
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados do cliente">
                <option value="cod_cliente">Código</option>
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
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto flex-grow"
            />
            <Button type="submit" variant="primary" className="shrink-0">
              <SearchIcon className="mr-2 h-5 w-5" /> Buscar
            </Button>
          </form>

          <ItemsPerPageSelector
            itemsPerPage={itemsPerPage}
            onChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
            className='w-full xl:w-auto justify-end'
          />
        </div>

        <InlineAlert message={error} />

        {loading ? (
          <p>Carregando clientes...</p>
        ) : (
          <ListWithPagination
            key={searchTerm + searchType}
            data={clients}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          >
            {(paginatedClients: any[]) => (
              <ClientList
                clients={paginatedClients}
                searchType={searchType}
                renderActions={(client: any) => {
                  if (selectClientForOS || selectClientForVehicle) {
                    return (
                      <Button
                        variant="floating"
                        className="bg-green-600 text-white hover:bg-green-700 border-green-600 text-xs font-semibold"
                        onClick={() => {
                          if (selectClientForVehicle) {
                            navigate(`/clientes/${client.cod_cliente}/editar`, { state: { scrollToVehicles: true, openVehicleModal: true } });
                          } else {
                            navigate(`/clientes/${client.cod_cliente}/editar`, { state: { scrollToVehicles: true } });
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
                      onClick={() => navigate(`/clientes/${client.cod_cliente}/editar`)}
                      title="Ver cliente"
                    >
                      <EyeIcon className="h-5 w-5" />
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

export default ClientsScreen;
