import type { FullConfig } from '@playwright/test';

/**
 * Global setup: warm up the backend before the suite runs.
 * The live backend is hosted on a free tier that spins down after inactivity and can take
 * 30-60s to cold-start. Pinging the health endpoint (and retrying) up front means the first
 * real test does not absorb that latency and get misreported as a failure.
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const base = process.env.API_BASE_URL ?? 'https://smartstock-backend-m2i3.onrender.com';
  const healthUrl = `${base}/api/health`;
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        // eslint-disable-next-line no-console
        console.log(`[global-setup] backend warm after ${attempt} attempt(s): ${healthUrl}`);
        return;
      }
    } catch {
      // ignore and retry — the instance is still waking up
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  // eslint-disable-next-line no-console
  console.warn('[global-setup] backend did not confirm warm; proceeding anyway.');
}

export default globalSetup;
