import { STATUS_MAP, StatusId } from './constants';
import { toastify } from '../components/modules/SystemMessages';

export interface OsData {
    cod_os: number;
    status_servico: number | string;
    [key: string]: any;
}

// --- Função para lidar com a alteração de status da OS ---
export const handleStatusChange = async (
    os: OsData, 
    newStatus: number | string, 
    api: (url: string, method?: string, body?: any) => Promise<any>, 
    fetchOrders: () => void
): Promise<void> => {
    const statusIdOld = Number(os.status_servico) as StatusId;
    const statusIdNew = Number(newStatus) as StatusId;
    
    const statusNameOld = STATUS_MAP[statusIdOld]?.text || 'Desconhecido';
    const statusNameNew = STATUS_MAP[statusIdNew]?.text || 'Desconhecido';

    if (window.confirm(`Confirma a alteração do status da OS Nº ${os.cod_os} de "${statusNameOld}" para "${statusNameNew}"?`)) {
        try {
            const fullData = await api(`/os/${os.cod_os}`);
            const payload = {
                data_os: fullData.data_os,
                quilometragem: fullData.quilometragem || 0,
                descricao: fullData.descricao || '',
                tipo_desconto: fullData.tipo_desconto || 'N',
                desconto: fullData.desconto || 0,
                status_servico: statusIdNew,
                valor_pago: fullData.valor_pago || 0,
                fk_cod_veiculo: fullData.fk_cod_veiculo,
                pecas: (fullData.pecas || []).map((p: any) => ({
                    cod_item: p.cod_item || null,
                    nome_item: p.nome_item || p.nome,
                    quantidade: p.quantidade,
                    valor_unitario: p.valor_unitario
                })),
                servicos: (fullData.servicos || []).map((s: any) => ({
                    cod_item: s.cod_item || null,
                    nome_item: s.nome_item || s.nome,
                    quantidade: s.quantidade,
                    valor_unitario: s.valor_unitario
                }))
            };
            await api(`/os/${os.cod_os}`, 'PUT', payload);
            fetchOrders();
        } catch (err: any) {
            toastify.errorMessage(
                "Erro ao atualizar status da OS. " + (err?.message || 'Verifique sua conexão e tente novamente.')
            );
        }
    }
};
