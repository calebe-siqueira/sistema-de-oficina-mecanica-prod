import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';
import { useServiceOrders } from '../hooks/useServiceOrders';

import VehicleList from '../features/VehicleList';
import ServiceOrderList from '../features/ServiceOrderList';
import ListWithPagination from '../features/ListWithPagination';
import { VehicleFormModal } from '../features/VehicleFormModal';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { InlineAlert } from '../components/ui/InlineAlert';
import { TableEmptyState } from '../components/modules/TableEmptyState';
import { toastify } from '../components/modules/SystemMessages';
import { LuChevronLeft, LuTrash2, LuPlus, LuSearch, LuEraser } from '../components/ui/Icons';

import { ESTADOS_BRASIL, ITEMS_PER_PAGE_OPTIONS, STATUS_MAP } from '../utils/constants';
import { formatSafeDate, getBirthDateRange, dateInRange } from '../utils/date';
import { handleStatusChange } from '../utils/handleStatusChange';
import { maskCep, maskCnpj, maskCpf, maskPhone, maskPlaca } from '../utils/masks';
import { isValidAddress, isValidCep, isValidCpfCnpj, isValidPhone } from '../utils/validators';

import { ResponseVeiculoDTO } from '../types/veiculo';
import { ResponseClienteDTO, ResponseEnderecoDTO } from '../types/cliente';

interface ClientFormProps {
  params: any;
}

