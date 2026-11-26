import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { TriangleAlertIcon, ExternalLinkIcon, CarIcon, UserIcon } from '../components/ui/Icons';
import { maskPlaca, maskCpfCnpj } from '../utils/masks';
import { useApi } from '../hooks/useApi';
import { ResponseVeiculoDTO } from '../types/veiculo';

export interface DuplicatePlateOwner {
  cod_cliente: number;
  nome_cliente: string;
  cpf_cnpj?: string;
}

export interface DuplicatePlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: () => Promise<void> | void;
  onViewVehicle?: (owner?: DuplicatePlateOwner) => void;
  placa: string;
  owners: DuplicatePlateOwner[];
  loading?: boolean;
}

export const DuplicatePlateModal: React.FC<DuplicatePlateModalProps> = ({
  isOpen,
  onClose,
  onConfirmSave,
  onViewVehicle,
  placa,
  owners,
  loading = false,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const api = useApi();

  const [existingVehicle, setExistingVehicle] = useState<ResponseVeiculoDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Garante o foco automático no botão Cancelar ao abrir o modal (UX e acessibilidade)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const primaryOwner = owners[0];
  const hasMultipleOwners = owners.length > 1;

  // Carrega os dados precisos do veículo consultando primeiramente os veículos do cliente específico
  useEffect(() => {
    let isMounted = true;

    if (isOpen && placa) {
      const cleanPlaca = placa.replace(/[.\- ]/g, '').toUpperCase();
      setLoadingDetails(true);

      const fetchPreciseVehicle = async () => {
        try {
          // Busca pelo veículo preciso se houver cliente identificado, consultando diretamente os veículos dele
          if (primaryOwner?.cod_cliente) {
            try {
              const clientVehicles: ResponseVeiculoDTO[] = await api(
                `/clientes/${primaryOwner.cod_cliente}/veiculos`,
                'GET',
                undefined,
                { suppressErrorToast: true }
              );

              if (Array.isArray(clientVehicles)) {
                const matched = clientVehicles.find(
                  (v) => v.placa.replace(/[.\- ]/g, '').toUpperCase() === cleanPlaca
                );

                if (matched && isMounted) {
                  setExistingVehicle(matched);
                  setLoadingDetails(false);
                  return;
                }
              }
            } catch (err) {
              console.warn('Busca direta por cliente falhou, tentando fallback por placa:', err);
            }
          }

          // Fallback: busca por placa geral caso a busca direta pelo cliente não retorne o veículo
          const generalVehicle: ResponseVeiculoDTO = await api(
            `/veiculos/search/placa?placa=${encodeURIComponent(cleanPlaca)}`,
            'GET',
            undefined,
            { suppressErrorToast: true }
          );

          if (isMounted) {
            setExistingVehicle(generalVehicle);
          }
        } catch {
          if (isMounted) {
            setExistingVehicle(null);
          }
        } finally {
          if (isMounted) {
            setLoadingDetails(false);
          }
        }
      };

      fetchPreciseVehicle();
    } else {
      setExistingVehicle(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, placa, primaryOwner?.cod_cliente, api]);

  // Bloqueia o fechamento durante o salvamento
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  /**
   * Abre o cadastro do cliente em uma NOVA GUIA mantendo o formulário atual intacto:
   * 1. Passa os parâmetros via URL (query params) para rolar até a seção de veículos (scrollToVehicles=true);
   * 2. Seleciona automaticamente o veículo na tabela e filtra suas OSs (osSearchType=cod_veiculo&osSearchTerm=ID);
   * 3. Na aba original, mantém os dados preenchidos pelo usuário e o modal pronto para posterior decisão.
   */
  const handleView = (owner?: DuplicatePlateOwner) => {
    if (onViewVehicle) {
      onViewVehicle(owner);
      return;
    }

    const targetOwner = owner || primaryOwner;
    const vehicleId = existingVehicle?.cod_veiculo;

    if (targetOwner?.cod_cliente) {
      const params = new URLSearchParams();
      params.set('scrollToVehicles', 'true');
      if (vehicleId) {
        params.set('osSearchType', 'cod_veiculo');
        params.set('osSearchTerm', String(vehicleId));
      }

      const targetUrl = `/clientes/${targetOwner.cod_cliente}/editar?${params.toString()}`;
      window.open(targetUrl, '_blank');
    } else {
      window.open(`/veiculos?term=${encodeURIComponent(placa)}&type=placa`, '_blank');
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-amber-600">
          <TriangleAlertIcon className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-lg">Placa já cadastrada para outro cliente</span>
        </div>
      }
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-slate-700">
        {/* Mensagem principal de confirmação */}
        <div className="text-sm leading-relaxed">
          {hasMultipleOwners ? (
            <p>
              Já existem veículos cadastrados com a placa{' '}
              <strong className="text-slate-900 font-bold tracking-wider">{maskPlaca(placa)}</strong> para{' '}
              <strong>{owners.length} outros clientes</strong> no sistema.
            </p>
          ) : (
            <p>
              Já existe um veículo com a placa{' '}
              <strong className="text-slate-900 font-bold tracking-wider">{maskPlaca(placa)}</strong> cadastrada para o cliente{' '}
              <strong className="text-slate-900 font-bold uppercase">
                {primaryOwner?.nome_cliente || existingVehicle?.nome_cliente || 'outro cliente'}
              </strong>
              {primaryOwner?.cpf_cnpj && (
                <span className="text-slate-500 font-normal">
                  {' '}({maskCpfCnpj(primaryOwner.cpf_cnpj)})
                </span>
              )}
              .
            </p>
          )}

          <p className="mt-2 text-slate-800 font-medium">
            Tem certeza de que deseja prosseguir com o cadastro deste veículo para o cliente atual?
          </p>
        </div>

        {/* Card informativo com os dados do veículo registrado */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 space-y-2 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <CarIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Dados do veículo registrado no sistema:</span>
          </div>

          {loadingDetails ? (
            <div className="flex items-center gap-2 py-1 text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>Carregando informações do veículo...</span>
            </div>
          ) : existingVehicle ? (
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
              <div>
                <span className="text-slate-500 block">Montadora e Modelo</span>
                <span className="font-semibold text-slate-900">
                  {existingVehicle.nome_montadora} {existingVehicle.nome_modelo}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Ano e Cor</span>
                <span className="font-semibold text-slate-900">
                  {existingVehicle.ano || 'N/A'} • {existingVehicle.cor || 'N/A'}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <UserIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-slate-600 truncate">
                    Proprietário cadastrado: <strong className="text-slate-900 uppercase">{existingVehicle.nome_cliente || primaryOwner?.nome_cliente}</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-600">
              Placa: <strong className="text-slate-900">{maskPlaca(placa)}</strong>
              {primaryOwner?.nome_cliente && (
                <> • Cliente: <strong className="text-slate-900 uppercase">{primaryOwner.nome_cliente}</strong></>
              )}
            </p>
          )}

          {/* Lista de outros proprietários caso haja múltiplos */}
          {hasMultipleOwners && (
            <div className="pt-2 border-t border-amber-200/70">
              <span className="text-slate-600 block mb-1">Clientes vinculados a esta placa:</span>
              <ul className="space-y-1 pl-2">
                {owners.map((owner) => (
                  <li key={owner.cod_cliente} className="flex items-center justify-between text-slate-800">
                    <span className="truncate">
                      • <strong className="uppercase">{owner.nome_cliente}</strong>
                      {owner.cpf_cnpj && <span className="text-slate-500"> ({maskCpfCnpj(owner.cpf_cnpj)})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleView(owner)}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                      title="Ver cadastro deste cliente"
                    >
                      <span>Ver cliente</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2.5 pt-4 border-t border-slate-100">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="cancel"
            autoFocus
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleView(primaryOwner)}
            disabled={loading}
            title="Abre o cadastro do cliente e destaca o veículo selecionado"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <ExternalLinkIcon className="w-4 h-4 text-slate-500" />
            <span>Ver veículo</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onConfirmSave}
            disabled={loading}
            className="w-full sm:w-auto min-w-[190px]"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar mesmo assim'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
