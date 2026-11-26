import React, { SelectHTMLAttributes, ReactNode, useState, useId } from 'react';

// 1. Definimos a interface estendendo os atributos nativos do <select>
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode; // Os <option> que virão dentro do select
  invalid?: boolean;
  info?: ReactNode;
}

const Select = ({ 
  label, 
  id: customId, 
  children, 
  required, 
  className = '',
  invalid,
  info,
  onBlur,
  ...props 
}: SelectProps) => {
  const [touched, setTouched] = useState(false);

  // Gera um ID único automático caso nenhum ID tenha sido passado por prop
    const defaultId = useId();
    const inputId = customId || defaultId;

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const isInvalid = invalid || (touched && required && !props.value);

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center gap-1.5 mb-1">
          <label htmlFor={inputId} className={`block text-sm font-medium ${isInvalid ? 'text-red-600' : 'text-gray-700'}`}>
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {info}
        </div>
      )}
      
      <select
        id={inputId}
        required={required}
        onBlur={handleBlur}
        {...props}
        value={props.value ?? ''}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm
          ${props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'} 
          ${isInvalid ? 'border-red-500 border-2' : 'border-gray-300'}
          ${className}
        `}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
