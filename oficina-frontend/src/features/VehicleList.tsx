import React from 'react';
import Button from '../components/ui/Button';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { EyeIcon, EditIcon, PlusIcon, FilePdfIcon } from '../components/ui/Icons';
import {
  StickyTableContainer,
  StickyActionHeader,
  StickyActionCell,
  StickyActionGroup
} from '../components/ui/StickyTable';
import { maskPlaca } from '../utils/masks';
import { ResponseVeiculoDTO } from '../types/veiculo';

/**
 * Strategy Pattern: Definição extensível de colunas para o VehicleList.
 * Cada coluna encapsula sua própria estratégia de renderização e estilização (OCP).
 */
export interface VehicleColumn<T = ResponseVeiculoDTO> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (vehicle: T) => React.ReactNode;
}

/**
 * Predefinições reutilizáveis de colunas prontas para uso (DRY / Strategy).
 */
export const VEHICLE_TABLE_COLUMNS = {
  CLIENT: {
    key: 'cliente',
    header: 'Cliente',
    headerClassName: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex-1 border-b border-gray-200',
    cellClassName: 'px-4 py-4 text-sm truncate border-b border-gray-200',
    render: (v: ResponseVeiculoDTO) => v.nome_cliente || '-'
  },
  FUEL: {
    key: 'combustivel',
    header: 'Combustível',
    headerClassName: 'hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex-1 border-b border-gray-200',
    cellClassName: 'hidden sm:table-cell px-4 py-3 text-sm capitalize truncate border-b border-gray-200',
    render: (v: ResponseVeiculoDTO) => v.combustivel || '-'
  }
} as const;

/**
 * Propriedades comuns dos botões de ação do veículo
 */
export interface VehicleActionButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Botão padronizado para criação de OS (Compound Component)
 */
