// --> Utilitários de VALIDAÇÃO

// --- Validadores de Documento (CPF e CNPJ) ---
// Validar CNPJ
class CNPJ {
  private static readonly tamanhoCNPJSemDV: number = 12;
  private static readonly regexCNPJSemDV: RegExp = /^([A-Z\d]){12}$/;
  private static readonly regexCNPJ: RegExp = /^([A-Z\d]){12}(\d){2}$/;
  private static readonly regexCaracteresMascara: RegExp = /[./-]/g;
  private static readonly regexCaracteresNaoPermitidos: RegExp = /[^A-Z\d./-]/i;
  private static readonly valorBase: number = "0".charCodeAt(0);
  private static readonly pesosDV: number[] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  private static readonly cnpjZerado: string = "00000000000000";

  static isValid(cnpj: string): boolean {
    if (!this.regexCaracteresNaoPermitidos.test(cnpj)) {
      let cnpjSemMascara = this.removeMascaraCNPJ(cnpj);
      if (this.regexCNPJ.test(cnpjSemMascara) && cnpjSemMascara !== CNPJ.cnpjZerado) {
        const dvInformado = cnpjSemMascara.substring(this.tamanhoCNPJSemDV);
        const dvCalculado = this.calculaDV(cnpjSemMascara.substring(0, this.tamanhoCNPJSemDV));
        return dvInformado === dvCalculado;
      }
    }
    return false;
  }

  static calculaDV(cnpj: string): string {
    if (!this.regexCaracteresNaoPermitidos.test(cnpj)) {
      let cnpjSemMascara = this.removeMascaraCNPJ(cnpj);
      if (this.regexCNPJSemDV.test(cnpjSemMascara) && cnpjSemMascara !== this.cnpjZerado.substring(0, this.tamanhoCNPJSemDV)) {
        let somatorioDV1 = 0;
        let somatorioDV2 = 0;
        for (let i = 0; i < this.tamanhoCNPJSemDV; i++) {
          const asciiDigito = cnpjSemMascara.charCodeAt(i) - this.valorBase;
          somatorioDV1 += asciiDigito * this.pesosDV[i + 1];
          somatorioDV2 += asciiDigito * this.pesosDV[i];
        }
        const dv1 = somatorioDV1 % 11 < 2 ? 0 : 11 - (somatorioDV1 % 11);
        somatorioDV2 += dv1 * this.pesosDV[this.tamanhoCNPJSemDV];
        const dv2 = somatorioDV2 % 11 < 2 ? 0 : 11 - (somatorioDV2 % 11);
        return `${dv1}${dv2}`;
      }
    }
    throw new Error("Não é possível calcular o DV pois o CNPJ fornecido é inválido");
  }

  private static removeMascaraCNPJ(cnpj: string): string {
      return cnpj.replace(this.regexCaracteresMascara, "");
  }
}

export const isValidCnpj = (cnpj: string): boolean => {
  return CNPJ.isValid(cnpj);
};

// Validar CPF
export const isValidCpf = (cpf: string | null | undefined): boolean => {
  if (!cpf) return false;

  const strCPF = String(cpf).replace(/\D/g, '');

  // Valida tamanho e rejeita números repetidos
  if (strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(strCPF[i]) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (digito1 !== Number(strCPF[9])) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(strCPF[i]) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return digito2 === Number(strCPF[10]);
};

// Validar CPF ou CNPJ baseado no tipo do cliente
export const isValidCpfCnpj = (documentValue: string | null | undefined, tipo: string): boolean => {
  if (!documentValue) {
    return true; // Se não tiver valor, é válido
  }

  const doc = String(documentValue).toUpperCase();
  if (tipo === 'F') {
    return isValidCpf(doc);
  } else {
    return isValidCnpj(doc);
  }
};

// --- Validadores de Veículo ---
// Validar placa
export const isValidPlaca = (placa: string | null | undefined): boolean => {
  if (!placa) return false;

  // Remove hifens e espaços antes de validar
  const placaLimpa = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Regex oficial que cobre:
  // ABC1234 (Antiga) OU ABC1D23 (Mercosul)
  const regexOficial = /^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$/;

  return regexOficial.test(placaLimpa);
};

// Validar ano de fabricação do veículo
export const isValidVehicleYear = (value: string | number | null | undefined): boolean => {
  if (!value) return false;

  const ano = parseInt(value as string, 10);

  // Não pode ser inferior a 1886 e posterior ao ano atual + 1
  return !Number.isNaN(ano) && ano >= 1886 && ano <= new Date().getFullYear() + 1;
};

// --- Validadores de Contato ---
// Validar celular/telefone
export const isValidPhone = (value: string | null | undefined): boolean => {
  const digits = String(value || '').replace(/\D/g, '');

  // Se a entrada for vazia, considera válido
  if (digits.length === 0) return true;

  // Deve ter 10 (celulares antigos/fixos) ou 11 dígitos (celulares novos)
  return digits.length >= 10 && digits.length <= 11;
};

// --- Validadores de Endereço ---
// Validar CEP
export const isValidCep = (value: string | null | undefined): boolean => {
  // Deve ter 8 digitos
  return String(value || '').replace(/\D/g, '').length === 8;
};

export const isValidAddress = (address: any): { isValid: boolean; error: string } => {
  if (!address) return {
    isValid: true,
    error: ''
  };

  const addressFields = [address.cep, address.logradouro, address.numero, address.bairro, address.cidade, address.uf];
  const hasAnyAddress = addressFields.some(f => f && String(f).trim() !== '');

  if (!hasAnyAddress) {
    return {
      isValid: true,
      error: ''
    };
  }

  const cepValid = !address.cep || isValidCep(address.cep);
  if (!cepValid) {
    return {
      isValid: false,
      error: 'CEP deve ter 8 dígitos.'
    };
  }

  const isComplete = address.cep && address.logradouro && (address.numero !== null && address.numero !== '') && address.bairro && address.cidade && address.uf;
  if (!isComplete) {
    return {
      isValid: false,
      error: 'Endereço incompleto. Todos os campos obrigatórios devem ser preenchidos corretamente.'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};
