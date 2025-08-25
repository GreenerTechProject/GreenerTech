import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GoogleMapsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GoogleMapsErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center p-6">
            <MapPin className="h-16 w-16 text-red-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erreur de chargement de la carte
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md">
              Une erreur s'est produite lors du chargement de Google Maps. 
              Cela peut être dû à un problème de connexion ou de configuration.
            </p>
            
            {this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Détails de l'erreur
                </summary>
                <pre className="text-red-600 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GoogleMapsErrorBoundary;
