import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#1a1a1a',
          color: '#ff6b6b',
          padding: '40px',
          fontFamily: 'monospace',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#ff4757', fontSize: '32px', marginBottom: '20px' }}>
            ⚡ RUNTIME ERROR DETECTED
          </h1>
          
          <div style={{
            backgroundColor: '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ff4757'
          }}>
            <h2 style={{ marginTop: 0 }}>Error:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
          </div>

          {this.state.errorInfo && (
            <div style={{
              backgroundColor: '#2d2d2d',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #3498db'
            }}>
              <h2>Component Stack:</h2>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ↻ Reload Page
            </button>
            
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ↺ Try Again
            </button>
          </div>

          <div style={{ marginTop: '30px', color: '#95a5a6', fontSize: '14px' }}>
            <p>🔍 <strong>Debugging Tips:</strong></p>
            <ul style={{ lineHeight: '1.6' }}>
              <li>Check browser console for detailed errors (F12 → Console)</li>
              <li>Verify all imported components exist and export correctly</li>
              <li>Check for undefined variables or null references</li>
              <li>Look for TypeScript compilation warnings</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;