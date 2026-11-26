import React from 'react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

interface ListWithPaginationProps<T> {
    data: T[];
    itemsPerPage: number;
    children: (paginatedItems: T[]) => React.ReactNode;
    
    // Props opcionais para modo controlado (server-side pagination)
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number | ((prev: number) => number)) => void;
}

function ListWithPagination<T>({
    data,
    itemsPerPage,
    children,
    currentPage: controlledCurrentPage,
    totalPages: controlledTotalPages,
    onPageChange
}: ListWithPaginationProps<T>) {

    const isControlled = controlledCurrentPage !== undefined && controlledTotalPages !== undefined && onPageChange !== undefined;

    // Se não for controlado, usamos o hook para paginar no client-side
    const { 
        visibleItems, 
        currentPage: uncontrolledCurrentPage, 
        totalPages: uncontrolledTotalPages, 
        setCurrentPage: setUncontrolledCurrentPage 
    } = usePagination(isControlled ? [] : data, itemsPerPage);

    const currentPage = isControlled ? controlledCurrentPage : uncontrolledCurrentPage;
    const totalPages = isControlled ? controlledTotalPages : uncontrolledTotalPages;
    const handlePageChange = isControlled ? onPageChange : setUncontrolledCurrentPage;
    
    // No modo controlado, a data que recebemos JÁ É a página atual inteira
    const itemsToRender = isControlled ? data : visibleItems;

    return (
        <div>
            {children(itemsToRender)}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}

export default ListWithPagination;
