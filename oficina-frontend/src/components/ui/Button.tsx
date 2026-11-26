import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'cancel' | 'trash_white' | 'trash_gray' | 'floating';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  ...props 
}, ref) => {
  const isFloating = variant === 'floating';

  const baseStyle = isFloating
    ? 'inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-lg shadow-xs hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/40 active:scale-95 data-active:scale-95 hover:scale-105 data-hover:scale-105 transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100'
    : 'inline-flex items-center justify-center px-4 py-2 border [:where(&)]:border-transparent text-sm font-medium rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  
  const variants = { 
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-600',
    secondary: 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-600',
    success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-600',
    ghost: 'text-gray-600 bg-transparent hover:bg-gray-100 focus:ring-gray-400',
    cancel: 'text-gray-700 bg-gray-200 hover:text-gray-800 hover:bg-gray-300 transition-colors focus:ring-gray-400',
    trash_white: 'text-red-600 bg-white hover:text-red-700 hover:bg-red-50 transition-colors focus:ring-red-500',
    trash_gray: 'text-red-600 bg-gray-100 hover:text-red-700 hover:bg-red-50 transition-colors focus:ring-red-500',
    // [:where(&)] transforma a regra em um "estilo padrão fraco" (fallback), assim, 
    // qualquer outra classe comum consegue sobrescrevê-lo facilmente, de modo que, 
    // se o desenvolvedor fornecer cores personalizadas no className, elas prevalecem.
    floating: 
      '[:where(&)]:bg-white [:where(&)]:text-gray-700 [:where(&)]:border-gray-200/80 [:where(&)]:hover:border-gray-300',
  };

  const variantClass = variants[variant] || '';

  return (
    <button 
      ref={ref}
      type={type} 
      onClick={onClick} 
      className={`${baseStyle} ${variantClass} ${className}`.trim()} 
      {...props}
    > 
      {children} 
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
