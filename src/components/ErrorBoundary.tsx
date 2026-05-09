import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface CrashLog {
  ts: string;
  url: string;
  userAgent: string;
  message: string;
  stack?: string;
  componentStack?: string;
}

const STORAGE_KEY = 'skoolvyn_crash_logs';
const MAX_LOGS = 25;

function persistLog(log: CrashLog) {
  try {
    const existing: CrashLog[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(log);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_LOGS)));
  } catch { /* storage full or blocked */ }
}

export function getCrashLogs(): CrashLog[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function clearCrashLogs() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// Global handlers for uncaught errors and unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    persistLog({
      ts: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: e.message || String(e.error),
      stack: e.error?.stack,
    });
    // Surface in console for dev visibility
    // eslint-disable-next-line no-console
    console.error('[CrashTracker] window.error:', e.message, e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason: any = e.reason;
    persistLog({
      ts: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
    // eslint-disable-next-line no-console
    console.error('[CrashTracker] unhandledrejection:', reason);
  });
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    persistLog({
      ts: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
    });
    // eslint-disable-next-line no-console
    console.error('[CrashTracker] React error boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const { error, errorInfo } = this.state;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-2xl w-full bg-card border rounded-xl shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">An unexpected error occurred. Details below have been saved locally.</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 text-xs font-mono text-foreground/90 max-h-72 overflow-auto">
              <div className="font-semibold text-destructive mb-2">{error?.name}: {error?.message}</div>
              {error?.stack && <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">{error.stack}</pre>}
              {errorInfo?.componentStack && (
                <>
                  <div className="font-semibold mt-3 mb-1">Component stack:</div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">{errorInfo.componentStack}</pre>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">Try again</Button>
              <Button onClick={this.handleReload}>Go to home</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recent crashes are stored in <code>localStorage["{STORAGE_KEY}"]</code> for support.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
