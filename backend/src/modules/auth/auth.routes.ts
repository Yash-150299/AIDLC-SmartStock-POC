/**
 * Auth routes (api-contracts.md):
 *   POST /auth/login  — public
 *   POST /auth/logout — bearer, 204
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { UnauthorizedError } from '../../errors/app-errors';
import { authService } from './auth.service';
import { loginBodySchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post(
  '/login',
  validate({ body: loginBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claims = req.tokenClaims;
      if (!claims) {
        throw new UnauthorizedError();
      }
      await authService.logout(claims.jti, new Date(claims.exp * 1000));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
