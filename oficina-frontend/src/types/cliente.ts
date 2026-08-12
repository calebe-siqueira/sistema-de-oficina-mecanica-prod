import { ResponseVeiculoDTO } from './veiculo';

export type CreateEnderecoDTO = {
  cep: string;
  logradouro: string;
  numero: number;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type UpdateEnderecoDTO = Partial<CreateEnderecoDTO>;

export type CreateClienteDTO = {
  nome_cliente: string;
  email?: string;
  celular?: string;
  telefone?: string;
  rg?: string;
  cpf_cnpj?: string;
  data_nascimento?: string;
  tipo: string;
  endereco?: CreateEnderecoDTO;
};

export type UpdateClienteDTO = Partial<Omit<CreateClienteDTO, 'endereco'>> & {
  endereco?: UpdateEnderecoDTO;
};

export type ResponseEnderecoDTO = {
  cod_endereco: number;
  fk_cep: number;
  numero: number;
  complemento?: string;
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
};

export type ResponseClienteDTO = {
  cod_cliente: number;
  nome_cliente: string;
  email?: string;
  celular?: string;
  telefone?: string;
  fk_cod_endereco?: number | null;
  rg?: string;
  cpf_cnpj?: string;
  data_nascimento?: string | null;
  tipo: string;
  endereco?: ResponseEnderecoDTO | null;
  veiculos?: ResponseVeiculoDTO[] | null;
};

export type SearchClienteDTO = {
  termo: string;
  tipo: string;
};
