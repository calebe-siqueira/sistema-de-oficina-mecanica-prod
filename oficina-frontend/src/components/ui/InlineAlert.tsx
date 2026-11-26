import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  ChevronDownIcon,
  TriangleAlertIcon,
  CheckIcon,
  InfoIcon,
  CloseIcon,
} from './Icons';

export type InlineAlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface InlineAlertProps {
  /** Mensagem a ser exibida */
  message?: string | null;
  /** Variante visual e semântica do alerta */
  variant?: InlineAlertVariant;
  /** Classes adicionais para customização */
  className?: string;
  /** Ícone customizado (se omitido, usa o padrão conforme a variante) */
  icon?: ReactNode;
  /** Callback para dispensar o alerta */
  onDismiss?: () => void;
  /** Controla se o alerta deve rolar e focar automaticamente ao ser exibido */
  autoScroll?: boolean;
}

const variantStyles: Record<
  InlineAlertVariant,
  { container: string; icon: string; button: string }
> = {
  error: {
    container: 'text-red-700 bg-red-50 border border-red-200 focus-visible:ring-red-600',
    icon: 'text-red-600',
    button: 'text-red-600 hover:bg-red-100 focus-visible:ring-red-600',
  },
  success: {
    container: 'text-emerald-800 bg-emerald-50 border border-emerald-200 focus-visible:ring-emerald-600',
    icon: 'text-emerald-600',
    button: 'text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-600',
  },
  warning: {
    container: 'text-amber-800 bg-amber-50 border border-amber-200 focus-visible:ring-amber-600',
    icon: 'text-amber-600',
    button: 'text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-600',
  },
  info: {
    container: 'text-blue-800 bg-blue-50 border border-blue-200 focus-visible:ring-blue-600',
    icon: 'text-blue-600',
    button: 'text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-600',
  },
};

export function InlineAlert({
  message,
  variant = 'error',
  className = '',
  icon,
  onDismiss,
  autoScroll = true,
}: InlineAlertProps) {
  // Estado para controlar a expansão do alerta quando o texto for longo
  const [isExpanded, setIsExpanded] = useState(false);

  // Estado para controlar a visibilidade do botão (se o alerta é expandível)
  const [isExpandable, setIsExpandable] = useState(false);

  // Referência para medir o tamanho do texto no navegador
  const textRef = useRef<HTMLSpanElement>(null);

  // Referência para o container principal (foco e scroll)
  const containerRef = useRef<HTMLDivElement>(null);

  // Efeito de Foco e Scroll (Acessibilidade e UX)
  useEffect(() => {
    if (message && autoScroll && containerRef.current) {
      // O setTimeout garante que o navegador terminou o layout da tela antes do scroll
      const timer = setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          container.focus({ preventScroll: true });
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [message, autoScroll]);

  useEffect(() => {
    if (!message || !textRef.current) return;

    const checkOverflow = () => {
      // Elemento que contém o texto dentro do alerta
      const element = textRef.current;
      if (!element) return;

      if (message.includes('\n')) {
        setIsExpandable(true);
        return;
      }

      // Checamos se o texto extrapolou a caixa
      // element.scrollWidth: largura do texto do alerta
      // element.clientWidth: largura da caixa disponível
      if (!isExpanded) {
        setIsExpandable(element.scrollWidth > element.clientWidth);
      }
    };

    checkOverflow();

    // Cria um observador para reagir a mudanças de tamanho da tela (ex: virar o celular)
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (textRef.current.parentElement) {
      resizeObserver.observe(textRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [message, isExpanded]);

  if (!message) return null;

  const currentStyle = variantStyles[variant];

  const defaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckIcon className={`h-4 w-4 shrink-0 mt-0.5 ${currentStyle.icon}`} />;
      case 'warning':
      case 'error':
        return <TriangleAlertIcon className={`h-4 w-4 shrink-0 mt-0.5 ${currentStyle.icon}`} />;
      case 'info':
        return <InfoIcon className={`h-4 w-4 shrink-0 mt-0.5 ${currentStyle.icon}`} />;
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role={variant === 'error' ? 'alert' : 'status'}
      className={`mb-4 text-xs sm:text-sm p-3 rounded-lg flex justify-between gap-2.5 outline-none focus-visible:ring-1 ${currentStyle.container} ${
        isExpandable ? 'items-start' : 'items-center'
      } ${className}`}
    >
      <div className={`flex gap-2.5 min-w-0 w-full ${isExpanded ? 'items-start' : 'items-center'}`}>
        {icon !== undefined ? icon : defaultIcon()}
        <div className="flex flex-col min-w-0 w-full pt-0.5">
          <span
            ref={textRef}
            className={`font-normal transition-all duration-300 leading-relaxed ${
              isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
            }`}
          >
            {message}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* Botão de expansão do texto truncado */}
        {isExpandable && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Recolher mensagem' : 'Expandir mensagem'}
            title={isExpanded ? 'Recolher mensagem' : 'Expandir mensagem'}
            className={`p-1 rounded-full transition-colors duration-200 outline-none focus-visible:ring-1 ${currentStyle.button}`}
          >
            <ChevronDownIcon
              className={`h-4 w-4 transform transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        )}

        {/* Botão opcional de dispensar */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dispensar aviso"
            title="Dispensar aviso"
            className={`p-1 rounded-full text-xs font-bold transition-colors duration-200 outline-none focus-visible:ring-1 ${currentStyle.button}`}
          >
            <CloseIcon className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
