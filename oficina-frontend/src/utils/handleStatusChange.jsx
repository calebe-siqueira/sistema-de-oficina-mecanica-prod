import { STATUS_MAP } from './constants';

// --- Função para lidar com a alteração de status da OS ---
export const handleStatusChange = async (os, newStatus, api, fetchOrders) => {
    // console.log(`\n\n\nTentando alterar status da OS Nº ${os.cod_OS} de "${statusNameOld}" para "${statusNameNew}"`);
    const statusNameOld = STATUS_MAP[os.status_servico];
    const statusNameNew = STATUS_MAP[newStatus];

    if (window.confirm(`Confirma a alteração do status da OS Nº ${os.cod_OS} de "${statusNameOld}" para "${statusNameNew}"?`)) {
        try {
            const fullData = await api(`/os/${os.cod_OS}`);
            const payload = { os: fullData.os, status: { ...fullData.status, status_servico: parseInt(newStatus) }, items: Array.isArray(fullData.items) ? fullData.items : [] };
            await api(`/os/${os.cod_OS}`, 'PUT', payload);
            fetchOrders();
        } catch (err) { alert("Erro ao atualizar status: " + err.message); }
    }
};
