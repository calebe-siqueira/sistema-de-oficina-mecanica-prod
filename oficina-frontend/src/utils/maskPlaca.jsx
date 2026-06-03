/* Função para aplicar máscara na placa do veículo no momento do cadastro 
   e para formatar as exibições de placas nos formatos antigo e Mercosul (AAA-0000 X AAA0A00) */
export const maskPlaca = (v) => {
  if (!v || String(v) === 'null' || String(v) === 'undefined') return '';
  let val = String(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
  let formatted = '';
  for (let i = 0; i < val.length && i < 7; i++) {
    let char = val[i];
    if (i < 3) {
      if (!/[A-Z]/.test(char)) break;
    } else if (i === 3) {
      if (!/[0-9]/.test(char)) break;
    } else if (i === 4) {
      if (!/[A-Z0-9]/.test(char)) break;
    } else if (i > 4) {
      if (!/[0-9]/.test(char)) break;
    }
    formatted += char;
  }

  if (formatted.length > 4) {
    if (/[A-Z]/.test(formatted[4])) {
      return formatted;
    } else {
      return formatted.slice(0, 3) + '-' + formatted.slice(3);
    }
  } else if (formatted.length > 3) {
    return formatted.slice(0, 3) + '-' + formatted.slice(3);
  }
  return formatted;
};