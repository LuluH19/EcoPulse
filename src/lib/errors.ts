/**
 * Hiérarchie d'erreurs applicatives. Chaque erreur porte un `code` brut et
 * stable (ex: `ERR_NETWORK`) destiné à l'affichage technique dans l'ErrorBoundary
 * — jamais un message libre non typé (errorBoundaryGuide.md).
 */
export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    // new.target pointe sur la sous-classe réellement instanciée.
    this.name = new.target.name;
    this.code = code;
    // Restaure la chaîne de prototype (perdue en transpilant `extends Error`).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Échec réseau / HTTP (timeout, statut non-2xx, hôte injoignable). */
export class NetworkError extends AppError {
  readonly status?: number;

  constructor(message: string, status?: number, code = "ERR_NETWORK") {
    super(message, code);
    this.status = status;
  }
}

/** Donnée reçue qui ne respecte pas le contrat attendu (schéma Zod). */
export class ValidationError extends AppError {
  constructor(message: string, code = "ERR_VALIDATION") {
    super(message, code);
  }
}
