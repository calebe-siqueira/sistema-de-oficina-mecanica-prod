import { STATUS_MAP } from './constants';

/**
 * Retorna o estilo e o texto referente a um determinado status de OS.
 * Caso o status seja inválido ou não encontrado, retorna o status padrão (1: Orçamento).
 */
export const getOsStatusConfig = (status: number) => {
  return STATUS_MAP[status] || STATUS_MAP[1];
};
