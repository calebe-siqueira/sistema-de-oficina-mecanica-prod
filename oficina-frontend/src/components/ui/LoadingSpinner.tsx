interface LoadingSpinnerProps {
  message: string;
  className?: string;
}

export const LoadingSpinner = ({ message, className }: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full pt-32 ${className}`}>
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  )
}
