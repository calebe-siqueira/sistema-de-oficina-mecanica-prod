import React from 'react';
import { Modal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { TrashIcon, TriangleAlertIcon } from '../components/ui/Icons';
import { maskPlaca, formatCurrency } from '../utils/masks';

export interface ConfirmDeleteServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  osNumber?: number | string;
  vehiclePlate?: string;
  vehicleDescription?: string;
  totalValue?: number | string;
  itemsCount?: number;
  loading: boolean;
}

export const ConfirmDeleteServiceOrderModal: React.FC<ConfirmDeleteServiceOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  osNumber,
  vehiclePlate,
  vehicleDescription,
  totalValue,
  itemsCount,
  loading,
}) => {
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
          <span className="font-semibold text-lg">Excluir ordem de serviço</span>
        </div>
      }
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div className="space-y-4 text-gray-700">
        <p className="text-sm">
          Deseja realmente excluir a ordem de serviço{' '}
          <strong className="text-gray-900 font-bold">Nº {osNumber}</strong>
          {vehiclePlate && (
            <>
              {' '}associada ao veículo{' '}
              <strong className="text-gray-900 font-semibold">{maskPlaca(vehiclePlate)}</strong>
              {vehicleDescription ? ` (${vehicleDescription})` : ''}
            </>
          )}
          ?
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
          <div className="flex items-start gap-2">
            <TriangleAlertIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold">Atenção!</p>
              <p className="mt-1">
                Todas as peças, serviços e demais dados vinculados a esta ordem de serviço serão excluídos.
              </p>
            </div>
          </div>
        </div>

        {itemsCount !== undefined && itemsCount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex justify-between items-center">
            <span>
              Itens na OS: <strong className="font-semibold text-gray-800">{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</strong>
            </span>
            {totalValue !== undefined && (
              <span>
                Valor total: <strong className="font-semibold text-gray-800">{formatCurrency(totalValue)}</strong>
              </span>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="cancel"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? 'Excluindo...' : 'Excluir OS'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteServiceOrderModal;
