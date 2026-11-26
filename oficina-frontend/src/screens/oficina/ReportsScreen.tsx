import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { InfoPopover } from '../../components/ui/InfoPopover';
import { SearchIcon, FileCogIcon } from '../../components/ui/Icons';
import { ItemsPerPageSelector } from '../../components/ui/ItemsPerPageSelector';
import { fetchAndOpenPdf } from '../../utils/pdfGenerator';
import ListWithPagination from '../../features/ListWithPagination';
import VehicleList from '../../features/VehicleList';
import { toastify } from '../../components/modules/SystemMessages';

export const ReportsScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
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

  const navigate = useNavigate();
  const api = useApi();

  const fetchVehicles = useCallback(async (st: string, tipo: string, page: number, size: number) => {
    setLoading(true);
    setError(null);

    try {
      let ep = `/veiculos?page=${page - 1}&size=${size}`;
      if (st) ep = `/veiculos/search?term=${encodeURIComponent(st)}&type=${tipo}&page=${page - 1}&size=${size}`;
      const data = await api(ep);
      const contentData = data?.content || (Array.isArray(data) ? data : []);

      const vehiclesWithClientName = contentData.map((v: any) => ({ ...v, nome_cliente: v.nome_cliente ? v.nome_cliente : 'N/A' }));

      setVehicles(vehiclesWithClientName);
      setTotalPages(data?.total_pages || 1);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar relatórios. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchVehicles(searchTerm, searchType, currentPage, itemsPerPage);
  }, [fetchVehicles, searchTerm, searchType, currentPage, itemsPerPage]);

  const handleGenerateReport = async (vehicleId: string | number) => {
    if (!vehicleId) return;

    setReportLoading(true);
    setError(null);

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
      <CardHeader className='h-16' actions={
        // Botão ainda não implementado
        <Button onClick={() => toastify.infoMessage('Configuração de relatório em breve!')}>
          <FileCogIcon className="mr-2 h-5 w-5" />
          Configurar relatório
        </Button>
      }>
        <div className='flex items-center gap-2'>
          Relatórios de Veículos
          <InfoPopover
            title="Relatório de Manutenções"
            placement="bottom start"
            content={
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>Gera um prontuário completo em PDF com todo o histórico de manutenções realizadas no veículo.</p>
                <p className="text-slate-500 pt-1 border-t border-slate-100 text-[11px]">Consolida ordens de serviço, peças aplicadas, serviços executados e evolução do hodômetro.</p>
              </div>
            }
          />
        </div>
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
                <option value="cpf_cnpj">CPF/CNPJ</option>
                <option value="telefone">Celular/Telefone</option>
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
            <Button type="submit" variant="primary" className="shrink-0"><SearchIcon className="mr-2 h-5 w-5" /> Buscar</Button>
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
                extraColumns={[VehicleList.Columns.CLIENT]}
                renderActions={(v) => (
                  <>
                    <VehicleList.ReportButton
                      loading={reportLoading}
                      onClick={() => handleGenerateReport(String(v.cod_veiculo))}
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

export default ReportsScreen;
