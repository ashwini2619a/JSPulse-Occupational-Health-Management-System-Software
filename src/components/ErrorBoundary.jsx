import React from 'react';
import { AlertOctagon, RotateCw, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    if (confirm("⚠️ Warning: This will clear all locally saved clinic records and stock data. Are you sure you want to proceed?")) {
      localStorage.clear();
      try {
        // Delete the actual IndexedDB databases used by the application
        const dbNames = ['JSPulseOHMS_Sheets', 'JSPulseOHMS_Backups'];
        let pendingDeletes = dbNames.length;
        const onDone = () => {
          pendingDeletes--;
          if (pendingDeletes <= 0) window.location.reload();
        };
        dbNames.forEach(name => {
          try {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = onDone;
            req.onerror = onDone;
            req.onblocked = onDone;
          } catch { onDone(); }
        });
        // Safety fallback: reload after 2 seconds in case callbacks never fire
        setTimeout(() => window.location.reload(), 2000);
      } catch (e) {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at top right, #0f172a, #020617)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            {/* Header Icon */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              marginBottom: '24px'
            }}>
              <AlertOctagon size={48} />
            </div>

            {/* Error Messages */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px 0', color: '#f1f5f9' }}>
              System Exception Intercepted
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
              The application encountered an unexpected rendering or state error. The safety subsystem has halted execution to prevent data corruption.
            </p>

            {/* Recovery Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '32px'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <RotateCw size={18} /> Refresh Application
              </button>

              <button
                onClick={this.handleResetStorage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={18} /> Reset Application Cache (Clear Data)
              </button>
            </div>

            {/* Error Details */}
            <details style={{ textAlign: 'left', background: '#0b0f19', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <summary style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}>
                Show Error Details
              </summary>
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: '200px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, color: '#f87171', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
