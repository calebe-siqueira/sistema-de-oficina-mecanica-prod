import React from 'react';
import Button from '../components/ui/Button';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { LuEye, LuSquarePen, LuTrash2, LuPlus, FilePdf } from '../components/ui/Icons';
import { maskPlaca } from '../utils/masks';

import { ResponseVeiculoDTO } from '../types/veiculo';

export interface VehicleListProps {
  vehicles: ResponseVeiculoDTO[];
  view?: 'vehicles' | 'reports' | 'clientForm';

  // Callbacks de ações (de acordo com a view)
  onViewVehicle?: (vehicle: ResponseVeiculoDTO) => void;
  onGenerateReport?: (vehicleId: string | number) => void;
  reportLoading?: boolean;

  // Callbacks adicionais para ClientForm
  onCreateOs?: (vehicle: ResponseVeiculoDTO) => void;
  onEditVehicle?: (vehicle: ResponseVeiculoDTO) => void;
  onDeleteVehicle?: (vehicle: ResponseVeiculoDTO) => void;

  // Suporte a destaque de busca (ClientForm)
  osSearchType?: string;
  osSearchTerm?: string;
  onVehicleClick?: (vehicle: ResponseVeiculoDTO) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({
  vehicles = [],
  view = 'vehicles',
  onViewVehicle,
  onGenerateReport,
  reportLoading = false,
  onCreateOs,
  onEditVehicle,
  onDeleteVehicle,
  osSearchType,
  osSearchTerm,
  onVehicleClick
}) => {
  const visibleVehicles = vehicles;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%] min-w-[100px]">Placa</th>

            {/* Telas Grandes (XL+): exibe colunas separadas para cada característica do veículo */}
            <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Montadora</th>
            <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Modelo</th>

            {/* Telas Médias (de SM até XL): Coluna combinada para montadora e modelo */}
            <th className="hidden sm:table-cell xl:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">Montadora e modelo</th>

            {/* Telas Pequenas (Abaixo de SM): Coluna tudo-em-um, que exibe todas as informações do veículo */}
            <th className="sm:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[54%]">Veículo</th>

            {/* Cor e Ano: Aparecem apenas se NÃO for tela pequena (SM+) */}
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Ano</th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Cor</th>

