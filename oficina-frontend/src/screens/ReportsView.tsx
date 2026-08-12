import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { InlineAlert } from '../components/ui/InlineAlert';
import { LuSearch, LuFileCog } from '../components/ui/Icons';
import { ITEMS_PER_PAGE_OPTIONS } from '../utils/constants';
import { matchesNumber } from '../utils/filters';
import { fetchAndOpenPdf } from '../utils/pdfGenerator';
import ListWithPagination from '../features/ListWithPagination';
import VehicleList from '../features/VehicleList';
import { toastify } from '../components/modules/SystemMessages';

export const ReportsView: React.FC = () => {
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('placa');

  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const { navigate } = useNavigation();
  const api = useApi();

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await api('/veiculos');
        const vehiclesWithClientName = Array.isArray(data)
          ? data.map(v => ({ ...v, nome_cliente: v.nome_cliente ? v.nome_cliente : 'N/A' }))
          : [];

        if (isMounted) {
          setAllVehicles(vehiclesWithClientName);
          setFilteredVehicles(vehiclesWithClientName);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err.message || 'Erro ao carregar relatórios. Verifique sua conexão e tente novamente.';
          setError(errorMessage);
          toastify.errorMessage(errorMessage, err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadVehicles();
    return () => { isMounted = false };
  }, [api]);

  const handleGenerateReport = async (vehicleId: string | number) => {
    if (!vehicleId) return;

    setReportLoading(true);
    setError('');

    const generatePdfPromise = fetchAndOpenPdf({
      url: `/api/veiculos/${vehicleId}/os/pdf`,
      tabTitle: `Relatório do Veículo ${vehicleId}`
    });

    try {
      await toastify.promiseMessage(
        generatePdfPromise,
        "Gerando PDF...",
        "PDF gerado com sucesso!",
        "Erro ao gerar PDF"
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar PDF. Tente novamente.');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredVehicles(allVehicles);
      return;
    }
    const term = searchTerm.toLowerCase();
    const res = allVehicles.filter(v => {
      const cleanTerm = term.replace(/\D/g, '');
      switch (searchType) {
        case 'placa': return (v.placa || '').toLowerCase().includes(term);
        case 'montadora': return (v.montadora || '').toLowerCase().includes(term);
        case 'modelo': return (v.modelo || '').toLowerCase().includes(term);
        case 'ano': return matchesNumber(v.ano, term);
        case 'cor': return (v.cor || '').toLowerCase().includes(term);
        case 'nome': return (v.nome_cliente || '').toLowerCase().includes(term);
        case 'cpf_cnpj': return (v.cliente?.cpf_cnpj || '').replace(/\D/g, '').includes(cleanTerm);
        case 'telefone': return (v.cliente?.celular || v.cliente?.telefone || '').replace(/\D/g, '').includes(cleanTerm);
        default: return true;
      }
    });
    setFilteredVehicles(res);
  }, [searchTerm, searchType, allVehicles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <Card>
      <CardHeader className='h-16' actions={
        // Botão ainda não implementado
        <Button onClick={() => toastify.infoMessage('Configuração de relatório em breve!')}>
          <LuFileCog className="mr-2 h-5 w-5" />
          Configurar relatório
        </Button>}>
        Relatórios de Veículos
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
                <option value="nome">Nome</option>
                <option value="cpf_cnpj">CPF/CNPJ</option>
                <option value="telefone">Celular/Telefone</option>
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
            <Button type="submit" variant="primary" className="shrink-0"><LuSearch className="mr-2 h-5 w-5" /> Buscar</Button>
          </form>

          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
            <select className="border border-gray-300 rounded-md text-sm p-2 bg-white" value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}>
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
                view="reports"
                reportLoading={reportLoading}
                onGenerateReport={handleGenerateReport}
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

export default ReportsView;
