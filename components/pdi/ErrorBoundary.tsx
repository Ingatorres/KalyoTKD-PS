import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-red-900 text-white p-8 overflow-auto z-[9999] flex flex-col font-mono text-sm">
          <h1 className="text-2xl font-bold mb-4">¡Error Crítico en la Pantalla! (PDI)</h1>
          <p className="mb-4 text-red-200">Por favor, reporta este error al administrador del sistema.</p>
          
          <div className="bg-black/50 p-4 rounded-lg mb-4 whitespace-pre-wrap font-bold">
            {this.state.error && this.state.error.toString()}
          </div>
          
          <div className="bg-black/80 p-4 rounded-lg text-xs whitespace-pre-wrap opacity-75">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
          
          <button 
            className="mt-6 bg-white text-red-900 px-6 py-2 rounded font-bold self-start hover:bg-red-100"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar / Limpiar Error
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
