import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';

import VehicleList from '../../features/VehicleList';
import ServiceOrderList from '../../features/ServiceOrderList';
import ListWithPagination from '../../features/ListWithPagination';
import { VehicleFormModal } from '../../features/VehicleFormModal';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { TableEmptyState } from '../../components/modules/TableEmptyState';
import { toastify } from '../../components/modules/SystemMessages';
import { ChevronLeftIcon, TrashIcon, PlusIcon, SearchIcon, EraserIcon } from '../../components/ui/Icons';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { InfoPopover } from '../../components/ui/InfoPopover';
import { ItemsPerPageSelector } from '../../components/ui/ItemsPerPageSelector';

import { ESTADOS_BRASIL, STATUS_MAP } from '../../utils/constants';
import { formatDateToISO, getBirthDateRange, dateInRange, getLocalTodayString } from '../../utils/date';
import { handleStatusChange } from '../../utils/handleStatusChange';
import { maskCep, maskCpfCnpj, maskPhone, maskPlaca } from '../../utils/masks';
import { isValidAddress, isValidCep, isValidCpfCnpj, isValidClientPhones } from '../../utils/validators';

import { ResponseVeiculoDTO } from '../../types/veiculo';
import { ResponseClienteDTO, ResponseEnderecoDTO, ResponseAtivarAcessoDTO } from '../../types/cliente';
import { ConfirmActivateModal, ConfirmDeactivateModal, AccessResultModal } from '../../features/ClientAccessModals';

