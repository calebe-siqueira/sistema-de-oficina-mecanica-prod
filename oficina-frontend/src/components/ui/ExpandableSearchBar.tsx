import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from './Button';
import { ChevronLeftIcon, SearchIcon } from './Icons';

export interface ExpandableSearchBarProps {
  /** Valor do campo de busca */
  value: string;
  /** Callback disparado ao alterar o texto de busca */
  onChange: (value: string) => void;
  /** Placeholder do campo de busca (padrão: "Digite a placa (ex: AAA0A00)...") */
  placeholder?: string;
  /** Rótulo de acessibilidade para o input (padrão: "Buscar por placa") */
  ariaLabel?: string;
  /** Rótulo de acessibilidade do botão de abrir a busca (padrão: "Buscar por placa") */
  searchButtonAriaLabel?: string;
  /** Estado de controle externo da visibilidade da busca */
  isSearching?: boolean;
  /** Notificação de alteração do estado de visibilidade da busca */
  onSearchingChange?: (isSearching: boolean) => void;
  /** Callback disparado ao cancelar/fechar a busca (além de limpar o valor) */
  onCancel?: () => void;
  /** Função de retorno para o botão Voltar (padrão: navigate(-1)) */
  onBack?: () => void;
  /** Texto do botão de voltar (padrão: "Voltar") */
  backButtonText?: string;
  /** Indica se os dados estão carregando (desabilita/oculta o botão de busca enquanto carrega) */
  loading?: boolean;
  /** Classes CSS adicionais para o container da barra */
  className?: string;
}

/**
 * Componente modular de barra de busca expansível para telas de listagem.
 * Prioriza a estética minimalista e mobile first, expandindo o campo de entrada
 * apenas quando o usuário aciona a busca.
 *
 * Segue os princípios SOLID (SRP e OCP) e DRY, unificando a interação entre telas.
 */
export const ExpandableSearchBar: React.FC<ExpandableSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Digite o termo de busca...',
  ariaLabel = 'Buscar por um termo',
  searchButtonAriaLabel = 'Buscar por um termo',
  isSearching: controlledIsSearching,
  onSearchingChange,
  onCancel,
  onBack,
  backButtonText = 'Voltar',
  loading = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [internalIsSearching, setInternalIsSearching] = useState(false);

  const isControlled = controlledIsSearching !== undefined;
  const isSearching = isControlled ? controlledIsSearching : internalIsSearching;

  const setIsSearching = (open: boolean) => {
    if (!isControlled) {
      setInternalIsSearching(open);
    }
    onSearchingChange?.(open);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    onChange('');
    onCancel?.();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Fecha e cancela a busca via Escape apenas enquanto o campo estiver ativo/expandido
  useEffect(() => {
    if (!isSearching) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearching]);

  return (
    <div className={`flex justify-between items-center ${className}`}>
      {isSearching ? (
        <div className="flex items-center w-full gap-2 transition-all duration-300 ease-in-out">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
              aria-label={ariaLabel}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-sm text-sm"
            />
          </div>
          <Button
            type="button"
            variant="cancel"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium shadow-sm text-sm shrink-0"
            onClick={handleCancelSearch}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            className="flex items-center text-gray-700 bg-gray-200 hover:bg-gray-300 border-none rounded-lg font-medium shadow-sm py-2 px-4"
            onClick={handleBack}
          >
            <ChevronLeftIcon className="mr-1 h-5 w-5" />
            {backButtonText}
          </Button>

          {!loading && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsSearching(true)}
              aria-label={searchButtonAriaLabel}
              className="shadow-sm rounded-lg"
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ExpandableSearchBar;
