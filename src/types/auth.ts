export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  adminName?: string;
  message: string;
}

export interface CreatePasswordRequest {
  password: string;
  name: string;
  description?: string;
}

export interface CreatePasswordResponse {
  success: boolean;
  passwordId?: string;
  message: string;
}

export interface DeletePasswordRequest {
  passwordId: string;
}

export interface DeletePasswordResponse {
  success: boolean;
  message: string;
}

export interface ListPasswordsResponse {
  success: boolean;
  passwords?: Array<{
    id: string;
    name?: string;
    description?: string;
    createdAt: string;
    createdBy?: string;
  }>;
  message: string;
}

export interface JwtPayload {
  adminId: string;
  adminName: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  adminId?: string;
  adminName?: string;
}