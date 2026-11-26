import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { ResponseAtivarAcessoDTO } from '../types/cliente';
import { CheckIcon, CopyIcon, KeyIcon, MailIcon, TriangleAlertIcon, ShieldAlertIcon, UserCheckIcon } from '../components/ui/Icons';

interface ConfirmActivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName?: string;
  clientEmail?: string;
  loading: boolean;
}

export const ConfirmActivateModal: React.FC<ConfirmActivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  clientEmail,
  loading,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <UserCheckIcon className="w-6 h-6 text-blue-600" />
          <span>Ativar acesso do cliente</span>
        </div>
      }
      isOpen={isOpen}
      onClose={loading ? () => { } : onClose}
    >
      <div className="space-y-4 text-gray-700">
        <p>
          Deseja realmente ativar o acesso ao sistema para{' '}
          <strong className="text-gray-900">{clientName || 'este cliente'}</strong>?
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <MailIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Login de acesso: <strong className="font-semibold">{clientEmail}</strong></span>
          </div>
          <p className="text-xs text-blue-800 mt-1 pl-6">
            Um usuário será habilitado para o cliente e uma senha temporária será gerada e enviada para o e-mail cadastrado.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Caso o e-mail não possa ser entregue automaticamente pelo servidor, a senha temporária também será exibida na tela a seguir para que possa ser informada pessoalmente ao cliente.
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Ativando...' : 'Ativar acesso'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface ConfirmDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName?: string;
  loading: boolean;
}

export const ConfirmDeactivateModal: React.FC<ConfirmDeactivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  loading,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-700">
          <ShieldAlertIcon className="w-6 h-6 text-red-600" />
          <span>Desativar acesso do cliente</span>
        </div>
      }
      isOpen={isOpen}
      onClose={loading ? () => { } : onClose}
    >
      <div className="space-y-4 text-gray-700">
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
          <div className="flex items-start gap-2">
            <TriangleAlertIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold">Atenção ao revogar o acesso:</p>
              <p className="mt-1">
                Ao desativar o acesso de <strong className="font-bold">{clientName || 'este cliente'}</strong>, ele não conseguirá mais realizar login no sistema ou consultar suas ordens de serviço online.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Tem certeza de que deseja prosseguir com a desativação do usuário deste cliente?
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? 'Desativando...' : 'Desativar acesso'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface AccessResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ResponseAtivarAcessoDTO | null;
}

export const AccessResultModal: React.FC<AccessResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const emailEnviado = Boolean(result.email_enviado ?? result.email_enviado);
  const senhaTemporaria = result.senha_temporaria ?? result.senha_temporaria ?? '';

  const handleCopyPassword = async () => {
    if (!senhaTemporaria) return;
    try {
      await navigator.clipboard.writeText(senhaTemporaria);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar senha:', err);
    }
  };

  const handleCopyAll = async () => {
    const credText = `Acesso oficina:\nLogin: ${result.login}\nSenha temporária: ${senhaTemporaria}`;
    try {
      await navigator.clipboard.writeText(credText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar credenciais:', err);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-green-700">
          <CheckIcon className="w-6 h-6 text-green-600" />
          <span>Acesso ativado com sucesso</span>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4 text-gray-700">
        {emailEnviado ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900 flex items-start gap-2">
            <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Credenciais enviadas por e-mail!</p>
              <p className="text-xs text-green-800 mt-0.5">
                As instruções e senha de acesso foram enviadas com sucesso para o e-mail: <strong>{result.login}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm text-amber-900 flex items-start gap-2">
            <TriangleAlertIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Atenção ao envio do e-mail:</p>
              <p className="text-xs text-amber-800 mt-0.5">
                O acesso foi ativado com sucesso, porém o e-mail automático não pôde ser enviado pelo servidor. Por favor, passe a senha temporária abaixo diretamente ao cliente.
              </p>
            </div>
          </div>
        )}

        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Credenciais de acesso</span>
            <KeyIcon className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Login / E-mail</span>
            <div className="p-2 bg-white rounded border border-gray-300 font-mono text-sm text-gray-800 break-all select-all">
              {result.login}
            </div>
          </div>

          {senhaTemporaria ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Senha temporária</span>
                {copied && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <CheckIcon className="w-3.5 h-3.5" /> Copiado!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-white rounded border border-gray-300 font-mono text-base font-bold text-blue-700 tracking-wider select-all">
                  {senhaTemporaria}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCopyPassword}
                  title="Copiar apenas a senha"
                  className="px-3 py-2 flex items-center gap-1 text-xs shrink-0"
                >
                  <CopyIcon className="w-4 h-4" />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Senha mantida conforme configuração anterior ou definida pelo usuário.
            </p>
          )}

          {senhaTemporaria && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopyAll}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CopyIcon className="w-3.5 h-3.5" /> Copiar login e senha juntos
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Informe ao cliente que ele deverá utilizar esta senha temporária em seu primeiro acesso e que poderá redefini-la a qualquer momento.
        </p>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button
            variant="primary"
            onClick={onClose}
            className="min-w-[100px]"
          >
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
};
