export interface Montadora {
  cod_montadora: number;
  nome_montadora: string;
}

export interface Modelo {
  cod_modelo: number;
  nome_modelo: string;
  montadora: Montadora;
}

// Interface Base (Fonte da verdade para o modelo de dados)
export interface BaseVeiculo {
  cod_veiculo: number | null;
  placa: string;
  nome_montadora: string;
  nome_modelo: string;
  combustivel: string;
  ano: number | null;
  cor: string;
  tipo: string;
  fk_cod_cliente: number | null;
}

// DTO de Criação: Remove a chave primária
export type CreateVeiculoDTO = Omit<BaseVeiculo, 'cod_veiculo'>;

// DTO de Atualização: Todos os campos de criação tornam-se opcionais
export type UpdateVeiculoDTO = Partial<CreateVeiculoDTO>;

// DTO de Resposta da API
export interface ResponseVeiculoDTO extends BaseVeiculo {
  fk_cod_cliente: number | null;
  nome_cliente: string;
}

// Sub-tipos auxiliares
export type ClienteDetailsDTO = {
  cod_cliente: number | null;
  nome_cliente: string;
  celular: string;
};

export type ResponseVeiculoDetailsDTO = {
  veiculo: ResponseVeiculoDTO;
  cliente: ClienteDetailsDTO | null;
};
