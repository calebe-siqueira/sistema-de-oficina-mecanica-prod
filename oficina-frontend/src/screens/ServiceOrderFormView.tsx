import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';

import OSItemsList from '../features/OSItemList';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { InlineAlert } from '../components/ui/InlineAlert';
import { toastify } from '../components/modules/SystemMessages';
import {
  LuChevronLeft,
  LuPrinter,
  LuEye,
  LuPlus,
  LuPackage,
  LuWrench
} from '../components/ui/Icons';

import { STATUS_MAP } from '../utils/constants';
import { getLocalTodayString, getOsDateRange, formatSafeDate, dateInRange } from '../utils/date';
import { maskPlaca } from '../utils/masks';
import { fetchAndOpenPdf } from '../utils/pdfGenerator';

import { ResponseVeiculoDTO, ClienteDetailsDTO } from '../types/veiculo';

export interface ServiceOrderFormProps {
  params: {
    osId?: string;
    vehicleId?: string;
    clientId?: string;
  };
  pdfLibsLoaded?: boolean;
}

type ItemType = 'P' | 'S';

interface OSItem {
  cod_item?: number | null;
  nome_item: string;
  quantidade: number | string;
  valor: number | string;
  tipo: ItemType;
}

interface OSStatus {
  status_servico: number | string;
  valor_pago: number | string;
}

interface OSRecord {
  cod_os?: number;
  data_os: string;
  quilometragem: string | number;
  descricao: string;
  tipo_desconto: 'N' | 'V' | 'P';
  desconto: number | string;
  fk_cod_veiculo: string | number;
}

// Funções Utilitárias Locais
const parsePositiveNumber = (value: string | number): string => {
  if (value === '') return '';
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(parsed) ? '' : String(Math.max(0, parsed));
};

const getErrorMessage = (err: unknown, defaultMsg: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) return String((err as any).message);
  if (typeof err === 'string') return err;
  return defaultMsg;
};

