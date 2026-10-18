import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const AuthContext = createContext(null);
const ME_KEY = ['auth', 'me'];

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // Ask the server who we are. A 401 just means "logged out", so return null instead of erroring.
  const { data: user, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: () =>
      api
        .get('/auth/me')
        .then((r) => r.data.user)
        .catch((err) => {
          if (err.response?.status === 401) return null;
          throw err;
        }),
    staleTime: Infinity,
  });

  const setUser = (u) => queryClient.setQueryData(ME_KEY, u);

  const login = useMutation({
    mutationFn: (body) => api.post('/auth/login', body).then((r) => r.data.user),
    onSuccess: setUser,
  });

  const register = useMutation({
    mutationFn: (body) => api.post('/auth/register', body).then((r) => r.data.user),
    onSuccess: setUser,
  });

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      setUser(null);
    },
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
