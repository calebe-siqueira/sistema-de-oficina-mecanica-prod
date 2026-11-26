import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { SearchIcon, PlusIcon } from '../../components/ui/Icons';
import { STATUS_MAP } from '../../utils/constants';
import { ItemsPerPageSelector } from '../../components/ui/ItemsPerPageSelector';
import ListWithPagination from '../../features/ListWithPagination';
import ServiceOrderList from '../../features/ServiceOrderList';
import { handleStatusChange } from '../../utils/handleStatusChange';
import { toastify } from '../../components/modules/SystemMessages';

import { getLocalTodayString } from '../../utils/date';
import { ResponseOsDTO } from '../../types/ordem_servico';

export const ServiceOrdersScreen: React.FC = () => {
  const [searchType, setSearchType] = useState<string>('cod_os');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tipos de busca numérica/por ID: não exigem mínimo de caracteres
  const isIdSearchType = (type: string) =>
    type === 'cod_os' || type === 'cod_cliente' || type === 'cod_veiculo';

  const {
    searchInput,
    setSearchInput,
    searchTerm,
    triggerSearch,
    resetSearch
  } = useDebouncedSearch({
    initialValue: '',
    isIdType: isIdSearchType,
    searchType
  });

  const navigate = useNavigate();
  const api = useApi();

  const { orders, loading: osLoading, error: osError, fetchOrders, totalPages } = useServiceOrders({
    searchType,
    searchTerm,
    startDate,
    endDate,
    filterStatus,
    page: currentPage,
    size: itemsPerPage
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);

    // UX inteligente para busca por intervalo de datas:
    // Se preencheu apenas a data inicial e clicou em buscar, preenche a data final com a data atual
    if (searchType === 'intervalo_data') {
      let finalEndDate = endDate;
      if (startDate && !endDate) {
        finalEndDate = getLocalTodayString();
        setEndDate(finalEndDate);
      }

      if (startDate && finalEndDate && startDate > finalEndDate) {
        toastify.warningMessage('A data inicial não pode ser posterior à data final.');
        return;
      }
    }

    const { hasChanged } = triggerSearch();
    // Se o termo já era o mesmo (ex: debounce já havia rodado ou clique repetido no botão),
    // o useEffect do useServiceOrders não detectará mudança em searchTerm.
    // Disparamos fetchOrders() diretamente para garantir a execução imediata da busca solicitada.
    if (!hasChanged) {
      fetchOrders();
    }
  };

  return (
    <Card>
      <CardHeader
        className='h-16'
        actions={
          <Button onClick={() => navigate('/clientes', { state: { selectClientForOS: true } })}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Nova OS
          </Button>
        }
      >
        Ordens de Serviço
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                resetSearch();
                setStartDate('');
                setEndDate('');
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados da OS">
                <option value="cod_os">Código</option>
                <option value="data">Data</option>
                <option value="intervalo_data">Intervalo de datas</option>
              </optgroup>
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
                <option value="montadora">Montadora</option>
                <option value="modelo">Modelo</option>
                <option value="ano">Ano</option>
                <option value="cor">Cor</option>
              </optgroup>
              <optgroup label="Dados do cliente">
                <option value="cod_cliente">Código</option>
                <option value="nome_cliente">Nome</option>
              </optgroup>
            </Select>

            {searchType === 'intervalo_data' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                <span className="text-gray-500 text-sm font-medium px-1">até</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            ) : searchType === 'data' ? (
              <Input type="date" value={searchInput} onChange={e => setSearchInput(e.target.value)} className="w-full sm:w-auto flex-grow" required />
            ) : (
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                }}
                className="w-full sm:w-auto flex-grow"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="shrink-0"
            >
              <SearchIcon className="mr-2 h-5 w-5" />
              Buscar
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <option value="Todas">Todos os status</option>
              <optgroup label="Status da ordem">
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={`ord_${k}`} value={k}>{v.text}</option>)}
              </optgroup>
              <optgroup label="Status de pagamento">
                <option value="pag_pendente">Pagamento pendente</option>
                <option value="pag_parcial">Pago parcialmente</option>
                <option value="pag_pago">Pago integralmente</option>
              </optgroup>
            </Select>

            <ItemsPerPageSelector
              itemsPerPage={itemsPerPage}
              onChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <InlineAlert message={osError} />

        {osLoading ? (
          <p>Carregando OS...</p>
        ) : (
          <ListWithPagination
            key={searchTerm + searchType + startDate + endDate + filterStatus}
            data={orders as ResponseOsDTO[]}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          >
            {(paginatedOrders: ResponseOsDTO[]) => (
              <ServiceOrderList
                orders={paginatedOrders}
                view="allOrders"
                api={api as any}
                onStatusChange={async (os: ResponseOsDTO, newStatus: string) => { handleStatusChange(os, newStatus, api as any, fetchOrders as any) }}
                onEdit={(os: ResponseOsDTO) => navigate(`/ordens-servico/${os.cod_os}/editar`, { state: { vehicleId: os.fk_cod_veiculo, clientId: os.fk_cod_cliente } })}
              />
            )}
          </ListWithPagination>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceOrdersScreen;