export const VehicleCreateOsButton: React.FC<VehicleActionButtonProps> = ({
  onClick,
  title = 'Criar OS para este veículo',
  disabled = false,
  className = ''
}) => (
  <Button
    variant="floating"
    className={`h-9 bg-green-600 text-xs font-semibold text-white hover:bg-green-700 border-green-600 ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    disabled={disabled}
    title={title}
  >
    <PlusIcon className="h-4 w-4 mr-0.5" /> OS
  </Button>
);

/**
 * Botão padronizado para visualização de veículo (Compound Component)
 */
export const VehicleViewButton: React.FC<VehicleActionButtonProps> = ({
  onClick,
  title = 'Ver veículo',
  disabled = false,
  className = ''
}) => (
  <Button
    variant="floating"
    className={`bg-white hover:bg-blue-50 hover:text-blue-900 ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    disabled={disabled}
    title={title}
  >
    <EyeIcon className="h-5 w-5" />
  </Button>
);

/**
 * Botão padronizado para edição de veículo (Compound Component)
 */
export const VehicleEditButton: React.FC<VehicleActionButtonProps> = ({
  onClick,
  title = 'Editar veículo',
  disabled = false,
  className = ''
}) => (
  <Button
    variant="floating"
    className={`bg-white hover:bg-blue-50 hover:text-blue-900 ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    disabled={disabled}
    title={title}
  >
    <EditIcon className="h-5 w-5" />
  </Button>
);

export interface VehicleReportButtonProps extends VehicleActionButtonProps {
  loading?: boolean;
}

/**
 * Botão padronizado para geração de relatório de veículo (Compound Component)
 */
export const VehicleReportButton: React.FC<VehicleReportButtonProps> = ({
  onClick,
  title = 'Gerar relatório completo de OSs do veículo',
  disabled = false,
  loading = false,
  className = ''
}) => (
  <Button
    variant="floating"
    className={`bg-blue-600 text-white hover:bg-blue-700 border-blue-600 ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    disabled={disabled || loading}
    title={title}
  >
    <FilePdfIcon className="h-5 w-5" />
  </Button>
);

/**
 * Container padronizado de agrupamento para ações por linha
 */
export interface VehicleActionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const VehicleActionGroup: React.FC<VehicleActionGroupProps> = ({
  children,
  className = ''
}) => (
  <StickyActionGroup className={className}>
    {children}
  </StickyActionGroup>
);

/**
 * Propriedades do VehicleList (Totalmente desacoplado de telas específicas - SRP e OCP)
 */
export interface VehicleListProps {
  vehicles: ResponseVeiculoDTO[];

  /**
   * Colunas adicionais customizadas (Strategy Pattern / Open-Closed Principle).
   */
  extraColumns?: VehicleColumn[];

  /**
   * Render prop para botões de ação customizados por linha (Inversion of Control).
   */
  renderActions?: (vehicle: ResponseVeiculoDTO) => React.ReactNode;

  /**
   * Largura CSS adicional para a coluna de ações (se omitido, utiliza dimensionamento compacto natural).
   */
  actionsColumnWidth?: string;

  /**
   * Cabeçalho da coluna de ações. Default: 'Ações'
   */
  actionsHeader?: React.ReactNode;

  /**
   * Callback ao clicar na linha do veículo
   */
  onRowClick?: (vehicle: ResponseVeiculoDTO) => void;

  /**
   * Função para determinar se a linha está destacada
   */
  isRowHighlighted?: (vehicle: ResponseVeiculoDTO) => boolean;

  /**
   * Mensagem quando não houver veículos
   */
  emptyMessage?: string;
}

/**
 * Componente base do VehicleList
 */
const BaseVehicleList: React.FC<VehicleListProps> = ({
  vehicles = [],
  extraColumns = [],
  renderActions,
  actionsColumnWidth = '',
  actionsHeader = 'Ações',
  onRowClick,
  isRowHighlighted,
  emptyMessage = 'Nenhum veículo encontrado',
}) => {
  const isClickable = Boolean(onRowClick);

  return (
    <StickyTableContainer>
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%] min-w-[100px] border-b border-gray-200">
              Placa
            </th>

            {/* Telas Grandes (XL+): exibe colunas separadas para cada característica do veículo */}
            <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%] border-b border-gray-200">
              Montadora
            </th>
            <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%] border-b border-gray-200">
              Modelo
            </th>

            {/* Telas Médias (de SM até XL): Coluna combinada para montadora e modelo */}
            <th className="hidden sm:table-cell xl:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[30%] border-b border-gray-200">
              Montadora e modelo
            </th>

            {/* Telas Pequenas (Abaixo de SM): Coluna tudo-em-um, que exibe todas as informações do veículo */}
            <th className="sm:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[54%] border-b border-gray-200">
              Veículo
            </th>

            {/* Cor e Ano: Aparecem apenas se NÃO for tela pequena (SM+) */}
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%] border-b border-gray-200">
              Ano
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%] border-b border-gray-200">
              Cor
            </th>

            {/* Colunas adicionais customizadas (Strategy Pattern) */}
            {extraColumns.map((col) => (
              <th
                key={col.key}
                className={col.headerClassName || 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex-1 border-b border-gray-200'}
              >
                {col.header}
              </th>
            ))}

            {/* Coluna de ações */}
            {renderActions && (
              <StickyActionHeader className={`border-b border-gray-200 ${actionsColumnWidth}`.trim()}>
                {actionsHeader}
              </StickyActionHeader>
            )}
          </tr>
        </thead>
        <tbody className="bg-white">
          {vehicles.length === 0 ? (
            <tr>
              <td colSpan={100} className="border-b border-gray-200">
                <TableEmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            vehicles.map((v) => {
              const highlighted = Boolean(isRowHighlighted && isRowHighlighted(v));

              return (
                <tr
                  key={v.cod_veiculo}
                  className={`hover:bg-gray-50 group ${isClickable ? 'cursor-pointer' : ''} ${
                    highlighted ? 'bg-gray-50 border-2 border-gray-300' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(v)}
                >
                  <td className="px-4 py-4 text-sm font-bold uppercase truncate border-b border-gray-200">
                    {maskPlaca(v.placa)}
                  </td>

                  {/* Telas Grandes (XL+) */}
                  <td className="hidden xl:table-cell px-4 py-4 text-sm capitalize truncate border-b border-gray-200">
                    {v.nome_montadora}
                  </td>
                  <td className="hidden xl:table-cell px-4 py-4 text-sm capitalize truncate border-b border-gray-200">
                    {v.nome_modelo}
                  </td>

                  {/* Telas Médias (SM até XL) */}
                  <td className="hidden sm:table-cell xl:hidden px-4 py-4 text-sm capitalize truncate border-b border-gray-200">
                    {v.nome_montadora} {v.nome_modelo}
                  </td>

                  {/* Telas Pequenas (Abaixo de SM) */}
                  <td className="sm:hidden px-4 py-4 text-sm capitalize truncate border-b border-gray-200">
                    {v.nome_montadora} {v.nome_modelo} <br />
                    <span className="text-xs text-gray-500">
                      {v.cor ? `${v.cor}` : ''} {v.ano ? `| ${String(v.ano || '').substring(0, 4)}` : ''} {v.combustivel ? `| ${v.combustivel}` : ''}
                    </span>
                  </td>

                  {/* Cor e Ano: Aparecem em telas SM para cima */}
                  <td className="hidden sm:table-cell px-4 py-4 text-sm truncate border-b border-gray-200">
                    {v.ano ? String(v.ano || '').substring(0, 4) : '-'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-sm capitalize truncate border-b border-gray-200">
                    {v.cor ? v.cor : '-'}
                  </td>

                  {/* Renderização dinâmica das colunas extras */}
                  {extraColumns.map((col) => (
                    <td
                      key={col.key}
                      className={col.cellClassName || 'px-4 py-4 text-sm truncate border-b border-gray-200'}
                    >
                      {col.render(v)}
                    </td>
                  ))}

                  {/* Renderização de ações */}
                  {renderActions && (
                    <StickyActionCell className={`border-b border-gray-200 ${actionsColumnWidth}`.trim()}>
                      <VehicleActionGroup>
                        {renderActions(v)}
                      </VehicleActionGroup>
                    </StickyActionCell>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </StickyTableContainer>
  );
};

/**
 * Compound Component Pattern:
 * Exporta o componente principal com seus subcomponentes e estratégias anexados.
 */
export type VehicleListComponent = typeof BaseVehicleList & {
  Columns: typeof VEHICLE_TABLE_COLUMNS;
  CreateOsButton: typeof VehicleCreateOsButton;
  ViewButton: typeof VehicleViewButton;
  EditButton: typeof VehicleEditButton;
  ReportButton: typeof VehicleReportButton;
  ActionGroup: typeof VehicleActionGroup;
};

export const VehicleList = BaseVehicleList as VehicleListComponent;
VehicleList.Columns = VEHICLE_TABLE_COLUMNS;
VehicleList.CreateOsButton = VehicleCreateOsButton;
VehicleList.ViewButton = VehicleViewButton;
VehicleList.EditButton = VehicleEditButton;
VehicleList.ReportButton = VehicleReportButton;
VehicleList.ActionGroup = VehicleActionGroup;

export default VehicleList;
