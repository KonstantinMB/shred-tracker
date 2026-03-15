import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl bg-card border border-border p-6 space-y-4">
            <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <p className="text-xs text-muted-foreground">
              Make sure <code className="bg-secondary px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
              <code className="bg-secondary px-1 rounded">VITE_SUPABASE_ANON_KEY</code> are set in Vercel if deploying to production.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
