import React, { ReactNode, forwardRef } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', id }, ref) => (
    <div
      ref={ref}
      id={id}
      className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

interface CardHeaderProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  actions,
  className = '',
}) => (
  <div
    className={`px-4 py-4 sm:px-6 border-b border-gray-200 flex justify-between items-center ${className}`}
  >
    <h2 className="text-xl font-semibold text-gray-800">{children}</h2>
    {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
  </div>
);

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);