export const ClientFormScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const clientId = id === 'new' || !id ? null : Number(id);
  const isNewClient = id === 'new' || !id;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const state = location.state || {};

  const scrollToVehicles = Boolean(state.scrollToVehicles || searchParams.get('scrollToVehicles') === 'true');
  const openVehicleModal = Boolean(state.openVehicleModal || searchParams.get('openVehicleModal') === 'true');
  const navOsSearchType = state.osSearchType || searchParams.get('osSearchType');
  const navOsSearchTerm = state.osSearchTerm || searchParams.get('osSearchTerm');

  const initialClientState = useMemo<Partial<ResponseClienteDTO>>(() => ({ nome_cliente: '', email: '', celular: '', telefone: '', cpf_cnpj: '', rg: '', data_nascimento: '', tipo: 'F' }), []);
  const initialAddressState = useMemo<Partial<ResponseEnderecoDTO>>(() => ({ cep: '', logradouro: '', numero: undefined, complemento: '', bairro: '', cidade: '', uf: '' }), []);

  const [client, setClient] = useState<Partial<ResponseClienteDTO>>(initialClientState);
  const [address, setAddress] = useState<Partial<ResponseEnderecoDTO>>(initialAddressState);
  const [vehicles, setVehicles] = useState<ResponseVeiculoDTO[]>([]);
  const [originalName, setOriginalName] = useState('');

  const [loading, setLoading] = useState(!isNewClient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [cpfCnpjInvalid, setCpfCnpjInvalid] = useState(false);
  const [celularInvalid, setCelularInvalid] = useState(false);
  const [telefoneInvalid, setTelefoneInvalid] = useState(false);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(!!openVehicleModal);
  const [selectedVehicle, setSelectedVehicle] = useState<ResponseVeiculoDTO | null>(null);

  const [osSearchType, setOsSearchType] = useState(navOsSearchType || 'cod_os');
  const [osStartDate, setOsStartDate] = useState('');
  const [osEndDate, setOsEndDate] = useState('');
  const [osFilterStatus, setOsFilterStatus] = useState('Todas');
  const [osItemsPerPage, setOsItemsPerPage] = useState(25);
  const [osCurrentPage, setOsCurrentPage] = useState(1);

  // Tipos de busca numérica/por ID: não exigem mínimo de caracteres
  const isIdSearchType = (type: string) =>
    type === 'cod_os' || type === 'cod_veiculo' || type === 'cod_cliente';

  const {
    searchInput: osSearchInput,
    setSearchInput: setOsSearchInput,
    searchTerm: osSearchTerm,
    triggerSearch: triggerOsSearch,
    resetSearch: resetOsSearch,
    setImmediate: setImmediateOs
  } = useDebouncedSearch({
    initialValue: navOsSearchTerm || '',
    isIdType: isIdSearchType,
    searchType: osSearchType
  });

  const [clientHasActiveUser, setClientHasActiveUser] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [accessActionLoading, setAccessActionLoading] = useState(false);
  const [accessResult, setAccessResult] = useState<ResponseAtivarAcessoDTO | null>(null);
  const [accessResultModalOpen, setAccessResultModalOpen] = useState(false);

  const { orders: osOrders, loading: osLoading, error: osError, fetchOrders: fetchClientOs, totalPages: osTotalPages } = useServiceOrders({
    clientId,
    searchType: osSearchType,
    searchTerm: osSearchTerm,
    startDate: osStartDate,
    endDate: osEndDate,
    filterStatus: osFilterStatus,
    page: osCurrentPage,
    size: osItemsPerPage
  });

  const api = useApi();
  const vehiclesSectionRef = useRef<HTMLDivElement>(null);

  const [minNascimento, maxNascimento] = useMemo(() => getBirthDateRange(), []);

  useEffect(() => {
    let isMounted = true;
    if (!isNewClient && clientId) {
      const fetchClientData = async () => {
        setLoading(true);
        setError(null);
        setAddressError(null);
        try {
          const [clientData, accessStatus] = await Promise.all([
            api(`/clientes/${clientId}`),
            api(`/clientes/${clientId}/tem-acesso`).catch((err: any) => {
              console.warn('Não foi possível verificar status de acesso do cliente:', err);
              return null;
            })
          ]);
          if (isMounted && clientData) {
            // Clonagem de segurança para não mutar acidentalmente objetos fora do estado
            const c = { ...(clientData.cliente || initialClientState) };
            clientData.data_nascimento = formatDateToISO(clientData.data_nascimento);
            clientData.cpf_cnpj = maskCpfCnpj(clientData.cpf_cnpj, clientData.tipo);
            clientData.celular = maskPhone(clientData.celular);
            clientData.telefone = maskPhone(clientData.telefone);
            setClient(clientData);
            setOriginalName(clientData.nome_cliente);

            const addr = { ...(clientData.endereco || initialAddressState) };
            addr.cep = maskCep(addr.cep);
            setAddress(addr);

            setVehicles(Array.isArray(clientData.veiculos) ? clientData.veiculos : []);

            if (accessStatus) {
              setClientHasActiveUser(Boolean(accessStatus.tem_acesso));
            }
          }
        } catch (err: any) {
          if (isMounted) {
            const errorMessage = err.message || 'Erro ao carregar cliente. Verifique sua conexão e tente novamente.';
            setError(errorMessage);
            toastify.errorMessage(errorMessage, err);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchClientData();
    } else if (!clientId && !isNewClient) {
      toastify.errorMessage('ID de cliente inválido. Recarregue a página e tente novamente.');
      setError('ID de cliente inválido. Recarregue a página e tente novamente.');
      setLoading(false);
    } else {
      setLoading(false);
    }
    return () => { isMounted = false };
  }, [clientId, isNewClient, api, initialClientState, initialAddressState]);

  useEffect(() => {
    if (scrollToVehicles && vehiclesSectionRef.current && !loading) {
      setTimeout(() => vehiclesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [scrollToVehicles, loading]);

  // Sincroniza os filtros de busca de OS/veículo quando informados via navegação (state ou searchParams)
  useEffect(() => {
    if (navOsSearchType) {
      setOsSearchType(navOsSearchType);
    }
    if (navOsSearchTerm) {
      setImmediateOs(String(navOsSearchTerm));
    }
  }, [clientId, navOsSearchType, navOsSearchTerm, setImmediateOs]);

  // --- Validações ---

  // Validação de celular/telefone (1 obrigatório)
  // phoneValidation.isValid: Valida se todos os preenchidos são válidos
  // phoneValidation.atLeastOneIsValid: Valida se pelo menos um dos preenchidos é válido
  const phoneValidation = isValidClientPhones(client.celular, client.telefone);  

  // Validação de CPF/CNPJ
  const isCpfCnpjValid = isValidCpfCnpj(client.cpf_cnpj, client.tipo);

  // Validação de endereço
  const isAddressValid = isValidAddress(address).isValid; // Retorna um booleano isValid e uma string error

  // Validação de data de nascimento
  const isBirthDateValid = !client.data_nascimento || dateInRange(client.data_nascimento, minNascimento, maxNascimento);

  const isEmailValidForAccess = !clientHasActiveUser || Boolean((client.email || '').trim());

  const isValidClientForm = (client.nome_cliente || '').trim() !== '' && phoneValidation.isValid && isBirthDateValid && isAddressValid && isCpfCnpjValid && isEmailValidForAccess;

  // --- Handles ---
  const handleClientBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cpf_cnpj') {
      setCpfCnpjInvalid(!isValidCpfCnpj(value, client?.tipo));
      return;
    }

    if (name === 'celular' || name === 'telefone') {
      const celularVal = name === 'celular' ? value : client?.celular;
      const telefoneVal = name === 'telefone' ? value : client?.telefone;

      const { celularInvalid, telefoneInvalid } = isValidClientPhones(celularVal, telefoneVal);
    
      setCelularInvalid(celularInvalid);
      setTelefoneInvalid(telefoneInvalid);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se o usuário mudou o "tipo" (F ou J), reformata o cpf_cnpj já preenchido
    if (name === 'tipo') {
      const updatedCpfCnpj = maskCpfCnpj(client?.cpf_cnpj, value);

      setClient((prev: any) => ({
        ...prev,
        tipo: value,
        cpf_cnpj: updatedCpfCnpj,
      }));
      setCpfCnpjInvalid(!isValidCpfCnpj(updatedCpfCnpj, value))
      return
    }

    // Mapeamento de máscaras por campo
    const masks: Record<string, (val: string) => string> = {
      cpf_cnpj: (val) => maskCpfCnpj(val, client?.tipo),
      celular: maskPhone,
      telefone: maskPhone,
    };

    const formattedValue = masks[name] ? masks[name](value) : value;

    setClient((prev: any) => ({ ...prev, [name]: formattedValue }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === 'cep') value = maskCep(value);
    if (name === 'numero') {
      if (value === '') {
        value = '';
      } else {
        const parsed = parseInt(value, 10);
        value = Number.isNaN(parsed) ? '' : String(Math.max(0, parsed));
      }
    }
    setAddress((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCepSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = String(e.target.value).replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress((prev: any) => ({ ...prev, cep: maskCep(data.cep), logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, complemento: data.complemento || '' }));
          document.getElementById('numero')?.focus();
        } else {
          toastify.warningMessage("Não foi possível encontrar um endereço para o CEP informado. Verifique o CEP e tente novamente.");
        }
      } catch (err) {
        toastify.errorMessage("Não foi possível buscar pelo CEP. Verifique sua conexão e tente novamente.", err as Error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCpfCnpjValidForSubmit = isValidCpfCnpj(client.cpf_cnpj, client.tipo);
    setCpfCnpjInvalid(!isCpfCnpjValidForSubmit);

    const addressValidationForSubmit = isValidAddress(address);
    setAddressError(addressValidationForSubmit.error);

    if (!isCpfCnpjValidForSubmit || !addressValidationForSubmit.isValid) return;

    if (clientHasActiveUser && (!client.email || !client.email.trim())) {
      toastify.warningMessage('O campo de e-mail é obrigatório quando o acesso do cliente está ativado.');
      document.getElementById('email')?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...client,
        data_nascimento: formatDateToISO(client.data_nascimento) || null,
        cpf_cnpj: client.cpf_cnpj ? String(client.cpf_cnpj).replace(/[.\-\/]/g, '') : null,
        endereco: {
          ...address,
          cep: address.cep ? String(address.cep).replace(/\D/g, '') : null,
          numero: address.numero ? Number(address.numero) : null
        }
      };
      if (!payload.endereco.cep) (payload as any).endereco = null;

      if (isNewClient) {
        const newClientData = await api('/clientes', 'POST', payload);
        toastify.successMessage('Cliente criado com sucesso!');
        navigate(`/clientes/${newClientData.cod_cliente}/editar`, { replace: true });
      } else {
        await api(`/clientes/${clientId}`, 'PUT', payload);
        setOriginalName(payload.nome_cliente || '');
        toastify.successMessage('Cliente atualizado com sucesso!');
      }
      setError(null);
      setAddressError(null);
    } catch (err: any) {
      toastify.errorMessage(err.message || 'Erro ao salvar cliente. Verifique os dados preenchidos e tente novamente.', err);
      setError(err.message || 'Erro ao salvar cliente. Verifique os dados preenchidos e tente novamente.');
    } finally { setSaving(false); }
  };

  const handleToggleAccess = (nextChecked: boolean) => {
    if (isNewClient || !clientId) {
      toastify.warningMessage('Salve os dados do cliente antes de ativar ou gerenciar o acesso ao sistema.');
      return;
    }

    if (nextChecked) {
      if (!client.email || !client.email.trim()) {
        toastify.warningMessage('Para ativar o acesso do cliente, é necessário preencher o campo de e-mail.');
        document.getElementById('email')?.focus();
        return;
      }
      setActivateModalOpen(true);
    } else {
      setDeactivateModalOpen(true);
    }
  };

  const handleConfirmActivateAccess = async () => {
    if (!clientId) return;
    if (!client.email || !client.email.trim()) {
      toastify.warningMessage('Para ativar o acesso do cliente, é necessário preencher o campo de e-mail.');
      setActivateModalOpen(false);
      document.getElementById('email')?.focus();
      return;
    }

    setAccessActionLoading(true);
    try {
      // Garante que o cadastro atualizado (especialmente o e-mail) seja salvo antes de ativar o acesso
      const payload = {
        ...client,
        data_nascimento: formatDateToISO(client.data_nascimento) || null,
        cpf_cnpj: client.cpf_cnpj ? String(client.cpf_cnpj).replace(/[.\-\/]/g, '') : null,
        endereco: {
          ...address,
          cep: address.cep ? String(address.cep).replace(/\D/g, '') : null,
          numero: address.numero ? Number(address.numero) : null
        }
      };
      if (!payload.endereco.cep) (payload as any).endereco = null;
      await api(`/clientes/${clientId}`, 'PUT', payload);
      setOriginalName(payload.nome_cliente || '');

      const response: ResponseAtivarAcessoDTO = await api(`/clientes/${clientId}/ativar-acesso`, 'POST');
      setClientHasActiveUser(true);
      setActivateModalOpen(false);
      setAccessResult(response);
      setAccessResultModalOpen(true);
      toastify.successMessage(response.mensagem || 'Acesso ativado com sucesso!');
    } catch (err: any) {
      toastify.errorMessage(err.message || 'Erro ao ativar o acesso do cliente.', err);
    } finally {
      setAccessActionLoading(false);
    }
  };

  const handleConfirmDeactivateAccess = async () => {
    if (!clientId) return;
    setAccessActionLoading(true);
    try {
      await api(`/clientes/${clientId}/desativar-acesso`, 'DELETE');
      setClientHasActiveUser(false);
      setDeactivateModalOpen(false);
      toastify.successMessage('Acesso do cliente desativado com sucesso!');
    } catch (err: any) {
      toastify.errorMessage(err.message || 'Erro ao desativar o acesso do cliente.', err);
    } finally {
      setAccessActionLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client?.nome_cliente}? Esta ação removerá também os veículos e ordens de serviço associados.`)) {
      try {
        await api(`/clientes/${clientId}`, 'DELETE');
        toastify.successMessage('Cliente excluído com sucesso!');
        navigate('/clientes');
        setError(null);
        setAddressError(null);
      } catch (err: any) {
        toastify.errorMessage(err.message || 'Erro ao excluir cliente. Verifique as dependências (como veículos e OS) e tente novamente.', err);
      }
    }
  };

  const handleOrderSearch = (e: React.FormEvent) => {
    // A submissão explícita do formulário cancela o debounce e aplica o termo imediatamente
    e.preventDefault();
    setOsCurrentPage(1);

    // UX inteligente para busca por intervalo de datas:
    // Se preencheu apenas a data inicial e clicou em buscar, preenche a data final com a data atual
    if (osSearchType === 'intervalo_data') {
      let finalEndDate = osEndDate;
      if (osStartDate && !osEndDate) {
        finalEndDate = getLocalTodayString();
        setOsEndDate(finalEndDate);
      }

      if (osStartDate && finalEndDate && osStartDate > finalEndDate) {
        toastify.warningMessage('A data inicial não pode ser posterior à data final.');
        return;
      }
    }

    const { hasChanged } = triggerOsSearch();
    if (!hasChanged) {
      fetchClientOs();
    }
  };

  const hasActiveOsFilters = Boolean(
    osSearchInput.trim() !== '' ||
    osStartDate !== '' ||
    osEndDate !== '' ||
    osFilterStatus !== 'Todas'
  );

  let noOrders = "Nenhuma OS encontrada";
  if (!osLoading && osOrders.length === 0) {
    if (osSearchType === 'cod_veiculo' && osSearchTerm !== '') {
      noOrders = "Nenhuma OS encontrada para este veículo";
    } else if (hasActiveOsFilters) {
      noOrders = "Nenhuma OS encontrada para esta busca";
    } else {
      noOrders = "Nenhuma OS encontrada para este cliente";
    }
  }

  if (loading && !isNewClient) return <p className="p-8">Carregando informações do cliente...</p>;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 mb-6">
        <div className="flex justify-between items-center">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            <ChevronLeftIcon className="mr-2 h-5 w-5" />
            Voltar
          </Button>
          {!isNewClient && (
            <Button
              type="button"
              variant="trash_white"
              onClick={handleDeleteClient}
            >
              <TrashIcon className="mr-2 h-5 w-5" />
              Excluir cliente
            </Button>
          )}
        </div>

        <InlineAlert message={error} />
        <InlineAlert message={addressError} />

        <Card>
          <CardHeader actions={
            <div className="flex items-center gap-2">
              <ToggleSwitch
                ref={switchRef}
                label={clientHasActiveUser ? "Ativo" : "Inativo"}
                title={
                  isNewClient
                    ? "Salve o cliente para poder gerenciar o acesso ao sistema"
                    : (clientHasActiveUser ? "Cliente com usuário ativo (clique para desativar)" : "Cliente sem usuário ativo (clique para ativar)")
                }
                checked={clientHasActiveUser}
                onChange={handleToggleAccess}
              />
              <InfoPopover
                title="Acesso ao Portal do Cliente"
                placement="bottom end"
                content={
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Status do usuário:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${clientHasActiveUser
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                        {clientHasActiveUser ? '● Ativo' : '○ Inativo'}
                      </span>
                    </div>

                    <p className="leading-snug">
                      Permite ao cliente entrar no sistema web para acompanhar seus veículos, histórico de serviços e ordens de serviço.
                    </p>

                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 border border-slate-100 text-[11px]">
                      <p className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">•</span>
                        <span><strong>Login:</strong> Utiliza o e-mail cadastrado no formulário.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">•</span>
                        <span><strong>Credenciais:</strong> Uma senha temporária é gerada e enviada por e-mail no momento da ativação.</span>
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          }>
            {isNewClient ? 'Novo cliente' : `Editando: ${originalName || ''}`}
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 xl:col-span-1">
              <Input label="Código" id="cod_cliente" name="cod_cliente" value={client?.cod_cliente || ''} onChange={handleClientChange} placeholder={isNewClient ? 'Gerado automaticamente' : ''} title={isNewClient ? 'Será gerado automaticamente ao salvar o cliente' : ''} readOnly />
            </div>
            <div className="md:col-span-10 xl:col-span-5">
              <Input label="Nome completo" id="nome_cliente" name="nome_cliente" value={client?.nome_cliente || ''} onChange={handleClientChange} required />
            </div>
            <div className="md:col-span-4 xl:col-span-2">
              <Input label="CPF/CNPJ" id="cpf_cnpj" name="cpf_cnpj" value={client?.cpf_cnpj || ''} onChange={handleClientChange} onBlur={handleClientBlur} invalid={cpfCnpjInvalid && !!client.cpf_cnpj} />
            </div>
            <div className="md:col-span-4 xl:col-span-2">
              <Select label="Tipo" id="tipo" name="tipo" value={client?.tipo || 'F'} onChange={handleClientChange} onBlur={handleClientBlur} >
                <option value="F">Pessoa Física</option>
                <option value="J">Pessoa Jurídica</option>
              </Select>
            </div>

            {/* <div className="md:col-span-6 lg:col-span-3">
              <Input label="RG" id="rg" name="rg" value={client?.rg || ''} onChange={handleClientChange} />
            </div> */}
            <div className="md:col-span-4 xl:col-span-2">
              <Input label="Data de nascimento" id="data_nascimento" name="data_nascimento" type="date" value={client?.data_nascimento || ''} onChange={handleClientChange} min={minNascimento} max={maxNascimento} invalid={!!client?.data_nascimento && !isBirthDateValid} />
            </div>

            {/* Container agrupador da seção de informações de contato */}
            <fieldset className="md:col-span-12 flex flex-col border border-gray-300 rounded-lg p-4 lg:pt-0">
              <legend className="px-2 text-sm font-medium text-gray-700 inline-flex items-center gap-1.5">
                <span>Informações de contato</span>
                <InfoPopover
                  title="Canais de contato"
                  placement="bottom start"
                  content={
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p>• <strong>Telefones:</strong> Pelo menos um telefone (celular ou fixo) deve ser informado para contato e notificações da oficina.</p>
                      <p>• <strong>E-mail:</strong> Obrigatório caso a chave de acesso ao portal do cliente esteja ativada.</p>
                    </div>
                  }
                />
              </legend>

              {/* 
                Grid principal:
                - Padrão (Mobile): 1 coluna (todos os campos empilhados)
                - md e lg: 12 colunas para permitir redimensionar os campos individualmente
              */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* E-mail */}
                <div className="md:col-span-12 lg:col-span-6">
                  <div className="h-auto lg:h-[44px]" />
                  <Input
                    label="E-mail"
                    id="email"
                    name="email"
                    type="email"
                    value={client?.email || ''}
                    onChange={handleClientChange}
                    required={clientHasActiveUser}
                  />
                </div>

                {/* Grupo de Telefones */}
                <div className="md:col-span-12 lg:col-span-6">

                  {/* Cabeçalho do Grupo */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Telefones <span className="text-red-600">*</span>
                    </label>
                    <p className={`text-xs ${
                      (celularInvalid || telefoneInvalid) && !phoneValidation.atLeastOneIsValid
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                      }`}
                    >
                      (Preencha pelo menos uma das opções abaixo)
                    </p>
                  </div>

                  {/* Sub-grid para Celular e Telefone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Celular"
                      id="celular"
                      name="celular"
                      type="tel"
                      value={client?.celular || ''}
                      onChange={handleClientChange}
                      onBlur={handleClientBlur}
                      placeholder="(99) 99999-9999"
                      invalid={celularInvalid}
                    />

                    <Input
                      label="Telefone"
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={client?.telefone || ''}
                      onChange={handleClientChange}
                      onBlur={handleClientBlur}
                      placeholder="(99) 9999-9999"
                      invalid={telefoneInvalid}
                    />
                  </div>

                </div>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Endereço</CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 xl:col-span-2">
              <Input label="CEP" id="cep" name="cep" value={address?.cep || ''} onChange={(e) => { handleAddressChange(e); handleCepSearch(e as any); }} placeholder="00000-000" required={!!address.cep} invalid={!!address?.cep && !isValidCep(address.cep)} />
            </div>
            <div className="md:col-span-9 xl:col-span-8">
              <Input label="Logradouro" id="logradouro" name="logradouro" value={address?.logradouro || ''} onChange={handleAddressChange} required={!!address.cep} />
            </div>
            <div className="md:col-span-3 xl:col-span-2">
              <Input label="Número" id="numero" name="numero" type="number" min="0" step="1" value={address?.numero ?? ''} onChange={handleAddressChange} required={!!address.cep} invalid={address?.numero !== undefined && address.numero < 0} />
            </div>

            <div className="md:col-span-9 xl:col-span-3">
              <Input label="Complemento" id="complemento" name="complemento" value={address?.complemento || ''} onChange={handleAddressChange} />
            </div>
            <div className="md:col-span-5 xl:col-span-4">
              <Input label="Bairro" id="bairro" name="bairro" value={address?.bairro || ''} onChange={handleAddressChange} required={!!address.cep} />
            </div>
            <div className="md:col-span-5 xl:col-span-3">
              <Input label="Cidade" id="cidade" name="cidade" value={address?.cidade || ''} onChange={handleAddressChange} required={!!address.cep} />
            </div>
            <div className="md:col-span-2 xl:col-span-2">
              <Select label="UF" id="uf" name="uf" value={address?.uf || ''} onChange={handleAddressChange} required={!!address.cep}>
                <option value="">Selecione</option>
                {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            variant="cancel"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            disabled={saving || loading || !isValidClientForm}
          >
            {saving ? 'Salvando...' : 'Salvar cliente'}
          </Button>
        </div>
      </form>

      {!isNewClient && (
        <div className='space-y-6'>
          <Card ref={vehiclesSectionRef} id="vehicles-section">
            <CardHeader actions={
              <Button
                type="button"
                onClick={() => { setSelectedVehicle(null); setVehicleModalOpen(true); }}
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Novo veículo
              </Button>}>
              Veículos
            </CardHeader>
            <CardContent>
              {(!Array.isArray(vehicles) || vehicles.length === 0) ? (
                <TableEmptyState message='Nenhum veículo cadastrado' className='pt-0 pb-0' />
              ) : (
                <VehicleList
                  vehicles={vehicles}
                  extraColumns={[VehicleList.Columns.FUEL]}
                  isRowHighlighted={(v) => osSearchType === 'cod_veiculo' && osSearchInput === String(v.cod_veiculo)}
                  onRowClick={(v) => {
                    // Clicar em um veículo na tabela de veículos filtra suas OSs;
                    // Clicar novamente no mesmo veículo restaura a listagem completa de OSs.
                    if (osSearchType === 'cod_veiculo' && osSearchInput === String(v.cod_veiculo)) {
                      setOsSearchType('cod_os');
                      resetOsSearch();
                    } else {
                      setOsSearchType('cod_veiculo');
                      setImmediateOs(String(v.cod_veiculo));
                    }
                    setOsCurrentPage(1);
                  }}
                  renderActions={(v) => (
                    <>
                      <VehicleList.CreateOsButton
                        onClick={() => {
                          navigate('/ordens-servico/nova', {
                            state: {
                              vehicleId: v.cod_veiculo,
                              clientId: clientId
                            }
                          });
                        }}
                      />
                      <VehicleList.EditButton
                        onClick={() => {
                          setSelectedVehicle(v);
                          setVehicleModalOpen(true);
                        }}
                      />
                    </>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleOrderSearch}>
            <Card>
              <CardHeader>
                {osSearchType === 'cod_veiculo' && osSearchInput !== ''
                  ? `Ordens de serviço do veículo ${maskPlaca(vehicles.find(v => v.cod_veiculo === parseInt(osSearchInput, 10))?.placa || '')}`.trim()
                  : 'Ordens de serviço'}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col xl:flex-row gap-4 w-full justify-between items-start xl:items-center mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto flex-grow">
                    <Select
                      value={osSearchType}
                      onChange={(e) => {
                        setOsSearchType(e.target.value);
                        resetOsSearch();
                        setOsStartDate("");
                        setOsEndDate("");
                        setOsCurrentPage(1);
                      }}
                      className="w-full sm:w-auto shrink-0"
                    >
                      <optgroup label="Dados da OS">
                        <option value="cod_os">Código</option>
                        <option value="data">Data</option>
                        <option value="intervalo_data">Intervalo de datas</option>
                      </optgroup>
                      <optgroup label="Dados do veículo">
                        <option value="placa">Placa</option>
                        <option value="montadora">Montadora</option>
                        <option value="modelo">Modelo</option>
                        <option value="ano">Ano</option>
                        <option value="cor">Cor</option>
                        <option value="cod_veiculo" className="hidden">Código do veículo</option>
                      </optgroup>
                    </Select>

                    <div className="flex flex-row items-center gap-2 w-full sm:w-auto flex-grow">
                      {osSearchType === 'intervalo_data' ? (
                        <div className="flex items-center gap-1 w-full sm:w-auto">
                          <Input
                            type="date"
                            value={osStartDate}
                            onChange={e => setOsStartDate(e.target.value)}
                            required
                          />
                          <span className="text-gray-500 text-sm font-medium px-1">até</span>
                          <Input
                            type="date"
                            value={osEndDate}
                            onChange={e => setOsEndDate(e.target.value)}
                            required
                          />
                        </div>
                      ) : osSearchType === 'data' ? (
                        <Input
                          type="date"
                          value={osSearchInput}
                          onChange={e => setOsSearchInput(e.target.value)}
                          className="w-full sm:w-auto flex-grow"
                          required
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Buscar..."
                          value={osSearchInput}
                          onChange={(e) => setOsSearchInput(e.target.value)}
                          className="w-full flex-grow sm:w-auto"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        title="Limpar filtros"
                        className="border-gray-300 shrink-0 sm:w-auto"
                        onClick={() => {
                          resetOsSearch();
                          setOsStartDate("");
                          setOsEndDate("");
                          setOsFilterStatus("Todas");
                          setOsSearchType("cod_os");
                          setOsCurrentPage(1);
                        }}
                      >
                        <EraserIcon className="h-5 w-5" />
                      </Button>
                    </div>

                    <Button
                      type='submit'
                      variant="primary"
                      className="w-full sm:w-auto shrink-0"
                    >
                      <SearchIcon className="mr-2 h-5 w-5" />
                      Buscar
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
                    <Select
                      value={osFilterStatus}
                      onChange={(e) => {
                        setOsFilterStatus(e.target.value);
                        setOsCurrentPage(1);
                      }}
                      className="w-full sm:w-auto shrink-0"
                    >
                      <option value="Todas">Todos os Status</option>
                      <optgroup label="Status da Ordem">
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={`ord_${k}`} value={k}>{v.text}</option>)}
                      </optgroup>
                      <optgroup label="Status de Pagamento">
                        <option value="pag_pendente">Pagamento pendente</option>
                        <option value="pag_parcial">Pago parcialmente</option>
                        <option value="pag_pago">Pago integralmente</option>
                      </optgroup>
                    </Select>

                    <ItemsPerPageSelector
                      itemsPerPage={osItemsPerPage}
                      onChange={(val) => {
                        setOsItemsPerPage(val);
                        setOsCurrentPage(1);
                      }}
                      className='w-full xl:w-auto justify-end'
                    />
                  </div>
                </div>

                <InlineAlert message={osError} />

                {osLoading ? (
                  <p>Carregando OS...</p>
                ) : !osError && (
                  <ListWithPagination
                    key={osSearchTerm + osSearchType + osStartDate + osEndDate + osFilterStatus}
                    data={osOrders}
                    itemsPerPage={osItemsPerPage}
                    currentPage={osCurrentPage}
                    totalPages={osTotalPages}
                    onPageChange={setOsCurrentPage}
                  >
                    {(paginatedOrders: any[]) => (
                      <ServiceOrderList
                        orders={paginatedOrders}
                        view="osListForClient"
                        clientId={clientId}
                        noOrdersMessage={noOrders}
                        api={api as any}
                        onStatusChange={(os: any, status: string) => handleStatusChange(os, status, api as any, fetchClientOs as any)}
                        onEdit={(os: any) => navigate(`/ordens-servico/${os.cod_os}/editar`, { state: { vehicleId: os.fk_cod_veiculo, clientId: clientId } })}
                      />
                    )}
                  </ListWithPagination>
                )}

              </CardContent>
            </Card>
          </form>
        </div>
      )}

      <VehicleFormModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setSelectedVehicle(null);
        }}
        clientId={clientId}
        vehicle={selectedVehicle}
        onSaved={(v: ResponseVeiculoDTO) => {
          setVehicleModalOpen(false);
          setSelectedVehicle(null);
          if (selectedVehicle) setVehicles(prev => prev.map(x => x.cod_veiculo === v.cod_veiculo ? v : x));
          else setVehicles(prev => [...prev, v]);
          fetchClientOs();
        }}
        onDeleted={(deletedId: number) => {
          setVehicles(prev => prev.filter(x => x.cod_veiculo !== deletedId));
          setVehicleModalOpen(false);
          setSelectedVehicle(null);
          if (osSearchType === 'cod_veiculo' && osSearchInput === String(deletedId)) {
            setOsSearchType('cod_os');
            resetOsSearch();
          }
          fetchClientOs();
        }}
      />

      <ConfirmActivateModal
        isOpen={activateModalOpen}
        onClose={() => setActivateModalOpen(false)}
        onConfirm={handleConfirmActivateAccess}
        clientName={client.nome_cliente}
        clientEmail={client.email}
        loading={accessActionLoading}
      />

      <ConfirmDeactivateModal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleConfirmDeactivateAccess}
        clientName={client.nome_cliente}
        loading={accessActionLoading}
      />

      <AccessResultModal
        isOpen={accessResultModalOpen}
        onClose={() => setAccessResultModalOpen(false)}
        result={accessResult}
      />
    </>
  );
};

export default ClientFormScreen;
