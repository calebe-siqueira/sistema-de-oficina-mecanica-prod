import { useState, useEffect, useMemo } from "react";

/**
 * Hook customizado para gerenciar autocomplete com busca local.
 * Faz a requisição da lista completa e filtra no frontend (ideal para catálogos limitados).
 * Aplica os princípios DRY e Open/Closed, sendo extensível para Montadoras, Modelos, Peças, Serviços etc.
 */
export function useAutocomplete<T>(
  query: string,
  fetchOptions: () => Promise<T[]>,
  getOptionLabel: (option: T) => string
) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca inicial das opções (Single Responsibility)
  useEffect(() => {
    let isMounted = true;
    
    const loadOptions = async () => {
      setLoading(true);
      try {
        const data = await fetchOptions();
        if (isMounted) setOptions(data);
      } catch (error) {
        console.error("Erro ao carregar opções no hook de autocomplete:", error);
        if (isMounted) setOptions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [fetchOptions]);

  // Derivação reativa das sugestões (Local Filtering)
  const suggestions = useMemo(() => {
    const lowerQuery = query?.toLowerCase().trim() || "";
    
    if (!lowerQuery) {
      return options.slice(0, 100); // Mostra até 100 opções quando o campo está vazio
    }
    
    return options
      .filter(option => getOptionLabel(option).toLowerCase().includes(lowerQuery))
      .slice(0, 100); // Limita a renderização para manter a UI performática (KISS)
  }, [query, options, getOptionLabel]);

  return { suggestions, loading, allOptions: options };
}
