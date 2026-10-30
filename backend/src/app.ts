/**
 * Build the Express application (api-contracts.md base path `/api`): JSON parsing, correlation id,
 * feature routers, and the terminal error handler last.
 */
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import { loadConfig } from './config/env';
import { correlationId } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { categoriesRouter, productsRouter } from './modules/inventory/inventory.routes';
import { stockAdjustmentRouter } from './modules/stock-adjustment/stock-adjustment.routes';

/**
 * Minimal CORS middleware. Allows the configured origin(s) so the browser frontend (served from a
 * different domain in production) can call the API. In local dev CORS_ORIGIN defaults to "*".
 * Only the methods/headers this API actually uses are advertised.
 */
function cors(allowedOrigins: string[]) {
  const allowAny = allowedOrigins.includes('*');
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestOrigin = req.header('Origin');

    if (allowAny) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-Id');
    res.setHeader('Access-Control-Expose-Headers', 'X-Correlation-Id');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

export function createApp(): Application {
  const app = express();
  const config = loadConfig();

  app.use(cors(config.corsOrigins));
  app.use(express.json());
  app.use(correlationId);

  // Liveness/readiness probe for the host (Render/Vercel). No auth, no DB dependency.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Stock-adjustment routes live under a product: /products/:id/stock-adjustments
  productsRouter.use('/:id/stock-adjustments', stockAdjustmentRouter);

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/products', productsRouter);
  api.use('/categories', categoriesRouter);

  app.use('/api', api);

  // Terminal error handler — must be registered last.
  app.use(errorHandler);

  return app;
}
