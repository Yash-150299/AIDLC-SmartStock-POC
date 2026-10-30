/**
 * Entry point — load/validate config, then start the HTTP listener (NFR-8).
 */
import { createApp } from './app';
import { loadConfig } from './config/env';

function main(): void {
  const config = loadConfig(); // fails fast if required env vars are missing
  const app = createApp();

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`SmartStock backend listening on http://localhost:${config.port}/api`);
  });
}

main();
