import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseStickyScrollStateOptions {
  /**
   * Tolerância em pixels para determinar se o scroll atingiu a extrema direita.
   * Default: 2
   */
  threshold?: number;
}

export interface UseStickyScrollStateReturn<T extends HTMLElement = HTMLDivElement> {
  containerRef: (node: T | null) => void;
  containerNode: T | null;
  isOverlapping: boolean;
  checkScroll: () => void;
}

/**
 * Hook reativo para detectar se uma tabela com rolagem horizontal possui colunas
 * transbordando e sobrepostas por uma coluna fixa à direita (`sticky right-0`).
 * 
 * Utiliza callback ref para garantir que o elemento DOM seja capturado com precisão
 * no ciclo de vida do componente, combinando listeners passivos de scroll, ResizeObserver,
 * MutationObserver e requestAnimationFrame.
 */
export function useStickyScrollState<T extends HTMLElement = HTMLDivElement>(
  options: UseStickyScrollStateOptions = {}
): UseStickyScrollStateReturn<T> {
  const { threshold = 2 } = options;
  const [containerNode, setContainerNode] = useState<T | null>(null);
  const [isOverlapping, setIsOverlapping] = useState<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  const containerRef = useCallback((node: T | null) => {
    setContainerNode(node);
  }, []);

  const checkScroll = useCallback(() => {
    if (!containerNode) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerNode;
    const maxScrollLeft = scrollWidth - clientWidth;

    // A coluna de ações fixa à direita está sobrepondo conteúdo se houver overflow
    // e o scroll ainda não alcançou o limite da extrema direita.
    const shouldOverlap = maxScrollLeft > 1 && scrollLeft < maxScrollLeft - threshold;

    setIsOverlapping(shouldOverlap);
  }, [containerNode, threshold]);

  useEffect(() => {
    if (!containerNode) return;

    const scheduleCheck = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        checkScroll();
        rafIdRef.current = null;
      });
    };

    // Checagens iniciais imediata e após layout
    checkScroll();
    const timer = setTimeout(scheduleCheck, 50);

    // Listener de scroll horizontal passivo
    containerNode.addEventListener('scroll', scheduleCheck, { passive: true });

    // Observa redimensionamento do container e da tabela interna
    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(containerNode);
    if (containerNode.firstElementChild) {
      resizeObserver.observe(containerNode.firstElementChild);
    }

    // Observa mutações no DOM (ex.: linhas adicionadas ou carregadas via API)
    const mutationObserver = new MutationObserver(scheduleCheck);
    mutationObserver.observe(containerNode, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', scheduleCheck);

    return () => {
      clearTimeout(timer);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      containerNode.removeEventListener('scroll', scheduleCheck);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [containerNode, checkScroll]);

  return { containerRef, containerNode, isOverlapping, checkScroll };
}

export default useStickyScrollState;
