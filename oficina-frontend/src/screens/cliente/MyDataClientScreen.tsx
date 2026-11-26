import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { ChevronLeftIcon, LockIcon, MailIcon } from '../../components/ui/Icons';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

import { useMeuPerfil } from '../../hooks/useMeuPerfil';
import { formatDateBR } from '../../utils/date';
import { ESTADOS_BRASIL } from '../../utils/constants';

import type {
  AlterarMinhaSenhaDTO,
  SolicitarTrocaEmailDTO,
  ConfirmarTrocaEmailDTO,
} from '../../types/meuPerfil';

// ─── Estado inicial dos formulários ───

const INITIAL_SENHA: AlterarMinhaSenhaDTO = {
  senha_atual: '',
  nova_senha: '',
  confirmacao_nova_senha: '',
};

const INITIAL_SOLICITAR_EMAIL: SolicitarTrocaEmailDTO = {
  novo_email: '',
};

const INITIAL_CONFIRMAR_EMAIL: ConfirmarTrocaEmailDTO = {
  novo_email: '',
  codigo: '',
};

// ─── Constantes de estilo (evitar duplicação – DRY) ───

const INPUT_CLASS = 'w-full border border-gray-300 rounded-md p-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white';

// ─── Componente principal ───

const MyDataClientScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    perfil,
    loading,
    error,
    submittingSenha,
    submittingEmail,
    alterarSenha,
    solicitarTrocaEmail,
    confirmarTrocaEmail,
  } = useMeuPerfil();

  // Controla qual painel de ação está aberto ('senha' | 'email' | null)
  const [activePanel, setActivePanel] = useState<'senha' | 'email' | null>(null);

  // Após solicitar o código, avança para o passo de confirmação
  const [emailCodigoEnviado, setEmailCodigoEnviado] = useState(false);

  const [senhaForm, setSenhaForm] = useState<AlterarMinhaSenhaDTO>(INITIAL_SENHA);
  const [solicitarEmailForm, setSolicitarEmailForm] = useState<SolicitarTrocaEmailDTO>(INITIAL_SOLICITAR_EMAIL);
  const [confirmarEmailForm, setConfirmarEmailForm] = useState<ConfirmarTrocaEmailDTO>(INITIAL_CONFIRMAR_EMAIL);

  // ─── Handlers de formulário ───

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSenhaForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSolicitarEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSolicitarEmailForm((prev) => ({ ...prev, [name]: value }));
    // Mantém o novo_email sincronizado no formulário de confirmação
    if (name === 'novo_email') {
      setConfirmarEmailForm((prev) => ({ ...prev, novo_email: value }));
    }
  };

  const handleConfirmarEmailChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setConfirmarEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Submits ───

  const handleSubmitSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await alterarSenha(senhaForm);
    if (ok) {
      setSenhaForm(INITIAL_SENHA);
      setActivePanel(null);
    }
  };

  const handleSolicitarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await solicitarTrocaEmail(solicitarEmailForm);
    if (ok) {
      setEmailCodigoEnviado(true);
    }
  };

  const handleConfirmarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirmarTrocaEmail(confirmarEmailForm);
    if (ok) {
      setSolicitarEmailForm(INITIAL_SOLICITAR_EMAIL);
      setConfirmarEmailForm(INITIAL_CONFIRMAR_EMAIL);
      setEmailCodigoEnviado(false);
      setActivePanel(null);
    }
  };

  const closePanel = () => {
    setActivePanel(null);
    setEmailCodigoEnviado(false);
    setSenhaForm(INITIAL_SENHA);
    setSolicitarEmailForm(INITIAL_SOLICITAR_EMAIL);
    setConfirmarEmailForm(INITIAL_CONFIRMAR_EMAIL);
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="secondary"
          className="flex items-center text-gray-700 bg-gray-200 hover:bg-gray-300 border-none rounded-lg font-medium shadow-sm py-2 px-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeftIcon className="mr-1 h-5 w-5" />
          Voltar
        </Button>
      </div>

      <InlineAlert message={error} className="bg-red-100" />

      {loading ? (
        <LoadingSpinner message="Carregando seus dados..." className='mt-22' />
      ) : !error && perfil && (
        <>
          {/* Card Meus Dados */}
          <Card className="shadow-sm rounded-xl border-none">
            <CardHeader className="text-xl font-bold text-gray-800 border-b border-gray-100 py-4 px-5">
              Meus dados
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Nome completo"
                type="text"
                name="nome_cliente"
                value={perfil.nome_cliente}
                className={INPUT_CLASS}
                readOnly
              />

              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label="CPF/CNPJ"
                    type="text"
                    name="cpf_cnpj"
                    value={perfil.cpf_cnpj ?? ''}
                    className={INPUT_CLASS}
                    readOnly
                  />
                </div>
                <div className="w-24 shrink-0">
                  <Select
                    label="Tipo"
                    name="tipo"
                    value={perfil.tipo}
                    className={INPUT_CLASS}
                    disabled
                  >
                    <option value="F">PF</option>
                    <option value="J">PJ</option>
                  </Select>
                </div>
              </div>

              <Input
                label="Data de nascimento"
                type="text"
                name="data_nascimento"
                value={formatDateBR(perfil.data_nascimento)}
                className={INPUT_CLASS}
                readOnly
              />

              <Input
                label="Celular"
                type="text"
                name="celular"
                value={perfil.celular ?? ''}
                className={INPUT_CLASS}
                readOnly
              />

              <Input
                label="Telefone"
                type="text"
                name="telefone"
                value={perfil.telefone ?? ''}
                className={INPUT_CLASS}
                readOnly
              />

              {/* E-mail com botão de alteração */}
              <div>
                <Input
                  label="E-mail"
                  type="email"
                  name="email"
                  value={perfil.email}
                  className={INPUT_CLASS}
                  readOnly
                  autoComplete='email'
                />
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() =>
                    setActivePanel((p) => (p === 'email' ? null : 'email'))
                  }
                >
                  <MailIcon className="h-3.5 w-3.5" />
                  Alterar e-mail
                </button>
              </div>

              {/* Senha com botão de alteração */}
              <div>
                <Input
                  label="Senha"
                  type="password"
                  name="senha"
                  value="••••••••••"
                  className={INPUT_CLASS}
                  readOnly
                />
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() =>
                    setActivePanel((p) => (p === 'senha' ? null : 'senha'))
                  }
                >
                  <LockIcon className="h-3.5 w-3.5" />
                  Alterar senha
                </button>
              </div>

              {/* Painel inline: alterar senha */}
              {activePanel === 'senha' && (
                <form
                  onSubmit={handleSubmitSenha}
                  className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                  aria-label="Formulário de alteração de senha"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Alterar senha
                  </p>

                  <Input
                    label="Senha atual"
                    type="password"
                    name="senha_atual"
                    value={senhaForm.senha_atual}
                    onChange={handleSenhaChange}
                    className={INPUT_CLASS}
                    required
                    autoComplete="current-password"
                  />
                  <Input
                    label="Nova senha"
                    type="password"
                    name="nova_senha"
                    value={senhaForm.nova_senha}
                    onChange={handleSenhaChange}
                    className={INPUT_CLASS}
                    required
                    autoComplete="new-password"
                  />
                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    name="confirmacao_nova_senha"
                    value={senhaForm.confirmacao_nova_senha}
                    onChange={handleSenhaChange}
                    className={INPUT_CLASS}
                    required
                    autoComplete="new-password"
                  />

                  <div className="flex gap-3 justify-end pt-1">
                    <Button
                      type="button"
                      variant="cancel"
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium py-2 px-5 rounded-lg border-none text-sm"
                      onClick={closePanel}
                      disabled={submittingSenha}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="success"
                      className="font-medium py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
                      disabled={submittingSenha}
                    >
                      {submittingSenha ? 'Salvando...' : 'Salvar senha'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Painel inline: alterar e-mail */}
              {activePanel === 'email' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {!emailCodigoEnviado ? (
                    /* Passo 1: solicitar código */
                    <form
                      onSubmit={handleSolicitarEmail}
                      className="space-y-3"
                      aria-label="Solicitar troca de e-mail"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Trocar e-mail
                      </p>
                      <p className="text-xs text-gray-500">
                        Informe o novo e-mail. Enviaremos um código de
                        verificação de 6 dígitos para ele.
                      </p>

                      <Input
                        label="Novo e-mail"
                        type="email"
                        name="novo_email"
                        value={solicitarEmailForm.novo_email}
                        onChange={handleSolicitarEmailChange}
                        className={INPUT_CLASS}
                        required
                        autoComplete="email"
                      />

                      <div className="flex gap-3 justify-end pt-1">
                        <Button
                          type="button"
                          variant="cancel"
                          className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium py-2 px-5 rounded-lg border-none text-sm"
                          onClick={closePanel}
                          disabled={submittingEmail}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          className="font-medium py-2 px-5 rounded-lg text-sm"
                          disabled={submittingEmail}
                        >
                          {submittingEmail ? 'Enviando...' : 'Enviar código'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Passo 2: confirmar código */
                    <form
                      onSubmit={handleConfirmarEmail}
                      className="space-y-3"
                      aria-label="Confirmar troca de e-mail"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Confirmar novo e-mail
                      </p>
                      <p className="text-xs text-gray-500">
                        Digite o código de 6 dígitos enviado para{' '}
                        <strong>{solicitarEmailForm.novo_email}</strong>.
                      </p>

                      <Input
                        label="Código de verificação"
                        type="text"
                        name="codigo"
                        value={confirmarEmailForm.codigo}
                        onChange={handleConfirmarEmailChange}
                        className={INPUT_CLASS}
                        required
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />

                      <div className="flex gap-3 justify-end pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium py-2 px-5 rounded-lg border-none text-sm"
                          onClick={() => setEmailCodigoEnviado(false)}
                          disabled={submittingEmail}
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          variant="success"
                          className="font-medium py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
                          disabled={submittingEmail}
                        >
                          {submittingEmail ? 'Confirmando...' : 'Confirmar'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Endereço */}
          {perfil.endereco && (
            <Card className="shadow-sm rounded-xl border-none">
              <CardHeader className="text-xl font-bold text-gray-800 border-b border-gray-100 py-4 px-5">
                Endereço
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <Input
                  label="CEP"
                  type="text"
                  name="cep"
                  value={perfil.endereco.cep ?? ''}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Input
                  label="Logradouro"
                  type="text"
                  name="logradouro"
                  value={perfil.endereco.logradouro ?? ''}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Input
                  label="Número"
                  type="text"
                  name="numero"
                  value={String(perfil.endereco.numero ?? '')}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Input
                  label="Complemento"
                  type="text"
                  name="complemento"
                  value={perfil.endereco.complemento ?? ''}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Input
                  label="Bairro"
                  type="text"
                  name="bairro"
                  value={perfil.endereco.bairro ?? ''}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Input
                  label="Cidade"
                  type="text"
                  name="cidade"
                  value={perfil.endereco.cidade ?? ''}
                  className={INPUT_CLASS}
                  readOnly
                />
                <Select
                  label="UF"
                  name="uf"
                  value={perfil.endereco.uf ?? ''}
                  className={INPUT_CLASS}
                  disabled
                >
                  <option value="">Selecione</option>
                  {ESTADOS_BRASIL.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MyDataClientScreen;