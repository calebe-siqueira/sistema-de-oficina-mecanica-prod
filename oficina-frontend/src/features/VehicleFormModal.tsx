import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi, ApiError } from '../hooks/useApi';
import { useAutocomplete } from '../hooks/useAutocomplete'

import { toastify } from '../components/modules/SystemMessages';
import { Modal } from '../components/ui/Modal';
import { InlineAlert } from '../components/ui/InlineAlert';
import { AutocompleteInput } from '../components/ui/AutocompleteInput';
import { InfoPopover } from '../components/ui/InfoPopover';
import { TrashIcon } from '../components/ui/Icons';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { ConfirmDeleteVehicleModal } from './ConfirmDeleteVehicleModal';
import { DuplicatePlateModal, DuplicatePlateOwner } from './DuplicatePlateModal';

import { TIPOS_COMBUSTIVEL } from '../utils/constants';
import { maskPlaca } from '../utils/masks';
import { isValidPlaca, isValidVehicleYear } from '../utils/validators';

import { Montadora, Modelo, ResponseVeiculoDTO, CreateVeiculoDTO } from '../types/veiculo';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number | null;
  vehicle: ResponseVeiculoDTO | null;
  onSaved: (savedVehicle: ResponseVeiculoDTO) => void;
  onDeleted?: (deletedVehicleId: number) => void;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  clientId,
  vehicle,
  onSaved,
  onDeleted
}) => {
  const isNewVehicle = !vehicle;
  const api = useApi();

  const initialFormState: CreateVeiculoDTO = useMemo(() => ({
    placa: '',
    nome_montadora: '',
    nome_modelo: '',
    combustivel: '',
    ano: null,
    cor: '',
    tipo: '',
    fk_cod_cliente: null
  }), []);

  const [formData, setFormData] = useState<CreateVeiculoDTO>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para exclusão de veículo
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [osCountLoading, setOsCountLoading] = useState(false);
  const [osCount, setOsCount] = useState<number | null>(null);

  // Estados para conflito de placa duplicada pertencente a outro cliente
  interface PlateConflictData {
    endpoint: string;
    method: 'POST' | 'PUT';
    payload: CreateVeiculoDTO;
    placa: string;
    owners: DuplicatePlateOwner[];
  }

  const [conflictData, setConflictData] = useState<PlateConflictData | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictSaveLoading, setConflictSaveLoading] = useState(false);

  // --- 1. CONFIGURAÇÃO DO AUTOCOMPLETE DE MONTADORAS ---
  const fetchMontadoras = useCallback(async () => {
    try {
      return await api(`/veiculos/montadoras`, 'GET');
    } catch (err) {
      console.error("Erro ao buscar montadoras:", err);
      return [];
    }
  }, [api]);

  const { suggestions: montadoras, allOptions: allMontadoras } = useAutocomplete<Montadora>(
    formData.nome_montadora,
    fetchMontadoras,
    (m) => m.nome_montadora
  );

  // Identifica a montadora exata para buscar os modelos
  const montadoraSelecionada = useMemo(() => {
    return allMontadoras.find(m => m.nome_montadora.trim().toUpperCase() === formData.nome_montadora.trim().toUpperCase());
  }, [allMontadoras, formData.nome_montadora]);

  const idMontadoraSelecionada = montadoraSelecionada?.cod_montadora;

  // --- 2. CONFIGURAÇÃO DO AUTOCOMPLETE DE MODELOS ---
  const fetchModelos = useCallback(async () => {
    if (!idMontadoraSelecionada) return [];
    try {
      return await api(`/veiculos/montadoras/${idMontadoraSelecionada}/modelos`, 'GET');
    } catch (err) {
      console.error("Erro ao buscar modelos:", err);
      return [];
    }
  }, [api, idMontadoraSelecionada]);

  const { suggestions: modelos } = useAutocomplete<Modelo>(
    formData.nome_modelo,
    fetchModelos,
    (m) => m.nome_modelo
  );

  // --- 3. CARREGAMENTO DOS DADOS AO EDITAR ---
  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        setFormData({ ...vehicle });
      } else {
        setFormData(initialFormState);
      }
      setError(null);
      setIsDeleteModalOpen(false);
      setDeleteLoading(false);
      setOsCount(null);
      setIsConflictModalOpen(false);
      setConflictData(null);
      setConflictSaveLoading(false);
    }
  }, [vehicle, isOpen, initialFormState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === 'placa') value = maskPlaca(value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isVehicleFormValid = () => {
    return (
      formData.placa && isValidPlaca(formData.placa) &&
      formData.nome_montadora.trim() &&
      formData.nome_modelo.trim() &&
      isValidVehicleYear(formData.ano) &&
      formData.cor.trim() &&
      String(formData.combustivel).trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isVehicleFormValid()) {
      toastify.warningMessage('Preencha todos os campos obrigatórios corretamente antes de salvar o veículo');
      setLoading(false);
      return;
    }

    const cleanPlaca = String(formData.placa).replace(/[.\- ]/g, '').toUpperCase();
    const payload = {
      ...formData,
      placa: cleanPlaca,
      fk_cod_cliente: clientId
    };

    // Define endpoint e método conforme o estado do formulário
    const endpoint = isNewVehicle
      ? `/clientes/${clientId}/veiculos`
      : `/veiculos/${vehicle?.cod_veiculo}?clienteId=${clientId}`;
    const method = isNewVehicle ? 'POST' : 'PUT';

    try {
      // 'suppressErrorToast: true' evita disparo global em caso de 409 DUPLICATE_PLATE_OTHER_CLIENT
      const saved = await api(endpoint, method, payload, { suppressErrorToast: true });
      toastify.successMessage('Veículo salvo com sucesso!');
      onSaved(saved);
      setError(null);
    } catch (err: any) {
      // 409 = placa já existe para outro(s) cliente(s) → exibe modal dedicado de confirmação
      const isDuplicatePlate = err instanceof ApiError 
        && err.status === 409 
        && err.data?.type === 'DUPLICATE_PLATE_OTHER_CLIENT';

      if (isDuplicatePlate) {
        setConflictData({
          endpoint,
          method,
          payload,
          placa: cleanPlaca,
          owners: err.data?.owners || []
        });
        setIsConflictModalOpen(true);
        return;
      }

      const errorMessage = err.message || 'Erro ao salvar veículo. Verifique os dados preenchidos e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmação para cadastrar o veículo mesmo com a placa já existente no sistema (force=true)
   */
  const handleConfirmDuplicateSave = async () => {
    if (!conflictData) return;
    setConflictSaveLoading(true);

    try {
      const separator = conflictData.endpoint.includes('?') ? '&' : '?';
      const forcedEndpoint = `${conflictData.endpoint}${separator}force=true`;
      const saved = await api(forcedEndpoint, conflictData.method, conflictData.payload);

      toastify.successMessage('Veículo salvo com sucesso!');
      setIsConflictModalOpen(false);
      setConflictData(null);
      onSaved(saved);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar veículo com confirmação. Tente novamente.';
      toastify.errorMessage(errorMessage, err);
    } finally {
      setConflictSaveLoading(false);
    }
  };

  const handleCloseConflictModal = () => {
    if (conflictSaveLoading) return;
    setIsConflictModalOpen(false);
  };

  /**
   * Abre o modal de confirmação de exclusão e busca a contagem de OSs associadas
   */
  const handleOpenDeleteModal = async () => {
    if (!vehicle?.cod_veiculo) return;
    setIsDeleteModalOpen(true);
    setOsCountLoading(true);
    setOsCount(null);

    try {
      const qtd = await api(`/veiculos/${vehicle.cod_veiculo}/quantidade-os`, 'GET');
      setOsCount(typeof qtd === 'number' ? qtd : Number(qtd?.quantidade ?? qtd ?? 0));
    } catch (err) {
      console.error('Erro ao verificar quantidade de OSs vinculadas:', err);
      setOsCount(null);
    } finally {
      setOsCountLoading(false);
    }
  };

  /**
   * Executa a requisição DELETE do veículo e notifica o componente pai
   */
  const handleConfirmDelete = async () => {
    if (!vehicle?.cod_veiculo) return;
    setDeleteLoading(true);

    try {
      await api(`/veiculos/${vehicle.cod_veiculo}`, 'DELETE');
      toastify.successMessage('Veículo excluído com sucesso!');
      setIsDeleteModalOpen(false);
      onClose();
      if (onDeleted) {
        onDeleted(vehicle.cod_veiculo);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir veículo. Verifique as dependências e tente novamente.';
      toastify.errorMessage(errorMessage, err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Modal title={isNewVehicle ? "Novo veículo" : `Editar veículo: ${vehicle?.placa}`} isOpen={isOpen} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Placa"
              id="placa"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              required
              invalid={formData.placa !== '' && !isValidPlaca(formData.placa)}
              info={
                <InfoPopover
                  title="Formatos de placa"
                  placement="bottom start"
                  content={
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>O sistema aceita os dois padrões nacionais:</p>
                      <p>• <strong>Mercosul:</strong> <code>BRA2E19</code></p>
                      <p>• <strong>Tradicional:</strong> <code>ABC-1234</code></p>
                      <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-100">Letras maiúsculas e traço são ajustados automaticamente.</p>
                    </div>
                  }
                />
              }
            />

            {/* Autocomplete de Montadoras */}
            <AutocompleteInput<Montadora>
              label="Montadora"
              id="nome_montadora"
              placeholder="Digite a montadora..."
              title="Digite para exibir sugestões de montadora"
              value={formData.nome_montadora}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, nome_montadora: val, nome_modelo: '' }));
              }}
              suggestions={montadoras}
              getOptionLabel={(m) => m.nome_montadora}
              getOptionKey={(m) => m.cod_montadora}
              required
              invalid={formData.nome_montadora !== '' && formData.nome_montadora.trim() === ''}
            />

            {/* Autocomplete de Modelos - Bloqueado até que haja texto ou seleção na montadora */}
            <div className={!formData.nome_montadora.trim() ? "opacity-60 pointer-events-none" : ""}>
              <AutocompleteInput<Modelo>
                label="Modelo"
                id="nome_modelo"
                placeholder={formData.nome_montadora.trim() ? "Digite o modelo..." : "Digite uma montadora primeiro"}
                title={modelos.length > 0 ? "Digite para exibir sugestões de modelo de acordo com a montadora selecionada" : "Para ver sugestões de modelos, selecione uma das montadoras sugeridas no campo anterior"}
                value={formData.nome_modelo}
                onChange={(val) => setFormData(prev => ({ ...prev, nome_modelo: val }))}
                suggestions={modelos}
                getOptionLabel={(m) => m.nome_modelo}
                getOptionKey={(m) => m.cod_modelo}
                required
              />
            </div>
            
            <Input
              label="Ano"
              id="ano"
              name="ano"
              type="number"
              value={formData.ano ? String(formData.ano) : ''}
              onChange={handleChange}
              required
              min="1886"
              max={new Date().getFullYear() + 1}
              invalid={formData.ano !== null && !isValidVehicleYear(formData.ano)}
            />
            <Input
              label="Cor"
              id="cor"
              name="cor"
              value={formData.cor}
              onChange={handleChange}
              required
            />
            <Select
              label="Combustível"
              id="combustivel"
              name="combustivel"
              value={formData.combustivel}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              {TIPOS_COMBUSTIVEL.map((fuel: string) => <option key={fuel} value={fuel}>{fuel}</option>)}
            </Select>
          </div>

          <InlineAlert message={error} />

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {!isNewVehicle && onDeleted && (
                <Button
                  type="button"
                  variant="trash_gray"
                  onClick={handleOpenDeleteModal}
                  disabled={loading || deleteLoading}
                  title="Excluir este veículo do sistema"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  Excluir veículo
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="cancel"
                onClick={onClose}
                disabled={loading || deleteLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || deleteLoading || !isVehicleFormValid()}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {vehicle && (
        <ConfirmDeleteVehicleModal
          isOpen={isDeleteModalOpen}
          onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          vehiclePlate={vehicle.placa}
          vehicleDescription={`${formData.nome_montadora} ${formData.nome_modelo}`.trim()}
          osCount={osCount}
          osCountLoading={osCountLoading}
          loading={deleteLoading}
        />
      )}

      <DuplicatePlateModal
        isOpen={isConflictModalOpen}
        onClose={handleCloseConflictModal}
        onConfirmSave={handleConfirmDuplicateSave}
        placa={conflictData?.placa || formData.placa}
        owners={conflictData?.owners || []}
        loading={conflictSaveLoading}
      />
    </>
  );
};
