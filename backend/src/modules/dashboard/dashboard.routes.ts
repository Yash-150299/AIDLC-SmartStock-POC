/**
 * Dashboard route (api-contracts.md): GET /dashboard/stats — bearer.
 */
import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { dashboardService } from './dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dashboardService.getStats();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
