/**
 * clientAreaService.ts
 *
 * Camada de serviço para o domínio "Área do Cliente" (cliente autenticado).
 * Centraliza todos os endpoints de /api/meu-perfil, seguindo o princípio
 * da Responsabilidade Única (SRP) e evitando duplicação (DRY).
 *
 * A função `request` é injetada como dependência (DIP) e vem do hook useApi,
 * garantindo que autenticação, tratamento de erros e logout automático
 * por sessão expirada ocorram de forma consistente em toda a aplicação.
 */

import type { Page } from '../types/page';
import type { ResponseVeiculoDTO } from '../types/veiculo';
import type { ResponseOsDTO } from '../types/ordem_servico';
import type {
  ResponseMeuPerfilDTO,
  DashboardClienteDTO,
  AlterarMinhaSenhaDTO,
  SolicitarTrocaEmailDTO,
  ConfirmarTrocaEmailDTO,
  ApiMessageResponse,
} from '../types/meuPerfil';

/** Tipo da função request injetada pelo useApi */
export type ApiRequestFn = (
  endpoint: string,
  method?: string,
  body?: unknown,
) => Promise<unknown>;

const BASE = '/meu-perfil';

// ─── Perfil ───

/**
 * GET /api/meu-perfil
 * Retorna os dados cadastrais do cliente autenticado (sem veículos).
 */
export const fetchMeuPerfil = (
  request: ApiRequestFn,
): Promise<ResponseMeuPerfilDTO> =>
  request(`${BASE}`) as Promise<ResponseMeuPerfilDTO>;

// ─── Dashboard ───

/**
 * GET /api/meu-perfil/dashboard
 * Retorna indicadores consolidados: totais, próximas revisões e últimas OS.
 */
export const fetchMeuDashboard = (
  request: ApiRequestFn,
): Promise<DashboardClienteDTO> =>
  request(`${BASE}/dashboard`) as Promise<DashboardClienteDTO>;

// ─── Veículos ───

export interface FetchVeiculosParams {
  page?: number;
  size?: number;
  placa?: string;
}

/**
 * GET /api/meu-perfil/veiculos  (sem filtro)
 * GET /api/meu-perfil/veiculos/search/placa?placa=XXX  (com filtro)
 * Retorna lista paginada dos veículos do cliente autenticado.
 */
export const fetchMeusVeiculos = (
  request: ApiRequestFn,
  { page = 0, size = 10, placa }: FetchVeiculosParams = {},
): Promise<Page<ResponseVeiculoDTO>> => {
  const hasPlacaFilter = placa && placa.trim().length > 0;

  const url = hasPlacaFilter
    ? `${BASE}/veiculos/search/placa?placa=${encodeURIComponent(placa)}&page=${page}&size=${size}`
    : `${BASE}/veiculos?page=${page}&size=${size}`;

  return request(url) as Promise<Page<ResponseVeiculoDTO>>;
};

// ─── Ordens de Serviço ───

export interface FetchOsParams {
  page?: number;
  size?: number;
  placa?: string;
}

/**
 * GET /api/meu-perfil/os          (todas as OS paginadas)
 * GET /api/meu-perfil/os/veiculo?placa=XXX  (filtradas por veículo)
 * Retorna lista paginada das ordens de serviço do cliente autenticado.
 */
export const fetchMinhasOs = (
  request: ApiRequestFn,
  { page = 0, size = 10, placa }: FetchOsParams = {},
): Promise<Page<ResponseOsDTO>> => {
  const hasPlacaFilter = placa && placa.trim().length > 0;

  const url = hasPlacaFilter
    ? `${BASE}/os/veiculo?placa=${encodeURIComponent(placa)}&page=${page}&size=${size}`
    : `${BASE}/os?page=${page}&size=${size}`;

  return request(url) as Promise<Page<ResponseOsDTO>>;
};

/**
 * GET /api/meu-perfil/os/:id
 * Retorna os detalhes completos de uma ordem de serviço do cliente.
 */
export const fetchMinhaOsPorId = (
  request: ApiRequestFn,
  id: number | string,
): Promise<ResponseOsDTO> =>
  request(`${BASE}/os/${id}`) as Promise<ResponseOsDTO>;

/**
 * GET /api/meu-perfil/os/:id/pdf
 * Faz o download do PDF de uma OS como Blob.
 * Utiliza fetch direto pois o useApi não suporta respostas binárias.
 */
export const fetchMinhaOsPdf = async (
  id: number | string,
): Promise<Blob> => {
  const response = await fetch(`/api/meu-perfil/os/${id}/pdf`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Sessão expirada ou acesso negado.');
  }

  if (!response.ok) {
    throw new Error(`Falha ao gerar PDF da OS ${id} (Erro ${response.status}).`);
  }

  return response.blob();
};

// ─── Senha ───

/**
 * PUT /api/meu-perfil/senha
 * Altera a senha do cliente autenticado.
 */
export const alterarMinhaSenha = (
  request: ApiRequestFn,
  dto: AlterarMinhaSenhaDTO,
): Promise<ApiMessageResponse> =>
  request(`${BASE}/senha`, 'PUT', dto) as Promise<ApiMessageResponse>;

// ─── E-mail ───

/**
 * POST /api/meu-perfil/email/solicitar
 * Solicita a troca de e-mail enviando código para o novo endereço.
 */
export const solicitarTrocaEmail = (
  request: ApiRequestFn,
  dto: SolicitarTrocaEmailDTO,
): Promise<ApiMessageResponse> =>
  request(`${BASE}/email/solicitar`, 'POST', dto) as Promise<ApiMessageResponse>;

/**
 * POST /api/meu-perfil/email/confirmar
 * Confirma a troca de e-mail com o código de verificação recebido.
 */
export const confirmarTrocaEmail = (
  request: ApiRequestFn,
  dto: ConfirmarTrocaEmailDTO,
): Promise<ApiMessageResponse> =>
  request(`${BASE}/email/confirmar`, 'POST', dto) as Promise<ApiMessageResponse>;
