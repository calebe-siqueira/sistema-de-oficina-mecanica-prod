// --> Utilitários de aplicação de MÁSCARA

export const maskCep = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined || v === '') return '';

    // Remove caracteres não numéricos e limita a string a 8 dígitos
    let val = String(v).replace(/\D/g, '').slice(0, 8);

    if (!val) return '';

    // Formata como CEP (XXXXX-XXX)
    return val.replace(/^(\d{5})(\d)/, '$1-$2');
};

export const maskCnpj = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined || v === '') return '';

    // Remove caracteres não alfanuméricos
    let val = String(v).toUpperCase().replace(/[^A-Z\d]/g, '');

    // Divide em base (alfanumérica) e dígito verificador (numérico)
    const base = val.slice(0, 12);
    const dv = val.slice(12, 14).replace(/\D/g, '');

    val = base + dv;

    if (!val) return '';

    // Formata como CNPJ (XX.XXX.XXX/XXXX-XX)
    return val
        .replace(/^([A-Z\d]{2})([A-Z\d])/, '$1.$2')
        .replace(/^([A-Z\d]{2})\.([A-Z\d]{3})([A-Z\d])/, '$1.$2.$3')
        .replace(/^([A-Z\d]{2})\.([A-Z\d]{3})\.([A-Z\d]{3})([A-Z\d])/, '$1.$2.$3/$4')
        .replace(/^([A-Z\d]{2})\.([A-Z\d]{3})\.([A-Z\d]{3})\/([A-Z\d]{4})(\d)/, '$1.$2.$3/$4-$5');
};

export const maskCpf = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined || v === '') return '';

    // Remove caracteres não numéricos e limita a string a 11 dígitos
    const val = String(v).replace(/\D/g, '').slice(0, 11);

    if (!val) return '';

    // Formata como CPF (XXX.XXX.XXX-XX)
    return val
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

export const maskPhone = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined || v === '') return '';

    // Remove caracteres não numéricos e limita a string 11 dígitos
    const val = String(v).replace(/\D/g, '').slice(0, 11);

    if (!val) return '';

    return val
        .replace(/^(\d{2})(\d)/g, '($1) $2')            // Adiciona o DDD: (XX)
        .replace(/(\d{4})(\d)/, '$1-$2')                // Assume formato telefone fixo (10 dígitos): (XX) XXXX-X
        .replace(/(\d{4})-(\d)(\d{4})$/, '$1$2-$3');    // Se virar celular (11 dígitos), move o hífen: (XX) XXXXX-XXXX
};

export const maskPlaca = (v: string | null | undefined): string => {
    if (!v) return '';

    // Remove caracteres não alfanuméricos e converte para maiúsculo
    const val = String(v).toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!val) return '';

    let formatted = '';

    for (let i = 0; i < val.length && i < 7; i++) {
        let char = val[i];

        if (i < 3) {
            if (!/[A-Z]/.test(char)) continue;      // 1º ao 3º: Aceita apenas letra
        } else if (i === 3) {
            if (!/[0-9]/.test(char)) continue;      // 4º: Aceita apenas número
        } else if (i === 4) {
            if (!/[A-Z0-9]/.test(char)) continue;   // 5º: Aceita letra ou número (Mercosul ou Antigo)
        } else if (i > 4) {
            if (!/[0-9]/.test(char)) continue;      // 6º e 7º: Aceita apenas número
        }

        formatted += char;
    }

    // Insere o hífen apenas se o 5º caractere for numérico (presume formato Mercosul)
    if (formatted.length > 4) {
        const isMercosul = /[A-Z]/.test(formatted[4]);
        return isMercosul ? formatted : `${formatted.slice(0, 3)}-${formatted.slice(3)}`;
    }

    return formatted;
};