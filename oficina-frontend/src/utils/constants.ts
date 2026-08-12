export type EstadoBrasil = typeof ESTADOS_BRASIL[number];
export type TipoCombustivel = typeof TIPOS_COMBUSTIVEL[number];
export type ItemsPerPageOption = typeof ITEMS_PER_PAGE_OPTIONS[number];
export type StatusId = keyof typeof STATUS_MAP;

export interface StatusConfig {
  readonly text: string;
  readonly bgStyle: string;
  readonly textStyle: string;
  readonly color: string;
}

// --- Constants ---
export const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export const TIPOS_COMBUSTIVEL = [
  'Diesel', 'Elétrico', 'Etanol', 'Flex', 'Gasolina', 'GNV'
] as const;

export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200] as const;

export const STATUS_MAP: Record<number, StatusConfig> = {
  1: { text: 'Orçamento',    bgStyle: 'bg-gray-100',   textStyle: 'text-gray-800',   color: '#6b7280' },
  2: { text: 'OS aberta',    bgStyle: 'bg-blue-100',   textStyle: 'text-blue-800',   color: '#3b82f6' },
  3: { text: 'Em andamento', bgStyle: 'bg-yellow-100', textStyle: 'text-yellow-800', color: '#eab308' },
  4: { text: 'Finalizada',   bgStyle: 'bg-green-100',  textStyle: 'text-green-800',  color: '#22c55e' },
  5: { text: 'Cancelada',    bgStyle: 'bg-red-100',    textStyle: 'text-red-800',    color: '#ef4444' },
} as const;
