import React from 'react';
import Button from './Button';
import { LuChevronLeft, LuChevronRight } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Função para gerar o array de páginas visíveis
  const getVisiblePages = () => {
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
      if (currentPage <= 2) end = 4;
      if (currentPage >= totalPages - 1) start = totalPages - 3;

      // Adiciona reticências antes do meio, se necessário
      if (start > 2) pages.push('...');

      // Adiciona as páginas do meio
      for (let i = start; i <= end; i++) pages.push(i);

      // Adiciona reticências depois do meio, se necessário
      if (end < totalPages - 1) pages.push('...');

      // Sempre inclui a última página
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Botão Anterior */}
      <Button
        className="px-2"
        onClick={() => onPageChange((p: number) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <LuChevronLeft className="h-4 w-4" />
      </Button>

      {/* Páginas Numéricas */}
      {getVisiblePages().map((page, index) => {
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
            onClick={() => handlePageChange(page)}
            className={`px-3 min-w-[36px] h-9 transition-colors ${isCurrent
                ? 'bg-blue-600 text-gray-700 hover:bg-blue-700' // Estilo da página ativa
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
        onClick={() => onPageChange((p: number) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        <LuChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;



// Paginação simples com botões de primeira e última página
// const Pagination = ({ currentPage, totalPages, onPageChange }) => {
//   if (totalPages <= 1) return null;

//   return (
//     <div className="flex items-center justify-center gap-2">
//       <Button
//         className="px-2"
//         onClick={() => onPageChange(1)}
//         disabled={currentPage === 1}
//         aria-label="Primeira página"
//       >
//         <LuChevronFirst className="h-4 w-4" />
//       </Button>

//       <Button
//         className="px-2"
//         onClick={() => onPageChange(p => Math.max(1, p - 1))}
//         disabled={currentPage === 1}
//         aria-label="Página anterior"
//       >
//         <LuChevronLeft className="h-4 w-4" />
//       </Button>

//       <span className="text-sm font-medium text-gray-700 mx-3 select-none">
//         Página {currentPage} de {totalPages}
//       </span>

//       <Button
//         className="px-2"
//         onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
//         disabled={currentPage === totalPages}
//         aria-label="Próxima página"
//       >
//         <LuChevronRight className="h-4 w-4" />
//       </Button>

//       <Button
//         className="px-2"
//         onClick={() => onPageChange(totalPages)}
//         disabled={currentPage === totalPages}
//         aria-label="Última página"
//       >
//         <LuChevronLast className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// };