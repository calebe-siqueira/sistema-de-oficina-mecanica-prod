export type AuthenticationDTO = {
  login: string;
  senha?: string;
};

export type ResponseLoginDTO = {
  cod_usuario: number;
  nome_usuario: string;
  login: string;
  funcao: string;
};