export const ServiceOrderFormView: React.FC<ServiceOrderFormProps> = ({ params, pdfLibsLoaded }) => {
  const { osId, vehicleId } = params;
  const isNewOS = osId === 'new';
  const { navigate, goBack } = useNavigation();
  const api = useApi();

  const [os, setOs] = useState<OSRecord>({
    data_os: getLocalTodayString(),
    quilometragem: '',
    descricao: '',
    tipo_desconto: 'N',
    desconto: 0,
    fk_cod_veiculo: vehicleId || ''
  });
  const [status, setStatus] = useState<OSStatus>({ status_servico: 1, valor_pago: 0 });
  const [items, setItems] = useState<OSItem[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<ResponseVeiculoDTO | null>(null);
  const [clientInfo, setClientInfo] = useState<ClienteDetailsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [minDate, maxDate] = useMemo(() => getOsDateRange(vehicleInfo?.ano), [vehicleInfo?.ano]);

  const { subTotal, totalDesconto, totalFinal, paymentStatusLabel, paymentStatusColor } = useMemo(() => {
    const sub = items.reduce((acc, item) => (acc + (parseFloat(String(item.valor)) || 0) * (parseFloat(String(item.quantidade)) || 0)), 0);
    let desc = 0;
    const dVal = parseFloat(String(os.desconto)) || 0;

    if (os.tipo_desconto === 'P') desc = (sub * (dVal / 100));
    else if (os.tipo_desconto === 'V') desc = dVal;

    const final = Math.max(0, sub - desc);

    const paid = parseFloat(String(status.valor_pago || 0)) || 0;
    let pLabel = 'Pagamento pendente';
    let pColor = 'bg-red-100 text-red-800';

    if (paid >= final && final > 0) {
      pLabel = 'Pago integralmente';
      pColor = 'bg-green-100 text-green-800';
    } else if (paid > 0 && final > 0) {
      pLabel = 'Pago parcialmente';
      pColor = 'bg-yellow-100 text-yellow-800';
    } else if (final === 0 && items.length > 0) {
      pLabel = 'Gratuito / Garantia';
      pColor = 'bg-gray-100 text-gray-800';
    }

    return {
      subTotal: sub.toFixed(2),
      totalDesconto: desc.toFixed(2),
      totalFinal: final.toFixed(2),
      paymentStatusLabel: pLabel,
      paymentStatusColor: pColor
    };
  }, [items, os.desconto, os.tipo_desconto, status.valor_pago]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        let currentVehicleId = vehicleId ? parseInt(vehicleId, 10) : null;
        if (!isNewOS) {
          const osData = await api(`/os/${osId}`);
          if (isMounted && osData) {
            setOs({ 
              cod_os: osData.cod_os, 
              data_os: formatSafeDate(osData.data_os),
              quilometragem: osData.quilometragem,
              descricao: osData.descricao || '',
              tipo_desconto: osData.tipo_desconto || 'N',
              desconto: osData.desconto || 0,
              fk_cod_veiculo: osData.fk_cod_veiculo || vehicleId
            });
            setStatus({ 
              status_servico: osData.status_servico || 1,
              valor_pago: osData.valor_pago || 0 
            });
            
            const itemsP = (osData.pecas || []).map((p: any) => ({ cod_item: p.cod_item, nome_item: p.nome, quantidade: p.quantidade, valor: p.valor_unitario, tipo: 'P' as ItemType }));
            const itemsS = (osData.servicos || []).map((s: any) => ({ cod_item: s.cod_item, nome_item: s.nome, quantidade: s.quantidade, valor: s.valor_unitario, tipo: 'S' as ItemType }));
            setItems([...itemsP, ...itemsS]);
            
            currentVehicleId = osData.fk_cod_veiculo;
          }
        }
        if (currentVehicleId) {
          const vData = await api(`/veiculos/${currentVehicleId}/details`);
          if (isMounted && vData) {
            setVehicleInfo(vData.veiculo);
            setClientInfo(vData.cliente);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err.message || 'Erro ao carregar dados';
          setError(errorMessage);
          toastify.errorMessage(errorMessage, err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted = false };
  }, [osId, vehicleId, isNewOS, api]);

  const handleOsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'quilometragem' || name === 'desconto') {
      setOs(prev => ({ ...prev, [name]: parsePositiveNumber(value) }));
      return;
    }
    setOs(prev => ({ ...prev, [name as keyof OSRecord]: value }));
  };

  const handleItemChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextValue: string | number = value;
    if (name === 'quantidade' || name === 'valor') {
      nextValue = parsePositiveNumber(value);
    }
    setItems(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], [name as keyof OSItem]: nextValue };
      return n;
    });
  };

  const addItem = (tipo: ItemType) => {
    const lastItem = items[items.length - 1];
    if (!lastItem || (lastItem.nome_item && lastItem.quantidade)) {
      setItems(prev => [...prev, { nome_item: '', quantidade: 1, valor: 0.00, tipo }]);
    } else {
      toastify.warningMessage("Preencha os campos do item atual antes de adicionar um novo");
    }
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePaymentChange = (val: string | number) => {
    setStatus(prev => ({ ...prev, valor_pago: Math.max(0, parseFloat(String(val || 0))) }));
  };

  const hasValidOsDate = dateInRange(os.data_os, minDate, maxDate);
  const hasItems = items.length > 0;
  const itemsValid = items.every(item => {
    if (!item.nome_item) return false;
    const quantidade = parseFloat(String(item.quantidade));
    const valor = parseFloat(String(item.valor));
    return !Number.isNaN(quantidade) && quantidade >= 1 && !Number.isNaN(valor) && valor >= 0;
  });

  const isServiceOrderValid = hasValidOsDate && itemsValid && hasItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasValidOsDate) {
      toastify.warningMessage('Data da OS inválida ou fora do intervalo permitido. Verifique a data e tente novamente.');
      return;
    }
    if (!itemsValid) {
      toastify.warningMessage('Itens da OS devem ter um nome e quantidade e valor válidos. Verifique os dados preenchidos e tente novamente.');
      return;
    }
    if (!hasItems) {
      toastify.warningMessage('A OS deve ter pelo menos um item. Insira uma peça e/ou serviço e tente novamente.');
      return;
    }

    setSaving(true);
    try {
      const validItems = items.filter(i => i.nome_item);
      const payload = {
        // Dados da OS
        data_os: formatSafeDate(os.data_os),
        quilometragem: parseInt(String(os.quilometragem)) || 0,
        descricao: os.descricao,
        fk_cod_veiculo: parseInt(String(vehicleId || os.fk_cod_veiculo)),

        // Dados do desconto
        tipo_desconto: os.tipo_desconto,
        desconto: parseFloat(String(os.desconto)) || 0,

        // Dados do status
        status_servico: parseInt(String(status.status_servico)),
        valor_pago: parseFloat(String(status.valor_pago)),

        // Itens da ordem
        pecas: validItems.filter(i => i.tipo === 'P').map(i => ({
          cod_item: i.cod_item || null,
          nome_item: i.nome_item,
          quantidade: parseFloat(String(i.quantidade)),
          valor_unitario: parseFloat(String(i.valor))
        })),
        servicos: validItems.filter(i => i.tipo === 'S').map(i => ({
          cod_item: i.cod_item || null,
          nome_item: i.nome_item,
          quantidade: parseFloat(String(i.quantidade)),
          valor_unitario: parseFloat(String(i.valor))
        }))
      };

      if (isNewOS) {
        const newOS = await api(`/veiculos/${payload.fk_cod_veiculo}/os`, 'POST', payload);
        toastify.successMessage('Ordem de Serviço criada com sucesso!');
        navigate('serviceOrderForm', { osId: String(newOS.cod_os), vehicleId: String(payload.fk_cod_veiculo) });
      } else {
        await api(`/os/${osId}`, 'PUT', payload);
        toastify.successMessage('Ordem de Serviço atualizada com sucesso!');
      }
      setError('');
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao salvar OS. Verifique os dados preenchidos e tente novamente.');
      toastify.errorMessage(errorMsg, err);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    if (isNewOS) {
      toastify.warningMessage('Salve a ordem de serviço antes de gerar o PDF. Clique em Salvar OS e tente novamente.');
      return;
    }

    setError('');

    const generatePdfPromise = fetchAndOpenPdf({
      url: `/api/os/${osId}/pdf`,
      tabTitle: `OS #${osId} - PDF`
    });

    try {
      await toastify.promiseMessage(
        generatePdfPromise,
        "Gerando PDF...",
        "PDF gerado com sucesso!",
        "Erro ao gerar PDF"
      );
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Erro ao gerar PDF');
      setError(errorMsg);
    }
  };

  return (
    <div>
      <InlineAlert error={error} />

      {loading ? (
        <p>Carregando dados da OS...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center">
            <Button type="button" variant="secondary" onClick={goBack}>
              <LuChevronLeft className="mr-2 h-5 w-5" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewOS ? 'Nova OS' : `OS Nº: ${os.cod_os}`}
            </h1>
            <Button
              type="button"
              variant="ghost"
              className="text-blue-600"
              onClick={handlePrintPDF}
              disabled={!pdfLibsLoaded || isNewOS}
            >
              <LuPrinter className="mr-2 h-5 w-5" /> Gerar PDF
            </Button>
          </div>

          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Cliente</span>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{clientInfo?.nome_cliente}</p>
                  {clientInfo && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-1 text-blue-600 hover:text-blue-900"
                      onClick={() => navigate('clientForm', { clientId: String(clientInfo.cod_cliente) })}
                      title="Ver cliente"
                    >
                      <LuEye className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Veículo</span>
                <p className="text-lg font-semibold capitalize">
                  {vehicleInfo?.nome_montadora} {vehicleInfo?.nome_modelo} {vehicleInfo?.cor} {vehicleInfo?.ano && new Date(String(vehicleInfo.ano)).getFullYear()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Placa</span>
                <p className="text-lg font-semibold">{maskPlaca(String(vehicleInfo?.placa || ''))}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Dados da OS</CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Data"
                  id="data_os"
                  name="data_os"
                  type="date"
                  value={os.data_os || ''}
                  onChange={handleOsChange}
                  required
                  min={minDate}
                  max={maxDate}
                  invalid={os.data_os !== '' && !hasValidOsDate}
                />
                <Input
                  label="KM"
                  id="quilometragem"
                  name="quilometragem"
                  type="number"
                  min="0"
                  step="1"
                  value={os.quilometragem}
                  onChange={handleOsChange}
                />
                <Select
                  label="Status"
                  id="status_servico"
                  name="status_servico"
                  value={status.status_servico}
                  onChange={e => setStatus({ ...status, status_servico: e.target.value })}
                >
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  name="descricao"
                  rows={3}
                  value={os.descricao}
                  onChange={handleOsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader actions={
              <Button type="button" onClick={() => addItem('P')}>
                <LuPlus className="mr-2 h-5 w-5" /> Peça
              </Button>
            }>
              <LuPackage className="mr-3 h-6 w-6 inline" /> Peças
            </CardHeader>
            <CardContent>
              <OSItemsList items={items} type="P" onItemChange={handleItemChange} onRemoveItem={removeItem} onAddItem={() => addItem('P')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader actions={
              <Button type="button" onClick={() => addItem('S')}>
                <LuPlus className="mr-2 h-5 w-5" /> Serviço
              </Button>
            }>
              <LuWrench className="mr-3 h-6 w-6 inline" /> Serviços
            </CardHeader>
            <CardContent>
              <OSItemsList items={items} type="S" onItemChange={handleItemChange} onRemoveItem={removeItem} onAddItem={() => addItem('S')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Pagamento</CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-between gap-6">
              {/* Seção de desconto */}
              <div className="space-y-4 flex-1">
                <div className="flex gap-4">
                  <Select
                    label="Tipo Desconto"
                    name="tipo_desconto"
                    value={os.tipo_desconto}
                    onChange={handleOsChange}
                    className="w-1/2"
                  >
                    <option value="N">Nenhum</option>
                    <option value="V">Valor (R$)</option>
                    <option value="P">Porcentagem (%)</option>
                  </Select>
                  <Input
                    label="Desconto"
                    name="desconto"
                    type="number"
                    min="0"
                    step="1"
                    value={os.desconto}
                    onChange={handleOsChange}
                    className="w-1/2"
                  />
                </div>

                {/* Seção de valor pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor pago</label>
                  <div className="flex items-center mt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handlePaymentChange(parseFloat(String(status.valor_pago)) - 1)}
                    >
                      -
                    </Button>
                    <div className="relative flex-grow mx-2">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">R$</span>
                      <input
                        type="number"
                        min="0"
                        max={totalFinal}
                        step="1"
                        value={status.valor_pago}
                        onChange={(e) => handlePaymentChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handlePaymentChange(parseFloat(String(status.valor_pago)) >= (parseFloat(String(totalFinal))) ? totalFinal : parseFloat(String(status.valor_pago)) + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold ${paymentStatusColor}`}>
                    {paymentStatusLabel}
                  </div>
                </div>
              </div>

              {/* Seção de total */}
              <div className="flex-1 space-y-2 text-right bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-600">Subtotal:</span>
                  <span>R$ {subTotal}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-600">Desconto:</span>
                  <span className="text-red-600">- R$ {totalDesconto}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold mt-2 pt-2 border-t">
                  <span>TOTAL:</span>
                  <span className="text-blue-700">R$ {totalFinal}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="danger" onClick={goBack} disabled={saving}> Cancelar </Button>
            <Button
              type="submit"
              variant="success"
              disabled={saving || !isServiceOrderValid}
              onClick={isServiceOrderValid ? undefined : () => toastify.errorMessage('Preencha todos os campos corretamente.')}
            >
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ServiceOrderFormView;
