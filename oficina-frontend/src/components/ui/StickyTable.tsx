import React, { createContext, useContext, forwardRef, useCallback } from 'react';
import { useStickyScrollState } from '../../hooks/useStickyScrollState';

interface StickyTableContextValue {
  isOverlapping: boolean;
  containerNode: HTMLDivElement | null;
  checkScroll: () => void;
}

const StickyTableContext = createContext<StickyTableContextValue | null>(null);

/**
 * Hook para acessar o estado de sobreposição da tabela fixa
 */
export function useStickyTable() {
  return useContext(StickyTableContext);
}

export interface StickyTableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  threshold?: number;
}

/**
 * Container com scroll horizontal que monitora e propaga o estado de sobreposição
 * das colunas fixas via StickyTableContext.
 */
export const StickyTableContainer = forwardRef<HTMLDivElement, StickyTableContainerProps>(
  ({ children, className = '', threshold = 2, ...props }, forwardedRef) => {
    const { containerRef, containerNode, isOverlapping, checkScroll } = useStickyScrollState<HTMLDivElement>({ threshold });

    const handleRef = useCallback((node: HTMLDivElement | null) => {
      containerRef(node);
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    }, [containerRef, forwardedRef]);

    return (
      <StickyTableContext.Provider value={{ isOverlapping, containerNode, checkScroll }}>
        <div
          ref={handleRef}
          className={`overflow-x-auto ${className}`.trim()}
          {...props}
        >
          {children}
        </div>
      </StickyTableContext.Provider>
    );
  }
);

StickyTableContainer.displayName = 'StickyTableContainer';

// ── Estilos Tailwind centralizados ──
// Mantemos as strings de classe em constantes semânticas para manter os componentes
// limpos e facilitar ajustes futuros em um único lugar (DRY).

const STICKY_BASE = 'border-l-transparent sticky right-0 z-10 w-px whitespace-nowrap px-4 py-3 border-l transition-all duration-200 ease-out';

const HEADER_STYLES = {
  base: `${STICKY_BASE} bg-gray-50 text-center text-xs font-medium uppercase tracking-wider`,
  idle: 'shadow-none text-gray-500',
  stuck: 'border-gray-200 shadow-[-2px_0_12px_-1px_rgba(0,0,0,0.06)] text-gray-700',
} as const;

const CELL_STYLES = {
  base: `${STICKY_BASE} bg-white text-sm font-medium group-hover:bg-gray-50`,
  idle: 'shadow-none',
  stuck: 'border-gray-200 shadow-[-2px_0_12px_-1px_rgba(0,0,0,0.06)]',
} as const;

export interface StickyActionHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Força o estado de sobreposição/elevação (opcional; se omitido, lê do StickyTableContainer). */
  isStuck?: boolean;
}

/**
 * Cabeçalho (th) padronizado para a coluna de ações com elevação dinâmica.
 */
export const StickyActionHeader = forwardRef<HTMLTableCellElement, StickyActionHeaderProps>(
  ({ children = 'Ações', isStuck, className = '', ...props }, ref) => {
    const context = useContext(StickyTableContext);
    const overlapping = isStuck !== undefined ? isStuck : (context?.isOverlapping ?? false);

    return (
      <th
        ref={ref}
        className={`${HEADER_STYLES.base} ${overlapping ? HEADER_STYLES.stuck : HEADER_STYLES.idle} ${className}`.trim()}
        {...props}
      >
        {children}
      </th>
    );
  }
);

StickyActionHeader.displayName = 'StickyActionHeader';

export interface StickyActionCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Força o estado de sobreposição/elevação (opcional; se omitido, lê do StickyTableContainer). */
  isStuck?: boolean;
}

/**
 * Célula de linha (td) padronizada para a coluna de ações com elevação dinâmica
 * e integração com hover de linha (`group-hover`).
 */
export const StickyActionCell = forwardRef<HTMLTableCellElement, StickyActionCellProps>(
  ({ children, isStuck, className = '', ...props }, ref) => {
    const context = useContext(StickyTableContext);
    const overlapping = isStuck !== undefined ? isStuck : (context?.isOverlapping ?? false);

    return (
      <td
        ref={ref}
        className={`${CELL_STYLES.base} ${overlapping ? CELL_STYLES.stuck : CELL_STYLES.idle} ${className}`.trim()}
        {...props}
      >
        {children}
      </td>
    );
  }
);

StickyActionCell.displayName = 'StickyActionCell';

export interface StickyActionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Container flex horizontal compacto e padronizado para os botões de ação dentro da célula.
 */
export const StickyActionGroup: React.FC<StickyActionGroupProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  Container: StickyTableContainer,
  Header: StickyActionHeader,
  Cell: StickyActionCell,
  Group: StickyActionGroup,
};
