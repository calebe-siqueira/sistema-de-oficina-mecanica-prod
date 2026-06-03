import React, { InputHTMLAttributes, ReactNode, useState } from 'react';

// Usamos o Omit para remover o 'prefix' original que é string
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: ReactNode; // Agora sua versão personalizada é aceita sem conflitos
  invalid?: boolean;
}

const Input = ({ 
  label, 
  id, 
  required, 
  prefix, 
  className = '',
  invalid,
  onBlur,
  ...props 
}: InputProps) => {
  const [touched, setTouched] = useState(false);
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  // O campo é visualmente inválido se:
  // 1. Marcado explicitamente como inválido pelo elemento pai
  // 2. Obrigatório, mas vazio após ser alterado
  const isInvalid = invalid || (touched && required && !props.value && props.value !== 0);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-1 ${isInvalid ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative mt-1">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        
        <input
          id={id}
          required={required}
          onBlur={handleBlur}
          {...props}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            ${prefix ? 'pl-8' : ''} 
            ${props.readOnly || props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'} 
            ${isInvalid ? 'border-red-500 border-2' : 'border-gray-300'}
            ${className}
          `}
        />
      </div>
    </div>
  );
};

export default Input;



// const Input = ({ label, id, required, ...props }) => (
//   <div className="w-full">
//     {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>}
//     <div className="relative">
//       {props.prefix && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{props.prefix}</span></div>)}
//       <input id={id} required={required} {...props} className={`mt-1 block w-full px-3 py-2 ${props.prefix ? 'pl-8' : ''} bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''} ${props.className || ''}`} />
//     </div>
//   </div>
// );