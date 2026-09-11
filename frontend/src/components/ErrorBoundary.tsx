// frontend/src/components/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

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

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console (in production, send to monitoring service like Sentry)
    console.error('🚨 Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDark = document.documentElement.classList.contains('dark');
      const isRTL = document.documentElement.dir === 'rtl';

      return (
        <div
          className={`flex min-h-screen items-center justify-center p-4 ${
            isDark ? 'bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-8 text-center shadow-xl ${
              isDark
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            {/* Error icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h1
              className={`text-2xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {isRTL ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
            </h1>

            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {isRTL
                ? 'نعتذر عن هذا الخطأ. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
                : "We're sorry for the inconvenience. Please refresh the page and try again."}
            </p>

            {/* Error details (collapsible, for debugging) */}
            {this.state.error && (
              <details className="mt-6 text-start">
                <summary
                  className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Bug size={14} />
                  {isRTL ? 'تفاصيل الخطأ' : 'Error details'}
                </summary>
                <pre
                  className={`mt-2 max-h-48 overflow-auto rounded-lg p-3 text-xs ${
                    isDark ? 'bg-gray-900 text-red-400' : 'bg-gray-50 dark:bg-gray-900 text-red-600'
                  }`}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary"
              >
                <RefreshCw size={16} />
                {isRTL ? 'تحديث الصفحة' : 'Reload Page'}
              </button>

              <button onClick={this.handleGoHome} className="btn-secondary">
                <Home size={16} />
                {isRTL ? 'الصفحة الرئيسية' : 'Go Home'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;