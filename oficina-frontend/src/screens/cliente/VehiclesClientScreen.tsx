import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FileTextIcon } from '../../components/ui/Icons';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import ExpandableSearchBar from '../../components/ui/ExpandableSearchBar';

import { useMeusVeiculos } from '../../hooks/useMeusVeiculos';
import { isValidVehicleYear } from '../../utils/validators';

// ─── Componente principal ───

const VehiclesClientScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Captura o parâmetro da URL imediatamente antes do hook rodar
  const placaParam = searchParams.get('placa') || '';

  const [isSearching, setIsSearching] = useState<boolean>(() => Boolean(placaParam));

  const {
    vehicles,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
  } = useMeusVeiculos(10, placaParam);

  const isFilterActive = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Barra superior de ações */}
      <ExpandableSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        isSearching={isSearching}
        onSearchingChange={setIsSearching}
        placeholder="Digite a placa para buscar (ex: AAA0A00)..."
        ariaLabel="Buscar por placa"
        searchButtonAriaLabel="Buscar veículos por placa"
        loading={loading}
      />

      {/* Título */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Veículos</h1>
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

      {/* Lista de veículos */}
      {loading ? (
        <LoadingSpinner message="Carregando veículos..." />
      ) : !error && (
        <>
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <p className="text-gray-500">
                {isFilterActive
                  ? `Nenhum veículo encontrado para a placa "${searchTerm.toUpperCase()}".`
                  : 'Você não possui veículos cadastrados.'}
              </p>
            ) : (
              vehicles.map((vehicle) => (
                <Card
                  key={vehicle.cod_veiculo}
                  className="shadow-sm rounded-xl border-none"
                >
                  <CardContent className="flex justify-between items-center p-5">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-900 mb-1">
                        {vehicle.placa}
                      </span>
                      <span className="text-sm text-gray-500">
                        {vehicle.nome_montadora} {vehicle.nome_modelo}{' '}
                        {vehicle.cor && `— ${vehicle.cor}`} {isValidVehicleYear(vehicle.ano) ? `(${vehicle.ano})` : ''}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      className="p-3 ml-4 shadow-sm rounded-lg shrink-0 flex-none"
                      onClick={() =>
                        navigate(
                          `/cliente/ordens-servico?placa=${vehicle.placa}`,
                        )
                      }
                      title="Ver ordens de serviço deste veículo"
                    >
                      <FileTextIcon className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
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

export default VehiclesClientScreen;