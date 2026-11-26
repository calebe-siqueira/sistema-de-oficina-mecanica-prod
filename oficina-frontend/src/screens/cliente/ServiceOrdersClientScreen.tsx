import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMeusServiceOrders } from '../../hooks/useMeusServiceOrders';

import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CarIcon, EyeIcon } from '../../components/ui/Icons';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import ExpandableSearchBar from '../../components/ui/ExpandableSearchBar';

import { formatDateBR } from '../../utils/date';
import { formatCurrency } from '../../utils/masks';
import { getOsStatusConfig } from '../../utils/statusHelpers';

// ─── Componente principal ───

const ServiceOrdersClientScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Captura o parâmetro da URL imediatamente antes do hook rodar
  const placaParam = searchParams.get('placa') || '';

  const [isSearching, setIsSearching] = useState<boolean>(() => Boolean(placaParam));

  const {
    orders,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
  } = useMeusServiceOrders(10, placaParam);

  const isFilterActive = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Barra superior de ações */}
      <ExpandableSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        isSearching={isSearching}
        onSearchingChange={setIsSearching}
        placeholder="Digite a placa para buscar (ex: AAA0A00)..."
        ariaLabel="Buscar por placa"
        searchButtonAriaLabel="Buscar ordens de serviço por placa"
        loading={loading}
      />

      {/* Título */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
        {!loading && !error && (
          <span className="text-sm text-gray-500">
            {totalElements} encontrado(s)
            {isFilterActive && (
              <> para a placa <strong>{searchTerm.toUpperCase()}</strong></>
            )}
          </span>
        )}
      </div>

      <InlineAlert message={error} className="bg-red-100" />

      {/* Lista de Ordens de Serviço */}
      {loading ? (
        <LoadingSpinner message="Carregando serviços..." />
      ) : !error && (
        <>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-500">
                {isFilterActive
                  ? `Nenhuma ordem de serviço para a placa "${searchTerm.toUpperCase()}".`
                  : 'Você não possui ordens de serviço.'}
              </p>
            ) : (
              orders.map((os) => {
                const {
                  text: statusText,
                  bgStyle: statusBg,
                  textStyle: statusTextStyle,
                  borderStyle: statusBorderStyle,
                } = getOsStatusConfig(os.status_servico);

                // Organiza o nome do veículo de maneira segura (ex.: Honda Civic (AAA0A00))
                const montadora = os.modelo?.montadora?.nome_montadora ? `${os.modelo.montadora.nome_montadora}` : '';
                const modelo = os.modelo?.nome_modelo || 'Veículo';
                const placa = os.placa ? `(${os.placa.toUpperCase()})` : '';

                const nomeVeiculo = `${montadora} ${modelo} ${placa}`;

                return (
                  <Card
                    key={os.cod_os}
                    className="shadow-sm rounded-xl border-none"
                  >
                    <CardContent className="flex justify-between p-5">
                      {/* Informações da OS */}
                      <div className="flex flex-col flex-1 pr-4">
                        <span className="text-xl font-bold text-gray-900 mb-2">
                          OS {os.cod_os}
                        </span>
                        <span className="text-sm text-gray-500 mb-1">
                          Veículo: {nomeVeiculo}
                        </span>
                        <span className="text-sm text-gray-500 mb-4">
                          {formatDateBR(os.data_os, '-')}
                          {os.quilometragem != null && (
                            <>
                              <span className="mx-1">|</span>
                              {os.quilometragem} km
                            </>
                          )}
                          <span className="mx-1">|</span>
                          {formatCurrency(os.valor_total)}
                        </span>

                        {/* Pill de Status */}
                        <div
                          className={`mt-auto w-full max-w-xs px-3 py-1 rounded-full border ${statusBg} ${statusBorderStyle}`}
                        >
                          <span
                            className={`text-sm font-medium ${statusTextStyle}`}
                          >
                            Status: {statusText}
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-col gap-3 shrink-0">
                        <Button
                          variant="ghost"
                          className="p-3 shadow-sm rounded-lg border border-gray-200 hover:bg-gray-50 flex-none bg-white text-gray-700"
                          onClick={() =>
                            navigate(
                              `/cliente/veiculos?placa=${os.placa}`,
                            )
                          }
                          title="Ver veículo"
                          aria-label={`Ver veículo ${os.placa}`}
                        >
                          <CarIcon className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="primary"
                          className="p-3 shadow-sm rounded-lg flex-none"
                          onClick={() =>
                            navigate(`/cliente/visualizacao-os/${os.cod_os}`)
                          }
                          title="Ver detalhes da OS"
                          aria-label={`Ver detalhes da OS ${os.cod_os}`}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default ServiceOrdersClientScreen;