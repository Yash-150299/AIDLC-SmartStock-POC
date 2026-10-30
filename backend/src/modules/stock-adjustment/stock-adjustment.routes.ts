/**
 * Stock-adjustment routes (api-contracts.md). Bearer required. Mounted on the products router so
 * the paths are /products/:id/stock-adjustments.
 *   POST /products/:id/stock-adjustments  (201)
 *   GET  /products/:id/stock-adjustments
 */
import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { stockAdjustmentService } from './stock-adjustment.service';
import {
  historyQuerySchema,
  productIdParamSchema,
  stockAdjustmentBodySchema,
} from './stock-adjustment.schemas';

// mergeParams so `:id` from the parent products path is visible here.
export const stockAdjustmentRouter = Router({ mergeParams: true });

stockAdjustmentRouter.use(requireAuth);

stockAdjustmentRouter.post(
  '/',
  validate({ params: productIdParamSchema, body: stockAdjustmentBodySchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const result = await stockAdjustmentService.adjustStock(
        Number(req.params.id),
        req.body,
        req.user?.id,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

stockAdjustmentRouter.get(
  '/',
  validate({ params: productIdParamSchema, query: historyQuerySchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const query = req.query as { page?: number; pageSize?: number };
      const result = await stockAdjustmentService.getAdjustmentHistory(
        Number(req.params.id),
        query.page,
        query.pageSize,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);
