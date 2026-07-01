"use client";

import { Component, type ReactNode } from "react";
import { AppError } from "@/lib/errors";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Libellé technique du bloc protégé (ex: "GRAPHIQUE 24H"). */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Isole le rendu d'un bloc du dashboard : si un composant enfant lève une
 * erreur, on affiche une fiche de secours industrielle (code brut + retry) au
 * lieu de faire tomber toute la page (errorBoundaryGuide.md).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error("[error-boundary] rendu échoué", this.props.label, error);
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const code = error instanceof AppError ? error.code : "ERR_UNKNOWN";
    const label = this.props.label ? ` — ${this.props.label}` : "";

    return (
      <div className="border border-red-500 bg-white p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-red-500">
          {`// Erreur${label}`}
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-slate-500">
          Code:{" "}
          <span className="font-semibold text-slate-900">{code}</span>
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="mt-4 w-full bg-slate-900 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
        >
          Réessayer
        </button>
      </div>
    );
  }
}
