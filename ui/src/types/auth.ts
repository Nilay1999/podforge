export type Role = "viewer" | "editor" | "admin";

export interface Identity {
  username: string;
  role: Role;
  provider: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: Identity;
}

export interface AuthProviders {
  authEnabled: boolean;
  local: boolean;
  oidc?: {
    issuer: string;
    clientId: string;
  };
}

export interface UserAccount {
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  password?: string;
  role?: Role;
}
