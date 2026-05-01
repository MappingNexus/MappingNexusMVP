import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
 children: ReactNode;
 fallbackMessage?: string;
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

 static getDerivedStateFromError(error: Error): Partial<State> {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('[ErrorBoundary] Caught error:', error, errorInfo);
 this.setState({ errorInfo });
 }

 handleReset = () => {
 this.setState({ hasError: false, error: null, errorInfo: null });
 };

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
 <div className="w-full max-w-lg cb-card p-10 text-center">
 <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
 <AlertTriangle className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
 </div>

 <h2 className="text-2xl font-semibold tracking-tight mb-2">Something went wrong</h2>
 <p className="cb-body mb-6 leading-relaxed">
 {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
 </p>

 {this.state.error && (
 <div className="text-left bg-muted border border-border rounded-2xl p-4 mb-6">
 <p className="text-xs font-mono text-foreground/80 break-all">{this.state.error.message}</p>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button onClick={this.handleReset} className="cb-btn-primary">
 <RefreshCw className="w-4 h-4" />
 Try again
 </button>
 <button onClick={() => (window.location.href = '/')} className="cb-btn-secondary">
 Go home
 </button>
 </div>

 <p className="text-xs cb-body mt-8">If this keeps happening, please contact support.</p>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}

export default ErrorBoundary;

