// --> Utilitários de comparação entre os valores passados, utilizado para realização de buscas

// Utilizado em campos onde o valor buscado é um número, ex.: códigos e ano
export const matchesNumber = (value: string | number | undefined | null, searchTerm: string): boolean => {
    if (!searchTerm || searchTerm.trim() === '') return false;

    const intSearchTerm = parseInt(searchTerm, 10);
    // Se o termo da busca for inválido, não faz a busca
    if (isNaN(intSearchTerm)) return false;

    const intValue = parseInt(String(value || ''), 10);
    // Se o valor no banco for inválido, não faz a busca
    if (isNaN(intValue)) return false;

    return String(intValue).includes(String(intSearchTerm));
}