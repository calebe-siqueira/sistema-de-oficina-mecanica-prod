import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { PlusIcon, SearchIcon } from '../../components/ui/Icons';
import { toastify } from '../../components/modules/SystemMessages';
import { ItemsPerPageSelector } from '../../components/ui/ItemsPerPageSelector';
import ListWithPagination from '../../features/ListWithPagination';
import VehicleList from '../../features/VehicleList';
import { Page } from '../../types/page';

export const VehiclesScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchType, setSearchType] = useState<string>('placa');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const isIdSearchType = (type: string) => type === 'cod_cliente';

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

  const api = useApi();
  const navigate = useNavigate();

  const fetchVehicles = useCallback(async (st: string, tipo: string, page: number, size: number) => {
    setLoading(true);
    setError(null);

    try {
      let ep = `/veiculos?page=${page - 1}&size=${size}`;
      if (st) {
        ep = `/veiculos/search?term=${encodeURIComponent(st)}&type=${tipo}&page=${page - 1}&size=${size}`;
      }

      const data: Page<any> = await api(ep, "GET");
      setVehicles(data.content || []);
      setTotalPages(data.total_pages || 1);
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Erro ao carregar veículos. Verifique sua conexão e tente novamente.";
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchVehicles(searchTerm, searchType, currentPage, itemsPerPage);
  }, [fetchVehicles, searchTerm, searchType, currentPage, itemsPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const { hasChanged } = triggerSearch();
    if (!hasChanged) {
      fetchVehicles(searchTerm, searchType, 1, itemsPerPage);
    }
  };

  return (
    <Card>
      <CardHeader
        className='h-16'
        actions={
          <Button onClick={() => navigate('/clientes', { state: { selectClientForVehicle: true } })}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Novo veículo
          </Button>
        }
      >
        Veículos
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
          <p>Carregando veículos...</p>
        ) : (
          <ListWithPagination
            key={searchTerm + searchType}
            data={vehicles}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          >
            {(paginatedVehicles: any[]) => (
              <VehicleList
                vehicles={paginatedVehicles}
                extraColumns={[VehicleList.Columns.CLIENT, VehicleList.Columns.FUEL]}
                renderActions={(v) => (
                  <>
                    <VehicleList.CreateOsButton
                      onClick={() => {
                        navigate('/ordens-servico/nova', {
                          state: {
                            vehicleId: v.cod_veiculo,
                            clientId: v.fk_cod_cliente
                          }
                        });
                      }}
                    />
                    <VehicleList.ViewButton
                      onClick={() => {
                        navigate(`/clientes/${v.fk_cod_cliente}/editar`, {
                          state: {
                            scrollToVehicles: true,
                            osSearchType: 'cod_veiculo',
                            osSearchTerm: String(v.cod_veiculo)
                          }
                        });
                      }}
                    />
                  </>
                )}
              />
            )}
          </ListWithPagination>
        )}
      </CardContent>
    </Card>
  );
};

export default VehiclesScreen;
