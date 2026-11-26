import React from 'react';
import { Modal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { TrashIcon, TriangleAlertIcon } from '../components/ui/Icons';
import { maskPlaca } from '../utils/masks';

export interface ConfirmDeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehiclePlate: string;
  vehicleDescription?: string;
  osCount: number | null;
  osCountLoading: boolean;
  loading: boolean;
}

export const ConfirmDeleteVehicleModal: React.FC<ConfirmDeleteVehicleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  vehiclePlate,
  vehicleDescription,
  osCount,
  osCountLoading,
  loading,
}) => {
  // Texto formatado de forma simples (só é avaliado quando necessário)
  const osLabel = (osCount: number) => {
    if (osCount === null || osCount <= 0) return '';
    return osCount === 1 ? 'ordem de serviço associada' : 'ordens de serviço associadas';
  };

  // Impede a execução da ação caso esteja carregando
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-600">
          <TrashIcon className="w-5 h-5" />
          <span className="font-semibold text-lg">Excluir veículo</span>
        </div>
      }
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div className="space-y-4 text-gray-700">
        <p className="text-sm">
          Deseja realmente excluir o veículo com placa{' '}
          <strong className="text-gray-900 font-bold">{maskPlaca(vehiclePlate)}</strong>
          {vehicleDescription ? ` (${vehicleDescription})` : ''}?
        </p>

        {osCountLoading ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span>Verificando ordens de serviço vinculadas...</span>
          </div>
        ) : osCount !== null && osCount > 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
            <div className="flex items-start gap-2">
              <TriangleAlertIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold">Atenção!</p>
                <p className="mt-1">
                  Este veículo possui <strong className="font-bold">{osCount} {osLabel(osCount)}</strong>.<br/>
                  A confirmação desta exclusão também <strong>excluirá todas as suas ordens de serviço</strong>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            Não existe nenhuma ordem de serviço associada a este veículo.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={loading || osCountLoading}
            className="min-w-[140px]"
          >
            {loading ? 'Excluindo...' : 'Excluir veículo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
