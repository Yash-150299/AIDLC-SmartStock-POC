/**
 * Logout mutation (BL-W1). Clears the local session regardless of the server result (BR-W4),
 * clears the query cache, and routes to login.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';

export function useLogout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const finish = () => {
    auth.logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return useMutation<void, unknown, void>({
    mutationFn: () => logout(),
    // Local session is cleared whether or not the server call succeeds (BR-W4).
    onSuccess: finish,
    onError: finish,
  });
}
