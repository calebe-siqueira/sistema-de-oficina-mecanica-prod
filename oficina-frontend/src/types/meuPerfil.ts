import { ResponseEnderecoDTO } from './cliente';

// ─── Perfil ───

/** Espelho de ResponseMeuPerfilDTO.java */
export interface ResponseMeuPerfilDTO {
  cod_cliente: number;
  nome_cliente: string;
  email: string;
  celular: string | null;
  telefone: string | null;
  fk_cod_endereco: number | null;
  rg: string | null;
  cpf_cnpj: string | null;
  /** ISO 8601 date string (YYYY-MM-DD) */
  data_nascimento: string | null;
  /** 'F' = Pessoa Física | 'J' = Pessoa Jurídica */
  tipo: 'F' | 'J';
  endereco: ResponseEnderecoDTO | null;
}

// ─── Dashboard ───

/** Espelho de ProximaRevisaoDTO.java */
export interface ProximaRevisaoDTO {
  cod_veiculo: number;
  placa: string;
  modelo: string;
  montadora: string;
  /** ISO 8601 date string ou null */
  data_ultima_revisao: string | null;
  /** ISO 8601 date string ou null */
  data_proxima_revisao: string | null;
  /** 'EM_DIA' | 'PROXIMA' | 'ATRASADA' | 'SEM_HISTORICO' */
  status_revisao: 'EM_DIA' | 'PROXIMA' | 'ATRASADA' | 'SEM_HISTORICO';
  dias_restantes: number | null;
}

/** Espelho de UltimaOsResumoDTO.java */
export interface UltimaOsResumoDTO {
  cod_os: number;
  /** ISO 8601 date string */
  data_os: string;
  status_servico: number;
  status_descricao: string;
  veiculo: string;
  placa: string;
  modelo: string;
  valor_total: number;
}

/** Espelho de DashboardClienteDTO.java */
export interface DashboardClienteDTO {
  total_veiculos: number;
  total_ordens_servico: number;
  proximas_revisoes: ProximaRevisaoDTO[];
  ultimas_ordens_servico: UltimaOsResumoDTO[];
}

// ─── Senha ───

/** Espelho de AlterarMinhaSenhaDTO.java */
export interface AlterarMinhaSenhaDTO {
  senha_atual: string;
  nova_senha: string;
  confirmacao_nova_senha: string;
}

// ─── E-mail ───

/** Espelho de SolicitarTrocaEmailDTO.java */
export interface SolicitarTrocaEmailDTO {
  novo_email: string;
}

/** Espelho de ConfirmarTrocaEmailDTO.java */
export interface ConfirmarTrocaEmailDTO {
  novo_email: string;
  codigo: string;
}

/** Resposta genérica de mensagem da API */
export interface ApiMessageResponse {
  message: string;
}
