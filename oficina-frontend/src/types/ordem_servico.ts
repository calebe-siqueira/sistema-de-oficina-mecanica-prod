import { Modelo } from './veiculo';

export type ItemDTO = {
  cod_item?: number;
  nome_item?: string;
  quantidade: number;
  valor_unitario: number;
};

export type CreateOsDTO = {
  data_os: string; // LocalDate (YYYY-MM-DD)
  quilometragem?: number;
  descricao?: string;
  tipo_desconto?: string;
  desconto?: number;
  status_servico?: number;
  valor_pago?: number;
  fk_cod_veiculo: number;
  pecas?: ItemDTO[];
  servicos?: ItemDTO[];
};

export type UpdateOsDTO = Partial<Omit<CreateOsDTO, 'fk_cod_veiculo'>>;

export type ItemResponseDTO = {
  cod_associativa: number;
  cod_item: number;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

export type ResponseOsDTO = {
  cod_os: number;
  nome_cliente: string;
  data_os: string;
  quilometragem: number | null;
  descricao: string | null;
  fk_cod_veiculo: number;
  fk_cod_cliente: number | null;
  placa: string;
  modelo: Modelo | null;
  ano: number | null;
  cor: string;
  status_servico: number;
  pecas: ItemResponseDTO[];
  servicos: ItemResponseDTO[];
  tipo_desconto: string;
  desconto: number;
  valor_total: number;
  valor_pago: number;
};
