import React, { useMemo } from 'react';
import Button from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Função para gerar o array de páginas visíveis (useMemo evita recalcular desnecessariamente a cada render)
  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Número máximo de botões numéricos visíveis

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Sempre inclui a primeira página
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Ajusta os limites nas extremidades
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      // Adiciona reticências antes do meio, se houver um buraco maior que 1 número
      if (start > 2) {
        pages.push(start === 3 ? 2 : '...');
      }

      // Adiciona as páginas do meio
      for (let i = start; i <= end; i++) pages.push(i);

      // Adiciona reticências depois do meio, se necessário
      if (end < totalPages - 1) {
        pages.push(end === totalPages - 2 ? totalPages - 1 : '...');
      }

      // Sempre inclui a última página
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {/* Botão Anterior */}
      <Button
        className="px-2"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Páginas Numéricas */}
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="px-3 py-1 text-gray-400 select-none">
              ...
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <Button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`px-3 min-w-[36px] h-9 transition-colors ${isCurrent
              ? 'bg-blue-600 text-white hover:bg-blue-700' // Estilo do botão da página ativa
              : 'bg-transparent !text-gray-700 hover:bg-gray-100'
              }`}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {page}
          </Button>
        );
      })}

      {/* Botão Próximo */}
      <Button
        className="px-2"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
