/**
 * Login mutation (BL-W1). On success, stores the session in AuthContext and navigates to the
 * dashboard. The 401 `INVALID_CREDENTIALS` surfaces to the caller as an `ApiError` for inline
 * display (EH-W2) — it is NOT treated as session expiry.
 */
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, LoginResponse } from '@smartstock/shared';
import { login } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';

export function useLogin() {
  const navigate = useNavigate();
  const auth = useAuth();

  return useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: (body) => login(body),
    onSuccess: (data) => {
      auth.login(data.token, data.user);
      navigate('/dashboard', { replace: true });
    },
  });
}
