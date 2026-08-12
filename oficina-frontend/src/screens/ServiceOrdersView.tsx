import React, { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { InlineAlert } from '../components/ui/InlineAlert';
import { LuSearch, LuPlus } from '../components/ui/Icons';
import { ITEMS_PER_PAGE_OPTIONS, STATUS_MAP } from '../utils/constants';
import ListWithPagination from '../features/ListWithPagination';
import ServiceOrderList from '../features/ServiceOrderList';
import { handleStatusChange } from '../utils/handleStatusChange';
import { toastify } from '../components/modules/SystemMessages';

import { ResponseOsDTO } from '../types/ordem_servico';

export const ServiceOrdersView: React.FC = () => {
  const [searchType, setSearchType] = useState<string>('cod_os');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const { navigate } = useNavigation();
  const api = useApi();

  const { filteredOrders: orders, loading: osLoading, error: osError, fetchOrders } = useServiceOrders({
    searchType,
    searchTerm,
    startDate,
    endDate,
    filterStatus
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <Card>
      <CardHeader
        className='h-16'
        actions={
          <Button onClick={() => navigate('clients', { selectClientForOS: true })}>
            <LuPlus className="mr-2 h-5 w-5" />
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
                setSearchTerm('');
                setSearchInput('');
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
                {/* <option value="cod_cliente">Código</option> */}
                <option value="nome_cliente">Nome</option>
              </optgroup>
            </Select>

            {searchType === 'intervalo_data' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                <span className="text-gray-500 text-sm font-medium px-1">até</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            ) : searchType === 'data' ? (
              <Input type="date" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto flex-grow" required />
            ) : (
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val.length >= 3 || val.length === 0) {
                    setSearchTerm(val);
                  }
                }}
                className="w-full sm:w-auto flex-grow"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="shrink-0"
            >
              <LuSearch className="mr-2 h-5 w-5" />
              Buscar
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-48 shrink-0">
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

            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
              <select className="border border-gray-300 rounded-md text-sm p-2 bg-white" value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}>
                {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        <InlineAlert error={osError} />

        {osLoading ? (
          <p>Carregando OS...</p>
        ) : (
          <ListWithPagination key={searchTerm + searchType + startDate + endDate + filterStatus} data={orders as ResponseOsDTO[]} itemsPerPage={itemsPerPage}>
            {(paginatedOrders: ResponseOsDTO[]) => (
              <ServiceOrderList
                orders={paginatedOrders}
                view="allOrders"
                api={api as any}
                onStatusChange={async (os: ResponseOsDTO, newStatus: string) => {handleStatusChange(os, newStatus, api as any, fetchOrders as any)}}
                onEdit={(os: ResponseOsDTO) => navigate('serviceOrderForm', { osId: os.cod_os, vehicleId: os.fk_cod_veiculo, clientId: os.fk_cod_cliente })}
                onDelete={(os: ResponseOsDTO) => {
                  if (window.confirm(`Excluir OS Nº ${os.cod_os}?`)) {
                    api(`/os/${os.cod_os}`, 'DELETE').then(fetchOrders as any).catch(err => toastify.errorMessage(err.message || "Erro ao excluir OS. Tente novamente.", err))
                  }
                }}
              />
            )}
          </ListWithPagination>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceOrdersView;
