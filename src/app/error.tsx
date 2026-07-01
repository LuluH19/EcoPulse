"use client";

import { useEffect } from "react";
import { AppError } from "@/lib/errors";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Filet de sécurité au niveau du segment de route : capture toute erreur non
 * interceptée par un ErrorBoundary local (ex: échec dans un hook au sommet de la
 * page). Fiche de secours industrielle avec code brut et bouton de reprise.
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("[app/error] rendu de route échoué", error);
  }, [error]);

  const code = error instanceof AppError ? error.code : "ERR_UNKNOWN";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 bg-white p-4 sm:p-6">
      <div className="border border-red-500 bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-red-500">
          {"// EcoPulse — panne"}
        </p>
        <p className="mt-3 font-mono text-sm text-slate-900">{error.message}</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-slate-500">
          Code:{" "}
          <span className="font-semibold text-slate-900">{code}</span>
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full bg-slate-900 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
        >
          Réessayer la connexion
        </button>
      </div>
    </main>
  );
}
