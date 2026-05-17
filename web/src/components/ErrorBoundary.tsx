"use client";
import { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { reportError } from "@/lib/error-reporting";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    override state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo) {
        // Forward to whatever reporter is wired in lib/error-reporting (Sentry today,
        // a no-op shim in environments where SENTRY_DSN is unset).
        reportError(error, { component: "ErrorBoundary", componentStack: info.componentStack ?? undefined });
    }

    private reset = () => {
        this.setState({ hasError: false });
    };

    override render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="ui-page">
                        <div className="ui-card ui-card-padded">
                            <div className="ui-empty">
                                <div className="ui-empty-icon" aria-hidden>
                                    <AlertTriangle size={28} />
                                </div>
                                <h3 className="ui-empty-title">Something went wrong</h3>
                                <p className="ui-empty-description">
                                    The page hit an unexpected error. Try reloading — if this keeps happening, contact support.
                                </p>
                                <div className="ui-empty-action">
                                    <button type="button" className="btn btn-primary" onClick={this.reset}>
                                        <RefreshCw size={16} /> Try again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
