import React, { useId } from 'react';
import { ITEMS_PER_PAGE_OPTIONS } from '../../utils/constants';

export interface ItemsPerPageSelectorProps {
  /** Quantidade atual de itens por página */
  itemsPerPage?: number;
  /** Alias para itemsPerPage compatível com formulários controlados */
  value?: number;
  /** Callback acionado ao alterar o número de itens por página */
  onChange?: (itemsPerPage: number) => void;
  /** Callback para compatibilidade direta */
  setItemsPerPage?: (itemsPerPage: number) => void;
  /** Opções de quantidade por página (padrão: ITEMS_PER_PAGE_OPTIONS) */
  options?: readonly number[] | number[];
  /** Texto da label acessível (padrão: "Exibição:") */
  label?: string;
  /** ID para acessibilidade do label e select */
  id?: string;
  /** Nome do campo de formulário */
  name?: string;
  /** Desabilita o seletor */
  disabled?: boolean;
  /** Classes CSS extras para o container flex */
  className?: string;
  /** Classes CSS extras para o elemento select */
  selectClassName?: string;
}

export function ItemsPerPageSelector({
  itemsPerPage,
  value,
  onChange,
  setItemsPerPage,
  options = ITEMS_PER_PAGE_OPTIONS,
  label = 'Exibição:',
  id,
  name = 'itens_por_pagina',
  disabled = false,
  className = '',
  selectClassName = ''
}: ItemsPerPageSelectorProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  const currentValue = value ?? itemsPerPage ?? options[0];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const numericValue = Number(e.target.value);
    if (onChange) {
      onChange(numericValue);
    }
    if (setItemsPerPage) {
      setItemsPerPage(numericValue);
    }
  };

  return (
    <div className={`flex items-center ${className}`.trim()}>
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap"
      >
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        disabled={disabled}
        className={`border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectClassName}`.trim()}
        value={currentValue}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ItemsPerPageSelector;
