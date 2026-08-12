import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { InlineAlert } from '../components/ui/InlineAlert';
import { LuPlus, LuSearch } from '../components/ui/Icons';
import { toastify } from '../components/modules/SystemMessages';
import { ITEMS_PER_PAGE_OPTIONS } from '../utils/constants';
import { matchesNumber } from '../utils/filters';
import ListWithPagination from '../features/ListWithPagination';
import VehicleList from '../features/VehicleList';

export const VehiclesView: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [searchType, setSearchType] = useState<string>('placa');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const api = useApi();
  const { navigate } = useNavigation();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/veiculos');
      const arr = Array.isArray(data) ? data : [];
      setVehicles(arr);
      setFilteredVehicles(arr);
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar veículos. Verifique sua conexão e tente novamente.";
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const res = vehicles.filter(v => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      switch (searchType) {
        case 'placa': return (v.placa || '').toLowerCase().includes(term);
        case 'montadora': return (v.montadora || '').toLowerCase().includes(term);
        case 'modelo': return (v.modelo || '').toLowerCase().includes(term);
        case 'ano': return matchesNumber(v.ano, term);
        case 'cor': return (v.cor || '').toLowerCase().includes(term);
        case 'nome_cliente': return (v.nome_cliente || '').toLowerCase().includes(term);
        default: return true;
      }
    });
    setFilteredVehicles(res);
  }, [searchTerm, searchType, vehicles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <Card>
      <CardHeader
        className='h-16'
        actions={
          <Button onClick={() => navigate('clients', { selectClientForVehicle: true })}>
            <LuPlus className="mr-2 h-5 w-5" />
            Novo veículo
          </Button>
        }
      >
        Veículos
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

            <Button type="submit" variant="primary" className="shrink-0">
              <LuSearch className="mr-2 h-5 w-5" /> Buscar
            </Button>
          </form>

          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
            <select
              className="border border-gray-300 rounded-md text-sm p-2 bg-white"
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
            >
              {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <InlineAlert error={error} />

        {loading ? (
          <p>Carregando veículos...</p>
        ) : (
          <ListWithPagination key={searchTerm + searchType} data={filteredVehicles} itemsPerPage={itemsPerPage}>
            {(paginatedVehicles: any[]) => (
              <VehicleList
                vehicles={paginatedVehicles}
                view="vehicles"
                onCreateOs={(v: any) => {
                  navigate('serviceOrderForm', {
                    osId: 'new',
                    vehicleId: v.cod_veiculo,
                    clientId: v.fk_cod_cliente
                  });
                }}
                onViewVehicle={(v: any) => {
                  navigate('clientForm', {
                    clientId: v.fk_cod_cliente,
                    scrollToVehicles: true,
                    osSearchType: 'cod_veiculo',
                    osSearchTerm: String(v.cod_veiculo)
                  });
                }}
              />
            )}
          </ListWithPagination>
        )}
      </CardContent>
    </Card>
  );
};

export default VehiclesView;
