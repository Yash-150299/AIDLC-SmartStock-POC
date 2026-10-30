/**
 * Inventory + category routes (api-contracts.md). All require a valid bearer token.
 *   GET  /products
 *   GET  /products/:id
 *   POST /products            (201)
 *   PUT  /products/:id
 *   GET  /categories
 */
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { ProductListQuery } from '@smartstock/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { inventoryService } from './inventory.service';
import {
  createCategorySchema,
  createProductSchema,
  productIdParamSchema,
  productListQuerySchema,
  updateProductSchema,
} from './inventory.schemas';

export const productsRouter = Router();
export const categoriesRouter = Router();

productsRouter.use(requireAuth);
categoriesRouter.use(requireAuth);

productsRouter.get(
  '/',
  validate({ query: productListQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inventoryService.listProducts(req.query as unknown as ProductListQuery);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.get(
  '/:id',
  validate({ params: productIdParamSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // `id` is validated and coerced to a positive integer by the params schema.
      const result = await inventoryService.getProduct(Number(req.params.id));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.post(
  '/',
  validate({ body: createProductSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inventoryService.createProduct(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.put(
  '/:id',
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const result = await inventoryService.updateProduct(Number(req.params.id), req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

categoriesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inventoryService.listCategories();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post(
  '/',
  validate({ body: createCategorySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inventoryService.createCategory((req.body as { name: string }).name);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);
