import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

export interface UseDebouncedSearchOptions {
  initialValue?: string;
  delay?: number;
  minChars?: number;
  isIdType?: (type: string) => boolean;
  searchType?: string;
  validateThreshold?: (type: string, value: string) => boolean;
}

export interface TriggerSearchResult {
  term: string;
  hasChanged: boolean;
}

export interface UseDebouncedSearchReturn {
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchTerm: string;
  triggerSearch: (customValue?: string) => TriggerSearchResult;
  resetSearch: (newVal?: string) => void;
  setImmediate: (value: string) => void;
}

/**
 * Verifica se os critérios mínimos de busca foram atingidos pelo valor digitado conforme o tipo selecionado:
 * - 'ano': exatamente 4 dígitos numéricos (ex: 2024);
 * - 'data': data ISO completa no formato YYYY-MM-DD (10 caracteres válidos);
 * - 'cpf_cnpj' / 'cpf' / 'cnpj': ao menos 3 dígitos numéricos;
 * - 'telefone' / 'celular': ao menos 4 dígitos numéricos;
 * - 'placa': ao menos 3 caracteres;
 * - IDs: ao menos 1 dígito puramente numérico;
 * - demais campos textuais (nome, modelo, etc.): ao menos `minChars` caracteres (padrão: 2).
 */
export function isSearchThresholdMet(
  searchType: string,
  value: string,
  minChars = 2,
  isIdType?: (type: string) => boolean
): boolean {
  const trimmedValue = value.trim();
  if (trimmedValue === '') return false;

  const isId = isIdType ? isIdType(searchType) : (searchType.startsWith('cod_') || searchType === 'id');
  if (isId) {
    return /^\d+$/.test(trimmedValue);
  }

  const type = (searchType || '').toLowerCase();

  switch (type) {
    case 'ano':
      return /^\d{4}$/.test(trimmedValue);
    case 'data':
      return /^\d{4}-\d{2}-\d{2}$/.test(trimmedValue);
    case 'cpf_cnpj':
    case 'cpf':
    case 'cnpj':
      return trimmedValue.replace(/\D/g, '').length >= 3;
    case 'telefone':
    case 'celular':
      return trimmedValue.replace(/\D/g, '').length >= 4;
    case 'placa':
      return trimmedValue.length >= 3;
    default:
      return trimmedValue.length >= minChars;
  }
}

/**
 * Hook reutilizável para gerenciar busca com debounce automático e suporte
 * a disparo imediato (submit via Enter ou clique no botão de buscar).
 *
 * Características:
 * - Digitação contínua: aguarda `delay` (em ms) antes de atualizar `searchTerm`.
 * - Threshold inteligente:
 *     - Anos exigem 4 dígitos numéricos;
 *     - Datas exigem 10 dígitos (formato ISO completo YYYY-MM-DD);
 *     - Códigos/IDs exigem dígitos numéricos (1+ caracteres);
 *     - CPF/CNPJ exigem ao menos 3 dígitos;
 *     - Telefone exige ao menos 4 dígitos;
 *     - Tipos textuais exigem `minChars` (padrão: 2).
 * - Campo vazio: limpa instantaneamente sem aguardar debounce.
 * - Busca imediata (`triggerSearch`): cancela qualquer debounce pendente e aplica o termo instantaneamente.
 * - `resetSearch` / `setImmediate`: manipulações atômicas e imediatas sem delay.
 */
export function useDebouncedSearch({
  initialValue = '',
  delay = 400,
  minChars = 2,
  isIdType = () => false,
  searchType = '',
  validateThreshold
}: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn {
  const [searchInput, setSearchInput] = useState<string>(initialValue);
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<string>(searchInput);
  const searchTermRef = useRef<string>(searchTerm);
  const isIdTypeRef = useRef(isIdType);
  const validateThresholdRef = useRef(validateThreshold);

  // Sincronização segura dos refs para React 18 Concurrent Mode,
  // evitando valores desatualizados quando o usuário digita muito rápido
  useLayoutEffect(() => {
    searchInputRef.current = searchInput;
    searchTermRef.current = searchTerm;
    isIdTypeRef.current = isIdType;
    validateThresholdRef.current = validateThreshold;
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Debounce automático ao alterar searchInput ou searchType
  useEffect(() => {
    const trimmed = searchInput.trim();

    // Se o input estiver vazio, limpa imediatamente o termo ativo
    if (trimmed === '') {
      setSearchTerm('');
      return;
    }

    // Regra de threshold inteligente
    const validator = validateThresholdRef.current || ((st: string, val: string) => isSearchThresholdMet(st, val, minChars, isIdTypeRef.current));
    const meetsThreshold = validator(searchType, trimmed);

    if (!meetsThreshold) {
      // Se não atingir o threshold mínimo na digitação automática,
      // limpa qualquer termo anterior para não manter filtro inconsistente
      setSearchTerm('');
      return;
    }

    timerRef.current = setTimeout(() => {
      setSearchTerm(trimmed);
      timerRef.current = null;
    }, delay);

    return clearTimer;
  }, [searchInput, searchType, delay, minChars, clearTimer]);

  /**
   * Força a aplicação imediata do termo de busca (usado em onSubmit ou clique em Buscar).
   * Cancela qualquer timer de debounce em andamento.
   */
  const triggerSearch = useCallback((customValue?: string): TriggerSearchResult => {
    clearTimer();
    const target = customValue !== undefined ? customValue.trim() : searchInputRef.current.trim();
    const hasChanged = searchTermRef.current !== target;
    setSearchTerm(target);
    return { term: target, hasChanged };
  }, [clearTimer]);

  /**
   * Reseta tanto o input quanto o termo de busca imediatamente.
   */
  const resetSearch = useCallback((newVal = '') => {
    clearTimer();
    setSearchInput(newVal);
    setSearchTerm(newVal);
  }, [clearTimer]);

  /**
   * Define simultaneamente input e termo de forma imediata (ex: seleção de veículo ou data).
   */
  const setImmediate = useCallback((value: string) => {
    clearTimer();
    setSearchInput(value);
    setSearchTerm(value.trim());
  }, [clearTimer]);

  return {
    searchInput,
    setSearchInput,
    searchTerm,
    triggerSearch,
    resetSearch,
    setImmediate
  };
}

export default useDebouncedSearch;
