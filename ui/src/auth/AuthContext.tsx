import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthProviders, Identity } from "@src/types";
import { fetchMe, fetchProviders, login as loginRequest } from "@src/api/auth";
import { clearToken, getToken, setToken } from "./token";
import { beginOidcLogin, completeOidcLogin } from "./oidc";

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "disabled";

interface AuthContextValue {
  status: AuthStatus;
  identity: Identity | null;
  providers: AuthProviders | null;
  loginLocal: (username: string, password: string) => Promise<void>;
  loginOidc: () => Promise<void>;
  finishOidc: (code: string, state: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let p: AuthProviders;
      try {
        p = await fetchProviders();
      } catch {
        if (!cancelled) setStatus("anonymous");
        return;
      }
      if (cancelled) return;
      setProviders(p);

      if (!p.authEnabled) {
        setStatus("disabled");
        return;
      }
      if (!getToken()) {
        setStatus("anonymous");
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setIdentity(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearToken();
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginLocal = useCallback(async (username: string, password: string) => {
    const res = await loginRequest(username, password);
    setToken(res.token);
    setIdentity(res.user);
    setStatus("authenticated");
  }, []);

  const loginOidc = useCallback(async () => {
    if (!providers?.oidc) throw new Error("OIDC is not configured");
    await beginOidcLogin(providers.oidc.issuer, providers.oidc.clientId);
  }, [providers]);

  const finishOidc = useCallback(
    async (code: string, state: string) => {
      if (!providers?.oidc) throw new Error("OIDC is not configured");
      const idToken = await completeOidcLogin(providers.oidc.clientId, code, state);
      setToken(idToken);
      try {
        const me = await fetchMe();
        setIdentity(me);
        setStatus("authenticated");
      } catch (err) {
        clearToken();
        throw err;
      }
    },
    [providers]
  );

  const logout = useCallback(() => {
    clearToken();
    setIdentity(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, identity, providers, loginLocal, loginOidc, finishOidc, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
