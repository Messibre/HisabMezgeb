import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import i18n from '@/lib/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Class component — react-i18next's useTranslation hook doesn't work here,
 * so this calls the i18next singleton's t() directly instead. This won't
 * reactively update if the language changes mid-crash, which is an
 * acceptable edge case for a screen that only appears when the app has
 * already crashed.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Replace with real error reporting (Sentry, LogRocket, etc.) in production
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
          <p className="text-foreground text-lg font-semibold">{i18n.t('errorBoundary.title')}</p>
          <p className="text-muted-foreground text-sm">{i18n.t('errorBoundary.message')}</p>
          <Button onClick={this.handleReset}>{i18n.t('errorBoundary.goHome')}</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
