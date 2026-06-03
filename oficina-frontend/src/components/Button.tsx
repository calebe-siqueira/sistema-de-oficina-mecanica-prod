import React, { ButtonHTMLAttributes, ReactNode } from 'react';

// 1. Definimos a interface para as propriedades (props)
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'cancel' | 'trash' | 'floating';
  // O onClick já vem herdado do ButtonHTMLAttributes, então não precisa declarar manualmente
}

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) => {
  
  const baseStyle = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  
  const variants = { 
    primary: 'text-white bg-blue-600 hover:bg-blue-700', 
    secondary: 'text-gray-700 bg-gray-200 hover:bg-gray-300', 
    danger: 'text-white bg-red-600 hover:bg-red-700', // inutilizado após adicionar o cancel e o trash
    success: 'text-white bg-green-600 hover:bg-green-700', 
    ghost: 'text-gray-600 bg-transparent hover:bg-gray-100', 
    cancel: 'text-red-600 bg-gray-200 hover:bg-gray-100',
    trash: 'text-red-600 bg-white hover:bg-red-50',
    floating: 'text-gray-600 shadow rounded-lg transition-all duration-200 hover:scale-105',
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    > 
      {children} 
    </button>
  );
};

export default Button;



// const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) => {
//   const baseStyle = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
//   const variants = { primary: 'text-white bg-blue-600 hover:bg-blue-700', secondary: 'text-gray-700 bg-gray-200 hover:bg-gray-300', danger: 'text-white bg-red-600 hover:bg-red-700', success: 'text-white bg-green-600 hover:bg-green-700', ghost: 'text-gray-600 bg-transparent hover:bg-gray-100'};
//   return (<button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}> {children} </button>);
// };