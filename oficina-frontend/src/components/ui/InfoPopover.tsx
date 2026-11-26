import React from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { LuInfo } from 'react-icons/lu';

interface InfoPopoverProps {
  /** Título opcional exibido no cabeçalho do popover */
  title?: string;
  /** Conteúdo textual ou elementos React exibidos dentro do balão informativo */
  content: React.ReactNode;
  /** Ícone customizado para o botão de ativação (padrão: LuInfo) */
  icon?: React.ReactNode;
  /** Texto opcional de acessibilidade para leitores de tela e tooltip nativo */
  ariaLabel?: string;
  /** Classes CSS adicionais para o container do Popover */
  className?: string;
  /** Classes CSS adicionais para o botão disparador */
  buttonClassName?: string;
  /** Classes CSS adicionais para o painel de conteúdo */
  panelClassName?: string;
  /** Alinhamento do popover em relação ao botão (padrão: 'bottom end') */
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end';
  /** Tamanho máximo aproximado do painel */
  size?: 'sm' | 'md' | 'lg';
}

export function InfoPopover({
  content,
  title,
  icon,
  ariaLabel,
  className = '',
  buttonClassName = '',
  panelClassName = '',
  placement = 'bottom end',
  size = 'md',
}: InfoPopoverProps) {
  const sizeMap = {
    sm: 'w-60',
    md: 'w-72 sm:w-80',
    lg: 'w-80 sm:w-96',
  };

  return (
    <Popover className={`relative inline-flex items-center leading-none ${className}`}>
      {/* Botão disparador com ícone informativo */}
      <PopoverButton
        type="button"
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 data-[open]:bg-blue-50 data-[open]:text-blue-600 ${buttonClassName}`}
        aria-label={ariaLabel || title || 'Informações adicionais'}
        title={title || ariaLabel || 'Informações adicionais'}
      >
        {icon || <LuInfo className="w-3.5 h-3.5" />}
      </PopoverButton>

      {/* Painel com as informações */}
      <PopoverPanel
        anchor={placement}
        transition
        className={`z-50 ${sizeMap[size]} rounded-xl bg-white p-3.5 text-xs text-slate-600 shadow-xl shadow-slate-900/10 border border-slate-200/90 [--anchor-gap:8px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 ${panelClassName}`}
      >
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-900 text-xs">
            {icon || <LuInfo className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            <span>{title}</span>
          </div>
        )}
        <div className="leading-relaxed">
          {content}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
