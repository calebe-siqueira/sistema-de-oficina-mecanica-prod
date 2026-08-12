import React, { useState, useMemo, useEffect } from 'react';

export interface UsePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  visibleItems: T[];
  totalPages: number;
  resetPage: () => void;
}

export function usePagination<T>(items: T[] | null | undefined, initialItemsPerPage: number = 25): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / itemsPerPage));

  // Volta para a primeira página se currentPage exceder totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const visibleItems = useMemo(() => {
    if (!items) return [];
    return items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handleItemsPerPageChange,
    visibleItems,
    totalPages,
    resetPage,
  };
}
