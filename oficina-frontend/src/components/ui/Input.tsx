import React, { InputHTMLAttributes, ReactNode, useState, useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  invalid?: boolean;
  info?: ReactNode;
  labelAction?: ReactNode;
  containerClassName?: string;
}

const Input = ({
  label,
  id: customId,
  required,
  prefix,
  suffix,
  className = '',
  containerClassName = '',
  invalid,
  info,
  labelAction,
  onBlur,
  ...props
}: InputProps) => {
  const [touched, setTouched] = useState(false);

  // Gera um ID único automático caso nenhum ID tenha sido passado por prop
  const defaultId = useId();
  const inputId = customId || defaultId;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  // O campo é visualmente inválido se:
  // 1. Marcado explicitamente como inválido pelo elemento pai
  // 2. Obrigatório, mas vazio
  const isInvalid = invalid || (touched && required && !props.value && props.value !== 0);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor={inputId} className={`block text-sm font-medium ${isInvalid ? 'text-red-600' : 'text-gray-700'}`}>
              {label}
              {required && <span className="text-red-600 ml-1">*</span>}
            </label>
            {info}
          </div>
          {labelAction}
        </div>
      )}

      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <span className="sm:text-sm">{prefix}</span>
          </div>
        )}

        <input
          id={inputId}
          required={required}
          onBlur={handleBlur}
          {...props}
          value={props.value ?? ''}
          onWheel={props.type === "number" ? (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur() : undefined}
          className={`
            block w-full py-2 border rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            ${prefix ? 'pl-8 sm:pl-9' : 'pl-3'} 
            ${suffix ? 'pr-10' : 'pr-3'} 
            ${props.readOnly || props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'} 
            ${isInvalid ? 'border-red-500 border-2' : 'border-gray-300'}
            ${className}
          `}
        />

        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
