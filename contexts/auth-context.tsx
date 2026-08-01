import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  changePasswordLocal,
  deleteAccountLocal,
  getSessionUser,
  loginLocal,
  logoutLocal,
  registerLocal,
  updateProfileLocal,
} from '@/services/auth-local';
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (patch: UpdateProfileInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  requireAuth: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const session = await getSessionUser();
        if (alive) setUser(session);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginLocal(input);
    setUser(next);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const next = await registerLocal(input);
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    await logoutLocal();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('请先登录');
    await deleteAccountLocal(user.id);
    setUser(null);
  }, [user]);

  const updateProfile = useCallback(async (patch: UpdateProfileInput) => {
    if (!user) throw new Error('请先登录');
    const next = await updateProfileLocal(user.id, patch);
    setUser(next);
  }, [user]);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    if (!user) throw new Error('请先登录');
    await changePasswordLocal(user.id, input.currentPassword, input.newPassword);
  }, [user]);

  const requireAuth = useCallback(() => Boolean(user), [user]);

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      deleteAccount,
      updateProfile,
      changePassword,
      requireAuth,
    }),
    [
      user,
      ready,
      login,
      register,
      logout,
      deleteAccount,
      updateProfile,
      changePassword,
      requireAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return ctx;
}
