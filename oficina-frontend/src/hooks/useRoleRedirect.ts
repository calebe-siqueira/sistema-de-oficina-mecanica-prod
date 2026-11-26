import { UserFuncao } from '../context/AuthContext';

/**
 * Retorna o caminho do dashboard padrão de acordo com a role do usuário.
 * - CLIENTE  → Portal do Cliente  (/cliente/dashboard)
 * - ADMIN    → Portal da Oficina  (/dashboard)
 * - MECANICO → Portal da Oficina  (/dashboard)
 */
export function getDefaultDashboard(funcao: UserFuncao | undefined | null): string {
  if (funcao === 'CLIENTE') return '/cliente/dashboard';
  return '/dashboard';
}
