import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../lib/api.js';

const accessTokenKey = 'vestora_access_token';
const refreshTokenKey = 'vestora_refresh_token';
const AuthContext = createContext(null);

async function saveTokens(tokens) {
  await Promise.all([
    SecureStore.setItemAsync(accessTokenKey, tokens.accessToken),
    SecureStore.setItemAsync(refreshTokenKey, tokens.refreshToken),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(accessTokenKey),
    SecureStore.deleteItemAsync(refreshTokenKey),
  ]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const tokenPair = useRef(null);
  const refreshPromise = useRef(null);

  const applyTokenPair = useCallback(async (tokens) => {
    tokenPair.current = tokens;
    await saveTokens(tokens);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenPair.current?.refreshToken;
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } finally {
      tokenPair.current = null;
      setUser(null);
      await clearTokens();
    }
  }, []);

  const refreshSession = useCallback((refreshToken) => {
    if (!refreshPromise.current) {
      refreshPromise.current = apiRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      })
        .then(async (refreshed) => {
          await applyTokenPair(refreshed);
          setUser(refreshed.user);
          return refreshed;
        })
        .finally(() => {
          refreshPromise.current = null;
        });
    }
    return refreshPromise.current;
  }, [applyTokenPair]);

  const request = useCallback(async (path, options = {}) => {
    const currentTokens = tokenPair.current;
    if (!currentTokens?.accessToken) {
      return apiRequest(path, options);
    }

    try {
      return await apiRequest(path, { ...options, token: currentTokens.accessToken });
    } catch (error) {
      if (error.status !== 401 || !currentTokens.refreshToken) throw error;

      try {
        const latestTokens = tokenPair.current;
        const refreshed =
          latestTokens?.accessToken !== currentTokens.accessToken
            ? latestTokens
            : await refreshSession(currentTokens.refreshToken);
        if (!refreshed?.accessToken) throw error;
        return await apiRequest(path, { ...options, token: refreshed.accessToken });
      } catch (refreshError) {
        if (refreshError.status === 401) {
          tokenPair.current = null;
          setUser(null);
          await clearTokens();
        }
        throw refreshError;
      }
    }
  }, [refreshSession]);

  const updateProfile = useCallback(async (profile) => {
    const result = await request('/auth/me', { method: 'PATCH', body: profile });
    setUser(result.user);
    return result.user;
  }, [request]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const refreshToken = await SecureStore.getItemAsync(refreshTokenKey);
        if (!refreshToken) return;

        const refreshed = await refreshSession(refreshToken);
        if (!active) return;
        setUser(refreshed.user);
      } catch (error) {
        if (active && error.status === 401) {
          tokenPair.current = null;
          await clearTokens();
        } else if (active) {
          console.error('Could not restore the VESTORA session:', error.message);
        }
      } finally {
        if (active) setReady(true);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await applyTokenPair(result);
    setUser(result.user);
  }, [applyTokenPair]);

  const register = useCallback(async ({ name, email, password, phone }) => {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, phone },
    });
    await applyTokenPair(result);
    setUser(result.user);
  }, [applyTokenPair]);

  const value = useMemo(
    () => ({ user, ready, request, login, register, logout, updateProfile }),
    [user, ready, request, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
