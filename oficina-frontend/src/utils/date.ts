// --> Utilitários envolvendo DATAS

// Pega a data atual formatada como YYYY-MM-DD
export const getLocalTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Formata datas recebidas de diversas formas
export const formatSafeDate = (val: string | number | Date | number[] | null | undefined): string => {
  if (!val) return '';
  try {
    if (typeof val === 'string') {
      // 1. Trata formato ISO (ex: 1995-05-26T00:00:00)
      if (val.includes('T')) return val.split('T')[0];

      // 2. Trata formato brasileiro (ex: 26/05/1995) convertendo para yyyy-MM-dd
      if (val.includes('/')) {
        const [day, month, year] = val.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      return val;
    }
    if (typeof val === 'number') return new Date(val).toISOString().split('T')[0];
    if (Array.isArray(val)) return `${val[0]}-${String(val[1] || '').padStart(2, '0')}-${String(val[2] || '').padStart(2, '0')}`;
    if (val instanceof Date) return val.toISOString().split('T')[0];
  } catch (e) {
    console.error("Erro ao formatar data:", val, e);
  }
  return '';
};

// Retorna uma data mínima e máxima (range) para a OS, com base no ano de fabricação do veículo e na data atual
export const getOsDateRange = (ano_fabricacao?: string | number | null): [string, string] => {
  // Data da OS não pode ser maior que hoje (futura)
  const max = getLocalTodayString();

  // Data da OS não pode ser menor que o ano de fabricação do veículo
  let min = '1886-01-01'; // Data da criação do primeiro automóvel como fallback

  if (ano_fabricacao) {
    // 2. Extrai o ano e converte com base 10 de forma segura
    const ano_fabricacao_int = parseInt(String(ano_fabricacao).substring(0, 4), 10);
    
    // Garante que não vai quebrar se a conversão resultar em NaN
    if (!isNaN(ano_fabricacao_int)) {
      min = `${ano_fabricacao_int - 1}-01-01`;
    }
  }

  return [min, max];
};

// Retorna uma data mínima e máxima (range) para data de nascimento, com base na data atual (idade mínima 10 anos)
export const getBirthDateRange = (): [string, string] => {
  const today = new Date();

  // Subtrai 10 anos da data atual (idade mínima para fazer o cadastro é 10 anos)
  today.setFullYear(today.getFullYear() - 10);
  const max = today.toISOString().split('T')[0];

  // Define a data mínima de nascimento como 01/01/1900
  const min = '1900-01-01';
  return [min, max];
};

// Verifica se uma data está dentro de um intervalo (range)
export const dateInRange = (value: string | null | undefined, min: string, max: string): boolean => {
  if (!value) return false;
  return value >= min && value <= max;
};
