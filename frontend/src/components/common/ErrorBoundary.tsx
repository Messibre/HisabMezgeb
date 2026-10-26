import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import i18n from '@/lib/i18n';
import { toUserError, reportError } from '@/lib/errors';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const userError = toUserError(this.state.error);
      const title = i18n.t(userError.titleKey, i18n.t('errorBoundary.title', 'Something went wrong.'));
      const message = i18n.t(userError.messageKey, i18n.t('errorBoundary.message', 'Please try refreshing the page.'));

      return (
        <div role="alert" className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--money-out)]/20 text-[var(--money-out)] mb-4">
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-md mb-2">{message}</p>
          {userError.requestId && (
            <p className="text-xs text-muted-foreground mb-4 font-mono select-all">
              {i18n.t('errors.reference', 'Reference')}: {userError.requestId}
            </p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <Button variant="outline" onClick={this.handleRetry}>
              {i18n.t('common.tryAgain', 'Try Again')}
            </Button>
            <Button onClick={this.handleGoHome}>
              {i18n.t('errorBoundary.goHome', 'Go to Home')}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
