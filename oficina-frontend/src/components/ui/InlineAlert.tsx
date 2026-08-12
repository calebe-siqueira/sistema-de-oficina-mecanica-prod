import { useState, useRef, useEffect } from 'react';
import { LuChevronDown } from './Icons';

export function InlineAlert({ error }: { error?: string | null }) {
  // Estado para controlar a expansão do alerta
  const [isExpanded, setIsExpanded] = useState(false);

  // Novo estado para controlar a visibilidade do botão
  const [isExpandable, setIsExpandable] = useState(false); 

  // Referência para medir o tamanho do texto no navegador
  const textRef = useRef<HTMLSpanElement>(null);

  // Referência para o container principal (foco e scroll)
  const containerRef = useRef<HTMLDivElement>(null);

  // Efeito de Foco e Scroll (Acessibilidade e UX)
  useEffect(() => {
    if (error && containerRef.current) {
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
  }, [error]);

  useEffect(() => {
    if (!error || !textRef.current) return;

    const checkOverflow = () => {
      // O elemento <span> que contém o texto dentro do alerta.
      const el = textRef.current;
      if (!el) return;

      // 1. Se o texto tem quebra de linha explícita, sempre precisa do botão.
      if (error.includes('\n')) {
        setIsExpandable(true);
        return;
      }

      // 2. Se o texto estiver recolhido (truncado), checamos se ele extrapolou a caixa.
      // el.scrollWidth: Largura total real do texto invisível
      // el.clientWidth: Largura da caixa disponível na tela
      if (!isExpanded) {
        setIsExpandable(el.scrollWidth > el.clientWidth);
      }
    };

    // Checa o tamanho na primeira renderização
    checkOverflow();

    // Cria um observador para reagir a mudanças de tamanho da tela (ex: virar o celular)
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    // Observa o container do texto
    if (textRef.current.parentElement) {
      resizeObserver.observe(textRef.current.parentElement);
    }

    // Limpeza do observer quando o componente desmontar
    return () => resizeObserver.disconnect();
  }, [error, isExpanded]); // Re-executa se o erro ou o estado de expansão mudarem

  // Se não houver erro, não renderiza nada na tela
  if (!error) return null;

  return (
    <div 
      ref={containerRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className={`mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md flex justify-between gap-4 outline-none focus-visible:ring-1 focus-visible:ring-red-600 ${
        isExpandable ? 'items-start' : 'items-center'
      }`}
    >
      <div className="flex flex-col min-w-0 w-full pt-0.5">
        <span 
          ref={textRef} // Conectamos a referência aqui
          className={`font-normal transition-all duration-300 ${
            isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
          }`}
        >
          {error}
        </span>
      </div>

      {/* Renderiza o botão SOMENTE se o texto for muito grande para a tela ou tiver '\n' */}
      {isExpandable && (
        <button 
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Recolher mensagem de erro" : "Expandir mensagem de erro"}
          title={isExpanded ? "Recolher mensagem de erro" : "Expandir mensagem de erro"}
          className="shrink-0 text-red-600 p-1 rounded-full transition-colors duration-200 hover:bg-red-100 outline-none focus-visible:ring-1 focus-visible:ring-red-600"
        >
          <LuChevronDown 
            className={`h-5 w-5 transform transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      )}
    </div>
  );
}
