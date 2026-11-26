import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode; // Permite passar qualquer componente de erro
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Atualiza o estado para exibir a UI de fallback na próxima renderização
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Apenas log local no console
    console.error("Erro interceptado:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Renderiza a UI personalizada passada via prop
      return this.props.fallback;
    }

    return this.props.children;
  }
}