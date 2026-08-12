import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi, ApiError } from '../hooks/useApi';
import { useAutocomplete } from '../hooks/useAutocomplete'

import { toastify } from '../components/modules/SystemMessages';
import { Modal } from '../components/ui/Modal';
import { InlineAlert } from '../components/ui/InlineAlert';
import { AutocompleteInput } from '../components/ui/AutocompleteInput';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

import { TIPOS_COMBUSTIVEL } from '../utils/constants';
import { maskPlaca } from '../utils/masks';
import { isValidPlaca, isValidVehicleYear } from '../utils/validators';

import { Montadora, Modelo, ResponseVeiculoDTO, CreateVeiculoDTO } from '../types/veiculo';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | number;
  vehicle: ResponseVeiculoDTO | null;
  onSaved: (savedVehicle: ResponseVeiculoDTO) => void;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  clientId,
  vehicle,
  onSaved
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
  const [error, setError] = useState('');

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
      setError('');
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
    setError('');

    if (!isVehicleFormValid()) {
      toastify.warningMessage('Preencha todos os campos obrigatórios corretamente antes de salvar o veículo');
      setLoading(false);
      return;
    }

    try {
      const cleanPlaca = String(formData.placa).replace(/[.\- ]/g, '').toUpperCase();
      const payload = {
        ...formData,
        placa: cleanPlaca,
        fk_cod_cliente: typeof clientId === 'string' ? parseInt(clientId, 10) : clientId
      };

      if (isNewVehicle) {
        try {
          const saved = await api(`/clientes/${clientId}/veiculos`, 'POST', payload);
          toastify.successMessage('Veículo salvo com sucesso!');
          onSaved(saved);
        } catch (err: any) {
          // 409 = placa já existe para outro(s) cliente(s) → exibe confirmação
          if (err instanceof ApiError && err.status === 409 && err.data?.type === 'DUPLICATE_PLATE_OTHER_CLIENT') {
            if (!window.confirm(err.data.message)) { setLoading(false); return; }
            // Usuário confirmou: reenvia com force=true para ignorar o conflito
            const saved = await api(`/clientes/${clientId}/veiculos?force=true`, 'POST', payload);
            toastify.successMessage('Veículo salvo com sucesso!');
            onSaved(saved);
          } else {
            // 400 (duplicata no mesmo cliente) ou outro erro → exibe mensagem
            throw err;
          }
        }
      } else {
        try {
          const saved = await api(`/veiculos/${vehicle?.cod_veiculo}?clienteId=${clientId}`, 'PUT', payload);
          toastify.successMessage('Veículo salvo com sucesso!');
          onSaved(saved);
        } catch (err: any) {
          if (err instanceof ApiError && err.status === 409 && err.data?.type === 'DUPLICATE_PLATE_OTHER_CLIENT') {
            if (!window.confirm(err.data.message)) { setLoading(false); return; }
            const saved = await api(`/veiculos/${vehicle?.cod_veiculo}?clienteId=${clientId}&force=true`, 'PUT', payload);
            toastify.successMessage('Veículo salvo com sucesso!');
            onSaved(saved);
          } else {
            throw err;
          }
        }
      }
      setError('');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar veículo. Verifique os dados preenchidos e tente novamente.';
      setError(errorMessage);
      toastify.errorMessage(errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <InlineAlert error={error} />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}> Cancelar </Button>
          <Button type="submit" variant="primary" disabled={loading || !isVehicleFormValid()}> {loading ? 'Salvando...' : 'Salvar'} </Button>
        </div>
      </form>
    </Modal>
  );
};