export const ClientFormView: React.FC<ClientFormProps> = ({ params }) => {
  const { clientId, scrollToVehicles } = params;
  const isNewClient = clientId === 'new';

  const initialClientState = useMemo<Partial<ResponseClienteDTO>>(() => ({ nome_cliente: '', email: '', celular: '', telefone: '', cpf_cnpj: '', rg: '', data_nascimento: '', tipo: 'F' }), []);
  const initialAddressState = useMemo<Partial<ResponseEnderecoDTO>>(() => ({ cep: '', logradouro: '', numero: undefined, complemento: '', bairro: '', cidade: '', uf: '' }), []);

  const [client, setClient] = useState<Partial<ResponseClienteDTO>>(initialClientState);
  const [address, setAddress] = useState<Partial<ResponseEnderecoDTO>>(initialAddressState);
  const [vehicles, setVehicles] = useState<ResponseVeiculoDTO[]>([]);
  const [originalName, setOriginalName] = useState('');

  const [loading, setLoading] = useState(!isNewClient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');

  const [cpfCnpjInvalid, setCpfCnpjInvalid] = useState(false);
  const [celularInvalid, setCelularInvalid] = useState(false);
  const [telefoneInvalid, setTelefoneInvalid] = useState(false);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(!!params.openVehicleModal);
  const [selectedVehicle, setSelectedVehicle] = useState<ResponseVeiculoDTO | null>(null);

  const [osSearchType, setOsSearchType] = useState(params.osSearchType || 'cod_os');
  const [osSearchTerm, setOsSearchTerm] = useState(params.osSearchTerm || '');
  const [osSearchInput, setOsSearchInput] = useState(params.osSearchTerm || '');
  const [osStartDate, setOsStartDate] = useState('');
  const [osEndDate, setOsEndDate] = useState('');
  const [osFilterStatus, setOsFilterStatus] = useState('Todas');
  const [osItemsPerPage, setOsItemsPerPage] = useState(25);

  const { filteredOrders: osOrders, loading: osLoading, error: osError, fetchOrders: fetchClientOs } = useServiceOrders({
    clientId,
    searchType: osSearchType,
    searchTerm: osSearchTerm,
    startDate: osStartDate,
    endDate: osEndDate,
    filterStatus: osFilterStatus
  });

  const { navigate, goBack } = useNavigation();
  const api = useApi();
  const vehiclesSectionRef = useRef<HTMLDivElement>(null);

  const [minNascimento, maxNascimento] = useMemo(() => getBirthDateRange(), []);

  useEffect(() => {
    let isMounted = true;
    if (!isNewClient && clientId) {
      const fetchClientData = async () => {
        setLoading(true); setError('');
        try {
          const clientData = await api(`/clientes/${clientId}`);
          if (isMounted && clientData) {
            // Clonagem de segurança para não mutar acidentalmente objetos fora do estado
            const c = { ...(clientData.cliente || initialClientState) };
            clientData.data_nascimento = formatSafeDate(clientData.data_nascimento);
            clientData.cpf_cnpj = (clientData.tipo === 'F' ? maskCpf(clientData.cpf_cnpj) : maskCnpj(clientData.cpf_cnpj));
            clientData.celular = maskPhone(clientData.celular);
            clientData.telefone = maskPhone(clientData.telefone);
            setClient(clientData);
            setOriginalName(clientData.nome_cliente);

            const addr = { ...(clientData.endereco || initialAddressState) };
            addr.cep = maskCep(addr.cep);
            setAddress(addr);

            setVehicles(Array.isArray(clientData.veiculos) ? clientData.veiculos : []);
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
  }, [clientId, isNewClient, api]);

  useEffect(() => {
    if (scrollToVehicles && vehiclesSectionRef.current && !loading) {
      setTimeout(() => vehiclesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [scrollToVehicles, loading]);

  // --- Validações ---

  // Validação de celular/telefone (1 obrigatório)
  const filledPhones = [client.celular, client.telefone].filter(Boolean);
  // Pelo menos um deve estar preenchido e todos os preenchidos devem estar completos
  const clientHasValidPhone = filledPhones.length > 0 && filledPhones.every(isValidPhone);

  // Validação de CPF/CNPJ
  const isCpfCnpjValid = isValidCpfCnpj(client.cpf_cnpj as string, client.tipo as string);

  // Validação de endereço
  const isAddressValid = isValidAddress(address).isValid; // Retorna um booleano isValid e uma string error

  // Validação de data de nascimento
  const isBirthDateValid = !client.data_nascimento || dateInRange(client.data_nascimento, minNascimento, maxNascimento);

  const isValidClientForm = (client.nome_cliente || '').trim() !== '' && clientHasValidPhone && isBirthDateValid && isAddressValid && isCpfCnpjValid;

  // --- Handles ---
  const handleClientBlur = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cpf_cnpj') {
      setCpfCnpjInvalid(!isCpfCnpjValid);
      return;
    }

    if (name === 'celular' || name === 'telefone') {
      const isInvalid = !isValidPhone(value as string);

      // Se o campo que disparou o blur for inválido
      if (name === 'celular') setCelularInvalid(isInvalid);
      if (name === 'telefone') setTelefoneInvalid(isInvalid);

      // Se o celular não está preenchido e não existe um telefone válido
      if (!value && !clientHasValidPhone) {
        if (name === 'celular') setCelularInvalid(true)
        if (name === 'telefone') setTelefoneInvalid(true)
      }

      // Se os preenchidos forem válidos (limpa os estados de erro)
      if (clientHasValidPhone) {
        setTelefoneInvalid(false)
        setCelularInvalid(false)
      }
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf_cnpj') value = (client?.tipo === 'F' ? maskCpf(value) : maskCnpj(value));
    if (name === 'celular' || name === 'telefone') value = maskPhone(value);
    setClient((prev: any) => ({ ...prev, [name]: value }));
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
    
    const isCpfCnpjValidForSubmit = isValidCpfCnpj(client.cpf_cnpj as string, client.tipo as string);
    setCpfCnpjInvalid(!isCpfCnpjValidForSubmit);

    const addressValidationForSubmit = isValidAddress(address);
    setAddressError(addressValidationForSubmit.error);

    if (!isCpfCnpjValidForSubmit || !addressValidationForSubmit.isValid) return;

    setSaving(true);
    try {
      const payload = {
        ...client,
        data_nascimento: formatSafeDate(client.data_nascimento as string) || null,
        cpf_cnpj: client.cpf_cnpj ? String(client.cpf_cnpj).replace(/[.\-\/]/g, '') : null,
        endereco: {
          ...address,
          cep: address.cep ? String(address.cep).replace(/\D/g, '') : null,
          numero: address.numero ? Number(address.numero) : null
        }
      };
      if (!payload.endereco.cep) delete (payload as any).endereco;

      if (isNewClient) {
        const newClientData = await api('/clientes', 'POST', payload);
        toastify.successMessage('Cliente criado com sucesso!');
        navigate('clientForm', { clientId: newClientData.cod_cliente });
      } else {
        await api(`/clientes/${clientId}`, 'PUT', payload);
        setOriginalName(payload.nome_cliente || '');
        toastify.successMessage('Cliente atualizado com sucesso!');
      }
      setError('');
    } catch (err: any) {
      toastify.errorMessage(err.message || 'Erro ao salvar cliente. Verifique os dados preenchidos e tente novamente.', err);
      setError(err.message || 'Erro ao salvar cliente. Verifique os dados preenchidos e tente novamente.');
    } finally { setSaving(false); }
  };

  const handleDeleteClient = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client?.nome_cliente}? Esta ação removerá também os veículos e ordens de serviço associados.`)) {
      try {
        await api(`/clientes/${clientId}`, 'DELETE');
        toastify.successMessage('Cliente excluído com sucesso!');
        navigate('clients');
        setError('');
      } catch (err: any) {
        toastify.errorMessage(err.message || 'Erro ao excluir cliente. Verifique as dependências (como veículos e OS) e tente novamente.', err);
      }
    }
  };

  const handleOrderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOsSearchTerm(osSearchInput);
  };

  let noOrders = "Nenhuma OS encontrada";
  if (!loading && osOrders.length === 0) {
    if (osSearchType === 'cod_veiculo') {
      noOrders = "Nenhuma OS encontrada para este veículo"
    } else if (osSearchTerm !== '') {
      noOrders = "Nenhuma OS encontrada para esta busca"
    } else {
      noOrders = "Nenhuma OS encontrada para este cliente"
    }
  }

  if (loading && !isNewClient) return <p className="p-8">Carregando informações do cliente...</p>;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={goBack}><LuChevronLeft className="mr-2 h-5 w-5" /> Voltar</Button>
          {!isNewClient && (
            <Button type="button" variant="trash" onClick={handleDeleteClient}><LuTrash2 className="mr-2 h-5 w-5" /> Excluir cliente</Button>
          )}
        </div>

        <InlineAlert error={error} />
        <InlineAlert error={addressError} />

        <Card>
          <CardHeader>{isNewClient ? 'Novo cliente' : `Editando: ${originalName || ''}`}</CardHeader>
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
              <legend className="px-2 text-sm font-medium text-gray-700">Informações de contato</legend>
              
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
                  />
                </div>

                {/* Grupo de Telefones */}
                <div className="md:col-span-12 lg:col-span-6">
                  
                  {/* Cabeçalho do Grupo */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Telefones <span className="text-red-600">*</span>
                    </label>
                    <p className={`text-xs ${(celularInvalid || telefoneInvalid) && (filledPhones.length < 2 && !clientHasValidPhone) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
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
              <Input label="CEP" id="cep" name="cep" value={address?.cep || ''} onChange={(e) => { handleAddressChange(e); handleCepSearch(e as any); }} placeholder="00000-000" required={!!address.cep} invalid={!!address?.cep && !isValidCep(address.cep as string)} />
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
          <Button variant="secondary" onClick={goBack} disabled={saving}> Cancelar </Button>
          <Button type="submit" variant="success" disabled={saving || loading || !isValidClientForm}> {saving ? 'Salvando...' : 'Salvar cliente'} </Button>
        </div>
      </form>

      {!isNewClient && (
        <>
          <Card ref={vehiclesSectionRef} id="vehicles-section">
            <CardHeader actions={
              <Button
                type="button"
                onClick={() => { setSelectedVehicle(null); setVehicleModalOpen(true); }}
              >
                <LuPlus className="mr-2 h-5 w-5" />
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
                  view="clientForm"
                  osSearchType={osSearchType}
                  osSearchTerm={osSearchTerm}
                  onVehicleClick={(v: any) => {
                    setOsSearchType('cod_veiculo');
                    setOsSearchTerm(String(v.cod_veiculo));
                    setOsSearchInput(String(v.cod_veiculo));
                  }}
                  onCreateOs={(v: any) => {
                    navigate('serviceOrderForm', {
                      osId: 'new',
                      vehicleId: v.cod_veiculo,
                      clientId: clientId
                    })
                  }}
                  onEditVehicle={(v: any) => {
                    setSelectedVehicle(v);
                    setVehicleModalOpen(true);
                  }}
                  onDeleteVehicle={async (v: any) => {
                    try {
                      const qtdOs = await api(`/veiculos/${v.cod_veiculo}/quantidade-os`);
                      
                      const confirmMessage = qtdOs > 0
                        ? `Excluir veículo ${maskPlaca(v.placa)}?\nAtenção, isso também irá excluir as ${qtdOs} ordens de serviço associadas a ele.`
                        : `Excluir veículo ${maskPlaca(v.placa)}?\n(nenhuma ordem de serviço associada)`;

                      if (window.confirm(confirmMessage)) {
                        await api(`/veiculos/${v.cod_veiculo}`, 'DELETE');
                        setVehicles(prev => prev.filter(x => x.cod_veiculo !== v.cod_veiculo));
                        toastify.successMessage('Veículo excluído com sucesso!');
                      }
                      setError('');
                    } catch (err: any) {
                      toastify.errorMessage(err.message || 'Erro ao excluir veículo. Verifique as dependências (como OS associadas) e tente novamente.', err);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleOrderSearch}>
            <Card>
              <CardHeader>{osSearchType === 'cod_veiculo' && osSearchTerm !== '' ? `Ordens de serviço do veículo ${maskPlaca(vehicles.find(v => v.cod_veiculo === parseInt(osSearchTerm))?.placa) || ''}` : 'Ordens de serviço'}</CardHeader>
              <CardContent>
                <div className="flex flex-col xl:flex-row gap-4 w-full justify-between items-start xl:items-center mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
                    <Select
                      value={osSearchType}
                      onChange={(e) => {
                        setOsSearchType(e.target.value)
                        setOsSearchTerm("");
                        setOsSearchInput("");
                        setOsStartDate("");
                        setOsEndDate("");
                      }}
                      className="w-full sm:w-48 shrink-0"
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

                    <div className="flex flex-row gap-3 w-full sm:w-auto flex-grow">
                      {osSearchType === 'intervalo_data' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
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
                          onChange={e => {
                            setOsSearchInput(e.target.value);
                            setOsSearchTerm(e.target.value);
                          }}
                          className="w-full sm:w-auto flex-grow"
                          required
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Buscar..."
                          value={osSearchInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOsSearchInput(val);
                            if (val.length >= 3 || val.length === 0) {
                              setOsSearchTerm(val);
                            }
                          }}
                          className="w-full flex-grow sm:w-auto"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        title="Limpar filtros"
                        className="shrink-0 w-[54px] sm:w-auto"
                        onClick={() => {
                          setOsSearchTerm("");
                          setOsSearchInput("");
                          setOsStartDate("");
                          setOsEndDate("");
                          setOsFilterStatus("Todas");
                          setOsSearchType("cod_os");
                        }}
                      >
                        <LuEraser className="h-5 w-5" />
                      </Button>
                    </div>

                    <Button
                      type='submit'
                      variant="primary"
                      className="shrink-0"
                    >
                      <LuSearch className="mr-2 h-5 w-5" />
                      Buscar
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
                    <Select value={osFilterStatus} onChange={(e) => setOsFilterStatus(e.target.value)} className="w-full sm:w-48 shrink-0">
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

                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
                      <select className="border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm" value={osItemsPerPage} onChange={(e) => setOsItemsPerPage(Number(e.target.value))}>
                        {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <InlineAlert error={osError} />

                {osLoading ? (
                  <p>Carregando OS...</p>
                ) : !osError && (
                  <ListWithPagination key={osSearchTerm + osSearchType + osStartDate + osEndDate + osFilterStatus} data={osOrders} itemsPerPage={osItemsPerPage}>
                    {(paginatedOrders: any[]) => (
                      <ServiceOrderList
                        orders={paginatedOrders}
                        view="osListForClient"
                        clientId={clientId}
                        noOrdersMessage={noOrders}
                        api={api as any}
                        onStatusChange={(os: any, status: string) => handleStatusChange(os, status, api as any, fetchClientOs as any)}
                        onEdit={(os: any) => navigate('serviceOrderForm', { osId: os.cod_os, vehicleId: os.fk_cod_veiculo, clientId: clientId })}
                        onDelete={(os: any) => {
                          if (window.confirm(`Excluir OS Nº ${os.cod_os}?`)) {
                            api(`/os/${os.cod_os}`, 'DELETE').then(fetchClientOs as any).catch(err => toastify.errorMessage(err.message || "Erro ao excluir OS. Tente novamente.", err))
                          }
                        }}
                      />
                    )}
                  </ListWithPagination>
                )}

              </CardContent>
            </Card>
          </form>
        </>
      )}

      <VehicleFormModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        clientId={clientId}
        vehicle={selectedVehicle}
        onSaved={(v: ResponseVeiculoDTO) => {
          setVehicleModalOpen(false);
          setSelectedVehicle(null);
          if (selectedVehicle) setVehicles(prev => prev.map(x => x.cod_veiculo === v.cod_veiculo ? v : x));
          else setVehicles(prev => [...prev, v]);
        }}
      />
    </>
  );
};

export default ClientFormView;
