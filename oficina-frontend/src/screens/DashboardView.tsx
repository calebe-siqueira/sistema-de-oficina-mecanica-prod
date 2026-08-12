import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';

import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { InlineAlert } from '../components/ui/InlineAlert';
import { LuPlus, LuSearch } from '../components/ui/Icons';
import { toastify } from '../components/modules/SystemMessages';
import { TableEmptyState } from '../components/modules/TableEmptyState';

import { STATUS_MAP } from '../utils/constants';
import { formatSafeDate } from '../utils/date';

import { DashboardStatsDTO } from '../types/dashboard';
import { ResponseOsDTO } from '../types/ordem_servico';

export const DashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const api = useApi();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [recentOs, setRecentOs] = useState<ResponseOsDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Flag para sinaliza se o componente ainda está renderizado na tela ou se foi desmontado
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Executa ambas as requisições ao mesmo tempo (paralelismo)
        const [resStats, resOs] = await Promise.all([
          api('/dashboard/stats'),
          api('/os')
        ]);

        // Só atualiza o estado se o componente estiver montado (usuário ainda estiver na tela)
        if (isMounted) {
          setStats(resStats);
          setRecentOs(Array.isArray(resOs) ? resOs.slice(0, 5) : []);
        }
      } catch (err: any) {
        // Ignora o erro se o componente já tiver sido desmontado
        if (isMounted) {
          const errorMessage = err.message || 'Erro ao carregar os dados. Verifique sua conexão e tente novamente.';
          setError(errorMessage);
          toastify.errorMessage(errorMessage, err);
        }
      } finally {
        // Só atualiza o loading se a requisição não tiver sido cancelada
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    // Função de limpeza: cancela a requisição se o componente for desmontado (roda automaticamente quando o componente desmonta)
    return () => { isMounted = false; };
  }, [api]); // Executa novamente apenas se a instância da api mudar

  const colorStatusOS = (status: number) => {
    // 1: Orçamento | 2: OS aberta | 3: Em andamento | 4: Finalizada | 5: Cancelada
    if (status > 0 && status <= 5) {
      return STATUS_MAP[status].color;
    } else {
      return STATUS_MAP[1].color;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <InlineAlert error={error} />

      {loading ? (
        <p className="text-gray-500">Carregando painel de métricas...</p>
      ) : stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Clientes ativos', value: stats.clientesAtivos },
              { name: 'Veículos cadastrados', value: stats.veiculosCadastrados },
              { name: 'OSs em andamento', value: stats.osEmAndamento },
              { name: 'OSs concluídas (mês)', value: stats.osConcluidasMes },
            ].map(s => (
              <Card key={s.name}>
                <CardContent>
                  <p className="text-sm font-medium text-gray-500 truncate">{s.name}</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>Ações rápidas</CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('clients', { action: 'new' })}
                >
                  <LuPlus className="mr-2 h-5 w-5" />
                  Novo cliente
                </Button>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('clients')}
                >
                  <LuSearch className="mr-2 h-5 w-5" />
                  Buscar cliente
                </Button>

                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => navigate('clients', { selectClientForOS: true })}
                >
                  <LuPlus className="mr-2 h-5 w-5" />
                  Nova ordem de serviço
                </Button>
              </CardContent>
            </Card>
            <Card className="flex flex-col h-full">
              <CardHeader>Ordens de serviço recentes</CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="w-full flex-1">
                  {recentOs.length === 0 ? (
                    <TableEmptyState message="Nenhuma OS recente" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentOs.map((os: ResponseOsDTO) => (
                            <tr
                              key={os.cod_os}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => navigate('serviceOrderForm', { osId: String(os.cod_os), vehicleId: String(os.fk_cod_veiculo), clientId: String(os.fk_cod_cliente) })}
                            >
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">#{os.cod_os}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[150px]">{os.nome_cliente}</td>
                              <td className="px-3 py-2 text-sm text-gray-500">{os.data_os ? formatSafeDate(os.data_os).split('-').reverse().join('/') : '-'}</td>

                              <td className="px-2 py-2 text-center align-middle w-12">
                                <div 
                                  className={`w-4 h-4 rounded-full mx-auto shadow-sm`}
                                  style={{ backgroundColor: String(colorStatusOS(os.status_servico)) }}
                                  title={STATUS_MAP[os.status_servico as keyof typeof STATUS_MAP]?.text}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-auto text-blue-600"
                  onClick={() => navigate('serviceOrders')}
                >
                  Ver todas as ordens
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
