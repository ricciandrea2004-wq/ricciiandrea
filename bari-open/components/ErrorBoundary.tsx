"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Vista Bari boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="panel feed-error" role="alert">
          <p className="section__eyebrow">Errore</p>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
            {this.props.fallbackTitle ?? "Contenuto non disponibile"}
          </h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {this.state.error.message || "Si è verificato un problema nel feed live."}
          </p>
          <button
            type="button"
            className="btn btn--ghost-dark"
            style={{ marginTop: "0.75rem" }}
            onClick={() => this.setState({ error: null })}
          >
            Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
