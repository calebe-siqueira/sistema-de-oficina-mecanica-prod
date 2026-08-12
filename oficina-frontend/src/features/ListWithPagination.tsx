import React from 'react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

interface ListWithPaginationProps<T> {
    data: T[];
    itemsPerPage: number;
    children: (paginatedItems: T[]) => React.ReactNode;
}

function ListWithPagination<T>({
    data,
    itemsPerPage,
    children
}: ListWithPaginationProps<T>) {

    const { visibleItems, currentPage, totalPages, setCurrentPage } = usePagination(data, itemsPerPage);

    return (
        <div>
            {children(visibleItems)} {/* O componente pai decide o que renderizar! */}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}

export default ListWithPagination;
