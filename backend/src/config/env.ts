/**
 * Centralized, typed environment loader (NFR-2). Fails fast at startup if required secrets are
 * missing so the app never runs with an unsafe/implicit configuration.
 */

export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  port: number;
  /**
   * Allowed CORS origin(s) for the browser frontend. Comma-separated list, or "*" to allow any.
   * In local dev the Vite proxy makes the frontend same-origin, so this can be left unset ("*").
   */
  corsOrigins: string[];
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim().length > 0 ? value : fallback;
}

let cached: AppConfig | undefined;

/** Load (and cache) the validated application configuration. */
export function loadConfig(): AppConfig {
  if (cached) {
    return cached;
  }

  const portRaw = optional('PORT', '3000');
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const corsRaw = optional('CORS_ORIGIN', '*');
  const corsOrigins = corsRaw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  cached = {
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '8h'),
    port,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ['*'],
  };
  return cached;
}
