import { Request } from 'express';

export interface LoginRequest {
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        name: string;
        role: string;
    };
    message: string;
}

export interface CreateUserRequest {
    name: string;
    password: string;
    description?: string;
}

export interface CreateUserResponse {
    success: boolean;
    userId?: string;
    message: string;
}

export interface UpdateUserRequest {
    userId: string;
    name?: string;
    description?: string;
}

export interface UpdateUserResponse {
    success: boolean;
    message: string;
}

export interface DeleteUserRequest {
    userId: string;
}

export interface DeleteUserResponse {
    success: boolean;
    message: string;
}

export interface ListUsersResponse {
    success: boolean;
    users?: Array<{
        id: string;
        name: string;
        role: string;
        description?: string;
        createdAt: string;
        createdBy?: string;
        creatorName?: string;
    }>;
    message: string;
}

export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdatePasswordResponse {
    success: boolean;
    message: string;
}

export interface JwtPayload {
    userId: string;
    userName: string;
    userRole: string;
    iat?: number;
    exp?: number;
}

// Extensão do Request do Express usando module augmentation
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userName?: string;
            userRole?: string;
        }
    }
}

// Interface para uso nos controllers (opcional)
export interface AuthenticatedRequest extends Request {
    userId: string;
    userName: string;
    userRole: string;
}
