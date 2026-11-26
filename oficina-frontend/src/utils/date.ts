// --> Utilitários envolvendo DATAS
import { parse, parseISO, isValid, format, subYears, isWithinInterval } from 'date-fns';

export type DateValue = string | number | Date | number[] | null | undefined;

// --- Instâncias globais do Intl para máxima performance ---
// Instanciar o Intl fora das funções evita recriá-lo em loops (ex: renderização de tabelas),
// garantindo um ganho expressivo de performance.
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { 
  timeZone: 'America/Sao_Paulo' 
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { 
  timeZone: 'America/Sao_Paulo', 
  dateStyle: 'short', 
  timeStyle: 'short' 
});

const dateTimeSecFormatter = new Intl.DateTimeFormat('pt-BR', { 
  timeZone: 'America/Sao_Paulo', 
  dateStyle: 'short', 
  timeStyle: 'medium' 
});

// --- Funções de Parsing Seguras (SRP & Validação Estrita) ---

/**
 * Faz o parsing de qualquer formato de entrada e garante o retorno de um objeto Date nativo VÁLIDO (ou null).
 * O date-fns protege contra o bug de fuso horário, interpretando as datas sempre em horário local.
 */
export const parseDateSafe = (val: DateValue): Date | null => {
  if (val === null || val === undefined || val === '') return null;

  let parsedDate: Date;

  if (Array.isArray(val)) {
    if (val.length < 3) return null;
    // O JS nativo usa mês 0-11. Como o array vem 1-12 (do backend), subtraímos 1 no mês.
    parsedDate = new Date(
      Number(val[0]),
      Number(val[1]) - 1, 
      Number(val[2]),
      val[3] !== undefined ? Number(val[3]) : 0,
      val[4] !== undefined ? Number(val[4]) : 0,
      val[5] !== undefined ? Number(val[5]) : 0
    );
  } else if (val instanceof Date) {
    parsedDate = val;
  } else if (typeof val === 'number') {
    parsedDate = new Date(val);
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    if (trimmed.includes('/')) {
      // Identifica o formato BR baseado na presença de horas e minutos
      const hasSeconds = (trimmed.match(/:/g) || []).length === 2;
      const hasTime = trimmed.includes(':');
      
      const formatStr = hasSeconds ? 'dd/MM/yyyy HH:mm:ss' : 
                        hasTime ? 'dd/MM/yyyy HH:mm' : 
                        'dd/MM/yyyy';

      parsedDate = parse(trimmed, formatStr, new Date());
    } else {
      // parseISO do date-fns resolve perfeitamente strings como "2024-10-24" sem transformar em UTC
      parsedDate = parseISO(trimmed);
    }
  } else {
    return null;
  }

  // isValid do date-fns barra o bug das "datas inventadas" (ex: 31/02/2024)
  return isValid(parsedDate) ? parsedDate : null;
};

// --- Funções Públicas de Formatação (KISS & DRY) ---

/**
 * Formata datas para o formato ISO (yyyy-MM-dd).
 * Uso indicado: envio para API/banco de dados.
 */
export const formatDateToISO = (val: DateValue): string => {
  const date = parseDateSafe(val);
  // date-fns é mais confiável que o Intl para gerar ISO estrito YYYY-MM-DD
  return date ? format(date, 'yyyy-MM-dd') : '';
};

/**
 * Formata datas para o padrão brasileiro (dd/MM/yyyy).
 * Uso indicado: exibição na interface do usuário.
 * @param val Data a ser formatada
 * @param fallback Valor retornado caso a data seja inválida ou vazia (padrão: '')
 */
export const formatDateBR = (val: DateValue, fallback: string = ''): string => {
  const date = parseDateSafe(val);
  return date ? dateFormatter.format(date) : fallback;
};

/**
 * Formata datas para o padrão brasileiro com horário (dd/MM/yyyy HH:mm ou dd/MM/yyyy HH:mm:ss).
 * Uso indicado: logs, auditoria, históricos e registros onde o horário é relevante.
 */
export const formatDateTimeBR = (
  val: DateValue,
  fallback: string = '',
  includeSeconds: boolean = false
): string => {
  const date = parseDateSafe(val);
  if (!date) return fallback;
  
  return includeSeconds ? dateTimeSecFormatter.format(date) : dateTimeFormatter.format(date);
};

// --- Funções de Regras de Negócio (Lógica & Ranges) ---

export const getLocalTodayString = (): string => formatDateToISO(new Date());

/**
 * Retorna uma data mínima e máxima (range) para a OS, com base no ano de fabricação do veículo e na data atual
 */
export const getOsDateRange = (anoFabricacao?: string | number | null): [string, string] => {
  const max = getLocalTodayString();
  let min = '1886-01-01'; // Data da criação do primeiro automóvel como fallback

  if (anoFabricacao) {
    // Extrai o ano e converte com base 10 de forma segura
    const ano = parseInt(String(anoFabricacao).substring(0, 4), 10);
    // Garante que não vai quebrar se a conversão resultar em NaN
    if (!isNaN(ano)) min = `${ano - 1}-01-01`;
  }

  return [min, max];
};

export const getBirthDateRange = (): [string, string] => {
  const min = '1900-01-01';
  // O date-fns resolve o salto de anos bissextos de forma segura com subYears
  const maxDate = subYears(new Date(), 10);
  return [min, formatDateToISO(maxDate)];
};

export const dateInRange = (value: DateValue, min: DateValue, max: DateValue): boolean => {
  const targetDate = parseDateSafe(value);
  const minDate = parseDateSafe(min);
  const maxDate = parseDateSafe(max);

  if (!targetDate || !minDate || !maxDate) return false;

  return isWithinInterval(targetDate, { start: minDate, end: maxDate });
};
