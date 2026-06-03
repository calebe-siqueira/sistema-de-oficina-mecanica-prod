import React, { SelectHTMLAttributes, ReactNode, useState } from 'react';

// 1. Definimos a interface estendendo os atributos nativos do <select>
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode; // Os <option> que virão dentro do select
  invalid?: boolean;
}

const Select = ({ 
  label, 
  id, 
  children, 
  required, 
  className = '',
  invalid,
  onBlur,
  ...props 
}: SelectProps) => {
  const [touched, setTouched] = useState(false);
  
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const isInvalid = invalid || (touched && required && !props.value);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-1 ${isInvalid ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={id}
        required={required}
        onBlur={handleBlur}
        {...props}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
          ${props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'} 
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


// const Select = ({ label, id, children, required, ...props }) => (
//   <div className="w-full">
//     {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>}
//     <select id={id} required={required} {...props} className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''} ${props.className || ''}`}>
//       {children}
//     </select>
//   </div>
// );