            {view !== 'clientForm' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex-1">Cliente</th>
                <th className="sticky right-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase z-10 w-[66px] sm:w-[125px]">Ações</th>
              </>
            )}
            {view === 'clientForm' && (
              <>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex-1">Combustível</th>
                <th className="sticky right-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase z-10 w-[66px] sm:w-[177px]">Ações</th>
              </>
            )}

          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visibleVehicles.length === 0 ? (
            <tr>
              <td colSpan={view !== 'clientForm' ? 8 : 7}>
                <TableEmptyState message="Nenhum veículo encontrado" />
              </td>
            </tr>
          ) : visibleVehicles.map(v => {
            const isHighlighted = osSearchType === 'cod_veiculo' && osSearchTerm === String(v.cod_veiculo);

            return (
              <tr
                key={v.cod_veiculo}
                className={`hover:bg-gray-50 ${onVehicleClick ? 'cursor-pointer' : ''} ${isHighlighted ? 'bg-gray-50 border-2 border-gray-300' : ''}`}
                onClick={() => onVehicleClick && onVehicleClick(v)}
              >
                <td className="px-4 py-4 text-sm font-bold uppercase truncate">{maskPlaca(v.placa)}</td>

                {/* Telas Grandes (XL+) */}
                <td className="hidden xl:table-cell px-4 py-4 text-sm capitalize truncate">{v.nome_montadora}</td>
                <td className="hidden xl:table-cell px-4 py-4 text-sm capitalize truncate">{v.nome_modelo}</td>

                {/* Telas Médias (SM até XL) */}
                <td className="hidden sm:table-cell xl:hidden px-4 py-4 text-sm capitalize truncate">{v.nome_montadora} {v.nome_modelo}</td>

                {/* Telas Pequenas (Abaixo de SM) */}
                <td className="sm:hidden px-4 py-4 text-sm capitalize truncate">
                  {v.nome_montadora} {v.nome_modelo} <br />
                  <span className="text-xs text-gray-500">{v.cor} - {String(v.ano || '').substring(0, 4)}</span>
                </td>

                {/* Cor e Ano: Aparecem em telas SM para cima */}
                <td className="hidden sm:table-cell px-4 py-4 text-sm truncate">{String(v.ano || '').substring(0, 4)}</td>
                <td className="hidden sm:table-cell px-4 py-4 text-sm capitalize truncate">{v.cor}</td>

                {/* Colunas e ações específas por View */}
                {view !== 'clientForm' && (
                  <>
                    <td className="px-4 py-4 text-sm truncate">{v.nome_cliente}</td>

                    <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[125px] text-left z-10">
                      <div className="flex flex-col w-[66px] sm:min-w-[125px] sm:flex-row sm:items-center sm:justify-start gap-2">

                        {/* Ações específicas da View Vehicles */}
                        {view === 'vehicles' && (
                          <>
                            {onCreateOs && (
                              <Button
                                variant="floating"
                                className="py-2.5 bg-green-600 text-xs text-white hover:bg-green-700"
                                onClick={(e) => { e.stopPropagation(); onCreateOs(v); }}
                                title="Criar OS para este veículo"
                              >
                                <LuPlus className="h-4 w-4" /> OS
                              </Button>
                            )}
                            {onViewVehicle && (
                              <Button
                                variant="floating"
                                className="bg-white hover:bg-blue-50 hover:text-blue-900"
                                onClick={(e) => { e.stopPropagation(); onViewVehicle(v); }}
                                title="Ver veículo"
                              >
                                <LuEye className="h-5 w-5" />
                              </Button>
                            )}
                          </>
                        )}

                        {/* Ações específicas da View Reports */}
                        {view === 'reports' && (
                          <>
                            {onGenerateReport && (
                              <Button
                                variant="floating"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                                onClick={(e) => { e.stopPropagation(); onGenerateReport(String(v.cod_veiculo)); }}
                                disabled={reportLoading}
                                title="Gerar relatório completo de OSs do veículo"
                              >
                                <FilePdf className="h-5 w-5" />
                              </Button>
                            )}
                            {onViewVehicle && (
                              <Button
                                variant="floating"
                                className="bg-white hover:bg-blue-50 hover:text-blue-900"
                                onClick={(e) => { e.stopPropagation(); onViewVehicle(v); }}
                                title="Ver veículo"
                              >
                                <LuEye className="h-5 w-5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}

                {/* Estilos e ações específicas da View ClientForm */}
                {view === 'clientForm' && (
                  <>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm capitalize truncate">{v.combustivel}</td>

                    <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[177px] text-left z-10">
                      <div className="flex flex-col w-[66px] sm:min-w-[177px] sm:flex-row sm:items-center sm:justify-start gap-2">
                        {onCreateOs && (
                          <Button
                            variant="floating"
                            className="py-2.5 bg-green-600 text-xs text-white hover:bg-green-700"
                            onClick={(e) => { e.stopPropagation(); onCreateOs(v); }}
                            title="Criar OS para este veículo"
                          >
                            <LuPlus className="h-4 w-4" /> OS
                          </Button>
                        )}
                        {onEditVehicle && (
                          <Button
                            variant="floating"
                            className="bg-white hover:bg-blue-50 hover:text-blue-900"
                            onClick={(e) => { e.stopPropagation(); onEditVehicle(v); }}
                            title='Editar veículo'
                          >
                            <LuSquarePen className="h-5 w-5" />
                          </Button>
                        )}
                        {onDeleteVehicle && (
                          <Button
                            variant="floating"
                            className="bg-white hover:bg-red-50 text-red-600 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); onDeleteVehicle(v); }}
                            title='Excluir veículo'
                          >
                            <LuTrash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}

export default VehicleList;
