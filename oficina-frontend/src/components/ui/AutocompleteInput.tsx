import { Combobox } from "@headlessui/react";
import React, { useState } from 'react';

interface AutocompleteInputProps<T> {
  label?: string;
  placeholder?: string;
  title?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: T) => void;
  suggestions: T[];
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string | number;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function AutocompleteInput<T>({
  label,
  placeholder = "Digite para buscar...",
  title,
  value,
  onChange,
  onSelect,
  suggestions,
  getOptionLabel,
  getOptionKey,
  required = false,
  invalid = false,
  id,
  disabled = false,
  onBlur
}: AutocompleteInputProps<T>) {
  const [touched, setTouched] = useState(false);
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const isInvalid = invalid || (touched && required && !value);

  const handleSelect = (item: T | string) => {
    if (typeof item === 'string') {
      onChange(item);
    } else if (item) {
      const labelValue = getOptionLabel(item);
      onChange(labelValue);
      if (onSelect) onSelect(item);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-1 ${isInvalid ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <Combobox value={value as any} onChange={handleSelect as any} disabled={disabled} nullable>
        <div className="relative mt-1">
          <Combobox.Input
            id={id}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm 
              placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
              ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'} 
              ${isInvalid ? 'border-red-500 border-2' : 'border-gray-300'}
            `}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            title={title}
            autoComplete="off"
            displayValue={() => value}
          />

          {/* Renderiza a lista flutuante se houver sugestões retornadas da API */}
          {suggestions.length > 0 && (
            <Combobox.Options className="absolute z-50 max-h-60 w-full overflow-auto bg-white border-0 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {suggestions.map((item) => (
                <Combobox.Option
                  key={getOptionKey(item)}
                  value={item}
                  className={({ active }) =>
                    `relative cursor-default select-none py-1 pl-3 pr-9 transition-colors ${
                      active ? "bg-[#1967D2] text-white" : "text-gray-900"
                    }`
                  }
                >
                  {getOptionLabel(item)}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
}
