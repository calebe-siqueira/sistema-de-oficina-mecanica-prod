export type CreateUsuarioDTO = {
  email: string;
  login: string;
  nome_usuario: string;
  senha?: string;
  funcao: string;
};

export type UpdateUsuarioDTO = Partial<Omit<CreateUsuarioDTO, 'email' | 'login'>> & {
  cod_usuario: number;
  email?: string;
  login?: string;
  nome_usuario?: string;
  senha?: string;
  funcao?: string;
};
