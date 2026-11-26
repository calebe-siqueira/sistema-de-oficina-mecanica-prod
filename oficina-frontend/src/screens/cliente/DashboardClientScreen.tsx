import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { CarIcon, FileTextIcon } from '../../components/ui/Icons';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TableEmptyState } from '../../components/modules/TableEmptyState';
import { OsStatusIndicator } from '../../components/modules/OsStatusIndicator';

import { useMeuDashboard } from '../../hooks/useMeuDashboard';
import { formatDateBR } from '../../utils/date';

// ─── Helpers de apresentação ───

/**
 * Retorna estilo visual para o badge de status de revisão.
 * Isolado por legibilidade e facilidade de manutenção (SRP / KISS).
 */
const getRevisaoStyle = (status: string) => {
  switch (status) {
    case 'EM_DIA':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Em dia',
      };
    case 'PROXIMA':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Próxima',
      };
    case 'ATRASADA':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Atrasada',
      };
    case 'SEM_HISTORICO':
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        label: 'Sem histórico',
      };
  }
};

// ─── Componente principal ───

const DashboardClientScreen: React.FC = () => {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMeuDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <InlineAlert message={error} className="bg-red-100" />

      {loading ? (
        <LoadingSpinner message="Carregando dashboard..." className='mt-22' />
      ) : !error && dashboard && (
        <div className="space-y-6">
          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500 truncate">
                  Meus veículos
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboard.total_veiculos}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500 truncate">
                  Minhas ordens
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboard.total_ordens_servico}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Conteúdo Inferior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ações Rápidas */}
            <Card>
              <CardHeader>Ações rápidas</CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full py-3"
                  onClick={() => navigate('/cliente/veiculos')}
                >
                  <CarIcon className="mr-2 h-5 w-5" />
                  Meus veículos
                </Button>

                <Button
                  variant="primary"
                  className="w-full py-3"
                  onClick={() => navigate('/cliente/ordens-servico')}
                >
                  <FileTextIcon className="mr-2 h-5 w-5" />
                  Minhas ordens
                </Button>
              </CardContent>
            </Card>

            {/* Ordens de Serviço Recentes */}
            <Card className="md:col-span-2">
              <CardHeader>Ordens de serviço recentes</CardHeader>
              <CardContent className="flex flex-col">
                <div className="w-full overflow-x-auto">
                  {dashboard.ultimas_ordens_servico.length === 0 ? (
                    <TableEmptyState message="Nenhuma ordem de serviço recente" />
                  ) : (
                    <table className="w-full text-left divide-y divide-gray-200">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 font-semibold">
                            OS
                          </th>
                          <th scope="col" className="px-4 py-2 font-semibold">
                            Veículo
                          </th>
                          <th scope="col" className="px-4 py-2 font-semibold">
                            Data
                          </th>
                          <th scope="col" className="px-4 py-2 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-200">
                        {dashboard.ultimas_ordens_servico.map((os) => (
                          <tr
                            key={os.cod_os}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(`/cliente/visualizacao-os/${os.cod_os}`)
                            }
                          >
                            <td className="px-4 py-2 font-semibold text-gray-900">
                              #{os.cod_os}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {os.placa}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {formatDateBR(os.data_os, '-')}
                            </td>
                            <td className="px-2 py-2 text-center align-middle w-12">
                              <OsStatusIndicator status={os.status_servico} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-auto text-blue-600"
                  onClick={() => navigate('/cliente/ordens-servico')}
                >
                  Ver todas as ordens
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 
            ATENÇÃO - aguardando alteração na API para retornar as próximas revisões paginadas
            Deverá ser exibido apenas os 5 primeiros registros retornados, 
            com a possibilidade de ver todas as revisões a partir de um botão exclusivo para expandir o painel.
          */}
          {/* Próximas Revisões */}
          {dashboard.proximas_revisoes.length > 0 && (
            <Card>
              <CardHeader>Status de revisões</CardHeader>
              <CardContent className="space-y-3">
                {dashboard.proximas_revisoes.map((revisao) => {
                  const style = getRevisaoStyle(revisao.status_revisao);
                  return (
                    <div
                      key={revisao.cod_veiculo}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">
                          {revisao.placa} — {revisao.montadora} {revisao.modelo}
                        </span>
                        {revisao.data_proxima_revisao && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            Próxima revisão:{' '}
                            {formatDateBR(revisao.data_proxima_revisao)}
                            {revisao.dias_restantes !== null &&
                              revisao.dias_restantes >= 0 && (
                                <> ({revisao.dias_restantes} dias)</>
                              )}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardClientScreen;
